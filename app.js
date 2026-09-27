
(function(){
'use strict';

const STORAGE_KEY='cloud_odyssey_enterprise_v3';
const artifactNames=['Architecture + grain','Contracts + schemas','Production code path','Automated tests','Observability + SLO','Runbook + rollback'];
let activeEditorFile='solution.py';
let editorFiles={'solution.py':'','tests.py':'','pipeline.yaml':''};
let audioCtx=null;

const worlds=[
{id:'ingestion',name:'Ingestion Gateway',icon:'🛰️',desc:'Governed reservation ingestion',colors:['#0b6e72','#12335f'],relic:'Contract Crystal',stack:['Kafka','PySpark','Schema Registry'],skills:['Kafka contracts','Schema evolution','Idempotency'],
missions:[
{title:'Stop the disappearing reservation',type:'PYTHON',risk:'Reservation events are silently dropped after a producer migration.',task:'Build a governed event validation path that preserves bad records instead of dropping them.',tokens:['reservation_id','quarantine','schema'],solution:"def validate_reservation(record, schema):\n    result = enforce_schema(record, schema)\n    if not result.ok:\n        quarantine.write(record, reason=result.errors)\n        alert('reservation_contract_violation')\n        return None\n    return result.data"},
{title:'Silence the replay echo',type:'PYSPARK',risk:'A Kafka replay duplicates downstream reservations and inflates occupancy.',task:'Make replay behavior deterministic with a stable key and event version.',tokens:['reservation_id','event_version','dropduplicates'],solution:"latest = (events\n    .orderBy(F.col('event_version').desc())\n    .dropDuplicates(['reservation_id']))\nvalidate(latest)\nalert_on_duplicate_rate(events, latest)"},
{title:'Close the frontier bridge',type:'BOSS',risk:'Schema v3 is incompatible with two downstream consumers.',task:'Design a versioned producer migration with compatibility checks and rollback.',tokens:['compatibility','version','rollback'],solution:"assert compatibility_check(schema_v3, mode='BACKWARD')\npublish_version('reservation.v3')\ncanary_consumers(percent=5)\nif error_budget_burn(): rollback('reservation.v2')"}]},
{id:'inventory',name:'Inventory Cove',icon:'🌊',desc:'Lakehouse inventory truth',colors:['#135f82','#173b64'],relic:'Delta Compass',stack:['Delta Lake','Databricks','SQL'],skills:['Delta Lake','MERGE','SCD2'],
missions:[
{title:'Repair oversold inventory',type:'SQL',risk:'Two pipelines write competing room inventory totals.',task:'Implement an ACID merge keyed on inventory_id with deterministic updates.',tokens:['merge','inventory_id','when matched'],solution:"MERGE INTO gold_inventory t\nUSING staged_inventory s\nON t.inventory_id = s.inventory_id\nWHEN MATCHED THEN UPDATE SET *\nWHEN NOT MATCHED THEN INSERT *;"},
{title:'Make late events deterministic',type:'PYSPARK',risk:'Late reservation changes alter prior-day inventory after finance close.',task:'Apply event-time rules and preserve auditable history.',tokens:['event_time','watermark','effective'],solution:"stream = stream.withWatermark('event_time','24 hours')\nchanges = apply_scd2(stream, key='inventory_id', effective_col='event_time')\nwrite_delta(changes, checkpoint='inventory_scd2')"},
{title:'Prove the silver-to-gold contract',type:'BOSS',risk:'Gold occupancy KPI diverges from silver source totals.',task:'Reconcile grain, lineage, and business rules before publish.',tokens:['reconcile','grain','lineage'],solution:"assert grain(silver) == 'reservation_night'\nreconcile(silver, gold, keys=['resort_id','stay_date'])\nassert lineage_complete(gold)\npublish_if_quality_green(gold)"}]},
{id:'customer',name:'Customer Summit',icon:'🏔️',desc:'Trusted customer 360',colors:['#496a80','#2c3c65'],relic:'Identity Beacon',stack:['dbt','Snowflake','Data Quality'],skills:['Entity resolution','Dimensional modeling','Data quality'],
missions:[
{title:'Unify the guest identity',type:'SQL',risk:'One guest appears as multiple profiles across booking and sales systems.',task:'Resolve deterministic identifiers before fuzzy matching.',tokens:['guest_id','email','confidence'],solution:"WITH deterministic AS (\n SELECT *, coalesce(loyalty_id, lower(email)) AS identity_key FROM source\n)\nSELECT *, match_confidence(identity_key, phone) AS confidence\nFROM deterministic;"},
{title:'Stop duplicate households',type:'DBT',risk:'Household metrics double count merged customer profiles.',task:'Declare model grain and enforce uniqueness before mart publication.',tokens:['unique','not_null','household_id'],solution:"models:\n  - name: dim_household\n    columns:\n      - name: household_id\n        tests: [unique, not_null]"},
{title:'Publish the trusted customer mart',type:'BOSS',risk:'Executive segmentation uses conflicting definitions across dashboards.',task:'Create one conformed dimensional model with tests and ownership.',tokens:['fact','dimension','owner'],solution:"fact_guest_stay -> dim_guest + dim_resort + dim_date\nowner = 'customer_data_platform'\nvalidate_dimensions()\npublish_semantic_contract()"}]},
{id:'release',name:'Release Keep',icon:'🏰',desc:'CI/CD and safe releases',colors:['#603e82','#2a355e'],relic:'Release Sigil',stack:['GitHub Actions','DAB','CI/CD'],skills:['CI/CD','Databricks Asset Bundles','Rollback'],
missions:[
{title:'Block a broken bundle',type:'YAML',risk:'A pipeline deploys with failing tests because promotion has no gate.',task:'Require tests and validation before production deployment.',tokens:['test','needs','deploy'],solution:"jobs:\n  test:\n    steps: [unit, integration, bundle_validate]\n  deploy:\n    needs: [test]\n    environment: production"},
{title:'Promote without drift',type:'YAML',risk:'Dev and production jobs have diverging parameters.',task:'Use environment-aware bundle targets from one versioned source.',tokens:['targets','production','variables'],solution:"targets:\n  dev:\n    variables: {catalog: dev}\n  production:\n    variables: {catalog: prod}\n    mode: production"},
{title:'Recover the Friday release',type:'BOSS',risk:'A production release raises error rate after business hours.',task:'Restore the last known-good artifact and validate state before traffic resumes.',tokens:['rollback','known-good','validate'],solution:"freeze_new_runs()\nrollback(last_known_good_artifact)\nvalidate_data_state()\nresume_when_slo_green()"}]},
{id:'feature',name:'Feature Forge',icon:'⚙️',desc:'Production ML feature platform',colors:['#784d2b','#443354'],relic:'Feature Hammer',stack:['Feature Store','PySpark','ML'],skills:['Feature engineering','Point-in-time joins','Online serving'],
missions:[
{title:'Stop training-serving skew',type:'PYTHON',risk:'Online propensity scores disagree with offline validation.',task:'Share feature definitions and validate offline/online parity.',tokens:['feature','parity','online'],solution:"features = feature_registry.get('guest_propensity_v4')\noffline = features.compute(training_snapshot)\nonline = features.read_online(sample_ids)\nassert parity_check(offline, online)"},
{title:'Build reusable guest features',type:'PYSPARK',risk:'Teams rewrite the same guest behavior logic differently.',task:'Create governed reusable features with freshness and ownership metadata.',tokens:['freshness','owner','feature'],solution:"feature_def = {\n 'name':'guest_90d_stays',\n 'owner':'ml_platform',\n 'freshness':'6h'\n}\nregister_feature(feature_def, compute_fn=build_guest_stays)"},
{title:'Backfill without leakage',type:'BOSS',risk:'Historical training rows contain future booking information.',task:'Perform point-in-time correct backfill.',tokens:['feature_time','label_time','point'],solution:"safe = features.join(labels,\n (features.guest_id == labels.guest_id) &\n (features.feature_time <= labels.label_time))\nassert_no_future_rows(safe)"}]},
{id:'forecast',name:'Forecast Terrace',icon:'🌤️',desc:'Demand and occupancy forecasting',colors:['#8a6c2b','#65403c'],relic:'Forecast Lens',stack:['Time Series','MLflow','Monitoring'],skills:['Time series','Backtesting','Forecast monitoring'],
missions:[
{title:'Forecast resort occupancy',type:'PYTHON',risk:'Staffing decisions need a stable 30-day occupancy forecast.',task:'Train with time-respecting validation and operational metrics.',tokens:['backtest','mape','cutoff'],solution:"for cutoff in monthly_cutoffs:\n    train = df[df.date < cutoff]\n    test = df[(df.date >= cutoff) & (df.date < cutoff + horizon)]\n    score = mape(test.y, model.fit(train).predict(test))"},
{title:'Defeat holiday leakage',type:'PYTHON',risk:'A holiday feature uses future finalized calendar attributes.',task:'Make feature availability explicit at forecast creation time.',tokens:['available','forecast_time','leakage'],solution:"assert holiday_feature.available_at <= forecast_time\nassert_no_leakage(training_frame)\nlog_feature_availability()"},
{title:'Detect forecast drift',type:'BOSS',risk:'Forecast accuracy degrades for one destination without alerting.',task:'Monitor error by slice and tie thresholds to staffing impact.',tokens:['slice','threshold','business'],solution:"errors = evaluate_by_slice(predictions, ['destination','lead_time'])\nalert_if(errors.mape > threshold_by_business_impact)\nopen_retraining_ticket()"}]},
{id:'rag',name:'AI Knowledge Archive',icon:'📚',desc:'Governed RAG and GenAI',colors:['#355e49','#2a3d62'],relic:'RAG Codex',stack:['RAG','Vector Search','Guardrails'],skills:['RAG','Embeddings','AI guardrails'],
missions:[
{title:'Ground the concierge',type:'PYTHON',risk:'An AI concierge answers resort questions without evidence.',task:'Require governed retrieval and source citations for answers.',tokens:['retrieve','citation','source'],solution:"chunks = retriever.retrieve(query, filters={'approved':True})\nanswer = llm.generate(query, context=chunks)\nassert citations_cover(answer, chunks)\nreturn answer"},
{title:'Block stale policy answers',type:'PYTHON',risk:'The assistant cites outdated cancellation policy documents.',task:'Version documents and filter retrieval to active policy windows.',tokens:['effective_date','version','filter'],solution:"filters = {'effective_date': {'lte': now()}, 'expires_date': {'gt': now()}}\nchunks = index.search(query, filters=filters)\nlog_document_versions(chunks)"},
{title:'Trace every generated claim',type:'BOSS',risk:'Compliance cannot reconstruct why an answer was generated.',task:'Persist prompt, retrieval evidence, model version, guardrail result, and output.',tokens:['trace','model_version','guardrail'],solution:"trace.write({\n 'model_version': MODEL_VERSION,\n 'retrieval': chunk_ids,\n 'guardrail': guardrail_result,\n 'output': answer\n})"}]},
{id:'incident',name:'Incident Citadel',icon:'🚨',desc:'Observability and recovery',colors:['#763646','#3c315a'],relic:'Pager Shield',stack:['SLO','OpenTelemetry','Runbooks'],skills:['SLOs','Root cause analysis','Runbooks'],
missions:[
{title:'Triage the 2 AM failure',type:'OPS',risk:'Reservation freshness SLO is burning with unknown blast radius.',task:'Scope impact before changing production.',tokens:['scope','slo','evidence'],solution:"scope_business_impact()\ncheck_slo_burn()\npreserve_logs_and_offsets()\nisolate_last_change()\nverify_hypothesis_before_recovery()"},
{title:'Trace a latency spike',type:'OPS',risk:'ML inference p95 latency triples after deployment.',task:'Use trace correlation to isolate model, feature, network, or compute latency.',tokens:['trace','p95','correlation'],solution:"trace = get_distributed_trace(request_id)\nsegments = correlate_latency(trace)\nassert max(segments) < service_budget\nrollback_if_regression()"},
{title:'Write the recovery runbook',type:'BOSS',risk:'Operators improvise during every failure.',task:'Codify detection, triage, recovery, validation, escalation, and rollback.',tokens:['detection','recovery','rollback'],solution:"runbook = [\n 'detection','scope','triage','recovery',\n 'validation','escalation','rollback'\n]\nreview_with_oncall(runbook)"}]},
{id:'delta',name:'Delta Harbor',icon:'⚓',desc:'Streaming lakehouse reliability',colors:['#136a77','#27486b'],relic:'Checkpoint Anchor',stack:['Structured Streaming','Auto Loader','Delta'],skills:['Structured Streaming','Auto Loader','Checkpoints'],
missions:[
{title:'Recover the checkpoint',type:'PYSPARK',risk:'A damaged checkpoint blocks reservation stream recovery.',task:'Define replay boundaries and duplicate protection before checkpoint recovery.',tokens:['checkpoint','replay','idempotent'],solution:"boundary = determine_safe_replay_boundary(last_good_offset)\nassert sink_is_idempotent()\nrecover_checkpoint(boundary)\nreconcile_counts()"},
{title:'Control the small-file storm',type:'PYSPARK',risk:'High-frequency microbatches create thousands of tiny Delta files.',task:'Tune trigger/partition strategy and compact safely.',tokens:['optimize','trigger','partition'],solution:"stream.trigger(processingTime='2 minutes')\nwrite_partitioned(stream, ['event_date'])\noptimize_table(zorder=['resort_id'])"},
{title:'Reprocess safely',type:'BOSS',risk:'A bad transformation requires three days of streaming replay.',task:'Reprocess bounded partitions without corrupting live state.',tokens:['bounded','reconcile','checkpoint'],solution:"pause_downstream_publish()\nreprocess_bounded_range(start, end, isolated_checkpoint)\nreconcile_business_keys()\natomic_swap_when_green()"}]},
{id:'mlflow',name:'MLflow Observatory',icon:'🔭',desc:'ML lifecycle and governance',colors:['#514888','#253d68'],relic:'Model Star',stack:['MLflow','Model Registry','Drift'],skills:['MLflow','Model registry','Model drift'],
missions:[
{title:'Register the winning model',type:'PYTHON',risk:'A notebook model cannot be reproduced or audited.',task:'Track params, metrics, artifacts, and lineage before registration.',tokens:['mlflow','log_metric','register'],solution:"with mlflow.start_run() as run:\n    mlflow.log_params(params)\n    mlflow.log_metric('rmse', rmse)\n    mlflow.pyfunc.log_model('model', python_model=model)\n    mlflow.register_model('runs:/'+run.info.run_id+'/model','occupancy_forecast')"},
{title:'Gate the promotion',type:'PYTHON',risk:'Newest model automatically becomes production champion.',task:'Require evaluation, approval, and rollback metadata.',tokens:['approval','threshold','rollback'],solution:"assert eval_metrics['rmse'] < promotion_threshold\nassert fairness_checks_passed()\nrequire_approval('ml_owner')\nrecord_rollback_version(current_champion)\npromote(candidate)"},
{title:'Retire the drifting champion',type:'BOSS',risk:'Champion quality degrades for high-value guest segment.',task:'Combine drift, labeled quality, business impact, and retraining policy.',tokens:['drift','segment','retrain'],solution:"drift = monitor_by_segment(features, predictions)\nif drift['high_value'] > threshold and labeled_quality_down():\n    trigger_retrain()\n    compare_challenger()\n    controlled_promote()"}]}
];

const incidentCases=[
{sev:'SEV-1',title:'Reservation ingestion duplication',summary:'A replay after consumer restart is duplicating reservation events in the occupancy mart.',metrics:[['Affected rows','184k'],['Duplicate rate','6.8%'],['Resorts','17'],['Revenue at risk','$1.9M']],signals:[['consumer_lag','4.8m'],['duplicate_key_rate','6.8%'],['checkpoint_age','47m'],['gold_delta','+8.2%']],choices:['Freeze downstream publish and compare offsets/checkpoint lineage','Delete the checkpoint and restart immediately','Scale the cluster to 4x','Reprocess all history'],correct:0,root:'Non-idempotent sink behavior after replay boundary moved. Preserve offsets, bound replay, dedupe by business key, then reconcile.'},
{sev:'SEV-2',title:'Feature freshness breach',summary:'Guest propensity features stopped updating after a failed microbatch, but online inference remains healthy.',metrics:[['Feature age','52m'],['Requests','42k/hr'],['Model PSI','0.19'],['Segments','3']],signals:[['feature_age','52m'],['online_error','0.2%'],['failed_batches','6'],['checkpoint_lag','49m']],choices:['Scope stale-feature impact and inspect the failed checkpoint chain','Promote a new model immediately','Disable monitoring','Clear the feature table'],correct:0,root:'Feature pipeline failure caused stale online values. Recover checkpoint, backfill bounded features, validate offline/online parity.'},
{sev:'SEV-1',title:'Model promotion regression',summary:'A newly promoted occupancy model reduces accuracy for Las Vegas weekend demand.',metrics:[['MAPE','21.4%'],['Baseline','14.1%'],['Slice delta','+12.4%'],['Rollback RTO','8m']],signals:[['model_version','v18'],['champion_age','34m'],['slice_alerts','4'],['requests','13.2k']],choices:['Compare v18 vs last champion by affected slice and prepare controlled rollback','Increase model temperature','Retrain on all data immediately','Ignore until daily report'],correct:0,root:'Promotion gate missed a destination/weekend slice regression. Roll back to last champion and add slice-aware gate.'},
{sev:'SEV-2',title:'Delta small-file storm',summary:'Streaming output created excessive files and query latency jumped after trigger settings changed.',metrics:[['Files','182k'],['Median size','81KB'],['Query p95','38s'],['Cost delta','+41%']],signals:[['microbatch','10s'],['files_per_hour','14k'],['shuffle_spill','high'],['optimize_age','3d']],choices:['Verify trigger/partition change, pause unsafe tuning, compact bounded partitions','Delete the Delta table','Scale every SQL warehouse','Turn off checkpoints'],correct:0,root:'Trigger interval and partitioning created a small-file explosion. Tune batch cadence and compact safely with business validation.'}
];

const defaults={xp:0,done:{},attempts:0,streak:0,bestStreak:0,checks:{},history:{},active:null,sound:false,incidentsSolved:0,lastIncident:null,incidentProgress:{},incidentAttempts:0,incidentCorrect:0,incidentCurrent:0};
let state=Object.assign({},defaults,JSON.parse(localStorage.getItem(STORAGE_KEY)||'{}'));
state.incidentProgress=state.incidentProgress||{};state.incidentAttempts=Number(state.incidentAttempts)||0;state.incidentCorrect=Number(state.incidentCorrect)||0;state.incidentCurrent=Number(state.incidentCurrent)||0;
let currentView='command', missionFilter='all', mapZoom=1, activeIncident=null, incidentStarted=0, incidentTimer=null;

const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>Array.from(r.querySelectorAll(s));
function save(){localStorage.setItem(STORAGE_KEY,JSON.stringify(state));renderHUD();}
function missionId(w,m){return w+'-'+m;}
function doneCount(){return Object.keys(state.done).filter(k=>state.done[k]).length;}
function worldDone(w){return worlds[w].missions.filter((x,m)=>state.done[missionId(w,m)]).length;}
function checkCount(){return Object.values(state.checks).filter(Boolean).length;}
function level(){return Math.floor(state.xp/500)+1;}
function pct(n,d){return d?Math.round(n/d*100):0;}
function esc(s){return String(s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];});}
function toast(msg){const t=$('#toast');t.textContent=msg;t.classList.add('show');setTimeout(function(){t.classList.remove('show');},1900);}
function logAttempt(id,label){state.history[id]=state.history[id]||[];state.history[id].push({label:label,ts:Date.now()});state.history[id]=state.history[id].slice(-20);save();}
function setByte(msg){$('#byteMessage').textContent=msg;}
function random(arr){return arr[Math.floor(Math.random()*arr.length)];}

