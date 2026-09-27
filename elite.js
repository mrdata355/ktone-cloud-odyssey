
(function(){
"use strict";
if(!window.CloudOdyssey){console.error("Elite Coach requires CloudOdyssey");return;}
var CO=window.CloudOdyssey, KEY="cloud_odyssey_elite_v1";
var st=Object.assign({scenario:0,attempts:[],reveals:{},voice:true},JSON.parse(localStorage.getItem(KEY)||"{}"));
var $=function(s,r){return (r||document).querySelector(s);};
var $$=function(s,r){return Array.prototype.slice.call((r||document).querySelectorAll(s));};
var save=function(){localStorage.setItem(KEY,JSON.stringify(st));};
var esc=function(s){return String(s||"").replace(/[&<>"]/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;"}[c];});};
var now=function(){return Date.now();};

var scenarios=[
{title:"Reservation replay inflated occupancy",sev:"SEV-1",domain:"Streaming",problem:"After a consumer restart, reservation events replayed and the Gold occupancy mart rose 8.2% above source truth even though the streaming job reported healthy.",metrics:[["consumer lag","4.8m"],["duplicate rate","6.8%"],["resorts","17"],["gold delta","+8.2%"]],ask:"Talk me through your first five moves. Do not jump straight to code.",keys:["scope","preserve","offset","checkpoint","idempotent","reconcile","business key","freeze"],solution:[["1","Bound blast radius","Freeze unsafe downstream publication and identify affected resorts/keys."],["2","Preserve evidence","Capture offsets, checkpoints, release SHA, duplicate samples and last known-good state."],["3","Test identity","Compare physical offsets to stable reservation/event identity; determine replay semantics."],["4","Recover bounded range","Use deterministic dedupe/idempotent sink behavior rather than unbounded restart."],["5","Reconcile + resume","Compare source → Silver → Gold totals, then resume only after business state is proven."]],why:"The checkpoint tells you processing state; it does not prove the Gold business effect was applied exactly once."},
{title:"Feature store freshness silently breached",sev:"SEV-2",domain:"ML Engineering",problem:"Online propensity scoring is returning normally, but the feature store has not refreshed for 52 minutes. Model latency and error rate look healthy.",metrics:[["feature age","52m"],["p95 latency","118ms"],["model PSI","0.19"],["failed batches","6"]],ask:"Explain how you separate a feature-pipeline incident from a model incident and what you would do.",keys:["freshness","feature","checkpoint","online","offline","parity","fallback","slo"],solution:[["1","Classify incident","Treat stale inputs separately from model-serving health."],["2","Scope impact","Identify models/segments consuming the stale features and their freshness contract."],["3","Inspect feature pipeline","Trace failed batches/checkpoint without changing the model."],["4","Recover + backfill","Restore bounded feature updates and verify offline/online parity."],["5","Apply fallback policy","Use last-known-good/default/fail-closed behavior according to the serving contract."]],why:"Retraining the model would change the wrong layer. The model can be healthy while its inputs violate their freshness contract."},
{title:"New champion regressed one business slice",sev:"SEV-1",domain:"MLOps",problem:"A newly promoted occupancy model improved aggregate RMSE but worsened Las Vegas weekend forecast MAPE by 12.4%, affecting staffing decisions.",metrics:[["champion","v18"],["slice delta","+12.4%"],["aggregate","better"],["rollback RTO","8m"]],ask:"Defend your promotion/rollback decision to an MLOps lead and an operations stakeholder.",keys:["slice","rollback","champion","gate","business","metric","lineage","retrain"],solution:[["1","Confirm slice evidence","Compare v18 and prior champion on the affected destination/weekend slice."],["2","Rollback if gate failed","Restore last-known-good champion while preserving v18 evidence."],["3","Record failed promotion","Bind the failed slice gate to run/model/data lineage."],["4","Fix policy","Add business-relevant slice criteria to promotion gates."],["5","Retrain only with evidence","Do not retrain merely because drift/regression was observed; first isolate the cause."]],why:"Aggregate improvement cannot override a critical business slice if that slice is explicitly part of the operating objective."},
{title:"Campaign writeback systems disagree",sev:"SEV-1",domain:"Distributed Recovery",problem:"Databricks says the recovery succeeded, but Snowflake history, Segment, the legacy CRM, and feedback acknowledgements disagree on current promotion state.",metrics:[["systems","4"],["unknown outcomes","3"],["history gaps","5"],["publish state","blocked"]],ask:"Design the recovery without pretending these systems share one transaction.",keys:["authorization","operation id","idempotent","lookup","reconcile","fence","certified","publish"],solution:[["1","Prove source continuity","Bind immutable source ranges/table identity and archive evidence."],["2","Repair durable authorization","Reconstruct missing approved history before new outbound attempts."],["3","Use stable operation identity","Same business command reuses the same destination operation ID."],["4","Resolve uncertainty","GET/lookup timed-out operations before deciding to resend."],["5","Reconcile + certify","Fence concurrent workers, reconcile both destinations, then atomically activate a certified release."]],why:"There is no atomic transaction across Delta, Snowflake and two external APIs, so correctness comes from durable authorization, idempotent commands, outcome resolution and reconciliation."},
{title:"Recovery query scans 1.8 TiB",sev:"SEV-2",domain:"FinOps / Performance",problem:"A bounded recovery population of 86K business keys triggers a Snowflake query scanning 1.8 TiB. The suggestion is to double warehouse size.",metrics:[["affected keys","86K"],["scan","1.8 TiB"],["target","≤120 GiB"],["credit target","≤8"]],ask:"Explain what you optimize before scaling compute, and how you prove the improvement.",keys:["bounded","keys","prune","scan","profile","credits","spill","join"],solution:[["1","Freeze workset","Materialize the exact affected keys and source range."],["2","Prune early","Join/filter large tables from that bounded key set."],["3","Reduce before shuffle","Aggregate/project required columns before wide joins."],["4","Inspect profiles","Measure bytes scanned, partition pruning, queue, spill and operators."],["5","Scale last","Increase warehouse only if the bounded plan is compute-limited after query design is fixed."]],why:"Compute makes necessary work faster; pruning removes unnecessary work. Scaling first can make a bad scan more expensive without changing its shape."},
{title:"Executive asks why the platform work matters",sev:"BUSINESS",domain:"Stakeholder",problem:"A shareholder sees Kafka, Delta, MLflow, dbt and SLO work as technical complexity and asks what changed for the business.",metrics:[["recovery time","↓"],["data trust","↑"],["duplicate risk","↓"],["unit cost","measured"]],ask:"Give a 60-second answer that connects engineering controls to value without drowning them in tooling.",keys:["business","risk","customer","revenue","cost","recovery","proof","result"],solution:[["1","Lead with business failure","What decision/customer process was at risk."],["2","State the change","Make data/model state deterministic, observable and recoverable."],["3","Translate controls","Retries no longer duplicate effects; bad releases are reversible; metrics are certified."],["4","Show proof","Use business KPI, error/reconciliation, MTTR and unit-cost evidence."],["5","Close with residual risk","Say what is still unverified and what next control/rehearsal is needed."]],why:"Executives fund outcomes and risk reduction. Tool names are supporting evidence, not the headline."}
];

var dims=["Recognition","Recall","Implementation","Debugging","Reasoning","Communication","Transfer"];
function speech(text){if(!st.voice||!window.speechSynthesis)return;window.speechSynthesis.cancel();var u=new SpeechSynthesisUtterance(text);u.rate=1.02;u.pitch=1;u.lang="en-US";window.speechSynthesis.speak(u);}
function listen(target,button){
 var SR=window.SpeechRecognition||window.webkitSpeechRecognition;if(!SR){CO.toast("Speech recognition unavailable in this browser.");return;}
 var r=new SR();r.lang="en-US";r.interimResults=true;r.continuous=false;var orig=button.textContent;button.textContent="Listening...";
 r.onresult=function(e){var t="";for(var i=e.resultIndex;i<e.results.length;i++)t+=e.results[i][0].transcript+" ";target.value=(target.value+" "+t).trim();};
 r.onend=function(){button.textContent=orig;};r.onerror=function(){button.textContent=orig;};r.start();
}
function current(){return scenarios[st.scenario%scenarios.length];}
function scoreAnswer(sc,text,revealed){
 var low=text.toLowerCase(), hits=sc.keys.filter(function(k){return low.indexOf(k)>=0;});
 var base=Math.round(hits.length/sc.keys.length*58)+Math.min(22,Math.floor(text.length/80));
 var why=/because|instead of|rather than|so that|which means|tradeoff/.test(low)?10:0;
 var proof=/metric|reconcile|evidence|slo|rate|count|time|cost|profile|test/.test(low)?10:0;
 var total=Math.min(100,base+why+proof-(revealed?15:0));
 var d={
  Recognition:Math.min(100,45+hits.length*7),
  Recall:Math.min(100,30+hits.length*9+(text.length>220?10:0)),
  Implementation:Math.min(100,30+(/first|then|next|after|before|step/.test(low)?20:0)+hits.length*6),
  Debugging:Math.min(100,25+(/scope|preserve|blast|evidence|root|hypothesis|trace/.test(low)?35:0)+hits.length*5),
  Reasoning:Math.min(100,25+why*5+(/why|because|instead|tradeoff/.test(low)?20:0)),
  Communication:Math.min(100,35+(/business|customer|risk|cost|result|impact/.test(low)?25:0)+Math.min(30,text.length/25)),
  Transfer:Math.min(100,30+(/another|similar|pattern|boundary|contract|identity|state/.test(low)?25:0)+hits.length*5)
 };
 return {score:total,hits:hits,dims:d};
}
function recordAttempt(sc,res,text,revealed){
 st.attempts.push({scenario:st.scenario,domain:sc.domain,score:res.score,dims:res.dims,revealed:revealed,ts:now(),chars:text.length});
 st.attempts=st.attempts.slice(-300);save();
}
function aggregate(){
 var a=st.attempts;if(!a.length)return {score:0,dims:{},domains:{},blind:0,passes:0,days:0};
 var dim={};dims.forEach(function(d){var vals=a.slice(-30).map(function(x){return x.dims[d]||0;});dim[d]=Math.round(vals.reduce(function(x,y){return x+y;},0)/vals.length);});
 var domains={};scenarios.forEach(function(s){if(domains[s.domain]!==undefined)return;var x=a.filter(function(z){return z.domain===s.domain;}).slice(-5);domains[s.domain]=x.length?Math.round(x.reduce(function(n,z){return n+z.score;},0)/x.length):0;});
 var recent=a.slice(-20),score=Math.round(recent.reduce(function(n,x){return n+x.score;},0)/recent.length);
 var blind=recent.filter(function(x){return !x.revealed&&x.score>=85;}).length;
 var passes=recent.filter(function(x){return x.score>=90;}).length;
 var dates={};a.forEach(function(x){dates[new Date(x.ts).toISOString().slice(0,10)]=1;});
 return {score:score,dims:dim,domains:domains,blind:blind,passes:passes,days:Object.keys(dates).length};
}
function otherSignals(){
 var base=CO.getState(), speak={}, ext={}, comms={}, forge={}, ladder={}, cloud={}, backendForge={}, sardine={}, delta={}, skillPractice={}, workHistory={};
 try{speak=JSON.parse(localStorage.getItem("cloud_odyssey_speaking_v1")||"{}");}catch(e){}
 try{ext=JSON.parse(localStorage.getItem("cloud_odyssey_extensive_v1")||"{}");}catch(e){}
 try{comms=JSON.parse(localStorage.getItem("cloud_odyssey_comms_v1")||"{}");}catch(e){}
 try{forge=JSON.parse(localStorage.getItem("cloud_odyssey_coding_forge_v1")||"{}");}catch(e){}
 try{ladder=JSON.parse(localStorage.getItem("cloud_odyssey_ladder_v1")||"{}");}catch(e){}
 try{cloud=JSON.parse(localStorage.getItem("cloud_odyssey_cloud_forge_v1")||"{}");}catch(e){}
 try{backendForge=JSON.parse(localStorage.getItem("cloud_odyssey_backend_forge_v1")||"{}");}catch(e){}
 try{sardine=JSON.parse(localStorage.getItem("cloud_odyssey_sardine_forge_v1")||"{}");}catch(e){}
 try{delta=JSON.parse(localStorage.getItem("cloud_odyssey_delta_mastery_v1")||"{}");}catch(e){}
 try{skillPractice=JSON.parse(localStorage.getItem("cloud_odyssey_skill_practice_v1")||"{}");}catch(e){}
 try{workHistory=JSON.parse(localStorage.getItem("cloud_odyssey_project_history_v1")||"{}");}catch(e){}
 var mission=CO.doneCount()/30*100;
 var incidents=Math.min(100,Object.values(base.incidentProgress||{}).filter(function(x){return x&&x.solved;}).length/4*100);
 var projects=Object.values(base.checks||{}).filter(Boolean).length/60*100;
 var workorders=Math.min(100,Object.keys(workHistory||{}).filter(function(k){return k.indexOf("build-")===0&&workHistory[k]&&workHistory[k].completed;}).length/4*100);
 var vocab=0;if(speak.termStats){var known=Object.keys(speak.termStats).filter(function(k){var x=speak.termStats[k];return x.right>=2&&x.natural>=1;}).length;vocab=Math.min(100,known/109*100);}
 var star=0;if(speak.starScores){var vals=Object.values(speak.starScores);star=vals.length?vals.reduce(function(n,x){return n+(x.overall||0);},0)/vals.length:0;}
 var deep=0;if(ext.tasks)deep=Object.values(ext.tasks).filter(Boolean).length/120*100;
 var stakeholder=0;if(comms.scores){var cs=Object.values(comms.scores);stakeholder=cs.length?cs.reduce(function(n,x){return n+(x.score||0);},0)/cs.length:0;}
 var coding=0,codingFirst=0;if(forge.attempts&&forge.attempts.length){
   var fa=forge.attempts.slice(-25);
   coding=fa.reduce(function(n,x){return n+(x.score||0);},0)/fa.length;
   var fp=fa.filter(function(x){return x.dims&&x.dims["First Pass"]>=85;});
   codingFirst=fp.length;
 }
 var ladderScore=0;if(ladder.scores&&Object.keys(ladder.scores).length){var lv=Object.values(ladder.scores);ladderScore=lv.reduce(function(n,x){return n+(x||0);},0)/lv.length;}
 var aws=0,gcp=0,azure=0,databricks=0,snowflake=0;
 if(cloud.checks){
   var keys=Object.keys(cloud.checks);
   function platformScore(prefix,projectCount){
     var checks=cloud.checks||{},grades=cloud.simGrades||{},evidence=cloud.evidence||{};
     var done=keys.filter(function(k){return k.indexOf(prefix+"-")===0&&checks[k];}).length;
     var gradeKeys=Object.keys(grades).filter(function(k){return k.indexOf(prefix+"-")===0;});
     var gradeTotal=gradeKeys.reduce(function(n,k){return n+Math.min(100,Number(grades[k])||0);},0);
     var liveEvidence=Object.keys(evidence).filter(function(projectKey){
       if(projectKey.indexOf(prefix+"-")!==0||(evidence[projectKey]||"").trim().length<=30)return false;
       var stageDone=Object.keys(checks).filter(function(k){return k.indexOf(projectKey+"-")===0&&checks[k];}).length;
       return stageDone===12&&(Number(grades[projectKey])||0)>=85;
     }).length;
     return Math.min(100,Math.round(done/(12*projectCount)*70+(gradeTotal/(projectCount*100))*15+(liveEvidence/projectCount)*15));
   }
   aws=platformScore("aws",12);
   gcp=platformScore("gcp",12);
   azure=platformScore("azure",8);
   databricks=platformScore("databricks",8);
   snowflake=platformScore("snowflake",8);
 }
 var sardineScore=0;
 if(sardine.checks||sardine.defense||sardine.mock||sardine.incident||sardine.star){
   var stask=Object.values(sardine.checks||{}).filter(Boolean).length/350*55;
   var sdef=Object.values(sardine.defense||{}).reduce(function(n,x){return n+(Number(x)||0);},0)/(25*100)*20;
   var smock=Object.values(sardine.mock||{}).reduce(function(n,x){return n+(Number(x)||0);},0)/(25*100)*10;
   var sinc=Object.values(sardine.incident||{}).reduce(function(n,x){return n+(Number(x)||0);},0)/(25*100)*10;
   var sstar=Object.values(sardine.star||{}).reduce(function(n,x){return n+(Number(x)||0);},0)/(25*100)*5;
   var scoreCore=stask+sdef+smock+sinc+sstar;
   var spat=sardine.pattern&&sardine.pattern.total?(Number(sardine.pattern.right||0)/Number(sardine.pattern.total)*100):0;
   var svocab=Object.values(sardine.vocab||{}).filter(Boolean).length/60*100;
   sardineScore=Math.min(100,Math.round(scoreCore*.9+spat*.05+svocab*.05));
 }
 var deltaScore=0;
 var dchecks=Object.values(delta.checks||{}).filter(Boolean).length/10*45;
 var dgrades=Object.values(delta.grades||{}),dgrade=dgrades.length?dgrades.reduce(function(n,x){return n+(Number(x)||0);},0)/dgrades.length:0;
 var dmatch=delta.match&&delta.match.total?Number(delta.match.right||0)/Number(delta.match.total)*100:0;
 deltaScore=Math.min(100,Math.round(dchecks+dgrade*.30+dmatch*.15+(Number(delta.defense)||0)*.10));
 var skillScores=[];Object.keys(skillPractice||{}).forEach(function(k){var x=skillPractice[k];if(!x||typeof x!=="object")return;if(x.explainScore!=null)skillScores.push(Number(x.explainScore)||0);if(x.proveScore!=null)skillScores.push(Number(x.proveScore)||0);});
 var skillsScore=skillScores.length?Math.round(skillScores.reduce(function(n,x){return n+x;},0)/skillScores.length):0;
 var backend=0;
 if(backendForge.checks||backendForge.grades){
   var bc=Object.values(backendForge.checks||{}).filter(Boolean).length/144*55;
   var bg=Object.values(backendForge.grades||{}).reduce(function(n,x){return n+(Number(x)||0);},0)/12*.45;
   backend=Math.min(100,Math.round(bc+bg));
 }
 return {missions:Math.round(mission),incidents:Math.round(incidents),workorders:Math.round(workorders),projects:Math.round(projects),vocab:Math.round(vocab),star:Math.round(star),deep:Math.round(deep),stakeholder:Math.round(stakeholder),coding:Math.round(coding),codingFirst:codingFirst,ladder:Math.round(ladderScore),aws:aws,gcp:gcp,azure:azure,databricks:databricks,snowflake:snowflake,backend:backend,sardine:sardineScore,delta:deltaScore,skills:skillsScore};
}
function readiness(){
 var ag=aggregate(),o=otherSignals();
 var internal=Math.round(ag.score*.095+o.coding*.095+o.ladder*.065+o.aws*.03+o.gcp*.03+o.azure*.03+o.databricks*.03+o.snowflake*.03+o.missions*.055+o.incidents*.05+o.projects*.04+o.vocab*.05+o.star*.05+o.deep*.05+o.stakeholder*.03+o.backend*.07+o.sardine*.10+o.delta*.07+o.skills*.05);
 return {score:internal,ag:ag,o:o};
}
function gates(r){
 var minDim=dims.length?Math.min.apply(null,dims.map(function(d){return r.ag.dims[d]||0;})):0;
 var domainVals=Object.values(r.ag.domains||{}),minDomain=domainVals.length?Math.min.apply(null,domainVals):0;
 return [
  ["Core lab mastery",r.o.missions>=90,r.o.missions+"%","≥90% of primary missions mastered"],
  ["Incident War Room",r.o.incidents>=100,r.o.incidents+"%","Master all core production incident cases"],
  ["Build Something projects",r.o.workorders>=100,r.o.workorders+"%","Complete all four evidence-driven build work orders"],
  ["Production artifacts",r.o.projects>=90,r.o.projects+"%","≥90% of project evidence complete"],
  ["Vocabulary fluency",r.o.vocab>=90,r.o.vocab+"%","Recognition + natural use, not definition only"],
  ["STAR delivery",r.o.star>=85,r.o.star+"%","Average production STAR score ≥85"],
  ["Deep recovery",r.o.deep>=90,r.o.deep+"%","≥90% of enterprise deep tasks"],
  ["Stakeholder translation",r.o.stakeholder>=85,r.o.stakeholder+"%","Average audience-fit ≥85"],
  ["Elite coding proficiency",r.o.coding>=90,r.o.coding+"%","Recent Coding Forge average ≥90"],
  ["First-pass coding",r.o.codingFirst>=5,r.o.codingFirst+"/5","At least five recent coding attempts with first-pass dimension ≥85"],
  ["Adaptive transfer ladder",r.o.ladder>=85,r.o.ladder+"%","Average across recognize → package stages ≥85"],
  ["AWS project forge",r.o.aws>=85,r.o.aws+"%","AWS campaign readiness ≥85 with real evidence slots"],
  ["GCP project forge",r.o.gcp>=85,r.o.gcp+"%","GCP campaign readiness ≥85 with real evidence slots"],
  ["Azure project forge",r.o.azure>=85,r.o.azure+"%","Azure campaign readiness ≥85 with real evidence slots"],
  ["Databricks project forge",r.o.databricks>=85,r.o.databricks+"%","Databricks campaign readiness ≥85 with real evidence slots"],
  ["Delta performance mastery",r.o.delta>=85,r.o.delta+"%","Pipeline optimization labs + decision match + blind defense ≥85"],
  ["Skills Matrix proficiency",r.o.skills>=85,r.o.skills+"%","Average Explain/Prove evidence across practiced skills ≥85"],
  ["Snowflake project forge",r.o.snowflake>=85,r.o.snowflake+"%","Snowflake campaign readiness ≥85 with real evidence slots"],
  ["Backend systems forge",r.o.backend>=85,r.o.backend+"%","Distributed backend architecture readiness ≥85"],
  ["Sardine role forge",r.o.sardine>=85,r.o.sardine+"%","Role-specific fraud data/ML readiness ≥85"],
  ["Blind scenario passes",r.ag.blind>=6,r.ag.blind+"/6","Six ≥85 attempts without reveal"],
  ["Repeated elite passes",r.ag.passes>=5,r.ag.passes+"/5","Five recent ≥90 scenario passes"],
  ["No weak skill dimension",minDim>=85,minDim+"%","Every proof dimension ≥85"],
  ["No weak domain",domainVals.length>=4&&minDomain>=85,(domainVals.length?minDomain:0)+"%","At least four tested domains; every tested domain ≥85"],
  ["Retention across days",r.ag.days>=3,r.ag.days+"/3","Prove skill on at least three separate dates"]
 ];
}
function nextPlan(r){
 var arr=[];
 var sig=r.o;
 if(sig.incidents<100)arr.push(["Incident War Room","Master the next unsolved incident and explain the evidence → containment → recovery → reconciliation sequence."]);
 if(sig.workorders<100)arr.push(["Build Something","Complete the next project through code pass → file verification → final defense."]);
 if(sig.vocab<90)arr.push(["Vocabulary","Run Natural Use + Contrast on weak terms until 90% fluency."]);
 if(sig.star<85)arr.push(["STAR","Do one STAR scenario without model reveal; keep Action first-person and Result measured."]);
 if(sig.deep<90)arr.push(["Deep recovery","Complete the next 8-task enterprise stage and explain WHY for every item."]);
 if(sig.coding<90)arr.push(["Coding Forge","Run a blind Build/Debug/Optimize challenge; target ≥90 with file discipline and WHY."]);
 if(sig.ladder<85)arr.push(["Adaptive Ladder","Take one pattern through the next unmet stage: recognize → write → debug → optimize → transfer → review → package."]);
 if(sig.aws<85)arr.push(["AWS Forge","Advance one AWS project stage and log actual sandbox evidence when available."]);
 if(sig.gcp<85)arr.push(["GCP Forge","Advance one GCP project stage and log actual sandbox evidence when available."]);
 if(sig.azure<85)arr.push(["Azure Forge","Advance one Azure project stage and explain the identity, recovery and cost boundary."]);
 if(sig.databricks<85)arr.push(["Databricks Forge","Advance one Databricks project stage; emphasize Lakeflow, Unity Catalog, Delta and deployment evidence."]);
 if(sig.delta<85)arr.push(["Delta Performance","Run the weakest physical-optimization lab: baseline → layout decision → query-profile proof → reconciliation."]);
 if(sig.skills<85)arr.push(["Skills Matrix","Practice one weak skill through Practice → Explain WHY → Prove it."]);
 if(sig.snowflake<85)arr.push(["Snowflake Forge","Advance one Snowflake project stage; prove ingestion, SQL semantics, governance and cost behavior."]);
 if(sig.backend<85)arr.push(["Backend Systems","Advance one distributed backend project and defend the design on the server grader."]);
 if(sig.sardine<85)arr.push(["Sardine Mission Forge","Advance the weakest Sardine project: artifact checklist → mock discussion → incident → blind defense."]);
 if(r.ag.blind<6)arr.push(["Blind transfer","Run a coach scenario without revealing solution; target ≥85."]);
 var weak=dims.slice().sort(function(a,b){return (r.ag.dims[a]||0)-(r.ag.dims[b]||0);})[0];
 if((r.ag.dims[weak]||0)<85)arr.push([weak,"Lowest proof dimension. Pick a scenario and answer specifically to improve "+weak.toLowerCase()+"."]);
 if(!arr.length)arr.push(["Elite maintenance","Use randomized blind incidents, stakeholder changes, and delayed retests to prevent memorization."]);
 return arr.slice(0,5);
}
function solutionHTML(sc,hidden){
 if(hidden)return '<div class="solve-visual"><span class="micro">SOLUTION PATH LOCKED</span><p style="font-size:8px;color:#7f94ad">Give your answer first. Revealing the solve reduces the attempt\'s proficiency weight.</p></div>';
 return '<div class="solve-visual"><span class="micro">REFERENCE SOLVE</span>'+sc.solution.map(function(x,i){return '<div class="solve-step"><i>'+x[0]+'</i><div><b>'+x[1]+'</b><span>'+x[2]+'</span></div></div>'+(i<sc.solution.length-1?'<div class="solve-arrow">↓</div>':'');}).join("")+'<div class="natural-speech"><b>WHY</b><p>'+sc.why+'</p></div></div>';
}
function resultHTML(res){
 return '<div class="answer-panel"><h4>COACH SCORE • '+res.score+'%</h4><div class="dimension-grid">'+dims.map(function(d){var v=Math.round(res.dims[d]||0);return '<div class="dimension"><span>'+d+'</span><b>'+v+'%</b><div class="dim-track"><i style="width:'+v+'%"></i></div></div>';}).join("")+'</div><div class="natural-speech"><b>Coach feedback</b><p>'+(res.score>=90?"Strong elite-readiness attempt. Now repeat it blind on a different scenario so this is transfer, not recognition.":res.score>=80?"Good production reasoning. Add the missing evidence/WHY language and retest without reveal.":"Do not memorize the solution. Rebuild the answer from identity/grain → failure boundary → evidence → recovery → business proof.")+'</p></div></div>';
}
function render(){
 var root=$("#view-elite");if(!root)return;var sc=current(),r=readiness(),gs=gates(r),revealed=!!st.reveals[st.scenario];
 root.innerHTML='<div class="view-heading"><div><span class="micro">LIVE COACH • OBJECTIVE PROFICIENCY</span><h2>Elite Coach & Proficiency OS</h2><p>A live problem-solving coach plus an evidence ledger. Internal “elite readiness” means repeated blind performance across code, incidents, explanation and transfer—not a claimed population percentile.</p></div><span class="enterprise-badge">ELITE TARGET ≥90</span></div>'+
 '<div class="elite-shell"><aside class="elite-sidebar glass"><div class="coach-card-top"><div class="coach-avatar">🧠</div><h3>Odyssey Engineering Coach</h3><p>Speaks the problem, listens to your reasoning, withholds the solution until you attempt it, then grades evidence across seven dimensions.</p></div><div class="provider-list"><div class="provider live"><b>Browser Voice Coach</b><span>Works now: speech synthesis + speech recognition when supported.</span></div><div class="provider"><b>HeyGen LiveAvatar</b><span>Recommended visual layer: real-time two-way avatar. Requires LiveAvatar API integration.</span></div><div class="provider"><b>Tavus</b><span>Best fit if you want a tutor that can see/hear and react multimodally.</span></div><div class="provider"><b>ElevenLabs Agents</b><span>Best fit for natural voice-only conversational coaching.</span></div><div class="provider"><b>InVideo</b><span>Use for polished problem/solution explainer clips, not the core live tutor.</span></div></div></aside>'+
 '<section class="elite-main glass"><div class="elite-session-head"><div><span class="micro">'+sc.domain+' • '+sc.sev+'</span><h2>'+esc(sc.title)+'</h2><p>'+esc(sc.ask)+'</p></div><div class="coach-controls"><button class="primary" id="speakProblem">🔊 Speak problem</button><button id="newScenario">New problem</button><button id="toggleEliteVoice">'+(st.voice?"Voice ON":"Voice OFF")+'</button></div></div>'+
 '<div class="problem-stage"><article class="problem-card"><span class="severity">'+sc.sev+'</span><h3>'+esc(sc.problem)+'</h3><div class="problem-metrics">'+sc.metrics.map(function(m){return '<div class="problem-metric"><span>'+m[0]+'</span><b>'+m[1]+'</b></div>';}).join("")+'</div></article>'+
 '<div class="coach-transcript"><span>COACH</span><p>'+esc(sc.ask)+'</p></div><div class="answer-workbench"><div><textarea id="eliteAnswer" placeholder="Talk or type your reasoning. Start with what you would establish before changing production..."></textarea><div class="elite-actions"><button class="primary" id="gradeElite">Grade my answer</button><button id="dictateElite">🎙 Dictate</button><button id="revealElite">'+(revealed?"Solution revealed":"Reveal solve")+'</button></div><div id="eliteResult"></div></div>'+solutionHTML(sc,!revealed)+'</div></div></section>'+
 '<aside class="elite-ledger glass"><div class="ledger-head"><span class="micro">PROFICIENCY LEDGER</span><h3>Elite Readiness</h3><div class="elite-score">'+r.score+'%</div><span class="elite-label">Internal evidence score — not a population percentile</span></div><div class="gate-list">'+gs.map(function(g){return '<div class="gate '+(g[1]?"pass":"")+'"><i></i><div><b>'+g[0]+'</b><span>'+g[3]+'</span></div><em>'+g[2]+'</em></div>';}).join("")+'</div><div class="domain-ledger"><span class="micro">COACH DOMAINS</span>'+Object.keys(r.ag.domains).map(function(d){var v=r.ag.domains[d];return '<div class="domain-row"><span>'+d+'</span><div class="domain-track"><i style="width:'+v+'%"></i></div><b>'+v+'%</b></div>';}).join("")+'</div><div class="next-plan"><span class="micro">NEXT BEST PRACTICE</span>'+nextPlan(r).map(function(x){return '<div class="plan-item"><b>'+x[0]+'</b><span>'+x[1]+'</span></div>';}).join("")+'</div></aside></div>';
 $("#speakProblem").onclick=function(){speech(sc.problem+" "+sc.ask);};
 $("#toggleEliteVoice").onclick=function(){st.voice=!st.voice;save();render();};
 $("#newScenario").onclick=function(){st.scenario=(st.scenario+1)%scenarios.length;save();render();if(st.voice)setTimeout(function(){speech(current().problem+" "+current().ask);},200);};
 $("#dictateElite").onclick=function(){listen($("#eliteAnswer"),$("#dictateElite"));};
 $("#revealElite").onclick=function(){st.reveals[st.scenario]=true;save();render();speech(sc.why);};
 $("#gradeElite").onclick=function(){var text=$("#eliteAnswer").value.trim();if(!text){CO.toast("Give your reasoning first");return;}var rev=!!st.reveals[st.scenario],res=scoreAnswer(sc,text,rev);recordAttempt(sc,res,text,rev);$("#eliteResult").innerHTML=resultHTML(res);if(st.voice)speech(res.score>=90?"Strong answer. Now prove it on a different problem without revealing the solution.":"Good attempt. Review the missing reasoning and try again without relying on the reference solution.");setTimeout(renderLedgerOnly,50);};
}
function renderLedgerOnly(){var r=readiness();var score=$(".elite-score");if(score)score.textContent=r.score+"%";}
function install(){
 var nav=$("#nav"),work=$("#workspace");if(!nav||!work)return;
 var b=document.createElement("button");b.className="nav-item";b.dataset.view="elite";b.innerHTML="<span>◬</span><b>Elite Coach</b><em>16</em>";
 b.onclick=function(){CO.setView("elite");$("#pageTitle").textContent="Elite Coach & Proficiency OS";render();};nav.appendChild(b);
 var sec=document.createElement("section");sec.className="view";sec.id="view-elite";work.appendChild(sec);render();
}
install();
})();