(function(){
"use strict";
if(!window.CloudOdyssey){console.error("Project Launchpad requires CloudOdyssey");return;}
var CO=window.CloudOdyssey,D=document,KEY="cloud_odyssey_active_work_v1",HISTORY_KEY="cloud_odyssey_project_history_v1",syncTimer=null;
var $=function(s,r){return (r||D).querySelector(s);};
var $$=function(s,r){return Array.prototype.slice.call((r||D).querySelectorAll(s));};
var esc=function(s){return String(s||"").replace(/[&<>"]/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c];});};
var streams={
 quick:{
  label:"Quick Win",view:"pattern-match",kicker:"RAPID PATTERN PROJECT",
  projects:[
   {title:"SQL Window Pattern Sprint",tag:"SQL • Windows",scenario:"Identify the correct window function for running totals, latest-row selection, previous-row comparison and ranked groups.",objective:"Build recognition speed before syntax: problem shape → window pattern → WHY → caveat.",files:["notes/sql_window_patterns.md"],accept:["Match 8 window scenarios","Explain ROW_NUMBER vs RANK vs DENSE_RANK","Recognize LAG/LEAD triggers","State one caveat per pattern"],launch:{kind:"match",category:"window"}},
   {title:"Spark Performance Triage Sprint",tag:"PySpark • Performance",scenario:"Recognize skew, broadcast, repartition, AQE and pre-aggregation from production symptoms.",objective:"Diagnose the bottleneck before changing cluster size or code.",files:["notes/spark_performance_patterns.md"],accept:["Recognize skew from uneven tasks","Know when broadcast is safe","Distinguish repartition from salting","Explain why evidence comes first"],launch:{kind:"match",category:"performance"}},
   {title:"SQL Command Semantics Sprint",tag:"SQL • DDL/DML/TCL",scenario:"Match operational intent to CREATE/ALTER/MERGE/DELETE/TRUNCATE/COMMIT/ROLLBACK and related commands.",objective:"Make command selection automatic while preserving transaction and rollback semantics.",files:["notes/sql_command_semantics.md"],accept:["Match DDL/DML/TCL cases","Explain DELETE vs TRUNCATE vs DROP","Recognize MERGE use cases","State rollback implications"],launch:{kind:"match",category:"commands"}},
   {title:"Data Cleaning Pattern Sprint",tag:"Python • Pandas",scenario:"Match dirty-data symptoms to null handling, dedupe, type conversion, string normalization, outlier inspection and filtering.",objective:"Recognize cleaning intent before writing code and preserve business meaning.",files:["notes/data_cleaning_patterns.md"],accept:["Match 8 cleaning symptoms","Explain dedupe key choice","Separate invalid from missing","State why outliers are not blindly deleted"],launch:{kind:"match",category:"cleaning"}}
  ]
 },
 build:{
  label:"Build Something",view:"coding-forge",kicker:"HANDS-ON ENGINEERING BUILD",
  projects:[
   {title:"Latest Customer Record CDC Build",tag:"SQL • CDC",scenario:"Customer CDC has multiple versions. Produce deterministic current state by customer.",objective:"Write the query, defend ordering/tie-breaking, name the file correctly and explain why DISTINCT is unsafe.",files:["sql/cdc/customer_latest.sql","tests/customer_latest_cases.sql"],accept:["ROW_NUMBER partitioned by customer","Stable event_time + event_version ordering","One current row per customer","Explain retry/determinism tradeoff"],launch:{kind:"coding",index:3,mode:"production"}},
   {title:"Skewed Spark Join Build",tag:"PySpark • Performance",scenario:"One key owns 2.5M rows while peer partitions have ~10–12K; one task dominates stage time.",objective:"Profile, choose broadcast/AQE/salting based on evidence, write the optimized transformation and defend the tradeoff.",files:["spark/jobs/customer_segment_enrichment.py","tests/test_skew_fixture.py","notes/query_plan.md"],accept:["Identify skew before scaling","Prune columns early","Choose broadcast only if dimension fits","Explain fallback when broadcast is unsafe"],launch:{kind:"coding",index:7,mode:"optimize"}},
   {title:"Delta Incremental Inventory MERGE",tag:"Databricks • SQL",scenario:"Silver inventory changes must update Gold current state without rewriting unrelated resorts.",objective:"Implement deterministic MERGE on a stable business key with retry-safe semantics.",files:["databricks/sql/merge_inventory_current.sql","tests/merge_replay.sql"],accept:["Stable inventory_id match","Matched update + unmatched insert","Bounded mutation scope","Explain precedence/retry semantics"],launch:{kind:"coding",index:10,mode:"production"}},
   {title:"Query-Plan First Optimization",tag:"SQL • Performance",scenario:"A reporting query takes 10 minutes instead of 10 seconds.",objective:"Inspect plan/cardinality/scan/join/sort evidence before changing indexes, clustering or compute.",files:["sql/performance/order_report_explain.sql","notes/optimization_findings.md"],accept:["Start with EXPLAIN/profile","Identify dominant operator","Prune columns/rows before scaling","Explain engine-specific tuning caveat"],launch:{kind:"coding",index:12,mode:"optimize"}}
  ]
 },
 talk:{
  label:"Talk It Through",view:"speaking",kicker:"ARCHITECTURE + STAR DEFENSE",
  projects:[
   {title:"Reservation Replay Architecture Defense",tag:"Streaming • Idempotency",scenario:"A consumer restart replays reservation events and occupancy rises above source truth.",objective:"Explain the recovery architecture naturally, defend business identity versus physical offsets, and turn it into an interview-ready STAR story.",files:["docs/replay_architecture.md","sql/reconcile_reservations.sql","runbooks/replay_recovery.md"],accept:["Explain WHO/WHAT/WHERE/WHEN/WHY without reading","Defend stable business key vs Kafka offset","State rollback + bounded replay + reconciliation","Give one measurable business result"],launch:{kind:"star",index:0}},
   {title:"Training / Serving Skew Defense",tag:"ML Engineering • Features",scenario:"Offline validation is strong but production predictions diverge because online preprocessing differs.",objective:"Defend a shared feature contract, parity test, point-in-time backfill and safe serving behavior.",files:["design/feature_contract.md","tests/test_online_offline_parity.py","runbooks/feature_skew.md"],accept:["Explain train/serve parity","Contrast shared feature definition vs duplicate logic","Describe point-in-time backfill","Give latency/freshness proof"],launch:{kind:"star",index:4}},
   {title:"Champion Slice Regression Defense",tag:"MLOps • Promotion",scenario:"A challenger improves aggregate performance but regresses a high-value business slice.",objective:"Explain champion/challenger promotion, slice-aware gates, rollback and model lineage.",files:["ml/promotion_policy.md","tests/test_slice_gate.py","runbooks/model_rollback.md"],accept:["State why aggregate score is insufficient","Defend slice-aware promotion gate","Explain rollback target + lineage","Give business-facing metric"],launch:{kind:"star",index:9}},
   {title:"Campaign Writeback Recovery Defense",tag:"Distributed Recovery",scenario:"Promotion state diverges across source history, warehouse authorization and external destinations.",objective:"Explain authorization-before-send, stable operation IDs, reconciliation and certified publication.",files:["design/writeback_saga.md","sql/reconcile_writeback.sql","runbooks/writeback_recovery.md"],accept:["Name authoritative states","Explain idempotent external effects","Describe bounded repair","Defend publish certification"],launch:{kind:"star",index:10}}
  ]
 },
 incident:{
  label:"Break Production",view:"warroom",kicker:"INCIDENT COMMAND",
  projects:[
   {title:"Reservation Ingestion Duplication",tag:"SEV-1 • Streaming",scenario:"Replay after consumer restart duplicates reservation events in the occupancy mart.",objective:"Contain blast radius, preserve offsets/checkpoints, identify the replay boundary, repair only affected keys and reconcile.",files:["incidents/reservation_duplication.md","sql/duplicate_reconcile.sql","runbooks/replay_recovery.md"],accept:["Preserve evidence before mutation","Bound affected offsets + business keys","Prove sink idempotency strategy","Reconcile before resume"],launch:{kind:"incident",index:0}},
   {title:"Feature Freshness Breach",tag:"SEV-2 • ML Features",scenario:"Online inference is healthy but guest propensity features stopped updating after failed microbatches.",objective:"Detect stale-but-valid values, recover the checkpoint chain, backfill bounded features and prove online/offline parity.",files:["incidents/feature_freshness.md","tests/feature_parity.py","runbooks/feature_checkpoint.md"],accept:["Distinguish service health from feature correctness","Scope stale decisions","Recover bounded feature range","Add freshness + parity prevention"],launch:{kind:"incident",index:1}},
   {title:"Model Promotion Regression",tag:"SEV-1 • MLOps",scenario:"A newly promoted model regresses a critical destination/weekend slice.",objective:"Use slice evidence to rollback the known-good champion and repair the promotion policy.",files:["incidents/model_regression.md","ml/slice_gate.yml","runbooks/model_rollback.md"],accept:["Identify affected slice","Compare champion vs challenger","Execute controlled rollback sequence","Add permanent slice gate"],launch:{kind:"incident",index:2}},
   {title:"Delta Small-File Storm",tag:"SEV-2 • Lakehouse",scenario:"Trigger changes create 182k tiny files, higher query latency and +41% cost.",objective:"Diagnose file-generation cause before scaling, compact bounded partitions and prevent recurrence.",files:["incidents/small_file_storm.md","sql/file_profile.sql","runbooks/delta_compaction.md"],accept:["Measure files/size/scan before scaling","Identify trigger/partition cause","Compact bounded scope","Prove latency + cost improvement"],launch:{kind:"incident",index:3}}
  ]
 },
 cloud:{
  label:"Cloud Adventure",view:"cloud-forge",kicker:"END-TO-END CLOUD PROJECT",
  projects:[
   {title:"GCP Streaming Risk / Reservation Pipeline",tag:"GCP • Pub/Sub • Dataflow • BigQuery",scenario:"Build a replay-safe near-real-time stream with dead-letter handling and business reconciliation.",objective:"Complete the 12-stage GCP streaming project from IAM and Terraform through replay, SLOs, runbook and architecture defense.",files:["infra/main.tf","dataflow/pipeline.py","sql/reconcile.sql","tests/replay_fixture.json","runbook.md"],accept:["12/12 simulation checkpoints","Replay/late-data test evidence","Blind architecture defense ≥85","Connector remains locked until graduation"],launch:{kind:"cloud",provider:"gcp",projectId:"gcp-streaming"}},
   {title:"GCP Vertex AI MLOps Factory",tag:"GCP • Vertex AI",scenario:"Train, evaluate, register, promote, monitor and rollback models with reproducible lineage.",objective:"Build the complete model lifecycle including dataset lineage, slice gates, registry and rollback.",files:["infra/vertex.tf","pipeline/pipeline.py","tests/model_gate.py","monitoring/drift.md","runbook.md"],accept:["12/12 simulation checkpoints","Reproducible model/data lineage","Slice-aware promotion gate","Blind defense ≥85"],launch:{kind:"cloud",provider:"gcp",projectId:"gcp-vertex-mlops"}},
   {title:"AWS Real-Time Reservation Stream",tag:"AWS • Kinesis • Flink",scenario:"Ingest reservations continuously, preserve raw evidence and publish trusted occupancy state.",objective:"Design replay-safe stateful streaming on AWS with checkpoint/savepoint recovery and reconciliation.",files:["infra/stream.tf","flink/job.py","sql/reconcile.sql","tests/replay_fixture.json","runbook.md"],accept:["12/12 simulation checkpoints","Checkpoint/replay semantics defended","Business reconciliation defined","Blind defense ≥85"],launch:{kind:"cloud",provider:"aws",projectId:"aws-streaming"}},
   {title:"Databricks Production Structured Streaming",tag:"Databricks • Delta",scenario:"Operate a continuous stream with explicit checkpoint ownership, lag/freshness SLOs and bounded replay.",objective:"Build the Databricks-native production stream and prove safe restart semantics.",files:["src/stream.py","resources/job.yml","tests/test_replay.py","monitoring/stream_slo.sql","runbook.md"],accept:["12/12 simulation checkpoints","Checkpoint ownership explicit","Replay test passes conceptually","Blind defense ≥85"],launch:{kind:"cloud",provider:"databricks",projectId:"dbx-structured-streaming"}},
   {title:"Snowflake Streams + Tasks CDC",tag:"Snowflake • CDC",scenario:"Process CDC incrementally with deterministic MERGE and retry-safe task behavior.",objective:"Build a Snowflake-native incremental pipeline with streams, task graph, replay tests and recovery.",files:["sql/create_stream.sql","sql/task_graph.sql","sql/merge_current.sql","tests/replay.sql","runbook.md"],accept:["12/12 simulation checkpoints","Deterministic MERGE semantics","Retry/replay proof","Blind defense ≥85"],launch:{kind:"cloud",provider:"snowflake",projectId:"snow-streams-tasks"}},
   {title:"Azure Event Hubs → Databricks Streaming",tag:"Azure • Event Hubs • Databricks",scenario:"Stream reservation events into a governed Delta lakehouse with replay-safe processing and reconciliation.",objective:"Build the Azure ingestion path, governance boundary, Delta layers, monitoring and recovery.",files:["infra/main.tf","src/stream.py","tests/replay.py","monitoring/slo.md","runbook.md"],accept:["12/12 simulation checkpoints","Event Hubs replay boundary explained","Delta reconciliation defined","Blind defense ≥85"],launch:{kind:"cloud",provider:"azure",projectId:"azure-eventhub-dbx"}}
  ]
 },
 explain:{
  label:"Explain My Work",view:"stakeholder",kicker:"STAKEHOLDER PROJECT REVIEW",
  projects:[
   {title:"Explain Reservation Replay to an Executive",tag:"Executive • Streaming",scenario:"A replay caused duplicate occupancy state and revenue/inventory risk.",objective:"Translate the recovery into business impact, evidence, residual risk and investment value without leading with Kafka/PySpark jargon.",files:["docs/executive_replay_brief.md","evidence/reconciliation_metrics.md"],accept:["Lead with business outcome","Quantify risk/impact","State proof of correctness","Explain prevention + residual risk"],launch:{kind:"explain",w:0,m:1,audience:"shareholder"}},
   {title:"Defend Feature Skew to ML Engineering",tag:"ML Engineering • Features",scenario:"Offline and online feature logic diverged and changed production scores.",objective:"Explain parity, freshness, serving fallback, feature contracts and point-in-time correctness to ML engineering.",files:["design/feature_contract.md","tests/parity_test.md","runbooks/feature_skew.md"],accept:["Explain offline/online contract","Give serving SLO/fallback","Describe parity evidence","State rollback/recovery"],launch:{kind:"explain",w:4,m:0,audience:"mleng"}},
   {title:"Explain Model Promotion to MLOps",tag:"MLOps • Registry",scenario:"A champion promotion regressed one critical business slice.",objective:"Defend lineage, promotion gates, drift, rollback and retraining policy.",files:["ml/model_card.md","ml/promotion_policy.md","runbooks/model_rollback.md"],accept:["Explain why promoted","Name blocking gates","Describe rollback RTO","Tie drift to action policy"],launch:{kind:"explain",w:9,m:1,audience:"mlops"}},
   {title:"Explain Customer Identity to Data Architecture",tag:"Architecture • Identity",scenario:"Multiple guest profiles create duplicate households and inconsistent analytics.",objective:"Explain grain, authoritative identity, deterministic vs fuzzy matching, lineage and failure boundaries.",files:["design/customer_identity.md","tests/identity_contract.sql","docs/lineage.md"],accept:["Declare entity + household grain","Name system of record","Contrast deterministic vs fuzzy match","Explain false-merge recovery"],launch:{kind:"explain",w:2,m:0,audience:"architect"}}
  ]
 }
};

function getWork(){try{return JSON.parse(localStorage.getItem(KEY)||"null");}catch(e){return null;}}
function getHistory(){try{return JSON.parse(localStorage.getItem(HISTORY_KEY)||"{}");}catch(e){return {};}}
function saveHistory(h){localStorage.setItem(HISTORY_KEY,JSON.stringify(h||{}));}
function projectStatus(w){
 if(!w)return "NOT STARTED";
 if(w.completed)return "COMPLETE";
 if(w.defensePassed)return "DEFENSE PASSED";
 if(workReady(w))return "READY";
 if(w.exercisePassed)return "CODE PASSED";
 return "IN PROGRESS";
}
function updateHistory(w){if(!w||!w.id)return;var h=getHistory();h[w.id]=JSON.parse(JSON.stringify(w));saveHistory(h);}
function projectIndex(work){return Number(work&&work.index)||0;}
function defenseTerms(work){
 var map={
  "build-0":["row_number","event_time","event_version","distinct","deterministic","validation","rollback"],
  "build-1":["skew","broadcast","aqe","salting","shuffle","evidence","validation"],
  "build-2":["merge","inventory_id","matched","not matched","idempotent","bounded","replay"],
  "build-3":["explain","scan","cardinality","join","sort","prune","cost","evidence"]
 };
 return map[work.id]||["why","evidence","validation","rollback","tradeoff"];
}
function workReady(w){
  if(!w)return false;
  var accepts=Array.isArray(w.accept)?w.accept.length:0,done=Object.values(w.done||{}).filter(Boolean).length;
  var files=Array.isArray(w.files)?w.files.length:0,verified=Object.values(w.artifacts||{}).filter(function(x){return x&&x.verified;}).length;
  return done===accepts&&verified===files;
}
function syncWork(w){
  clearTimeout(syncTimer);
  syncTimer=setTimeout(function(){
    var api=window.CloudOdysseyBackend;if(!api||!api.saveWorkOrder)return;
    var copy=JSON.parse(JSON.stringify(w||{}));copy.status=workReady(copy)?"ready":"active";
    api.health().then(function(h){
      if(h&&h.capabilities&&h.capabilities.durable_work_orders)return api.saveWorkOrder(copy);
    }).then(function(r){
      if(r&&r.work_order){document.dispatchEvent(new CustomEvent("odyssey:work-synced",{detail:r}));}
    }).catch(function(){});
  },450);
}
function saveWork(w){w.updatedAt=Date.now();localStorage.setItem(KEY,JSON.stringify(w));updateHistory(w);syncWork(w);}
async function hydrateWork(){
  var api=window.CloudOdysseyBackend;if(!api||!api.loadWorkOrders)return;
  try{
    var h=await api.health();if(!(h&&h.capabilities&&h.capabilities.durable_work_orders))return;
    var r=await api.loadWorkOrders(),rows=r.work_orders||[];if(!rows.length)return;
    var remote=rows[0]&&rows[0].payload;if(!remote)return;
    var local=getWork(),remoteTs=Number(remote.updatedAt||0),localTs=Number(local&&local.updatedAt||0);
    if(!local||remoteTs>localTs){
      localStorage.setItem(KEY,JSON.stringify(remote));
      if(activeView()===remote.view)renderWorkOrder(false);
      CO.toast("Restored latest project work order from server");
    }
  }catch(e){}
}
function closeModal(){var m=$("#modal");if(m)m.classList.add("hidden");}
function picker(kind){
 var s=streams[kind];if(!s)return;
 var history=getHistory();
 var body='<div class="pl-intro"><p>Pick a concrete project. Cloud Odyssey will carry the work order into the destination module instead of dropping you on a generic screen.</p></div><div class="pl-project-grid">'+
 s.projects.map(function(p,i){
   var rec=history[kind+"-"+i],status=projectStatus(rec),score=rec&&rec.exerciseScore!=null?(" • code "+rec.exerciseScore+"%"):"",def=rec&&rec.defenseScore!=null?(" • defense "+rec.defenseScore+"%"):"";
   var label=rec?(rec.completed?"Review completed project →":"Resume work order →"):"Launch work order →";
   return '<article class="pl-project-card '+(rec&&rec.completed?"complete":"")+'"><div class="pl-card-status"><span>'+esc(p.tag)+'</span><strong>'+status+score+def+'</strong></div><h3>'+esc(p.title)+'</h3><p>'+esc(p.scenario)+'</p><div class="pl-mini"><b>OBJECTIVE</b><p>'+esc(p.objective)+'</p></div><button type="button" data-pl-launch="'+kind+':'+i+'">'+label+'</button></article>';
 }).join("")+'</div>';
 var modal=$("#modal"),content=$("#modalContent");if(!modal||!content)return;
 content.innerHTML='<span class="micro">'+esc(s.kicker)+'</span><h2>'+esc(s.label)+' Projects</h2>'+body;
 modal.classList.remove("hidden");
 content.scrollTop=0;var pg=$(".pl-project-grid",content);if(pg)pg.scrollTop=0;
}
function activateDestination(view){
 if(!view)return false;
 if(window.CloudOdysseyUI&&window.CloudOdysseyUI.activate){
   try{return window.CloudOdysseyUI.activate(view,{instant:true})!==false;}catch(e){}
 }
 try{
   CO.setView(view);
   document.dispatchEvent(new CustomEvent("odyssey:viewchange",{detail:{view:view}}));
   return !!$("#view-"+view);
 }catch(e){return false;}
}
function destinationActive(view){
 var v=$("#view-"+view);
 return !!(v&&v.classList.contains("active"));
}
function routeWork(s,a){
 var target=s&&s.view;
 activateDestination(target);
 if(a.kind==="match"&&window.CloudOdysseyCodingForge&&window.CloudOdysseyCodingForge.launchMatch)window.CloudOdysseyCodingForge.launchMatch(a.category);
 else if(a.kind==="coding"&&window.CloudOdysseyCodingForge&&window.CloudOdysseyCodingForge.launchChallenge)window.CloudOdysseyCodingForge.launchChallenge(a.index,a.mode);
 else if(a.kind==="star"&&window.CloudOdysseySpeaking&&window.CloudOdysseySpeaking.launchStar)window.CloudOdysseySpeaking.launchStar(a.index);
 else if(a.kind==="incident"&&CO.launchIncident)CO.launchIncident(Number(a.index)||0);
 else if(a.kind==="cloud"&&window.CloudOdysseyCloudForge&&window.CloudOdysseyCloudForge.launch)window.CloudOdysseyCloudForge.launch(a.provider,a.projectId);
 else if(a.kind==="explain"){
   if(CO.openMission)CO.openMission(Number(a.w)||0,Number(a.m)||0);
   if(window.CloudOdysseyComms&&window.CloudOdysseyComms.launch)window.CloudOdysseyComms.launch({audience:a.audience,context:"active",tab:"talk"});
   else activateDestination(target);
 }
 else activateDestination(target);
 setTimeout(function(){if(!destinationActive(target))activateDestination(target);},120);
 return target;
}
function launch(kind,index){
 var s=streams[kind],p=s&&s.projects[index];if(!p){CO.toast("Project unavailable");return;}
 var id=kind+"-"+index,history=getHistory(),prev=history[id]||null,a=p.launch||{};
 var work=Object.assign({id:id,kind:kind,index:index,title:p.title,tag:p.tag,scenario:p.scenario,objective:p.objective,files:p.files,accept:p.accept,done:{},artifacts:{},view:s.view,startedAt:Date.now(),launch:a,exerciseScore:null,exercisePassed:false,defenseScore:null,defensePassed:false,completed:false},prev||{});
 work.id=id;work.kind=kind;work.index=index;work.title=p.title;work.tag=p.tag;work.scenario=p.scenario;work.objective=p.objective;work.files=p.files;work.accept=p.accept;work.view=s.view;work.launch=a;
 closeModal();
 var target;
 try{target=routeWork(s,a);}catch(e){activateDestination(s.view);target=s.view;}
 try{saveWork(work);}catch(e){try{localStorage.setItem(KEY,JSON.stringify(work));}catch(ignore){}}
 CO.toast("Started: "+p.title);
 document.dispatchEvent(new CustomEvent("odyssey:project-start",{detail:{id:id,kind:kind,index:index,title:p.title,view:target,launch:a}}));
 setTimeout(function(){if(!destinationActive(target))activateDestination(target);renderWorkOrder(true);},180);
 setTimeout(function(){if(destinationActive(target))renderWorkOrder(false);},650);
}
D.addEventListener("click",function(e){
 var b=e.target&&e.target.closest?e.target.closest("[data-pl-launch]"):null;
 if(!b)return;
 e.preventDefault();e.stopPropagation();
 if(b.dataset.plLaunching==="1")return;
 b.dataset.plLaunching="1";b.disabled=true;b.textContent="Starting project…";
 var x=String(b.dataset.plLaunch||"").split(":");
 setTimeout(function(){launch(x[0],Number(x[1]));},0);
 setTimeout(function(){b.disabled=false;b.dataset.plLaunching="";},1200);
},true);
function artifactHint(path){
 var p=String(path||"").toLowerCase();
 if(/runbook|incident/.test(p))return "Recovery/operating procedure: detection, evidence, bounded recovery, validation and rollback.";
 if(/reconcile/.test(p))return "Independent source-to-target business-state reconciliation.";
 if(/test|fixture/.test(p))return "Automated or repeatable cases proving edge, replay, failure or contract behavior.";
 if(/monitor|slo|alarm|drift/.test(p))return "Operational evidence: SLOs, metrics, alerts, freshness, latency or drift.";
 if(/infra|\.tf$/.test(p))return "Infrastructure-as-code for reproducible services, IAM and environment boundaries.";
 if(/\.sqlx?$/.test(p))return "Versioned SQL implementing a declared business transformation or diagnostic.";
 if(/\.py$/.test(p))return "Versioned Python implementation for the project behavior.";
 if(/\.ya?ml$/.test(p))return "Versioned configuration, deployment, policy or workflow contract.";
 return "Project artifact with a clear owner, purpose and reviewable content.";
}
function artifactHTML(work){
 work.artifacts=work.artifacts||{};
 return '<div class="pl-artifacts"><div class="pl-artifact-head"><div><b>ARTIFACT VERIFICATION LAB</b><p>Upload each required file. Cloud Odyssey checks the intended repo path, real filename, extension, content signals, what it does, and why it belongs there.</p></div><span>'+Object.values(work.artifacts).filter(function(x){return x&&x.verified;}).length+'/'+work.files.length+' VERIFIED</span></div>'+
 work.files.map(function(path,i){
   var a=work.artifacts[path]||{},status=a.verified?"VERIFIED":a.score!=null?("CHECK "+a.score+"%"):"NOT VERIFIED";
   return '<article class="pl-artifact '+(a.verified?"verified":"")+'" data-artifact-index="'+i+'">'+
    '<div class="pl-artifact-title"><div><code>'+esc(path)+'</code><p>'+esc(artifactHint(path))+'</p></div><strong>'+status+'</strong></div>'+
    '<label>INTENDED REPOSITORY PATH<input data-art-path="'+i+'" value="'+esc(path)+'"></label>'+
    '<label>UPLOAD FILE<input type="file" data-art-file="'+i+'"></label>'+
    '<label>WHAT DOES THIS FILE DO?<textarea data-art-purpose="'+i+'" placeholder="Explain its job in this project, inputs/outputs and what it proves.">'+esc(a.purpose||"")+'</textarea></label>'+
    '<label>WHY THIS NAME + FOLDER?<textarea data-art-namewhy="'+i+'" placeholder="Explain why this filename and repository location communicate purpose/ownership.">'+esc(a.naming_reason||"")+'</textarea></label>'+
    '<div class="pl-artifact-actions"><button data-art-verify="'+i+'">Verify artifact on server</button><span data-art-result="'+i+'">'+(a.message?esc(a.message):"Waiting for evidence")+'</span></div>'+
   '</article>';
 }).join("")+'</div>';
}
async function verifyArtifact(work,index,el){
 var expected=work.files[index],fileInput=$('[data-art-file="'+index+'"]',el),file=fileInput&&fileInput.files&&fileInput.files[0];
 var pathInput=$('[data-art-path="'+index+'"]',el),purposeEl=$('[data-art-purpose="'+index+'"]',el),whyEl=$('[data-art-namewhy="'+index+'"]',el),out=$('[data-art-result="'+index+'"]',el);
 if(!file){CO.toast("Upload the required file first");return;}
 if(file.size>120000){CO.toast("Artifact verifier accepts text files up to 120 KB");return;}
 out.textContent="Reading file...";
 var content;
 try{content=await file.text();}catch(e){out.textContent="Could not read file as text";return;}
 if(!window.CloudOdysseyBackend||!window.CloudOdysseyBackend.verifyArtifact){out.textContent="Backend artifact verifier unavailable";return;}
 out.textContent="Calling server verifier...";
 try{
   var r=await window.CloudOdysseyBackend.verifyArtifact({
     work_order_id:work.id,
     expected_path:expected,
     declared_path:pathInput.value.trim(),
     file_name:file.name,
     purpose:purposeEl.value.trim(),
     naming_reason:whyEl.value.trim(),
     content:content
   });
   var w=getWork();if(!w)return;w.artifacts=w.artifacts||{};
   w.artifacts[expected]={
     verified:!!r.verified,score:r.score,artifact_id:r.artifact_id,request_id:r.request_id,
     content_hash:r.content_hash,purpose:purposeEl.value.trim(),naming_reason:whyEl.value.trim(),
     dimensions:r.dimensions,message:(r.verified?"Server verified ":"Needs work ")+r.score+"%"
   };
   saveWork(w);renderWorkOrder(false);
   CO.toast(r.verified?"Artifact verified "+r.score+"%":"Artifact needs work "+r.score+"%");
 }catch(e){out.textContent="Verification failed: "+e.message;}
}
async function gradeProjectDefense(work,el){
 var ta=$("#projectDefenseAnswer",el),out=$("#projectDefenseResult",el),answer=ta?ta.value.trim():"";
 if(answer.length<80){CO.toast("Give a complete architecture defense before grading");return;}
 var api=window.CloudOdysseyBackend;if(!api||!api.grade){if(out)out.textContent="Server grader unavailable";return;}
 if(out)out.textContent="Server grading final defense...";
 try{
  var r=await api.grade(answer,defenseTerms(work),{type:"project-defense-"+work.id,blind:true});
  var w=getWork();if(!w||w.id!==work.id)return;
  w.defenseAnswer=answer;w.defenseScore=r.score;w.defensePassed=r.score>=85;
  if(w.defensePassed){
    var first=!w.completed;w.completed=true;w.completedAt=w.completedAt||Date.now();
    if(first&&!w.xpAwarded){var base=CO.getState();base.xp=(base.xp||0)+250;CO.save();w.xpAwarded=true;}
    document.dispatchEvent(new CustomEvent("odyssey:project-complete",{detail:{id:w.id,title:w.title,score:r.score,kind:w.kind}}));
  }
  saveWork(w);renderWorkOrder(false);
  CO.toast(w.defensePassed?"Project COMPLETE • defense "+r.score+"% • +250 XP":"Defense "+r.score+"% • reach 85% to complete");
 }catch(e){if(out)out.textContent="Defense grade failed: "+e.message;}
}
function renderWorkOrder(scroll){
 var work=getWork();if(!work)return;
 var target=$("#view-"+work.view);if(!target)return;
 var old=$(".pl-work-order",target);if(old)old.remove();
 var head=$(".view-heading",target);
 work.artifacts=work.artifacts||{};
 var done=Object.values(work.done||{}).filter(Boolean).length,total=work.accept.length;
 var verified=Object.values(work.artifacts).filter(function(x){return x&&x.verified;}).length;
 var exerciseRequired=work.kind==="build",exercisePassed=!exerciseRequired||!!work.exercisePassed;
 var ready=done===total&&verified===work.files.length&&exercisePassed;
 var el=D.createElement("section");el.className="pl-work-order glass";
 el.innerHTML='<div class="pl-work-head"><div><span class="micro">ACTIVE PROJECT WORK ORDER • '+esc(work.tag)+'</span><h3>'+esc(work.title)+'</h3><p>'+esc(work.objective)+'</p></div><div class="pl-progress"><b>'+done+'/'+total+'</b><span>ACCEPTANCE</span><em>'+verified+'/'+work.files.length+' files</em></div></div>'+
 '<div class="pl-work-grid"><article><b>SCENARIO</b><p>'+esc(work.scenario)+'</p></article><article><b>FILES YOU MUST PRODUCE</b>'+work.files.map(function(f){var a=work.artifacts[f];return '<code class="'+(a&&a.verified?"verified":"")+'">'+esc(f)+(a&&a.verified?" ✓":"")+'</code>';}).join("")+'</article></div>'+
 '<div class="pl-accept"><b>DEFINITION OF DONE '+(work.kind==="build"?"• AUTO-VERIFIED BY CODING PASS":"")+'</b>'+work.accept.map(function(x,i){return '<label><input type="checkbox" data-pl-check="'+i+'" '+(work.done&&work.done[i]?"checked":"")+' '+(work.kind==="build"?"disabled":"")+'><span>'+esc(x)+'</span></label>';}).join("")+'</div>'+
 artifactHTML(work)+
 '<div class="pl-final-gate '+(work.completed?"complete":ready?"ready":"")+'">'+
 (work.completed?
   '<b>✓ PROJECT COMPLETE</b><p>Code '+(work.exerciseScore==null?"—":work.exerciseScore+"%")+' • final defense '+work.defenseScore+'% • completed project evidence is persisted.</p><button data-pl-next>Next build project →</button>':
   ready?
   '<b>READY FOR FINAL PROJECT DEFENSE</b><p>All acceptance criteria, coding evidence and required artifacts are verified. Defend the design, correctness, failure modes, validation and tradeoffs.</p><textarea id="projectDefenseAnswer" placeholder="WHO / WHAT / WHERE / WHEN / WHY • implementation • evidence • failure mode • rollback • business result">'+esc(work.defenseAnswer||"")+'</textarea><div class="pl-defense-actions"><button data-pl-defense>Server-grade final defense</button><span id="projectDefenseResult">'+(work.defenseScore!=null?("Last score "+work.defenseScore+"%"):"85% required")+'</span></div>':
   '<b>FINAL PROJECT GATE LOCKED</b><p>'+(exercisePassed?"Finish acceptance criteria and verify every required artifact.":"Pass the mapped Coding Forge challenge at 90%+ first; then verify the required files.")+'</p>')+
 '</div>'+
 '<div class="pl-work-actions"><button data-pl-action="command">← Command Center</button><button data-pl-action="destination">Jump to exercise ↓</button><button data-pl-action="switch">Choose another project</button><button data-pl-action="clear">Close work order</button></div>';
 if(head)head.insertAdjacentElement("afterend",el);else target.prepend(el);
 $$("[data-art-verify]",el).forEach(function(b){b.onclick=function(){verifyArtifact(getWork(),+b.dataset.artVerify,el);};});
 $$("[data-pl-check]",el).forEach(function(cb){cb.onchange=function(){var w=getWork();if(!w)return;w.done=w.done||{};w.done[cb.dataset.plCheck]=cb.checked;saveWork(w);renderWorkOrder(false);if(Object.values(w.done).filter(Boolean).length===w.accept.length)CO.toast("Acceptance complete • verify every required artifact next");};});
 var defense=$("[data-pl-defense]",el);if(defense)defense.onclick=function(){gradeProjectDefense(getWork(),el);};
 var next=$("[data-pl-next]",el);if(next)next.onclick=function(){var w=getWork(),s=streams[w.kind],n=(projectIndex(w)+1)%s.projects.length;launch(w.kind,n);};
 var c=$('[data-pl-action="command"]',el);if(c)c.onclick=function(){window.CloudOdysseyUI?window.CloudOdysseyUI.activate("command"):CO.setView("command");};
 var dst=$('[data-pl-action="destination"]',el);if(dst)dst.onclick=function(){
   var selectors={
     "coding-forge":"#forgeCode",
     "pattern-match":".match-board",
     "speaking":"#speakingMain",
     "warroom":"#incidentChoices",
     "cloud-forge":".cloud-project-main",
     "stakeholder":"#practiceAnswer"
   };
   var node=$(selectors[work.view]||"",target)||target.querySelector(".forge-main,.speaking-main,.stakeholder-main,.cloud-project-main,.war-main");
   if(node){node.scrollIntoView({behavior:"smooth",block:"start"});setTimeout(function(){if(node.focus)node.focus({preventScroll:true});},350);}
 };
 var sw=$('[data-pl-action="switch"]',el);if(sw)sw.onclick=function(){picker(work.kind);};
 var cl=$('[data-pl-action="clear"]',el);if(cl)cl.onclick=function(){localStorage.removeItem(KEY);el.remove();};
 if(scroll)el.scrollIntoView({behavior:"smooth",block:"start"});
}
function bindCards(){
 var map=[
  ['[data-rich-action="view:pattern-match"]',"quick","Choose quick project →"],
  ['[data-rich-action="view:coding-forge"]',"build","Choose build project →"],
  ['[data-rich-action="view:speaking"]',"talk","Choose speaking project →"],
  ['[data-rich-action="view:warroom"]',"incident","Choose incident →"],
  ['[data-rich-action="view:cloud-forge"]',"cloud","Choose cloud project →"],
  ['[data-rich-action="view:stakeholder"]',"explain","Choose work to explain →"]
 ];
 map.forEach(function(x){
   $$(x[0]).forEach(function(card){
     if(!card.classList.contains("u-mode-card"))return;
     card.dataset.richAction="project-stream:"+x[1];
     card.onclick=function(e){e.preventDefault();e.stopPropagation();picker(x[1]);};
     var em=card.querySelector("em");if(em)em.textContent=x[2];
   });
 });
 var work=getWork();
 if(work&&activeView()===work.view)renderWorkOrder(false);
}
function activeView(){var v=$(".view.active");return v?v.id.replace(/^view-/,""):"command";}
D.addEventListener("odyssey:coding-grade",function(e){
 var d=e.detail||{},w=getWork();if(!w||w.kind!=="build"||!w.launch)return;
 if(Number(w.launch.index)!==Number(d.index))return;
 w.exerciseScore=Number(d.score)||0;w.exercisePassed=!!d.passed;w.exerciseDims=d.dims||{};w.exerciseUpdatedAt=Date.now();
 if(w.exercisePassed){w.done=w.done||{};(w.accept||[]).forEach(function(x,i){w.done[i]=true;});w.acceptanceSource="coding-forge-90+";}
 saveWork(w);
 if(activeView()===w.view)renderWorkOrder(false);
 CO.toast(w.exercisePassed?"Coding evidence attached to project • "+w.exerciseScore+"%":"Project coding evidence updated • "+w.exerciseScore+"%");
});
D.addEventListener("odyssey:viewchange",function(){setTimeout(bindCards,20);setTimeout(function(){var w=getWork();if(w&&activeView()===w.view)renderWorkOrder(false);},25);});
var observer=new MutationObserver(function(){bindCards();var w=getWork();if(w&&activeView()===w.view&&!$(".pl-work-order",$("#view-"+w.view)))renderWorkOrder(false);});
observer.observe($("#workspace")||D.body,{childList:true,subtree:true});
setTimeout(bindCards,40);
setTimeout(hydrateWork,900);
D.addEventListener("odyssey:identity",function(){setTimeout(hydrateWork,120);});
window.CloudOdysseyProjectLaunchpad={streams:streams,picker:picker,launch:launch,getWork:getWork,getHistory:getHistory,renderWorkOrder:renderWorkOrder,status:projectStatus};
})();