function renderHUD(){
  const d=doneCount(), lv=level(), into=state.xp%500;
  $('#hudLevel').textContent=String(lv).padStart(2,'0');
  $('#hudXp').textContent=into+' / 500';
  $('#hudXpBar').style.width=(into/5)+'%';
  $('#hudMastery').textContent=pct(d,30)+'%';
  $('#kpiLabs').textContent=d+' / 30';
  $('#kpiLabsBar').style.width=pct(d,30)+'%';
  $('#kpiProjects').textContent=checkCount()+' / 60';
  $('#kpiProjectsBar').style.width=pct(checkCount(),60)+'%';
  $('#kpiStreak').textContent=state.bestStreak||0;
  $('#kpiAttempts').textContent=state.attempts||0;
  $('#projectScore').textContent=pct(checkCount(),60)+'%';
  $('#soundToggle').textContent=state.sound?'◉':'◌';
}

function setView(name){
  currentView=name;
  $$('.view').forEach(function(v){v.classList.toggle('active',v.id==='view-'+name);});
  $$('.nav-item').forEach(function(n){n.classList.toggle('active',n.dataset.view===name);});
  const titles={command:'Production Command Center',worlds:'Cloud Odyssey World Map',missions:'Mission Control',lab:'Cloud Lab Workspace',warroom:'Incident War Room',projects:'PROJECTS* Readiness Board',skills:'Skills Matrix',relics:'Relic Vault'};
  $('#pageTitle').textContent=titles[name]||'Cloud Odyssey';
  if(name==='command') renderCommand();
  if(name==='worlds') renderWorlds();
  if(name==='missions') renderMissions();
  if(name==='projects') renderProjects();
  if(name==='skills') renderSkills();
  if(name==='relics') renderRelics();
  if(name==='warroom'&&!activeIncident) generateIncident();
}

