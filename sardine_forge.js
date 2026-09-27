(function(){
"use strict";
if(!window.CloudOdyssey||!window.CloudOdysseySardineData){console.error("Sardine Forge dependencies missing");return;}
var CO=window.CloudOdyssey;
var B=window.CloudOdysseyBackend||null;
var D=window.CloudOdysseySardineData;
var projects=D.projects,patterns=D.patterns,terms=D.terms,coverage=D.coverage;
var KEY="cloud_odyssey_sardine_forge_v1";
var st=Object.assign({project:0,mode:"mission",checks:{},defense:{},mock:{},incident:{},star:{},pattern:{right:0,total:0,index:0},vocab:{},audience:"shareholder",assignmentFilter:"current"},JSON.parse(localStorage.getItem(KEY)||"{}"));
var $=function(s,r){return (r||document).querySelector(s);};
var $$=function(s,r){return Array.prototype.slice.call((r||document).querySelectorAll(s));};
var save=function(){localStorage.setItem(KEY,JSON.stringify(st));};
var esc=function(s){return String(s||"").replace(/[&<>"]/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c];});};
var modes=[["mission","Mission + Checklist"],["fivew","WHO • WHAT • WHERE • WHEN • WHY"],["mock","Mock Discussions"],["patterns","Instant Patterns"],["incident","Break / Fix"],["model","Model + Feature Design"],["tradeoffs","Tradeoffs"],["star","STAR Method"],["thesaurus","Thesaurus"],["assignments","Task Board"],["coverage","JD Coverage"],["live","Live Practicum"]];
var stages=[
["Business decision + invariant","Define the automated decision, unacceptable false outcome, owner and measurable success."],
["WHO ownership map","Map producers, platform owner, feature/model owner, fraud/compliance consumers and escalation."],
["Source + contract","Specify keys, event time, schema/version, PII class, lineage and malformed-data behavior."],
["Real-time path","Design partitioning, windows/watermarks, state, dedupe, latency budget and serving."],
["Batch + recompute path","Design point-in-time backfill, bounded workset, reruns, orchestration and reconciliation."],
["Feature / model semantics","Define feature units, null/unknowns, windows, labels, leakage, normalization and thresholds."],
["Correctness + parity","Prove stream↔batch, online↔offline, source↔warehouse and train↔serve consistency."],
["Scale + latency","Set throughput, p95/p99, state/skew/fanout/scan/cache and unit-cost budgets."],
["Failure + graceful degradation","Inject timeout, replay, late data, stale feature, partial write and dependency failures."],
["Security + governance","Enforce encryption, IAM, tenancy, residency, deletion, audit and feature kill switches."],
["Observability + drift","Instrument SLOs, business reconciliation, DQ, freshness, drift and label delay."],
["Cost + extensibility","Measure cost per event/decision/provider/model and cost of adding the next signal."],
["Runbook + rollback","Write evidence capture, blast-radius control, bounded recovery, rollback and safe resume."],
["Stakeholder handoff + STAR","Explain WHO/WHAT/WHERE/WHEN/WHY, tradeoff, evidence, business impact and STAR."]
];
function current(){return projects[st.project%projects.length];}
function patternById(id){return patterns.find(function(x){return x.id===id;})||patterns[0];}
function checkKey(pr,i){return pr.id+"-"+i;}
function completed(pr){return stages.filter(function(_,i){return !!st.checks[checkKey(pr,i)];}).length;}
function g(bucket,pr){return Number((bucket||{})[pr.id]||0);}
function graduated(pr){return completed(pr)===14&&g(st.defense,pr)>=85;}
function score(pr){
 return Math.round(completed(pr)/14*55+g(st.defense,pr)/100*20+g(st.mock,pr)/100*10+g(st.incident,pr)/100*10+g(st.star,pr)/100*5);
}
function roleScore(){
 var base=projects.reduce(function(n,x){return n+score(x);},0)/projects.length;
 var pscore=st.pattern.total?st.pattern.right/st.pattern.total*100:0;
 var vscore=Object.values(st.vocab).filter(Boolean).length/terms.length*100;
 return Math.round(base*.9+pscore*.05+vscore*.05);
}
function detail(pr,i){
 var d=[
  "Write a decision contract for: "+pr.why5+" Define invariant, false-positive/false-negative cost, owner and business SLO.",
  "Create a RACI and escalation map for "+pr.who+". Name who approves semantic changes and rollback.",
  "Produce the source/data contract for "+pr.what+": key, event time, schema version, PII, lineage, quarantine and compatibility.",
  "Draw the realtime path: "+pr.stream+" Include partitioning, windows/state, deadline, dedupe and sink-effect semantics.",
  "Design batch/recompute: "+pr.batch+" Include point-in-time rules, bounded range, reruns, pruning and publish certification.",
  "Define feature/model semantics: units, null/unknown, windows, labels, leakage boundary, normalization and threshold meaning.",
  "Implement reconciliation for stream↔batch, source↔warehouse, online↔offline and train↔serve where applicable.",
  "Load/profile around "+pr.metrics.join(", ")+". Include p95/p99, skew/state/scan/fanout and unit cost.",
  "Inject this failure: "+pr.incident+" Define fail-open/fail-closed/fallback and prove no silent bad decision.",
  "Threat-model encryption, IAM, tenant boundary, residency, retention/deletion, audit and feature kill switch.",
  "Build technical plus business observability: SLO, freshness, DQ, drift, label delay and business reconciliation.",
  "Estimate current and 10x cost; identify the growth dimension and how the next source/feature/model is added safely.",
  "Write an evidence-preserving runbook: blast radius, diagnosis, rollback, bounded repair, reconciliation and safe resume.",
  "Prepare 60s executive, 3m engineering and STAR explanations with quantified result and explicit tradeoff."
 ];
 return d[i];
}
function artifacts(pr){
 var s=pr.id.replace(/-/g,"_");
 return [
  ["design/"+pr.id+".md","Architecture, invariants, five Ws, alternatives and ownership."],
  ["src/"+s+".py","Production implementation or reference skeleton."],
  ["tests/test_"+s+".py","Contract, replay, failure and parity tests."],
  ["sql/"+s+"_reconcile.sql","Independent business/data reconciliation."],
  ["monitoring/"+pr.id+"_slo.md","SLIs/SLOs, alerts, drift and correctness metrics."],
  ["runbooks/"+pr.id+".md","Evidence, rollback, repair and safe resume."]
 ];
}
function modeBar(){
 return '<div class="sardine-modes glass">'+modes.map(function(x){return '<button class="sardine-mode '+(st.mode===x[0]?"active":"")+'" data-smode="'+x[0]+'">'+x[1]+'</button>';}).join("")+'</div>';
}
function sidebar(){
 var total=projects.reduce(function(n,x){return n+completed(x);},0);
 var grad=projects.filter(graduated).length;
 return '<aside class="sardine-side glass"><div class="sardine-head"><span class="micro">SARDINE ROLE CAMPAIGN</span><h3>Senior Data / ML Engineer</h3><p>Event arrival → feature → model → decision → feedback → governance → recovery.</p></div>'+
 '<div class="sardine-role-kpis"><div class="sardine-kpi"><span>ROLE READINESS</span><b>'+roleScore()+'%</b></div><div class="sardine-kpi"><span>ASSIGNMENTS</span><b>'+total+'/350</b></div><div class="sardine-kpi"><span>GRADUATED</span><b>'+grad+'/25</b></div><div class="sardine-kpi"><span>BLIND GATE</span><b>≥85</b></div></div>'+
 '<div class="sardine-projects">'+projects.map(function(x,i){return '<button class="sardine-project '+(i===st.project?"active ":"")+(graduated(x)?"complete":"")+'" data-sproject="'+i+'"><span class="ico">'+x.icon+'</span><div><b>'+esc(x.title)+'</b><span>'+esc(x.stack.slice(0,3).join(" • "))+'</span></div><em>'+(graduated(x)?"GRAD":completed(x)+"/14")+'</em></button>';}).join("")+'</div></aside>';
}
function hero(pr,label){
 return '<div class="sardine-project-hero"><span class="micro">PROJECT '+String(st.project+1).padStart(2,"0")+' • '+esc(label)+'</span><h2>'+pr.icon+' '+esc(pr.title)+'</h2><p>'+esc(pr.scenario)+'</p><div class="sardine-chips">'+pr.stack.map(function(x){return '<span class="sardine-chip">'+esc(x)+'</span>';}).join("")+'</div><div class="sardine-source">'+esc(pr.source)+'</div></div>';
}
function flow(pr){
 return '<div class="sardine-flow">'+pr.flow.map(function(x,i){return '<div class="sardine-node"><b>'+esc(x)+'</b><span>'+(i===0?"source":i===pr.flow.length-1?"consumer / decision":"failure boundary")+'</span></div>'+(i<pr.flow.length-1?'<div class="sardine-arrow">→</div>':'');}).join("")+'</div>';
}
function mission(pr){
 return hero(pr,"END-TO-END PRODUCTION MISSION")+flow(pr)+
 '<div class="sardine-trade-grid"><div class="sardine-block"><b>REAL-TIME</b><p>'+esc(pr.stream)+'</p></div><div class="sardine-block"><b>BATCH / RECOMPUTE</b><p>'+esc(pr.batch)+'</p></div></div>'+
 '<div class="sardine-assignments">'+stages.map(function(x,i){return '<label class="sardine-assignment"><input type="checkbox" data-scheck="'+i+'" '+(st.checks[checkKey(pr,i)]?"checked":"")+'><div><b>'+String(i+1).padStart(2,"0")+'. '+x[0]+'</b><p>'+esc(detail(pr,i))+'</p></div><em>ASSIGN</em></label>';}).join("")+'</div>';
}
function fivew(pr){
 var vals=[["WHO",pr.who],["WHAT",pr.what],["WHERE",pr.where],["WHEN",pr.when],["WHY",pr.why5]];
 return hero(pr,"WHO • WHAT • WHERE • WHEN • WHY")+flow(pr)+
 '<div class="sardine-fivew">'+vals.map(function(x){return '<div class="sardine-five"><b>'+x[0]+'</b><p>'+esc(x[1])+'</p></div>';}).join("")+'</div>'+
 '<div class="sardine-block"><b>SHAREHOLDER SEQUENCE</b><p>Business decision → fraud/customer impact → correctness/reliability → scale/cost → evidence. Translate tools into outcomes.</p></div>'+
 '<div class="sardine-block"><b>ENGINEERING SEQUENCE</b><p>Source contract → event/identity boundary → realtime/batch compute → authoritative state → feature/model serving → parity/reconciliation → observability → rollback.</p></div>';
}
function talkPrompt(a){
 var m={
  shareholder:"Explain business value: fraud loss, conversion, review cost, regulatory risk, scale and unit economics. Do not lead with tools.",
  analyst:"Explain signal/model meaning, failure modes, evidence, unknowns and what the analyst sees during degradation.",
  backend:"Defend request contract, latency budget, idempotency, timeout/fallback and ownership boundaries.",
  ds:"Defend point-in-time features, labels, parity, evaluation, leakage and drift.",
  ml:"Defend reproducibility, registry, shadow/promotion/rollback and serving monitoring.",
  compliance:"Defend PII, residency, audit, deletion, explainability and fail-closed controls."
 };
 return m[a]||m.shareholder;
}
function talkKeys(a){
 var m={
  shareholder:["fraud","cost","conversion","risk","metric","because"],
  analyst:["signal","fallback","provenance","unknown","evidence","because"],
  backend:["latency","idempotent","timeout","contract","rollback","because"],
  ds:["point in time","label","parity","drift","leakage","because"],
  ml:["lineage","shadow","promotion","rollback","monitor","because"],
  compliance:["pii","audit","residency","delete","explain","because"]
 };
 return m[a]||m.shareholder;
}
function mock(pr){
 var au=[["shareholder","Shareholder / Executive"],["analyst","Fraud Analyst"],["backend","Backend Engineer"],["ds","Data Scientist"],["ml","ML Engineer"],["compliance","Compliance / Security"]];
 return hero(pr,"MOCK PIPELINE DISCUSSION")+
 '<div class="sardine-mock-grid"><div class="sardine-audiences">'+au.map(function(a){return '<button class="sardine-audience '+(st.audience===a[0]?"active":"")+'" data-saud="'+a[0]+'">'+a[1]+'</button>';}).join("")+'</div>'+
 '<div><div class="sardine-block"><span class="micro">PROMPT</span><h4>'+esc(talkPrompt(st.audience))+'</h4><p>Anchor to this project: '+esc(pr.why5)+'</p></div><div class="sardine-talk"><textarea id="smock" placeholder="Answer naturally: problem → sequence → WHY → evidence → tradeoff."></textarea><button id="gradeSMock">Grade discussion on server</button><div id="smockResult" class="sardine-result">No graded discussion yet.</div></div></div></div>';
}
function patternQuestion(pr){
 var correct=patternById(pr.patterns[st.pattern.index%pr.patterns.length]);
 var others=patterns.filter(function(x){return x.id!==correct.id;}).sort(function(){return Math.random()-.5;}).slice(0,3);
 return {correct:correct,options:[correct].concat(others).sort(function(){return Math.random()-.5;})};
}
function patternView(pr){
 var q=patternQuestion(pr);
 return hero(pr,"INSTANT PATTERN RECOGNITION")+
 '<div class="sardine-block"><span class="micro">SCENARIO</span><h4>'+esc(pr.incidentTitle)+'</h4><p>'+esc(pr.incident)+' Which production pattern should you recognize first?</p><div class="sardine-pattern-options">'+q.options.map(function(x){return '<button class="sardine-pattern-option" data-pchoice="'+x.id+'"><b>'+esc(x.name)+'</b><span>'+esc(x.meaning)+'</span></button>';}).join("")+'</div><div id="spatResult" class="sardine-result">Pattern score '+st.pattern.right+'/'+st.pattern.total+'</div><button id="nextSPat" class="sardine-action">Next pattern</button></div>'+
 '<div class="sardine-vocab-grid">'+pr.patterns.map(function(id){var x=patternById(id);return '<div class="sardine-term"><h4>'+esc(x.name)+'</h4><p>'+esc(x.meaning)+'</p><code>TRIGGER → '+esc(x.trigger)+'</code></div>';}).join("")+'</div>';
}
function incidentView(pr){
 return hero(pr,"BREAK / FIX WAR ROOM")+
 '<div class="sardine-incident"><span class="micro">SEV-1 / CORRECTNESS</span><h3>'+esc(pr.incidentTitle)+'</h3><p>'+esc(pr.incident)+'</p><div class="sardine-metrics">'+pr.metrics.map(function(x,i){return '<div class="sardine-metric"><span>signal '+(i+1)+'</span><b>'+esc(x)+'</b></div>';}).join("")+'</div>'+
 '<div class="sardine-block"><b>FIRST FIVE MOVES</b><p>1 bound impact → 2 preserve evidence → 3 prove semantic/failure boundary → 4 bounded recovery/rollback → 5 reconcile before resume. Then add prevention.</p></div>'+
 '<div class="sardine-talk"><textarea id="sincident" placeholder="Talk through the incident end to end."></textarea><button id="gradeSIncident">Grade incident command</button><div id="sincidentResult" class="sardine-result">Reference remains hidden until after your attempt.</div></div>'+
 '<button id="revealSIncident" class="sardine-action">Reveal recovery framework</button><div id="sincidentRef" class="sardine-block" style="display:none"><p>Scope and freeze unsafe effects → preserve offsets/run/model/provider/version evidence → distinguish infrastructure health from business correctness → repair the smallest bounded population with idempotent semantics → reconcile source/feature/model/decision state → resume under monitoring and add the prevention test.</p></div></div>';
}
function modelView(pr){
 var rows=[["DECISION",pr.why5],["DATA",pr.what],["FEATURE / PIPELINE",pr.model],["REAL-TIME",pr.stream],["BATCH / TRAIN",pr.batch],["MONITOR","Correctness + latency + drift + business outcome + rollback evidence"]];
 return hero(pr,"FEATURE + MODEL DESIGN REVIEW")+'<div class="sardine-model-grid">'+rows.map(function(x){return '<div class="sardine-block"><b>'+x[0]+'</b><p>'+esc(x[1])+'</p></div>';}).join("")+'</div><div class="sardine-block"><b>MODEL DESIGN SEQUENCE</b><p>Decision → label/maturity → point-in-time data → features → split/evaluation → model/objective → calibration/threshold → serving → feedback → drift → champion/challenger → rollback.</p></div>';
}
function tradeView(pr){
 return hero(pr,"TRADEOFF BATTLE")+'<div class="sardine-trade-grid"><div class="sardine-trade"><h4>Chosen architecture</h4><div class="side"><b>WHY THIS</b><p>'+esc(pr.why)+'</p></div></div><div class="sardine-trade"><h4>Rejected shortcut</h4><div class="side"><b>WHY NOT</b><p>'+esc(pr.alt)+'</p></div></div></div><div class="sardine-block"><b>INTERVIEW RULE</b><p>Never say a technology is universally better. State the constraint, choose the method, name the failure/cost introduced, and explain when the alternative becomes valid.</p></div>';
}
function starView(pr){
 var rows=[["S • Situation","A consequential "+pr.title+" constraint/failure affected a fraud/KYC decision."],["T • Task","Own correctness end to end while protecting latency, compliance, cost and downstream consumers."],["A • Action","Bound impact, preserve evidence, diagnose the exact boundary, implement bounded correction and add prevention."],["R • Result","Quantify correctness, latency, fraud/review, cost, recovery time or reduced recurrence."],["W • WHY","Explain why the chosen architecture was safer than the shortcut: "+pr.alt]];
 return hero(pr,"STAR + WHY")+'<div class="sardine-star-grid">'+rows.map(function(x){return '<div class="sardine-star-box"><b>'+x[0]+'</b><p>'+esc(x[1])+'</p></div>';}).join("")+'</div><div class="sardine-talk"><textarea id="sstar" placeholder="Tell the story naturally with metrics and tradeoff."></textarea><button id="gradeSStar">Grade STAR on server</button><div id="sstarResult" class="sardine-result">Target: Situation, Task, Action, Result, WHY/tradeoff, evidence, natural delivery.</div></div>';
}
function thesaurusView(pr){
 return hero(pr,"PRODUCTION THESAURUS")+'<div class="sardine-block"><input id="stermSearch" class="sardine-search" placeholder="Search term, synonym, contrast or usage..."></div><div class="sardine-vocab-grid">'+terms.map(function(t,i){return '<div class="sardine-term" data-tcard="'+i+'"><h4>'+esc(t.term)+'</h4><p><b>Say naturally:</b> '+esc(t.natural)+'</p><p><b>Do not confuse with:</b> '+esc(t.contrast)+'</p><code>'+esc(t.use)+'</code><label style="display:block;margin-top:6px;font-size:6px"><input type="checkbox" data-tmaster="'+i+'" '+(st.vocab[t.term]?"checked":"")+'> define + contrast + use naturally</label></div>';}).join("")+'</div>';
}
function assignmentView(pr){
 var rows=[];
 projects.forEach(function(x,pi){stages.forEach(function(s,i){rows.push({pr:x,pi:pi,i:i,title:s[0],done:!!st.checks[checkKey(x,i)]});});});
 var shown=st.assignmentFilter==="all"?rows:rows.filter(function(x){return x.pi===st.project;});
 return hero(pr,"EXTENSIVE TASK ASSIGNMENTS")+'<div class="sardine-block"><button class="sardine-action" data-afilter="current">Current project</button> <button class="sardine-action" data-afilter="all">All 350 assignments</button><p>'+rows.filter(function(x){return x.done;}).length+'/350 complete. Every checkbox should correspond to an artifact, implementation, test, diagram, runbook or explanation you can defend.</p></div><div class="sardine-assignments">'+shown.map(function(x){return '<label class="sardine-assignment"><input type="checkbox" data-aproject="'+x.pi+'" data-astage="'+x.i+'" '+(x.done?"checked":"")+'><div><b>'+esc(x.pr.title)+' • '+String(x.i+1).padStart(2,"0")+' '+esc(x.title)+'</b><p>'+esc(detail(x.pr,x.i))+'</p></div><em>'+esc(x.pr.stack[0])+'</em></label>';}).join("")+'</div>';
}
function projectById(id){return projects.find(function(x){return x.id===id;});}
function coverageScore(ids){
 var ps=ids.split(",").map(function(x){return projectById(x);}).filter(Boolean);
 return ps.length?Math.round(ps.reduce(function(n,x){return n+score(x);},0)/ps.length):0;
}
function coverageView(pr){
 return hero(pr,"JOB DESCRIPTION COVERAGE")+'<div class="sardine-coverage">'+coverage.map(function(c){var v=coverageScore(c[1]);return '<div class="sardine-coverage-row"><div><b>'+esc(c[0])+'</b><em>'+v+'%</em></div><span style="font-size:6px;color:#788ea8">'+esc(c[2])+'</span><div class="sardine-track"><i style="width:'+v+'%"></i></div></div>';}).join("")+'</div><div class="sardine-block"><b>ROLE STANDARD</b><p>Ready means you can build it, break/fix it, prove correctness, defend tradeoffs, explain it to fraud/backend/DS/compliance/leadership, and only then move to live GCP practice.</p></div>';
}
function liveView(pr){
 var ok=graduated(pr);
 return hero(pr,"LIVE PRACTICUM GATE")+'<div class="sardine-live '+(ok?"":"locked")+'"><span class="micro">'+(ok?"SIMULATION GRADUATED":"LIVE LOCKED")+'</span><h4>'+(ok?"GCP/provider phase unlocked":"Finish the simulation first")+'</h4><p>'+(ok?"This project may now move into the real-provider layer. Start read-only, then isolated sandbox execution. Connector credentials remain server-side.":"Complete all 14 assignments and score ≥85 on the blind defense. Mock, incident and STAR scores improve readiness but cannot bypass the gate.")+'</p><div class="sardine-role-kpis"><div class="sardine-kpi"><span>ASSIGNMENTS</span><b>'+completed(pr)+'/14</b></div><div class="sardine-kpi"><span>DEFENSE</span><b>'+g(st.defense,pr)+'%</b></div></div><button id="sconnector" class="sardine-action" '+(ok?"":"disabled")+'>Check '+pr.liveProvider.toUpperCase()+' connector</button><div id="sliveResult" class="sardine-result">$ no provider action executed</div></div>';
}
function proof(pr){
 var gates=[
  ["End-to-end assignments",completed(pr)===14,completed(pr)+"/14","Artifacts across every production layer"],
  ["Blind defense",g(st.defense,pr)>=85,g(st.defense,pr)+"%","Server grade ≥85"],
  ["Stakeholder mock",g(st.mock,pr)>=85,g(st.mock,pr)+"%","Translate across audiences"],
  ["Break/fix",g(st.incident,pr)>=85,g(st.incident,pr)+"%","Diagnose + recover"],
  ["STAR",g(st.star,pr)>=85,g(st.star,pr)+"%","Evidence + tradeoff"],
  ["Live practicum",graduated(pr),graduated(pr)?"UNLOCK":"LOCK","14/14 + defense ≥85"]
 ];
 return '<aside class="sardine-proof glass"><div class="sardine-score"><span class="micro">PROJECT READINESS</span><strong>'+score(pr)+'%</strong><span>'+completed(pr)+'/14 assignments • defense '+g(st.defense,pr)+'% • '+(graduated(pr)?"graduated":"live locked")+'</span></div><div class="sardine-proof-list">'+gates.map(function(x){return '<div class="sardine-proof-row"><div><b>'+x[0]+'</b><span>'+x[3]+'</span></div><em>'+x[2]+'</em></div>';}).join("")+'</div><div class="sardine-artifacts"><span class="micro">PROJECT FILES / WHY</span>'+artifacts(pr).map(function(x){return '<div class="sardine-file"><code>'+esc(x[0])+'</code><span>'+esc(x[1])+'</span></div>';}).join("")+'</div><div class="sardine-talk"><span class="micro">BLIND ARCHITECTURE DEFENSE</span><textarea id="sdefense" placeholder="WHO, WHAT, WHERE, WHEN, WHY; realtime/batch; correctness; latency; failure; security; cost; rollback; tradeoff..."></textarea><button id="gradeSDefense">Grade on real server</button><div id="sdefenseResult" class="sardine-result">Live requires 14/14 + defense ≥85.</div></div></aside>';
}
function main(pr){
 var map={mission:mission,fivew:fivew,mock:mock,patterns:patternView,incident:incidentView,model:modelView,tradeoffs:tradeView,star:starView,thesaurus:thesaurusView,assignments:assignmentView,coverage:coverageView,live:liveView};
 var fn=map[st.mode]||mission;
 return '<section class="sardine-main glass">'+fn(pr)+'</section>';
}
async function serverGrade(text,keys,type){
 if(!B)throw new Error("Backend grader unavailable");
 return B.grade(text,keys,{type:type,blind:true,duration_ms:120000});
}
function wire(pr){
 $$("[data-smode]").forEach(function(b){b.onclick=function(){st.mode=b.dataset.smode;save();render();};});
 $$("[data-sproject]").forEach(function(b){b.onclick=function(){st.project=+b.dataset.sproject;st.mode="mission";save();render();};});
 $$("[data-scheck]").forEach(function(b){b.onchange=function(){st.checks[checkKey(pr,+b.dataset.scheck)]=b.checked;save();render();};});

 var defenseBtn=$("#gradeSDefense");
 if(defenseBtn)defenseBtn.onclick=async function(){
  var t=$("#sdefense").value.trim(),o=$("#sdefenseResult");
  if(!t){CO.toast("Defend the project first");return;}
  o.textContent="Scoring...";
  try{
   var keys=pr.patterns.map(function(x){return x.replace(/-/g," ");}).concat(["business","evidence","rollback","reconcile","tradeoff","latency","security"]);
   var r=await serverGrade(t,keys,"sardine-defense:"+pr.id);
   st.defense[pr.id]=r.score;save();
   o.textContent="SERVER DEFENSE "+r.score+"%\nrequest "+(r.request_id||"—")+"\n"+JSON.stringify(r.dimensions,null,2);
   setTimeout(render,450);
  }catch(e){o.textContent=JSON.stringify(e.data||{error:e.message},null,2);}
 };

 $$("[data-saud]").forEach(function(b){b.onclick=function(){st.audience=b.dataset.saud;save();render();};});
 var mockBtn=$("#gradeSMock");
 if(mockBtn)mockBtn.onclick=async function(){
  var t=$("#smock").value.trim(),o=$("#smockResult");
  if(!t){CO.toast("Answer first");return;}
  o.textContent="Scoring...";
  try{
   var r=await serverGrade(t,talkKeys(st.audience),"sardine-mock:"+pr.id+":"+st.audience);
   st.mock[pr.id]=Math.max(g(st.mock,pr),r.score);save();
   o.textContent="DISCUSSION "+r.score+"%\n"+JSON.stringify(r.dimensions,null,2);
  }catch(e){o.textContent=JSON.stringify(e.data||{error:e.message},null,2);}
 };

 $$("[data-pchoice]").forEach(function(b){b.onclick=function(){
  var q=patternQuestion(pr),good=b.dataset.pchoice===q.correct.id;
  st.pattern.total++;if(good)st.pattern.right++;save();
  $$("[data-pchoice]").forEach(function(x){x.disabled=true;if(x.dataset.pchoice===q.correct.id)x.classList.add("correct");else if(x===b&&!good)x.classList.add("wrong");});
  $("#spatResult").textContent=(good?"CORRECT — ":"MISS — ")+q.correct.name+": "+q.correct.meaning+" • "+st.pattern.right+"/"+st.pattern.total;
 };});
 var nextPat=$("#nextSPat");if(nextPat)nextPat.onclick=function(){st.pattern.index=(st.pattern.index+1)%pr.patterns.length;save();render();};

 var incBtn=$("#gradeSIncident");
 if(incBtn)incBtn.onclick=async function(){
  var t=$("#sincident").value.trim(),o=$("#sincidentResult");
  if(!t){CO.toast("Command the incident first");return;}
  o.textContent="Scoring...";
  try{
   var keys=pr.patterns.map(function(x){return x.replace(/-/g," ");}).concat(["scope","evidence","rollback","reconcile","resume"]);
   var r=await serverGrade(t,keys,"sardine-incident:"+pr.id);
   st.incident[pr.id]=r.score;save();
   o.textContent="INCIDENT "+r.score+"%\n"+JSON.stringify(r.dimensions,null,2);
  }catch(e){o.textContent=JSON.stringify(e.data||{error:e.message},null,2);}
 };
 var reveal=$("#revealSIncident");if(reveal)reveal.onclick=function(){$("#sincidentRef").style.display="block";};

 var starBtn=$("#gradeSStar");
 if(starBtn)starBtn.onclick=async function(){
  var t=$("#sstar").value.trim(),o=$("#sstarResult");
  if(!t){CO.toast("Tell the STAR story first");return;}
  o.textContent="Scoring...";
  try{
   var r=await serverGrade(t,["situation","task","action","result","because","metric","tradeoff","evidence"],"sardine-star:"+pr.id);
   st.star[pr.id]=r.score;save();
   o.textContent="STAR "+r.score+"%\n"+JSON.stringify(r.dimensions,null,2);
  }catch(e){o.textContent=JSON.stringify(e.data||{error:e.message},null,2);}
 };

 var search=$("#stermSearch");
 if(search)search.oninput=function(){
  var q=search.value.toLowerCase();
  $$("[data-tcard]").forEach(function(card){var t=terms[+card.dataset.tcard];card.style.display=(t.term+" "+t.natural+" "+t.contrast+" "+t.use).toLowerCase().indexOf(q)>=0?"":"none";});
 };
 $$("[data-tmaster]").forEach(function(b){b.onchange=function(){st.vocab[terms[+b.dataset.tmaster].term]=b.checked;save();};});
 $$("[data-afilter]").forEach(function(b){b.onclick=function(){st.assignmentFilter=b.dataset.afilter;save();render();};});
 $$("[data-aproject]").forEach(function(b){b.onchange=function(){var pr2=projects[+b.dataset.aproject];st.checks[checkKey(pr2,+b.dataset.astage)]=b.checked;save();render();};});

 var conn=$("#sconnector");
 if(conn)conn.onclick=async function(){
  var o=$("#sliveResult");o.textContent="$ checking connector registry...";
  try{
   if(!B||!B.connectorStatus)throw new Error("Connector registry unavailable");
   var r=await B.connectorStatus(),c=r.connectors&&r.connectors[pr.liveProvider];
   o.textContent=JSON.stringify({provider:pr.liveProvider,configured:c&&c.configured,validated:c&&c.validated,mode:c&&c.mode,required:c&&c.required,safety:r.safety},null,2);
  }catch(e){o.textContent=JSON.stringify(e.data||{error:e.message},null,2);}
 };
}
function render(){
 var root=$("#view-sardine");
 if(!root)return;
 var pr=current();
 root.innerHTML='<div class="view-heading"><div><span class="micro">ROLE-SPECIFIC PRODUCTION CAMPAIGN</span><h2>Sardine Senior Data / ML Engineer Forge</h2><p>Fraud data + ML ownership: ingestion → feature platform → model → low-latency decision → feedback → governance → recovery → stakeholder defense.</p></div><span class="enterprise-badge">25 PROJECTS • 350 ASSIGNMENTS • 64 PATTERNS</span></div>'+modeBar()+'<div class="sardine-shell">'+sidebar()+main(pr)+proof(pr)+'</div>';
 wire(pr);
}
function install(){
 var nav=$("#nav"),work=$("#workspace");
 if(!nav||!work)return;
 var b=document.createElement("button");
 b.className="nav-item";b.dataset.view="sardine";b.innerHTML="<span>◉</span><b>Sardine Mission Forge</b><em>25</em>";
 b.onclick=function(){CO.setView("sardine");$("#pageTitle").textContent="Sardine Senior Data / ML Engineer Forge";render();};
 nav.appendChild(b);
 var sec=document.createElement("section");sec.className="view";sec.id="view-sardine";work.appendChild(sec);
 render();
}
window.CloudOdysseySardine={projects:projects,patterns:patterns,terms:terms,getState:function(){return st;},render:render,score:roleScore};
install();
})();