(function(){
"use strict";
if(!window.CloudOdyssey)return;
var CO=window.CloudOdyssey,D=document,KEY="cloud_odyssey_skill_practice_v1";
var $=function(s,r){return (r||D).querySelector(s);},$$=function(s,r){return Array.prototype.slice.call((r||D).querySelectorAll(s));};
var esc=function(s){return String(s||"").replace(/[&<>"]/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c];});};
var st=(function(){try{return JSON.parse(localStorage.getItem(KEY)||"{}");}catch(e){return {};}})();
function save(){localStorage.setItem(KEY,JSON.stringify(st));}

var TOPICS=[
 ["Spark Session + Basics","PySpark","Explain driver-created SparkSession, lazy DataFrame plan and when an action triggers execution.",["sparksession","lazy","action","driver"],"spark"],
 ["Data Types + Schema","PySpark","Apply an explicit schema at ingestion; explain why production pipelines should not rely blindly on inference.",["schema","structtype","type","infer"],"spark"],
 ["DataFrame Operations","PySpark","Select, filter, rename and deduplicate while preserving a declared business grain.",["select","filter","dedup","grain"],"translate"],
 ["Column Operations","PySpark","Use withColumn/when/cast/functions while avoiding repeated wide transformations and ambiguous null semantics.",["withcolumn","cast","when","null"],"translate"],
 ["Filtering + Conditions","PySpark","Push selective filters as early as semantics allow and explain AND/OR/null behavior.",["filter","predicate","null","early"],"translate"],
 ["Aggregations","PySpark","Design groupBy/agg around a declared grain; explain shuffle/skew implications.",["groupby","agg","grain","shuffle"],"spark"],
 ["Joins","PySpark","Choose join semantics first, then broadcast/repartition/skew strategy from evidence.",["join","left","broadcast","shuffle"],"spark"],
 ["Set Operations","PySpark","Explain union/unionByName/intersect/except and when UNION ALL semantics preserve duplicates intentionally.",["unionbyname","duplicate","schema","set"],"translate"],
 ["Window Functions","PySpark + SQL","Use ROW_NUMBER/RANK/DENSE_RANK/LAG/LEAD from the business requirement and deterministic ordering.",["row_number","partition","order","tie"],"window"],
 ["String Functions","PySpark","Normalize text deliberately while preserving raw/audit values and avoiding destructive over-cleaning.",["trim","lower","regex","raw"],"cleaning"],
 ["Date + Time","PySpark","Parse timestamps with explicit timezone/event-time semantics and avoid string-date comparisons.",["timestamp","timezone","event time","parse"],"spark"],
 ["Array + Map + Explode","PySpark","Flatten nested data only after declaring the new grain; distinguish explode from explode_outer.",["explode","grain","array","outer"],"translate"],
 ["Null Handling","PySpark","Treat missingness as business semantics: fill, drop, flag or quarantine rather than defaulting blindly.",["null","fill","drop","business"],"cleaning"],
 ["File Operations","PySpark","Read/write CSV, JSON, Parquet/Delta with explicit schema, mode, partition/layout and bad-record handling.",["parquet","schema","mode","write"],"spark"],
 ["Performance Optimization","Spark","Start with Spark UI/query-plan evidence; reduce scan/shuffle before adding compute.",["spark ui","shuffle","scan","evidence"],"performance"],
 ["UDFs","PySpark","Prefer built-in Spark SQL functions where possible; explain serialization/optimizer costs of Python UDFs.",["udf","builtin","serialization","optimizer"],"performance"],
 ["Cache / Persist","Spark","Persist only reused expensive lineage, select an appropriate storage level and unpersist explicitly.",["persist","reuse","unpersist","memory"],"translate"],
 ["Spark Architecture","Spark","Explain driver, executors, jobs, stages, tasks, narrow/wide transformations and shuffle boundaries.",["driver","executor","stage","shuffle"],"spark"],
 ["Common Actions","Spark","Distinguish lazy transformations from actions such as count/show/collect/write and explain driver-memory risk.",["action","lazy","collect","driver"],"spark"],
 ["Data Skew","Spark Performance","Recognize hot keys from uneven task/input metrics and choose AQE, broadcast, pre-aggregation, repartition or salting based on evidence.",["skew","hot key","task","evidence"],"performance"],
 ["Partition Pruning","Delta Performance","Filter directly on useful partition/range columns so irrelevant storage can be skipped.",["partition","filter","scan","skip"],"delta:pruning"],
 ["Predicate Pushdown","Delta Performance","Push selective predicates/projections toward the source before expensive movement and joins.",["predicate","filter","source","bytes"],"delta:pushdown"],
 ["Small Files","Delta Performance","Diagnose file-count/size distribution, bound affected partitions and compact without rewriting unrelated data.",["file","size","bounded","compact"],"delta:files"],
 ["OPTIMIZE","Delta Performance","Compact bounded Delta scope and prove before/after file count, bytes and latency.",["optimize","bounded","before","after"],"delta:optimize"],
 ["Z-Ordering","Delta Performance","Use workload-driven Z-Ordering to improve file-level skipping; prove it with representative filters.",["zorder","filter","files","workload"],"delta:zorder"],
 ["Liquid Clustering","Delta Performance","Choose clustering keys from evolving workload patterns and benchmark against the existing layout.",["liquid","clustering","workload","benchmark"],"delta:liquid"],
 ["VACUUM","Delta Performance","Set retention from recovery/time-travel/concurrent-reader requirements before deleting old files.",["vacuum","retention","recovery","time travel"],"delta:vacuum"],
 ["Data Skipping","Delta Performance","Prove physical layout improvements using files read and bytes scanned, not runtime alone.",["files","bytes","before","after"],"delta:skipping"]
].map(function(x){return {name:x[0],group:x[1],prompt:x[2],required:x[3],route:x[4]};});

function topicByName(name){
 var n=String(name||"").toLowerCase();
 var exact=TOPICS.find(function(t){return t.name.toLowerCase()===n;});if(exact)return exact;
 if(n.indexOf("delta")>=0||n.indexOf("databricks")>=0)return TOPICS.find(function(t){return t.name==="Partition Pruning";});
 if(n.indexOf("pyspark")>=0||n==="spark")return TOPICS.find(function(t){return t.name==="Spark Architecture";});
 if(n.indexOf("sql")>=0)return {name:name,group:"SQL",prompt:"Solve a production SQL problem, explain the grain, deterministic semantics, validation and performance boundary.",required:["grain","sql","validate","performance"],route:"problem"};
 if(n.indexOf("mlflow")>=0)return {name:name,group:"MLOps",prompt:"Explain experiment tracking, model registration, promotion gates, lineage and rollback.",required:["mlflow","lineage","promotion","rollback"],route:"cloud:databricks:dbx-mlflow"};
 if(n.indexOf("snowflake")>=0)return {name:name,group:"Warehouse",prompt:"Explain how you would profile and optimize a Snowflake workload without blindly scaling the warehouse.",required:["profile","scan","warehouse","cost"],route:"cloud:snowflake:snow-performance"};
 if(n.indexOf("dbt")>=0)return {name:name,group:"Transformation",prompt:"Explain staging/mart contracts, tests, lineage, CI and incremental correctness.",required:["staging","test","lineage","incremental"],route:"cloud:snowflake:snow-dbt"};
 if(n.indexOf("auto loader")>=0)return {name:name,group:"Databricks",prompt:"Explain incremental file discovery, schema evolution, checkpoints and replay safety.",required:["schema","checkpoint","incremental","replay"],route:"cloud:databricks:dbx-autoloader"};
 if(n.indexOf("structured streaming")>=0)return {name:name,group:"Streaming",prompt:"Explain event-time, watermark, checkpoint, output idempotency and replay/recovery.",required:["watermark","checkpoint","event time","idempotent"],route:"cloud:databricks:dbx-structured-streaming"};
 if(n.indexOf("kafka")>=0)return {name:name,group:"Streaming",prompt:"Explain partitions, offsets, consumer groups, replay boundaries and business idempotency.",required:["partition","offset","consumer","idempotent"],route:"mission:0:1"};
 if(n.indexOf("feature")>=0)return {name:name,group:"ML Engineering",prompt:"Explain offline/online feature parity, freshness, point-in-time joins and serving fallback.",required:["parity","freshness","point-in-time","online"],route:"mission:4:1"};
 if(n.indexOf("ml")>=0)return {name:name,group:"ML Engineering",prompt:"Explain training, evaluation, promotion, monitoring and rollback with production evidence.",required:["train","evaluate","monitor","rollback"],route:"cloud:databricks:dbx-mlflow"};
 return {name:name,group:"Production",prompt:"Explain this skill in a production pipeline using WHO / WHAT / WHERE / WHEN / WHY, one implementation example, one failure mode and one validation.",required:["why","pipeline","validate","failure"],route:"problem"};
}
function launchRoute(route){
 route=String(route||"");
 if(route.indexOf("delta:")===0&&window.CloudOdysseyDeltaMastery)return window.CloudOdysseyDeltaMastery.launch(route.split(":")[1]);
 if(route.indexOf("cloud:")===0&&window.CloudOdysseyCloudForge){var x=route.split(":");return window.CloudOdysseyCloudForge.launch(x[1],x[2]);}
 if(route.indexOf("mission:")===0){var m=route.split(":");return CO.openMission(+m[1],+m[2]);}
 var forge=window.CloudOdysseyCodingForge;
 if(!forge)return CO.toast("Practice module unavailable");
 if(route==="performance")return forge.launchChallenge(7,"optimize");
 if(route==="window")return forge.launchChallenge(1,"build");
 if(route==="translate")return forge.launchMatch("translate");
 if(route==="cleaning")return forge.launchMatch("cleaning");
 if(route==="spark")return forge.launchMatch("spark");
 if(route==="problem")return forge.launchMatch("problem");
 return forge.launchMatch(route);
}
function modal(topic,mode){
 var t=typeof topic==="string"?topicByName(topic):topic,content=$("#modalContent"),m=$("#modal");if(!content||!m)return;
 var last=st[t.name]||{};
 var ask=mode==="explain"?
  "Explain "+t.name+" naturally using WHO / WHAT / WHERE / WHEN / WHY. Include the alternative you would reject and why.":
  "Prove "+t.name+" at production level. "+t.prompt+" Include code/pseudocode, expected evidence, a failure mode, and a validation/rollback step.";
 content.innerHTML='<span class="micro">'+esc(t.group)+' • '+mode.toUpperCase()+'</span><h2>'+esc(t.name)+' practice</h2><div class="skill-drill-prompt">'+esc(ask)+'</div>'+
 '<textarea id="skillDrillAnswer" placeholder="Answer in your own words...">'+esc(last[mode+"Answer"]||"")+'</textarea>'+
 '<div class="skill-drill-actions"><button id="skillHandsOn">Open hands-on practice</button><button id="skillLocalCheck">Check concepts</button><button id="skillServerGrade">Server grade</button></div>'+
 '<div id="skillDrillResult">'+(last[mode+"Score"]!=null?("Last score: "+last[mode+"Score"]+"%"):"Not graded yet")+'</div>'+
 '<div class="skill-drill-sequence"><b>Required thinking sequence</b><span>WHO = grain/entity/owner</span><span>WHAT = operation</span><span>WHERE = clause/API/pipeline boundary</span><span>WHEN = trigger/use condition</span><span>WHY = tradeoff</span><span>PROOF = tests/metrics/reconciliation</span></div>';
 m.classList.remove("hidden");
 $("#skillHandsOn").onclick=function(){m.classList.add("hidden");launchRoute(t.route);};
 $("#skillLocalCheck").onclick=function(){
   var a=$("#skillDrillAnswer").value.toLowerCase(),hits=t.required.filter(function(k){return a.indexOf(k.toLowerCase())>=0;});
   $("#skillDrillResult").textContent="Concept coverage "+pct(hits.length,t.required.length)+"% • hit: "+hits.join(", ")+(hits.length<t.required.length?" • missing: "+t.required.filter(function(k){return !hits.includes(k);}).join(", "):"");
 };
 $("#skillServerGrade").onclick=async function(){
   var a=$("#skillDrillAnswer").value,api=window.CloudOdysseyBackend;st[t.name]=st[t.name]||{};st[t.name][mode+"Answer"]=a;save();
   if(!api||!api.grade){$("#skillDrillResult").textContent="Server grader unavailable";return;}
   $("#skillDrillResult").textContent="Server grading...";
   try{var r=await api.grade(a,t.required,{type:"skill-"+t.name.toLowerCase().replace(/[^a-z0-9]+/g,"-")+"-"+mode,blind:true});st[t.name][mode+"Score"]=r.score;save();$("#skillDrillResult").textContent="SERVER "+r.score+"% • "+(r.score>=85?"proficiency evidence recorded":"keep practicing");enhance();}
   catch(e){$("#skillDrillResult").textContent="Grade failed: "+e.message;}
 };
}
function topicScore(t){
 var x=st[t.name]||{},scores=[x.explainScore,x.proveScore].filter(function(v){return v!=null;});
 return scores.length?Math.round(scores.reduce(function(n,v){return n+Number(v);},0)/scores.length):0;
}
function explicitMatrix(){
 var host=$("#skillPracticeMatrix");if(!host)return;
 host.innerHTML=TOPICS.map(function(t,i){var s=topicScore(t);return '<article class="skill-practice-card"><div class="skill-practice-top"><div><span>'+esc(t.group)+'</span><h4>'+esc(t.name)+'</h4></div><strong>'+s+'%</strong></div><p>'+esc(t.prompt)+'</p><div class="skill-practice-actions"><button data-skill-practice="'+i+'">Practice</button><button data-skill-explain="'+i+'">Explain WHY</button><button data-skill-prove="'+i+'">Prove it</button></div></article>';}).join("");
 $$("[data-skill-practice]",host).forEach(function(b){b.onclick=function(){launchRoute(TOPICS[+b.dataset.skillPractice].route);};});
 $$("[data-skill-explain]",host).forEach(function(b){b.onclick=function(){modal(TOPICS[+b.dataset.skillExplain],"explain");};});
 $$("[data-skill-prove]",host).forEach(function(b){b.onclick=function(){modal(TOPICS[+b.dataset.skillProve],"prove");};});
}
function enhanceRows(){
 $$("#skillsMatrix .skill-row").forEach(function(row){
   if(row.querySelector(".matrix-actions"))return;
   var label=row.querySelector("span"),name=label?label.textContent.trim():"Skill",wrap=D.createElement("div");wrap.className="matrix-actions";
   wrap.innerHTML='<button data-matrix-practice>Practice</button><button data-matrix-explain>Explain</button><button data-matrix-prove>Prove</button>';
   row.appendChild(wrap);
   $('[data-matrix-practice]',wrap).onclick=function(){launchRoute(topicByName(name).route);};
   $('[data-matrix-explain]',wrap).onclick=function(){modal(name,"explain");};
   $('[data-matrix-prove]',wrap).onclick=function(){modal(name,"prove");};
 });
 $$("#signalMatrix .signal-card").forEach(function(card){
   if(card.querySelector(".signal-practice"))return;
   var n=(card.querySelector("b")||{}).textContent||"Production signal",b=D.createElement("button");b.className="signal-practice";b.textContent="Practice this signal →";
   b.onclick=function(){modal({name:n.split("•")[0].trim(),group:"Interview Signal",prompt:(card.querySelector("p")||{}).textContent||"Prove this signal.",required:["example","evidence","why","result"],route:"problem"},"prove");};card.appendChild(b);
 });
}
function ensureSection(){
 var view=$("#view-skills");if(!view||$("#skillPracticeSection"))return;
 var s=D.createElement("section");s.id="skillPracticeSection";s.className="glass section-card skill-practice-section";
 s.innerHTML='<div class="section-head"><div><span class="micro">PRACTICEABLE PYSPARK + DELTA MATRIX</span><h3>Click a skill and train it</h3><p>These are the concrete skills from your PySpark and Delta performance study sheets. Scores come from your Explain/Prove server grades.</p></div><span class="enterprise-badge">'+TOPICS.length+' SKILLS</span></div><div id="skillPracticeMatrix" class="skill-practice-grid"></div>';
 view.appendChild(s);explicitMatrix();
}
function enhance(){ensureSection();enhanceRows();explicitMatrix();}
var obs=new MutationObserver(function(){if($("#view-skills"))enhanceRows();});
var target=$("#view-skills");if(target)obs.observe(target,{subtree:true,childList:true});
D.addEventListener("odyssey:viewchange",function(e){if(e.detail&&e.detail.view==="skills")setTimeout(enhance,20);});
setTimeout(enhance,100);
window.CloudOdysseySkillPractice={topics:TOPICS,enhance:enhance,practice:function(name){launchRoute(topicByName(name).route);},explain:function(name){modal(name,"explain");},prove:function(name){modal(name,"prove");}};
})();