function renderCommand(){
  const campaign=worlds.slice(0,4);
  $('#campaignRows').innerHTML=campaign.map(function(w,wi){
    const d=worldDone(wi);
    return '<div class="campaign-row"><div class="world-icon">'+w.icon+'</div><div><b>'+w.name+'</b><span>'+w.desc+'</span></div><div class="row-progress"><div><i style="width:'+pct(d,3)+'%"></i></div><span>'+d+'/3 mastered</span></div></div>';
  }).join('');
  const categories=[
    ['Data platform',sumWorld([0,1,8])],['ML engineering',sumWorld([4,5,9])],['Governance',sumWorld([0,2,6])],
    ['Production ops',sumWorld([3,7,8])],['Business modeling',sumWorld([2,5])],['AI systems',sumWorld([6,9])]
  ];
  $('#radarBars').innerHTML=categories.map(function(x){return '<div class="radar-row"><span>'+x[0]+'</span><div class="radar-track"><i style="width:'+x[1]+'%"></i></div><b>'+x[1]+'%</b></div>';}).join('');
  const telemetry=[
    ['Reservation events','42.8K/min','healthy'],['Pipeline freshness','3m 12s','within SLO'],['Feature freshness','11m','healthy'],['Model p95','118ms','within SLO'],
    ['DLT expectations','99.92%','green'],['Kafka lag','1.4m','stable'],['MLflow runs','128','tracked'],['Cost / 1K events','$0.41','optimized']
  ];
  $('#telemetry').innerHTML=telemetry.map(function(t){return '<div class="telemetry-tile"><span>'+t[0]+'</span><b>'+t[1]+'</b><em>● '+t[2]+'</em></div>';}).join('');
  const next=[];
  worlds.forEach(function(w,wi){w.missions.forEach(function(m,mi){if(!state.done[missionId(wi,mi)]&&next.length<4)next.push([w,wi,m,mi]);});});
  $('#nextMissions').innerHTML=next.map(function(x){return '<div class="next-row"><div class="world-icon">'+x[0].icon+'</div><div><b>'+x[2].title+'</b><span>'+x[0].name+' • '+x[2].type+'</span></div><button class="text-btn open-mission" data-w="'+x[1]+'" data-m="'+x[3]+'">Launch</button></div>';}).join('')||'<div class="next-row"><div class="world-icon">🏆</div><div><b>Campaign mastered</b><span>All 30 missions complete</span></div></div>';
  $$('.open-mission').forEach(function(b){b.onclick=function(){openMission(+b.dataset.w,+b.dataset.m);};});
}
function sumWorld(ids){let done=0,total=0;ids.forEach(function(i){done+=worldDone(i);total+=3;});return pct(done,total);}

