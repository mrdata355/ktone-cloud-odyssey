(function(){
"use strict";
if(!window.CloudOdyssey)return;
var CO=window.CloudOdyssey,D=document,KEY="cloud_odyssey_delta_mastery_v1";
var $=function(s,r){return (r||D).querySelector(s);};
var $$=function(s,r){return Array.prototype.slice.call((r||D).querySelectorAll(s));};
var esc=function(s){return String(s||"").replace(/[&<>"]/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c];});};
var load=function(){try{return JSON.parse(localStorage.getItem(KEY)||"{}");}catch(e){return {};}}
var st=Object.assign({tab:"pipeline",lab:0,checks:{},grades:{},reveals:{},match:{right:0,wrong:0,total:0,done:{}},defense:0,incident:0},load());
function save(){localStorage.setItem(KEY,JSON.stringify(st));document.dispatchEvent(new CustomEvent("odyssey:delta-progress",{detail:score()}));}
function pct(a,b){return b?Math.round(a/b*100):0;}

var LABS=[
 {id:"baseline",title:"Baseline the Query Profile",skill:"Query Profile",stage:"01 • MEASURE",problem:"A Gold stay-fact query takes 94 seconds and scans 1.8 TiB. You have not changed the pipeline yet. Establish the performance baseline and identify the dominant operator before optimizing.",why:"Optimization without a baseline cannot prove causality or savings.",avoid:"Do not resize compute first; larger compute can hide unnecessary scans.",starter:"-- Capture baseline\nSELECT /* TODO profile */ * FROM gold_stays WHERE stay_date >= DATE '2026-09-01';",reference:"-- Capture query profile / bytes read / files read / rows returned\nSELECT reservation_id, customer_id, stay_date, resort_id, revenue\nFROM gold_stays\nWHERE stay_date >= DATE '2026-09-01';",required:["bytes","files","scan","profile","baseline"],files:["sql/performance/baseline_profile.sql","notes/query_profile_baseline.md"]},
 {id:"pruning",title:"Partition Pruning",skill:"Partition Pruning",stage:"02 • REDUCE SCAN",problem:"The Delta table is partitioned by stay_date, but a query wraps stay_date in YEAR() and scans far more files than expected. Rewrite the filter so partition pruning can happen.",why:"Pruning eliminates entire storage partitions before execution.",avoid:"Functions/casts around partition columns can prevent pruning depending on the engine.",starter:"SELECT * FROM gold_stays WHERE YEAR(stay_date)=2026;",reference:"SELECT reservation_id, customer_id, stay_date, revenue\nFROM gold_stays\nWHERE stay_date >= DATE '2026-01-01' AND stay_date < DATE '2027-01-01';",required:["stay_date",">=","<","partition"],files:["sql/performance/partition_pruning.sql"]},
 {id:"pushdown",title:"Predicate + Column Pushdown",skill:"Predicate Pushdown",stage:"03 • REDUCE DATA EARLY",problem:"A Silver pipeline selects every column, explodes nested items, joins a large dimension, then filters to one resort. Move selective filters and projections as early as semantics allow.",why:"Pushdown reduces bytes and rows carried into expensive joins/shuffles.",avoid:"Do not push a filter earlier if it changes business semantics.",starter:"wide = silver.select('*')\njoined = wide.join(dim,'customer_id')\nresult = joined.filter('resort_id = 42')",reference:"needed = silver.select('customer_id','resort_id','stay_date','revenue').filter('resort_id = 42')\nresult = needed.join(dim.select('customer_id','segment'),'customer_id','left')",required:["select","filter","join","resort_id"],files:["spark/performance/pushdown_projection.py"]},
 {id:"files",title:"Diagnose Small Files",skill:"Small Files",stage:"04 • FILE HEALTH",problem:"A microbatch change creates 182,000 tiny Delta files. Query latency and cloud-storage request cost climb. Diagnose before changing cluster size.",why:"Tiny files increase metadata/listing/open overhead and weaken file-level skipping efficiency.",avoid:"Do not blindly OPTIMIZE the entire table; bound the affected partitions first.",starter:"# TODO profile file count, size distribution, affected partitions",reference:"# Inspect table history/detail + file metrics, then bound the affected date/resort partitions before compaction.",required:["file","size","partition","history","bounded"],files:["sql/performance/file_profile.sql","incidents/small_file_storm.md"]},
 {id:"optimize",title:"OPTIMIZE Compaction",skill:"OPTIMIZE",stage:"05 • COMPACT",problem:"After bounding the small-file storm to the last three stay_date partitions, compact only the affected scope and record before/after file count and latency.",why:"Compaction reduces file-open overhead while preserving the table's logical data.",avoid:"A full-table compaction can waste compute and create unnecessary rewrite pressure.",starter:"OPTIMIZE gold_stays;",reference:"OPTIMIZE gold_stays WHERE stay_date >= DATE '2026-09-24';\n-- Record files/bytes/latency before and after.",required:["optimize","where","stay_date","before","after"],files:["sql/performance/optimize_bounded.sql","notes/compaction_evidence.md"]},
 {id:"zorder",title:"Z-Ordering Decision",skill:"Z-Ordering",stage:"06 • DATA SKIPPING",problem:"Most analyst queries filter by customer_id plus stay_date. The table is already partitioned by stay_date. Evaluate whether Z-Ordering customer_id improves file-level data skipping for this workload.",why:"Z-Ordering colocates related values to improve skipping for selective filters without creating high-cardinality partitions.",avoid:"Do not treat Z-Ordering as free or universal; rewrites cost compute and effectiveness depends on workload/data distribution.",starter:"OPTIMIZE gold_stays ZORDER BY (customer_id);",reference:"OPTIMIZE gold_stays WHERE stay_date >= DATE '2026-07-01' ZORDER BY (customer_id);\n-- Compare files read/bytes scanned for representative customer filters.",required:["zorder","customer_id","files","bytes","compare"],files:["sql/performance/zorder_customer.sql","notes/zorder_evidence.md"]},
 {id:"liquid",title:"Liquid Clustering Design",skill:"Liquid Clustering",stage:"07 • ADAPTIVE LAYOUT",problem:"Access patterns now vary across customer_id, resort_id and booking_channel, and manual repartition/Z-Order maintenance is becoming expensive. Design a Liquid Clustering strategy and migration test.",why:"Liquid Clustering can adapt physical organization without rigid static partition directories and is designed for evolving workloads.",avoid:"Do not migrate because it is newer; prove workload fit, compatibility and migration/maintenance behavior.",starter:"-- Design clustering keys + representative workload benchmark",reference:"-- Declare candidate clustering keys based on selective workload columns; benchmark representative queries before/after and document migration/rollback.",required:["clustering","workload","benchmark","before","after"],files:["design/liquid_clustering.md","sql/performance/liquid_benchmark.sql"]},
 {id:"vacuum",title:"VACUUM Safety + Retention",skill:"VACUUM",stage:"08 • RETENTION SAFETY",problem:"Storage cost is rising and an engineer proposes aggressive VACUUM immediately after compaction. Define a safe retention policy that preserves recovery/time-travel requirements.",why:"VACUUM removes old physical files; retention is a recovery and governance decision, not just cost cleanup.",avoid:"Do not shorten retention below recovery/time-travel/concurrent-reader requirements without explicit operational approval.",starter:"VACUUM gold_stays RETAIN 0 HOURS;",reference:"-- Establish approved retention from recovery requirements, active readers and compliance.\nVACUUM gold_stays RETAIN 168 HOURS; -- example only; use your approved policy",required:["retention","recovery","time travel","reader","vacuum"],files:["runbooks/delta_retention.md","sql/maintenance/vacuum_policy.sql"]},
 {id:"skipping",title:"Prove Data Skipping",skill:"Data Skipping",stage:"09 • VERIFY PHYSICAL EFFECT",problem:"You applied layout changes. Prove they actually reduce work using representative queries rather than assuming the command helped.",why:"Physical optimization matters only if representative workloads read fewer files/bytes at acceptable maintenance cost.",avoid:"Do not report only runtime; cache and compute variance can make runtime misleading.",starter:"-- TODO capture files read, bytes scanned, rows returned, duration",reference:"-- Compare identical query predicates before/after: files read, bytes scanned, rows returned, duration and maintenance cost.",required:["files","bytes","rows","before","after"],files:["sql/performance/skipping_validation.sql","notes/skipping_results.md"]},
 {id:"finops",title:"Performance + FinOps Proof",skill:"Delta FinOps",stage:"10 • CERTIFY",problem:"The optimized pipeline is faster. Certify it for production by proving correctness, scan reduction, latency improvement, maintenance cost and rollback boundaries.",why:"A production optimization must preserve business truth while improving unit economics.",avoid:"Do not trade correctness or recoverability for a cheaper query.",starter:"-- Build final evidence packet",reference:"-- Reconcile source↔Gold totals, compare p50/p95, files/bytes scanned, compute/storage maintenance cost, and document rollback/runbook.",required:["reconcile","p95","bytes","cost","rollback"],files:["sql/reconcile/delta_optimization.sql","docs/delta_performance_evidence.md","runbooks/delta_performance_rollback.md"]}
];

var MATCH=[
 ["Selective date filter scans all yearly partitions because the filter wraps the date column.","Partition Pruning"],
 ["Large Silver table carries 120 columns into a join but only 6 are needed.","Predicate Pushdown"],
 ["182k files average 90 KB after a trigger change.","OPTIMIZE"],
 ["Queries filter on customer_id while date partitioning is already useful.","Z-Ordering"],
 ["Workload filters shift across several dimensions and static layout maintenance is painful.","Liquid Clustering"],
 ["Storage cleanup must not destroy required time travel/recovery.","VACUUM"],
 ["One query got faster but you do not know whether fewer files were read.","Data Skipping"],
 ["Most Spark tasks finish quickly but three partitions dominate stage time.","Spark Skew Diagnosis"]
];
var CHOICES=["Partition Pruning","Predicate Pushdown","OPTIMIZE","Z-Ordering","Liquid Clustering","VACUUM","Data Skipping","Spark Skew Diagnosis"];

function score(){
 var checks=Object.values(st.checks||{}).filter(Boolean).length/LABS.length*45;
 var grades=Object.values(st.grades||{});var g=grades.length?grades.reduce(function(n,x){return n+(Number(x)||0);},0)/grades.length:0;
 var match=st.match.total?pct(st.match.right,st.match.total):0;
 return Math.min(100,Math.round(checks+g*.30+match*.15+(Number(st.defense)||0)*.10));
}
function nav(){
 var old=$('#nav [data-view="delta-mastery"]');if(old)return;
 var b=D.createElement("button");b.className="nav-item";b.dataset.view="delta-mastery";b.innerHTML="<span>Δ</span><b>Delta Performance</b><em>NEW</em>";
 b.onclick=function(){CO.setView("delta-mastery");var t=$("#pageTitle");if(t)t.textContent="Delta Performance Pipeline Mastery";render();};
 $("#nav").appendChild(b);
}
function ensureView(){
 if($("#view-delta-mastery"))return;
 var s=D.createElement("section");s.className="view";s.id="view-delta-mastery";$("#workspace").appendChild(s);
}
function tabs(){
 return [["pipeline","Pipeline"],["labs","Hands-On"],["match","Decision Match"],["incident","Break/Fix"],["defense","Architecture Defense"]].map(function(x){
   return '<button class="delta-tab '+(st.tab===x[0]?"active":"")+'" data-dtab="'+x[0]+'">'+x[1]+'</button>';
 }).join("");
}
function pipeline(){
 return '<div class="delta-flow">'+LABS.map(function(l,i){return '<article class="delta-stage '+(st.checks[l.id]?"done":"")+'" data-delta-launch="'+i+'"><span>'+l.stage+'</span><h4>'+esc(l.title)+'</h4><p>'+esc(l.why)+'</p><button>Practice this stage →</button></article>';}).join("")+'</div>';
}
function lab(){
 var l=LABS[st.lab]||LABS[0],grade=st.grades[l.id],revealed=st.reveals[l.id];
 return '<div class="delta-lab-grid"><aside class="delta-lab-list">'+LABS.map(function(x,i){return '<button data-lab="'+i+'" class="'+(i===st.lab?"active":"")+'"><span>'+x.stage+'</span>'+esc(x.title)+(st.checks[x.id]?' ✓':'')+'</button>';}).join("")+'</aside>'+
 '<article class="delta-work glass"><span class="micro">'+esc(l.stage)+' • '+esc(l.skill)+'</span><h3>'+esc(l.title)+'</h3><p class="delta-problem">'+esc(l.problem)+'</p>'+
 '<div class="delta-why"><div><b>WHY</b><p>'+esc(l.why)+'</p></div><div><b>DO NOT</b><p>'+esc(l.avoid)+'</p></div></div>'+
 '<label class="delta-editor-label">YOUR SOLUTION<textarea id="deltaAnswer">'+esc((st.answers&&st.answers[l.id])||l.starter)+'</textarea></label>'+
 '<div class="delta-actions"><button id="deltaCheck">Run checks</button><button id="deltaGrade">Server grade</button><button id="deltaReveal">Reveal reference</button></div>'+
 '<div id="deltaResult" class="delta-result">'+(grade!=null?('Last server score: '+grade+'%'):'Not graded yet')+'</div>'+
 (revealed?'<pre class="delta-reference">'+esc(l.reference)+'</pre>':'')+
 '<div class="delta-files"><b>PROJECT ARTIFACTS</b>'+l.files.map(function(f){return '<code>'+esc(f)+'</code>';}).join("")+'</div></article></div>';
}
function match(){
 var items=MATCH.map(function(x,i){
   var done=st.match.done&&st.match.done[i];
   return '<article class="delta-match-card '+(done&&done.ok?"good":done?"bad":"")+'"><p>'+esc(x[0])+'</p><select data-match="'+i+'"><option value="">Choose pattern…</option>'+CHOICES.map(function(c){return '<option '+(done&&done.choice===c?'selected':'')+'>'+esc(c)+'</option>';}).join("")+'</select><button data-match-check="'+i+'">Check</button><span>'+(done?(done.ok?'Correct':'Try again'):'')+'</span></article>';
 }).join("");
 return '<div class="delta-match-head"><div><span class="micro">RAPID RECOGNITION</span><h3>Symptom → physical optimization</h3><p>Choose the production technique before you touch syntax.</p></div><strong>'+pct(st.match.right,Math.max(1,st.match.total))+'%</strong></div><div class="delta-match-grid">'+items+'</div>';
}
function incident(){
 return '<article class="delta-incident glass"><span class="micro">SEV-2 • DELTA PERFORMANCE</span><h3>Small-file storm after microbatch change</h3><p>182,000 files averaging 90 KB appeared over three partitions. p95 query latency rose 3.2× and storage requests increased 44%.</p>'+
 '<ol><li>Preserve table history/query profile evidence.</li><li>Bound affected partitions and identify the trigger/write-pattern change.</li><li>Compact bounded partitions.</li><li>Re-profile representative workloads.</li><li>Reconcile business totals.</li><li>Fix upstream write sizing/trigger behavior.</li></ol>'+
 '<textarea id="deltaIncidentAnswer" placeholder="Write your incident sequence, evidence, commands, rollback and prevention...">'+esc(st.incidentAnswer||"")+'</textarea>'+
 '<button id="deltaIncidentGrade">Grade incident response</button><div class="delta-result">'+(st.incident?('Last score: '+st.incident+'%'):'Not graded')+'</div></article>';
}
function defense(){
 return '<article class="delta-defense glass"><span class="micro">BLIND STAFF-LEVEL DEFENSE</span><h3>Design and defend the entire Delta optimization pipeline</h3>'+
 '<p>Explain how you would take a 1.8 TiB scan / 94-second Gold workload to an evidence-backed production optimization. Cover baseline, pruning/pushdown, file health, layout choice, compaction, Z-Order vs Liquid Clustering, VACUUM safety, skipping proof, reconciliation, FinOps and rollback.</p>'+
 '<textarea id="deltaDefenseAnswer" placeholder="Use WHO / WHAT / WHERE / WHEN / WHY, then implementation, evidence and tradeoffs...">'+esc(st.defenseAnswer||"")+'</textarea>'+
 '<button id="deltaDefenseGrade">Server-grade architecture defense</button><div class="delta-result">'+(st.defense?('Last score: '+st.defense+'%'):'Not graded')+'</div></article>';
}
function render(){
 ensureView();var root=$("#view-delta-mastery");if(!root)return;
 root.innerHTML='<div class="view-heading"><div><span class="micro">DATABRICKS • DELTA LAKE • PERFORMANCE</span><h2>Delta Performance Pipeline Mastery</h2><p>Learn where each optimization belongs in the pipeline, prove it with query-profile evidence, and defend the tradeoff.</p></div><span class="enterprise-badge">'+score()+'% MASTERY</span></div>'+
 '<div class="delta-summary"><div><b>'+Object.values(st.checks||{}).filter(Boolean).length+'/'+LABS.length+'</b><span>LABS CHECKED</span></div><div><b>'+pct(st.match.right,Math.max(1,st.match.total))+'%</b><span>MATCH ACCURACY</span></div><div><b>'+Number(st.defense||0)+'%</b><span>DEFENSE</span></div><div><b>'+score()+'%</b><span>OVERALL</span></div></div>'+
 '<div class="delta-tabs">'+tabs()+'</div><div id="deltaBody">'+(st.tab==="pipeline"?pipeline():st.tab==="labs"?lab():st.tab==="match"?match():st.tab==="incident"?incident():defense())+'</div>';
 wire();
}
function localCheck(l,answer){
 var a=String(answer||"").toLowerCase(),hits=l.required.filter(function(k){return a.indexOf(k.toLowerCase())>=0;});
 return {score:Math.round(hits.length/l.required.length*100),hits:hits,missing:l.required.filter(function(k){return !hits.includes(k);})};
}
function wire(){
 $$("[data-dtab]").forEach(function(b){b.onclick=function(){st.tab=b.dataset.dtab;save();render();};});
 $$("[data-delta-launch]").forEach(function(b){b.onclick=function(){st.lab=+b.dataset.deltaLaunch;st.tab="labs";save();render();};});
 $$("[data-lab]").forEach(function(b){b.onclick=function(){st.lab=+b.dataset.lab;save();render();};});
 var chk=$("#deltaCheck");if(chk)chk.onclick=function(){
   var l=LABS[st.lab],a=$("#deltaAnswer").value;st.answers=st.answers||{};st.answers[l.id]=a;
   var r=localCheck(l,a);$("#deltaResult").textContent="Local checks "+r.score+"% • hit: "+r.hits.join(", ")+(r.missing.length?" • missing: "+r.missing.join(", "):"");
   if(r.score>=80)st.checks[l.id]=true;save();
 };
 var grd=$("#deltaGrade");if(grd)grd.onclick=async function(){
   var l=LABS[st.lab],a=$("#deltaAnswer").value;st.answers=st.answers||{};st.answers[l.id]=a;save();
   var api=window.CloudOdysseyBackend;if(!api||!api.grade){$("#deltaResult").textContent="Server grader unavailable.";return;}
   $("#deltaResult").textContent="Server grading...";
   try{var r=await api.grade(a,l.required,{type:"delta-"+l.id,blind:!st.reveals[l.id]});st.grades[l.id]=r.score;if(r.score>=85)st.checks[l.id]=true;save();$("#deltaResult").textContent="SERVER "+r.score+"% • "+(r.score>=85?"mastery evidence recorded":"keep iterating");render();}
   catch(e){$("#deltaResult").textContent="Grade failed: "+e.message;}
 };
 var rev=$("#deltaReveal");if(rev)rev.onclick=function(){var l=LABS[st.lab];st.reveals[l.id]=true;save();render();};
 $$("[data-match-check]").forEach(function(b){b.onclick=function(){
   var i=+b.dataset.matchCheck,sel=$('[data-match="'+i+'"]'),choice=sel.value,ok=choice===MATCH[i][1];
   st.match.done=st.match.done||{};var first=!st.match.done[i];st.match.done[i]={choice:choice,ok:ok};if(first)st.match.total++;if(ok&&first)st.match.right++;if(!ok&&first)st.match.wrong++;save();render();
 };});
 var ig=$("#deltaIncidentGrade");if(ig)ig.onclick=async function(){
   var a=$("#deltaIncidentAnswer").value;st.incidentAnswer=a;save();var api=window.CloudOdysseyBackend;
   if(!api||!api.grade)return;
   ig.textContent="Grading...";
   try{var r=await api.grade(a,["evidence","bound","partition","optimize","profile","reconcile","rollback","prevent"],{type:"delta-small-file-incident",blind:true});st.incident=r.score;save();render();}catch(e){ig.textContent="Grade failed";}
 };
 var dg=$("#deltaDefenseGrade");if(dg)dg.onclick=async function(){
   var a=$("#deltaDefenseAnswer").value;st.defenseAnswer=a;save();var api=window.CloudOdysseyBackend;
   if(!api||!api.grade)return;
   dg.textContent="Grading...";
   try{var r=await api.grade(a,["baseline","pruning","pushdown","small files","optimize","z-order","liquid clustering","vacuum","data skipping","reconcile","cost","rollback"],{type:"delta-architecture-defense",blind:true});st.defense=r.score;save();render();}catch(e){dg.textContent="Grade failed";}
 };
}
function launch(topic){
 var i=0;if(topic){var t=String(topic).toLowerCase();var hit=LABS.findIndex(function(l){return l.id===t||l.skill.toLowerCase().indexOf(t)>=0||l.title.toLowerCase().indexOf(t)>=0;});if(hit>=0)i=hit;}
 st.lab=i;st.tab="labs";save();CO.setView("delta-mastery");var title=$("#pageTitle");if(title)title.textContent="Delta Performance Pipeline Mastery";render();setTimeout(function(){var x=$("#deltaAnswer");if(x)x.scrollIntoView({behavior:"smooth",block:"center"});},80);
}
function install(){ensureView();nav();render();}
window.CloudOdysseyDeltaMastery={labs:LABS,launch:launch,getState:function(){return st;},score:score,render:render};
install();
})();