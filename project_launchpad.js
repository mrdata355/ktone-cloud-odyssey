(function(){
"use strict";
if(!window.CloudOdyssey){console.error("Project Launchpad requires CloudOdyssey");return;}
var CO=window.CloudOdyssey,D=document,KEY="cloud_odyssey_active_work_v1";
var $=function(s,r){return (r||D).querySelector(s);};
var $$=function(s,r){return Array.prototype.slice.call((r||D).querySelectorAll(s));};
var esc=function(s){return String(s||"").replace(/[&<>"]/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c];});};
var streams={
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
function saveWork(w){localStorage.setItem(KEY,JSON.stringify(w));}
function closeModal(){var m=$("#modal");if(m)m.classList.add("hidden");}
function picker(kind){
 var s=streams[kind];if(!s)return;
 var body='<div class="pl-intro"><p>Pick a concrete project. Cloud Odyssey will carry the work order into the destination module instead of dropping you on a generic screen.</p></div><div class="pl-project-grid">'+
 s.projects.map(function(p,i){return '<article class="pl-project-card"><span>'+esc(p.tag)+'</span><h3>'+esc(p.title)+'</h3><p>'+esc(p.scenario)+'</p><div class="pl-mini"><b>OBJECTIVE</b><p>'+esc(p.objective)+'</p></div><button data-pl-launch="'+kind+':'+i+'">Launch work order →</button></article>';}).join("")+'</div>';
 var modal=$("#modal"),content=$("#modalContent");if(!modal||!content)return;
 content.innerHTML='<span class="micro">'+esc(s.kicker)+'</span><h2>'+esc(s.label)+' Projects</h2>'+body;
 modal.classList.remove("hidden");
 $$("[data-pl-launch]",content).forEach(function(b){b.onclick=function(){var x=b.dataset.plLaunch.split(":");launch(x[0],+x[1]);};});
}
function launch(kind,index){
 var s=streams[kind],p=s&&s.projects[index];if(!p)return;
 var work={id:kind+"-"+index,kind:kind,title:p.title,tag:p.tag,scenario:p.scenario,objective:p.objective,files:p.files,accept:p.accept,done:{},view:s.view,startedAt:Date.now()};
 saveWork(work);closeModal();
 var a=p.launch||{};
 if(a.kind==="star"&&window.CloudOdysseySpeaking&&window.CloudOdysseySpeaking.launchStar)window.CloudOdysseySpeaking.launchStar(a.index);
 else if(a.kind==="incident"&&CO.launchIncident)CO.launchIncident(a.index);
 else if(a.kind==="cloud"&&window.CloudOdysseyCloudForge&&window.CloudOdysseyCloudForge.launch)window.CloudOdysseyCloudForge.launch(a.provider,a.projectId);
 else if(a.kind==="explain"){
   CO.openMission(a.w,a.m);
   if(window.CloudOdysseyComms&&window.CloudOdysseyComms.launch)window.CloudOdysseyComms.launch({audience:a.audience,context:"active",tab:"talk"});
 }
 else if(window.CloudOdysseyUI)window.CloudOdysseyUI.activate(s.view);
 setTimeout(function(){renderWorkOrder(true);},30);
}
function renderWorkOrder(scroll){
 var work=getWork();if(!work)return;
 var target=$("#view-"+work.view);if(!target)return;
 var old=$(".pl-work-order",target);if(old)old.remove();
 var head=$(".view-heading",target);
 var done=Object.values(work.done||{}).filter(Boolean).length,total=work.accept.length;
 var el=D.createElement("section");el.className="pl-work-order glass";
 el.innerHTML='<div class="pl-work-head"><div><span class="micro">ACTIVE PROJECT WORK ORDER • '+esc(work.tag)+'</span><h3>'+esc(work.title)+'</h3><p>'+esc(work.objective)+'</p></div><div class="pl-progress"><b>'+done+'/'+total+'</b><span>ACCEPTANCE</span></div></div>'+
 '<div class="pl-work-grid"><article><b>SCENARIO</b><p>'+esc(work.scenario)+'</p></article><article><b>FILES YOU SHOULD PRODUCE</b>'+work.files.map(function(f){return '<code>'+esc(f)+'</code>';}).join("")+'</article></div>'+
 '<div class="pl-accept"><b>DEFINITION OF DONE</b>'+work.accept.map(function(x,i){return '<label><input type="checkbox" data-pl-check="'+i+'" '+(work.done&&work.done[i]?"checked":"")+'><span>'+esc(x)+'</span></label>';}).join("")+'</div>'+
 '<div class="pl-work-actions"><button data-pl-action="command">← Command Center</button><button data-pl-action="switch">Choose another project</button><button data-pl-action="clear">Close work order</button></div>';
 if(head)head.insertAdjacentElement("afterend",el);else target.prepend(el);
 $$("[data-pl-check]",el).forEach(function(cb){cb.onchange=function(){var w=getWork();if(!w)return;w.done=w.done||{};w.done[cb.dataset.plCheck]=cb.checked;saveWork(w);renderWorkOrder(false);if(Object.values(w.done).filter(Boolean).length===w.accept.length)CO.toast("Project work order complete • now prove it in the module grader");};});
 var c=$('[data-pl-action="command"]',el);if(c)c.onclick=function(){window.CloudOdysseyUI?window.CloudOdysseyUI.activate("command"):CO.setView("command");};
 var sw=$('[data-pl-action="switch"]',el);if(sw)sw.onclick=function(){picker(work.kind);};
 var cl=$('[data-pl-action="clear"]',el);if(cl)cl.onclick=function(){localStorage.removeItem(KEY);el.remove();};
 if(scroll)el.scrollIntoView({behavior:"smooth",block:"start"});
}
function bindCards(){
 var map=[
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
D.addEventListener("odyssey:viewchange",function(){setTimeout(bindCards,20);setTimeout(function(){var w=getWork();if(w&&activeView()===w.view)renderWorkOrder(false);},25);});
var observer=new MutationObserver(function(){bindCards();var w=getWork();if(w&&activeView()===w.view&&!$(".pl-work-order",$("#view-"+w.view)))renderWorkOrder(false);});
observer.observe($("#workspace")||D.body,{childList:true,subtree:true});
setTimeout(bindCards,40);
window.CloudOdysseyProjectLaunchpad={streams:streams,picker:picker,launch:launch,getWork:getWork,renderWorkOrder:renderWorkOrder};
})();