function renderWorlds(){
  $('#worldMap').innerHTML=worlds.map(function(w,wi){
    const d=worldDone(wi);
    return '<article class="world-node '+(d===3?'restored':'')+'" style="--wa:'+w.colors[0]+';--wb:'+w.colors[1]+'">'+
      '<div class="world-kicker">WORLD '+String(wi+1).padStart(2,'0')+'</div><div class="world-big-icon">'+w.icon+'</div><h3>'+w.name+'</h3><p>'+w.desc+'</p>'+
      '<div class="world-stack">'+w.stack.map(function(s){return '<span class="stack-chip">'+s+'</span>';}).join('')+'</div>'+
      '<div class="world-progress"><i style="width:'+pct(d,3)+'%"></i></div><div class="world-footer"><span>'+d+' / 3 MASTERED</span><button class="enter-world" data-w="'+wi+'">'+(d===3?'REVISIT':'ENTER WORLD')+'</button></div></article>';
  }).join('');
  $$('.enter-world').forEach(function(b){b.onclick=function(){openWorld(+b.dataset.w);};});
}

function openWorld(wi){
  const w=worlds[wi];
  $('#modalContent').innerHTML='<span class="micro">WORLD '+String(wi+1).padStart(2,'0')+'</span><h2>'+w.icon+' '+w.name+'</h2><p>'+w.desc+'. Master all three quests to restore this world and earn the <b>'+w.relic+'</b>.</p><div class="modal-missions">'+w.missions.map(function(m,mi){
    const d=!!state.done[missionId(wi,mi)];
    return '<div class="modal-mission"><div class="world-icon">'+(mi===2?'👑':'⌘')+'</div><div><b>'+m.title+'</b><span>'+m.type+' • '+w.skills[mi]+' • +200 XP</span></div><button data-open="'+wi+','+mi+'">'+(d?'REVISIT':'LAUNCH')+'</button></div>';
  }).join('')+'</div>';
  $('#modal').classList.remove('hidden');
  $$('[data-open]',$('#modalContent')).forEach(function(b){b.onclick=function(){const p=b.dataset.open.split(',');closeModal();openMission(+p[0],+p[1]);};});
}

function renderMissions(){
  let idx=0,rows=[];
  worlds.forEach(function(w,wi){w.missions.forEach(function(m,mi){idx++;const d=!!state.done[missionId(wi,mi)];if(missionFilter==='open'&&d)return;if(missionFilter==='done'&&!d)return;
    rows.push('<div class="mission-row"><span class="mission-index">'+String(idx).padStart(2,'0')+'</span><div class="mission-main"><b>'+m.title+'</b><span>'+w.name+' • '+w.skills[mi]+'</span></div><div class="mission-stack">'+w.stack.join(' · ')+'</div><div class="status-chip '+(d?'done':'')+'">'+(d?'MASTERED':'OPEN')+'</div><div class="mission-progress">'+(state.history[missionId(wi,mi)]||[]).length+' attempts</div><button class="mission-open" data-w="'+wi+'" data-m="'+mi+'">'+(d?'REVISIT':'LAUNCH')+'</button></div>');
  });});
  $('#missionTable').innerHTML='<div class="mission-head"><span>#</span><span>MISSION</span><span>STACK</span><span>STATUS</span><span>HISTORY</span><span>ACTION</span></div>'+rows.join('');
  $$('.mission-open').forEach(function(b){b.onclick=function(){openMission(+b.dataset.w,+b.dataset.m);};});
}

function openMission(wi,mi){
  const w=worlds[wi],m=w&&w.missions&&w.missions[mi],id=missionId(wi,mi);
  state.active={w:wi,m:mi,mission_id:id,server_status:'starting',started_at_ms:Date.now()};save();
  loadLab(wi,mi);setView('lab');

  const api=window.CloudOdysseyBackend;
  if(api&&api.startMission&&w&&m){
    api.startMission({
      mission_id:id,
      world_id:w.id||('world-'+(wi+1)),
      world_name:w.name,
      mission_title:m.title,
      mission_type:m.type,
      skill:w.skills&&w.skills[mi],
      stack:w.stack||[],
      revisit:!!state.done[id],
      source:'mission-control'
    }).then(function(r){
      if(state.active&&state.active.w===wi&&state.active.m===mi){
        state.active.session_id=r.session_id;
        state.active.request_id=r.request_id;
        state.active.server_status='started';
        state.active.persistence=!!(r.persistence&&r.persistence.stored);
        save();
      }
      document.dispatchEvent(new CustomEvent('odyssey:mission-session',{detail:r}));
      toast('Server mission session '+String(r.session_id||'').slice(0,8)+' started'+((r.persistence&&r.persistence.stored)?' • persisted':' • control-plane acknowledged'));
    }).catch(function(e){
      if(state.active&&state.active.w===wi&&state.active.m===mi){
        state.active.server_status='error';
        state.active.server_error=e.message;
        save();
      }
      document.dispatchEvent(new CustomEvent('odyssey:mission-session-error',{detail:{mission_id:id,error:e.message}}));
      toast('Mission opened • backend session start failed');
    });
  }else{
    state.active.server_status='backend-client-unavailable';save();
    toast('Mission opened • backend client unavailable');
  }
}

function buildTestFile(w,m){
  return "# Production contract tests for "+m.title+"\n"+
    "def test_contract_or_grain():\n    assert True  # replace with mission-specific assertion\n\n"+
    "def test_deterministic_retry():\n    assert True\n\n"+
    "def test_observable_failure():\n    assert True\n\n"+
    "def test_business_validation():\n    assert True\n";
}
function buildPipelineFile(w,m){
  return "name: "+w.id+"-"+m.title.toLowerCase().replace(/[^a-z0-9]+/g,'-')+"\n"+
    "runtime: production-sim\n"+
    "stages:\n  - validate\n  - transform\n  - test\n  - publish\n"+
    "rollback: last-known-good\n";
}
function saveActiveEditor(){
  const e=$('#codeEditor');if(e)editorFiles[activeEditorFile]=e.value;
}
function switchEditor(file){
  if(!editorFiles.hasOwnProperty(file))return;
  saveActiveEditor();activeEditorFile=file;
  $('.ide-tab').forEach(function(b){b.classList.toggle('active',b.dataset.editor===file);});
  const e=$('#codeEditor');if(e)e.value=editorFiles[file]||'';
  const lang=$('#editorLang');
  if(lang)lang.textContent=file.endsWith('.yaml')?'YAML':file.endsWith('.py')?'PYTHON':'TEXT';
  toast('Opened '+file);
}
function playUiTone(on){
  try{
    audioCtx=audioCtx||new (window.AudioContext||window.webkitAudioContext)();
    const osc=audioCtx.createOscillator(),gain=audioCtx.createGain();
    osc.type='sine';osc.frequency.value=on?720:320;gain.gain.value=.035;
    osc.connect(gain);gain.connect(audioCtx.destination);osc.start();
    gain.gain.exponentialRampToValueAtTime(.0001,audioCtx.currentTime+.12);osc.stop(audioCtx.currentTime+.13);
  }catch(e){}
}
function loadLab(wi,mi){
  const w=worlds[wi],m=w.missions[mi],id=missionId(wi,mi);
  $('#labEmpty').classList.add('hidden');$('#labWorkspace').classList.remove('hidden');
  $('#labWorldLabel').textContent='WORLD '+String(wi+1).padStart(2,'0')+' // '+w.name.toUpperCase();
  $('#labTitle').textContent=m.title;
  $('#labState').textContent=state.done[id]?'MASTERED':'IN PROGRESS';
  editorFiles['solution.py']=starterFor(m,w);editorFiles['tests.py']=buildTestFile(w,m);editorFiles['pipeline.yaml']=buildPipelineFile(w,m);activeEditorFile='solution.py';$('#codeEditor').value=editorFiles['solution.py'];$('.ide-tab').forEach(function(b){b.classList.toggle('active',b.dataset.editor==='solution.py');});$('#editorLang').textContent='PYTHON';
  $('#runtimeLog').textContent='$ workspace initialized\n$ stack: '+w.stack.join(' / ')+'\n$ mission: '+m.title+'\n$ waiting for your implementation...';
  renderLabSide('brief',wi,mi);
  renderPipeline(wi,mi);
  resetTests(m);
  renderMLflow(wi,mi);
  $('#notebookCell').textContent=notebookFor(w,m);
  $('#notebookOutput').textContent='Cell has not been executed.';
}
function starterFor(m,w){
  if(m.type==='SQL')return '-- '+m.task+'\n\nWITH source AS (\n    SELECT * FROM raw_source\n)\n-- TODO: production-safe implementation\nSELECT * FROM source;';
  if(m.type==='YAML'||m.type==='DBT')return '# '+m.task+'\n\nversion: 1\n# TODO: add production controls\n';
  return '# '+m.task+'\n\ndef solve(input_data):\n    # TODO: production-safe implementation\n    pass\n';
}
function notebookFor(w,m){return "display(validation_df)\n# "+w.name+" / "+m.title+"\nassert validation_df.count() > 0";}
function renderLabSide(panel,wi,mi){
  const w=worlds[wi],m=w.missions[mi];
  let html='';
  if(panel==='brief')html='<h4>Production brief</h4><p>'+m.risk+'</p><h4>Your task</h4><p>'+m.task+'</p><h4>Stack</h4><p>'+w.stack.join(' • ')+'</p>';
  if(panel==='architecture')html='<h4>Expected architecture thinking</h4><ul><li>Declare source and target grain.</li><li>Define idempotency/replay boundary.</li><li>Separate quarantine from publish path.</li><li>Preserve lineage and rollback evidence.</li></ul>';
  if(panel==='acceptance')html='<h4>Acceptance criteria</h4><ul><li>Deterministic under retry or replay.</li><li>Bad data is visible, not silently lost.</li><li>Tests can fail the release.</li><li>SLO/alert is tied to business impact.</li></ul>';
  if(panel==='business')html='<h4>Business impact</h4><p>Explain how the implementation protects inventory truth, guest experience, conversion, staffing, or revenue. Senior-level answers connect code choices to operational outcomes.</p>';
  $('#labSideContent').innerHTML=html;
}
function renderPipeline(wi,mi){
  const w=worlds[wi];
  const nodes=[
    ['◫','Source',w.stack[0]],['⇢','Ingest','Contract gate'],['◇','Transform',w.skills[mi]],['✓','Quality','Automated checks'],['⬡','Publish','Business output']
  ];
  $('#pipelineGraph').innerHTML=nodes.map(function(n,i){return '<div class="pipe-node"><span>'+n[0]+'</span><div><b>'+n[1]+'</b><small>'+n[2]+'</small></div><em>'+((i===0||i===4)?'LIVE':'READY')+'</em></div>'+(i<nodes.length-1?'<div class="pipe-arrow">↓</div>':'');}).join('');
}
function resetTests(m){
  $('#testSummary').textContent='0/4';
  const names=['mission_contract','executable_shape','production_control','completeness'];
  $('#testResults').innerHTML=names.map(function(n){return '<div class="test-row"><span>○</span><span>'+n+'</span><b>WAIT</b></div>';}).join('');
}
function renderServerTests(tests){
  tests=Array.isArray(tests)?tests:[];
  $('#testSummary').textContent=tests.filter(function(t){return t.pass;}).length+'/'+tests.length;
  $('#testResults').innerHTML=tests.map(function(t){
    return '<div class="test-row '+(t.pass?'pass':'fail')+'"><span>'+(t.pass?'✓':'×')+'</span><span>'+esc(t.name)+'</span><b>'+(t.pass?'PASS':'FAIL')+'</b></div>';
  }).join('');
}
function localPreview(m,text){
  text=String(text||'').toLowerCase();
  const tokenPass=m.tokens.map(function(t){return text.indexOf(t.toLowerCase())>=0;});
  const genericPass=[/validate|test|assert|quality/.test(text),/alert|log|monitor|slo|trace|quarantine/.test(text),/rollback|idempot|replay|merge|checkpoint|version/.test(text)];
  return [
    tokenPass.filter(Boolean).length>=Math.min(2,m.tokens.length),
    genericPass[2]||tokenPass.filter(Boolean).length>=1,
    genericPass[0]||genericPass[1],
    text.length>80&&!/\b(todo|pass)\b/.test(text)
  ];
}
async function gradeCurrent(){
  if(!state.active)return;
  const wi=state.active.w,mi=state.active.m,w=worlds[wi],m=w.missions[mi],id=missionId(wi,mi);
  saveActiveEditor();
  const solution=editorFiles['solution.py']||'';
  const api=window.CloudOdysseyBackend;
  state.attempts++;
  appendLog('submitting mission to authoritative server grader...');

  if(!api||!api.gradeMission){
    const preview=localPreview(m,solution),passed=preview.filter(Boolean).length;
    state.streak=0;
    logAttempt(id,'LOCAL FALLBACK grade '+passed+'/4');
    renderTestResults(preview);
    $('#labState').textContent='LOCAL PREVIEW '+passed+'/4';
    appendLog('LOCAL FALLBACK only — backend grader unavailable; mastery/XP not awarded');
    toast('Local preview only • no verified mastery');
    renderHUD();save();
    return;
  }

  try{
    const history=state.history[id]||[];
    const revealUsed=history.some(function(x){return x&&x.label==='Solution revealed';});
    const r=await api.gradeMission({
      mission_id:id,
      solution:solution,
      session_id:state.active.session_id||null,
      reveal_used:revealUsed,
      duration_ms:Math.max(0,Date.now()-(state.active.started_at_ms||Date.now()))
    });

    state.active.server_grade={
      attempt_id:r.attempt_id,
      request_id:r.request_id,
      score:r.score,
      mastered:!!r.mastered,
      persistence:r.persistence||null,
      verification:r.verification||'unsigned'
    };

    if(r.mastered){
      state.streak=(state.streak||0)+1;
      state.bestStreak=Math.max(state.bestStreak||0,state.streak);
      if(!state.done[id]){
        state.done[id]=true;
        state.xp+=200;
        toast('SERVER VERIFIED • Mission mastered • +200 XP');
      }else{
        toast('SERVER VERIFIED • Mission revalidated');
      }
    }else{
      state.streak=0;
      toast('Server grade '+r.score+'% • keep iterating');
    }

    logAttempt(id,'SERVER grade '+r.score+'%'+(r.mastered?' MASTERED':''));
    renderServerTests(r.tests||[]);
    $('#labState').textContent=r.mastered?'MASTERED • SERVER':'SERVER '+r.score+'%';
    appendLog('REAL SERVER grade: '+r.score+'% • attempt '+String(r.attempt_id||'').slice(0,8)+' • request '+String(r.request_id||'').slice(0,8));
    appendLog('verification: '+(r.verification||'unsigned')+' • assessment persistence: '+((r.persistence&&r.persistence.saved)?'SAVED':'NOT PERSISTED'));
    renderHUD();save();

    if(api.syncProgress){
      try{
        const sync=await api.syncProgress();
        state.active.progress_sync={
          request_id:sync.request_id||null,
          persisted:!!(sync.snapshot||sync.persistence),
          message:sync.message||null
        };
        save();
        if(sync.snapshot)appendLog('progress snapshot persisted • version '+sync.snapshot.version+' • request '+String(sync.request_id||'').slice(0,8));
        else appendLog('progress sync not persisted • '+(sync.message||'DATABASE_URL required'));
      }catch(syncErr){
        appendLog('progress sync failed • '+syncErr.message);
      }
    }
  }catch(e){
    const preview=localPreview(m,solution),passed=preview.filter(Boolean).length;
    state.streak=0;
    logAttempt(id,'LOCAL FALLBACK after server error '+passed+'/4');
    renderTestResults(preview);
    $('#labState').textContent='LOCAL PREVIEW '+passed+'/4';
    appendLog('server grade failed: '+e.message);
    appendLog('LOCAL FALLBACK only — mastery/XP not awarded');
    toast('Server unavailable • local preview only');
    renderHUD();save();
  }
}
function renderTestResults(score){
  const names=['mission_contract','executable_shape','production_control','completeness'];
  $('#testSummary').textContent=score.filter(Boolean).length+'/4';
  $('#testResults').innerHTML=names.map(function(n,i){const p=score[i];return '<div class="test-row '+(p?'pass':'fail')+'"><span>'+(p?'✓':'×')+'</span><span>'+n+'</span><b>'+(p?'PASS':'FAIL')+'</b></div>';}).join('');
}
async function runTestsOnly(){
  if(!state.active)return;
  const wi=state.active.w,mi=state.active.m,m=worlds[wi].missions[mi],id=missionId(wi,mi);
  saveActiveEditor();
  const solution=editorFiles['solution.py']||'';
  const api=window.CloudOdysseyBackend;
  appendLog('submitting unit + contract checks to real server test runner...');

  if(!api||!api.runMissionTests){
    const preview=localPreview(m,solution);
    renderTestResults(preview);
    appendLog('LOCAL FALLBACK test preview — backend runner unavailable');
    toast('Local test preview only');
    return;
  }

  try{
    const r=await api.runMissionTests({mission_id:id,solution:solution});
    state.active.last_test={
      run_id:r.run_id,
      request_id:r.request_id,
      score:r.score,
      code_hash:r.code_hash,
      execution_mode:r.execution_mode
    };
    save();
    renderServerTests(r.tests||[]);
    appendLog('REAL SERVER tests: '+r.passed+'/'+r.total+' • score '+r.score+'%');
    appendLog('run '+String(r.run_id||'').slice(0,8)+' • request '+String(r.request_id||'').slice(0,8)+' • code '+String(r.code_hash||'').slice(0,12));
    appendLog('mode: '+r.execution_mode+' • unrestricted user code execution: '+(r.arbitrary_code_execution?'YES':'NO'));
    logAttempt(id,'SERVER tests '+r.passed+'/'+r.total);
    toast('Server tests '+r.passed+'/'+r.total);
  }catch(e){
    const preview=localPreview(m,solution);
    renderTestResults(preview);
    appendLog('server test runner failed: '+e.message);
    appendLog('LOCAL FALLBACK test preview only');
    toast('Server test failed • local preview shown');
  }
}
function appendLog(msg){const p=$('#runtimeLog');p.textContent+='\n['+new Date().toLocaleTimeString()+'] '+msg;p.scrollTop=p.scrollHeight;}
function renderMLflow(wi,mi){
  const mastered=!!state.done[missionId(wi,mi)];
  const vals=mastered?[['quality','0.982'],['freshness','3.2m'],['cost','0.41'],['errors','0.08%'],['drift','0.03'],['RTO','8m']]:[['quality','—'],['freshness','—'],['cost','—'],['errors','—'],['drift','—'],['RTO','—']];
  $('#mlflowMetrics').innerHTML=vals.map(function(v){return '<div class="ml-metric"><span>'+v[0]+'</span><b>'+v[1]+'</b></div>';}).join('');
}

function revealSolution(){
  if(!state.active)return;
  const wi=state.active.w,mi=state.active.m,m=worlds[wi].missions[mi],id=missionId(wi,mi);
  editorFiles['solution.py']=m.solution;switchEditor('solution.py');
  logAttempt(id,'Solution revealed');
  appendLog('reference solution loaded — study why each control exists');
  toast('Reference solution loaded');
}

function renderProjects(){
  $('#projectsBoard').innerHTML=worlds.map(function(w,wi){
    const count=artifactNames.filter(function(x,ai){return state.checks[wi+'-'+ai];}).length;
    return '<article class="project-card glass"><div class="project-head"><div><span class="micro">PROJECT '+String(wi+1).padStart(2,'0')+'</span><h3>'+w.icon+' '+w.name+'</h3></div><div class="score">'+count+'/6</div></div><div class="artifact-list">'+artifactNames.map(function(a,ai){const k=wi+'-'+ai;return '<label class="artifact-item"><input type="checkbox" data-check="'+k+'" '+(state.checks[k]?'checked':'')+'/><span>'+a+'</span></label>';}).join('')+'</div></article>';
  }).join('');
  $$('[data-check]').forEach(function(c){c.onchange=function(){state.checks[c.dataset.check]=c.checked;save();renderProjects();renderHUD();};});
}

function renderSkills(){
  const skills={};
  worlds.forEach(function(w,wi){w.stack.concat(w.skills).forEach(function(s){skills[s]=skills[s]||{done:0,total:0};skills[s].total++;});w.missions.forEach(function(m,mi){if(state.done[missionId(wi,mi)])w.stack.concat([w.skills[mi]]).forEach(function(s){skills[s].done=(skills[s].done||0)+1;});});});
  const top=Object.keys(skills).slice(0,16).map(function(s){const v=skills[s],p=Math.min(100,pct(v.done,Math.max(1,v.total)));return [s,p];});
  $('#skillsMatrix').innerHTML=top.map(function(x){return '<div class="skill-row"><span>'+x[0]+'</span><div class="skill-track"><i style="width:'+x[1]+'%"></i></div><b>'+x[1]+'%</b></div>';}).join('');
  const signals=[
    ['Architecture','Can declare grain, boundaries, lineage, ownership and failure modes.'],
    ['Coding','Can implement production-safe SQL/Python/PySpark patterns under constraints.'],
    ['MLOps','Can track, register, gate, monitor and roll back models.'],
    ['Operations','Can triage incidents without destroying evidence or widening blast radius.'],
    ['Business impact','Can connect engineering choices to guest, revenue, inventory and staffing outcomes.'],
    ['Leadership','Can define release gates, runbooks, SLOs, ownership and recovery decisions.']
  ];
  $('#signalMatrix').innerHTML=signals.map(function(s,i){const strength=Math.min(100,pct(doneCount()+Math.floor(checkCount()/6),30)+i*2);return '<div class="signal-card"><b>'+s[0]+' • '+strength+'%</b><p>'+s[1]+'</p></div>';}).join('');
}

function renderRelics(){
  $('#relicVault').innerHTML=worlds.map(function(w,wi){const unlocked=worldDone(wi)===3;return '<article class="relic-card glass '+(unlocked?'':'locked')+'"><div class="relic-icon">'+(unlocked?w.icon:'🔒')+'</div><span class="micro">'+(unlocked?'UNLOCKED':'LOCKED')+'</span><h3>'+w.relic+'</h3><p>'+(unlocked?'Earned by mastering all three '+w.name+' missions.':'Restore '+w.name+' to unlock this production relic.')+'</p></article>';}).join('');
}

function incidentKey(item){
  return String((item&&item.title)||"incident").toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"");
}
function incidentUniqueSolved(){
  return incidentCases.filter(function(x){var p=state.incidentProgress[incidentKey(x)];return p&&p.solved;}).length;
}
function incidentAccuracy(){
  return state.incidentAttempts?Math.round((state.incidentCorrect/state.incidentAttempts)*100):0;
}
function nextIncidentIndex(){
  if(!incidentCases.length)return 0;
  var start=(Number(state.incidentCurrent)||0)+1;
  for(var step=0;step<incidentCases.length;step++){
    var i=(start+step)%incidentCases.length,p=state.incidentProgress[incidentKey(incidentCases[i])];
    if(!(p&&p.solved))return i;
  }
  return start%incidentCases.length;
}
function renderIncidentProgress(){
  var solved=incidentUniqueSolved(),total=incidentCases.length,progress=$('#incidentProgress'),stats=$('#incidentStats'),next=$('#nextIncident');
  state.incidentsSolved=solved;
  if(progress)progress.innerHTML='<b>'+solved+'/'+total+'</b><span>INCIDENTS MASTERED</span><i><em style="width:'+pct(solved,total)+'%"></em></i>';
  if(stats)stats.innerHTML='<div><span>ACCURACY</span><b>'+incidentAccuracy()+'%</b></div><div><span>ATTEMPTS</span><b>'+state.incidentAttempts+'</b></div><div><span>CURRENT STREAK</span><b>'+(state.streak||0)+'</b></div><div><span>BEST STREAK</span><b>'+(state.bestStreak||0)+'</b></div>';
  if(next){
    var p=activeIncident&&state.incidentProgress[incidentKey(activeIncident)];
    next.disabled=!(p&&p.solved);
    next.textContent=solved===total?'Review next incident →':'Next incident →';
  }
}
function advanceIncident(){
  generateIncident(nextIncidentIndex());
}
function generateIncident(index){
  var idx;
  if(typeof index==='number'&&incidentCases.length)idx=((index%incidentCases.length)+incidentCases.length)%incidentCases.length;
  else idx=incidentCases.length?nextIncidentIndex():0;
  state.incidentCurrent=idx;
  activeIncident=incidentCases[idx]||null;
  if(!activeIncident)return;
  state.lastIncident=activeIncident.title;save();incidentStarted=Date.now();
  var p=state.incidentProgress[incidentKey(activeIncident)]||{};
  $('#incidentSeverity').textContent=activeIncident.sev;$('#incidentTitle').textContent=activeIncident.title;$('#incidentSummary').textContent=activeIncident.summary;
  $('#blastMetrics').innerHTML=activeIncident.metrics.map(function(m){return '<div class="blast"><span>'+m[0]+'</span><b>'+m[1]+'</b></div>';}).join('');
  $('#incidentSignals').innerHTML=activeIncident.signals.map(function(s){return '<div class="signal"><span>'+s[0]+'</span><b>'+s[1]+'</b></div>';}).join('');
  const timeline=[['00:00','Alert fired from production SLO monitor.'],['00:02','Business impact confirmed by downstream KPI anomaly.'],['00:04','Last deployment / checkpoint change identified.'],['00:06','Incident commander requests next action.']];
  $('#incidentTimeline').innerHTML=timeline.map(function(t){return '<div class="timeline-row"><time>'+t[0]+'</time><i></i><p>'+t[1]+'</p></div>';}).join('');
  $('#incidentChoices').innerHTML=activeIncident.choices.map(function(choice,i){return '<button class="incident-choice" data-choice="'+i+'" '+(p.solved?'disabled':'')+'>'+String.fromCharCode(65+i)+'. '+choice+'</button>';}).join('');
  $('#incidentFeedback').className='incident-feedback '+(p.solved?'good':'hidden');
  $('#incidentFeedback').innerHTML=p.solved?'<b>Previously mastered.</b><br>'+activeIncident.root+'<div class="incident-complete">✓ COMPLETE • use Next Incident to continue</div>':'';
  $('#runbookChecklist').innerHTML=['Preserve evidence','Bound blast radius','Identify last change','Verify hypothesis','Recover bounded scope','Reconcile business totals'].map(function(x){return '<div class="runbook-item '+(p.solved?'done':'')+'"><i></i><span>'+x+'</span></div>';}).join('');
  $$('.incident-choice').forEach(function(b){b.onclick=function(){resolveIncident(+b.dataset.choice);};});
  if(incidentTimer)clearInterval(incidentTimer);incidentTimer=setInterval(updateIncidentClock,1000);updateIncidentClock();renderIncidentProgress();
}
function updateIncidentClock(){const s=Math.floor((Date.now()-incidentStarted)/1000),m=Math.floor(s/60),r=s%60;$('#incidentClock').textContent=String(m).padStart(2,'0')+':'+String(r).padStart(2,'0');}
function resolveIncident(choice){
  if(!activeIncident)return;
  var key=incidentKey(activeIncident),p=state.incidentProgress[key]||{attempts:0,wrong:0,solved:false,firstPass:null};
  state.attempts++;state.incidentAttempts++;p.attempts++;
  const good=choice===activeIncident.correct,fb=$('#incidentFeedback');fb.classList.remove('hidden');fb.classList.toggle('good',good);fb.classList.toggle('bad',!good);
  if(good){
    state.incidentCorrect++;
    var firstSolve=!p.solved;
    if(p.firstPass===null)p.firstPass=p.attempts===1;
    p.solved=true;p.solvedAt=p.solvedAt||Date.now();p.lastCorrectAt=Date.now();
    state.streak=(state.streak||0)+1;state.bestStreak=Math.max(state.bestStreak||0,state.streak);
    if(firstSolve)state.xp=(state.xp||0)+120;
    fb.innerHTML='<b>Correct production sequence.</b><br>'+activeIncident.root+'<div class="incident-complete">✓ INCIDENT COMPLETE • '+(firstSolve?'+120 XP • ':'')+'Next Incident unlocked</div>';
    $$('.runbook-item').forEach(function(x,i){setTimeout(function(){x.classList.add('done');},i*120);});
    $$('.incident-choice').forEach(function(x){x.disabled=true;});
    toast(firstSolve?'Incident mastered • +120 XP':'Review pass recorded');
  }else{
    p.wrong++;if(p.firstPass===null)p.firstPass=false;state.streak=0;
    fb.innerHTML='<b>Unsafe first move.</b><br>That action changes production before evidence and blast radius are established. Preserve state, scope impact, then test a hypothesis.<div class="incident-retry">Retry this same incident — completion is not awarded yet.</div>';
    toast('Incident decision failed — retry this case');
  }
  state.incidentProgress[key]=p;state.incidentsSolved=incidentUniqueSolved();save();renderHUD();renderIncidentProgress();
}

function closeModal(){$('#modal').classList.add('hidden');}
function wire(){
  $$('.nav-item').forEach(function(b){b.onclick=function(){setView(b.dataset.view);};});
  $$('[data-jump]').forEach(function(b){b.onclick=function(){setView(b.dataset.jump);};});
  $$('[data-close-modal]').forEach(function(b){b.onclick=closeModal;});
  $$('.filter-btn').forEach(function(b){b.onclick=function(){$$('.filter-btn').forEach(function(x){x.classList.remove('active');});b.classList.add('active');missionFilter=b.dataset.filter;renderMissions();};});
  $('#soundToggle').onclick=function(){state.sound=!state.sound;save();playUiTone(state.sound);toast(state.sound?'Game sounds enabled':'Game sounds muted');};
  $('#resumeMission').onclick=function(){if(state.active)openMission(state.active.w,state.active.m);else openMission(0,0);};
  $('#byteHint').onclick=function(){setByte(random(['Start with the data grain before you touch code.','Preserve evidence before changing a failing production system.','Retries must be deterministic. Ask what key makes that true.','If bad data disappears silently, your platform is lying to you.','A senior answer always includes validation, observability and rollback.']));};
  $('#byteChallenge').onclick=function(){setByte(random(['Hard mode: explain the rollback before you explain the happy path.','Hard mode: identify the business KPI that proves your pipeline is correct.','Hard mode: add the test that fails the release before production does.','Hard mode: what happens during replay, late data and partial failure?']));};
  $('#mapZoomIn').onclick=function(){mapZoom=Math.min(1.2,mapZoom+.1);applyMapZoom();};
  $('#mapZoomOut').onclick=function(){mapZoom=Math.max(.7,mapZoom-.1);applyMapZoom();};
  $('#mapZoomReset').onclick=function(){mapZoom=1;applyMapZoom();};
  $('.lab-side-tab').forEach(function(b){b.onclick=function(){$('.lab-side-tab').forEach(function(x){x.classList.remove('active');});b.classList.add('active');if(state.active)renderLabSide(b.dataset.labpanel,state.active.w,state.active.m);};});
  $('.ide-tab').forEach(function(b){b.onclick=function(){switchEditor(b.dataset.editor);};});
  $('#runCode').onclick=runTestsOnly;$('#submitLab').onclick=gradeCurrent;$('#revealSolution').onclick=revealSolution;
  $('#formatCode').onclick=function(){const e=$('#codeEditor');e.value=e.value.replace(/\t/g,'    ').replace(/[ ]+$/gm,'');editorFiles[activeEditorFile]=e.value;toast('Formatted '+activeEditorFile);};
  $('#clearLogs').onclick=function(){$('#runtimeLog').textContent='$ logs cleared';};
  $('#runNotebook').onclick=function(){if(!state.active)return;const wi=state.active.w,mi=state.active.m,w=worlds[wi],m=w.missions[mi];$('#notebookOutput').innerHTML='rows=12,481 • quality=99.92% • freshness=3m 12s • <span style="color:#6cf0a9">VALIDATION GREEN</span>';appendLog('validation notebook executed for '+w.name+' / '+m.title);};
  $('#newIncident').onclick=function(){generateIncident(nextIncidentIndex());};
  if($('#nextIncident'))$('#nextIncident').onclick=advanceIncident;
  $('#resetProgress').onclick=function(){if(confirm('Reset all Cloud Odyssey progress on this device?')){state=Object.assign({},defaults);save();location.reload();}};
  document.addEventListener('keydown',function(e){if(e.key==='Escape')closeModal();if((e.ctrlKey||e.metaKey)&&e.key==='Enter'&&currentView==='lab')gradeCurrent();});
}
function applyMapZoom(){$('#worldMap').style.transform='scale('+mapZoom+')';$('#mapZoomReset').textContent=Math.round(mapZoom*100)+'%';}

function init(){
  wire();renderHUD();renderCommand();renderWorlds();renderMissions();renderProjects();renderSkills();renderRelics();
  if(state.active)loadLab(state.active.w,state.active.m);
  setByte(doneCount()?'You have '+doneCount()+' mastered missions. Keep converting practice into production evidence.':'Your first objective is to prove a production-safe path from source event to business outcome.');
}
window.CloudOdyssey={
  getState:function(){return state;},
  worlds:worlds,
  save:save,
  toast:toast,
  openMission:openMission,
  launchIncident:function(index){setView('warroom');generateIncident(Number(index)||0);},
  incidents:incidentCases,
  incidentProgress:function(){return {solved:incidentUniqueSolved(),total:incidentCases.length,accuracy:incidentAccuracy(),attempts:state.incidentAttempts,current:state.incidentCurrent};},
  nextIncident:advanceIncident,
  setView:setView,
  doneCount:doneCount,
  worldDone:worldDone,
  missionId:missionId,
  renderHUD:renderHUD,
  renderCommand:renderCommand,
  renderProjects:renderProjects,
  renderSkills:renderSkills,
  renderRelics:renderRelics
};
init();
})();