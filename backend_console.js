(function(){
"use strict";
if(!window.CloudOdyssey||!window.CloudOdysseyBackend){console.error("Backend console dependencies missing");return;}
var CO=window.CloudOdyssey,B=window.CloudOdysseyBackend,$=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>Array.from((r||document).querySelectorAll(s));
var last=null;
function pretty(x){return JSON.stringify(x,null,2);}
function log(x){last=x;var el=$("#backendOutput");if(el)el.textContent=pretty(x);}
function healthClass(h){return h&&h.ok?"good":"warn";}
async function runHealth(){log({action:"GET /api/v1/health",state:"loading"});log(await B.health(true));render();}
async function runSmoke(){log({action:"GET /api/v1/smoke",state:"loading"});try{log(await B.request("smoke"));}catch(e){log(e.data||{ok:false,error:e.message});}}
async function runPlan(){log({action:"POST /api/v1/recommendations",state:"loading"});try{log(await B.recommendations(45));}catch(e){log(e.data||{ok:false,error:e.message});}}
async function runGrade(){
 var text=$("#backendGradeText").value.trim();if(!text){CO.toast("Write an answer first");return;}
 log({action:"POST /api/v1/assessments/grade",state:"loading"});
 try{log(await B.grade(text,["idempotency","evidence","rollback","reconcile","least privilege"],{type:"control-plane-smoke",blind:true,duration_ms:60000}));}
 catch(e){log(e.data||{ok:false,error:e.message});}
}
async function runSync(){log({action:"PUT /api/v1/progress",state:"loading"});try{log(await B.syncProgress());}catch(e){log(e.data||{ok:false,error:e.message});}}
async function runEvent(){log({action:"POST /api/v1/events",state:"loading"});try{log(await B.emit("backend.console.test",{view:"backend",at:new Date().toISOString()}));}catch(e){log(e.data||{ok:false,error:e.message});}}
function routes(){
 return [
  ["GET","/api/v1/health","Runtime + DB + signing health","REAL"],
  ["GET","/api/v1/capabilities","Architecture/capability contract","REAL"],
  ["GET","/api/v1/smoke","Server-side scoring/recommendation diagnostic","REAL"],
  ["POST","/api/v1/recommendations","Adaptive next-best-practice policy","REAL"],
  ["POST","/api/v1/assessments/grade","Server grading + receipt/hash","REAL"],
  ["POST","/api/v1/events","Idempotent append-only event store","DB"],
  ["GET/PUT","/api/v1/progress","Versioned proficiency snapshots","DB"],
  ["POST","/api/v1/evidence","Evidence SHA-256 provenance","DB"]
 ];
}
function render(){
 var root=$("#view-backend");if(!root)return;
 var h=B.health?null:null;
 Promise.resolve(B.health()).then(function(hh){
  var db=hh&&hh.persistence||{},cap=hh&&hh.capabilities||{};
  root.innerHTML='<div class="view-heading"><div><span class="micro">REAL SERVER-SIDE ENGINEERING</span><h2>Backend Control Plane</h2><p>Operate the same backend patterns expected in a serious SaaS/data platform: contracts, idempotency, persistence, verification, adaptive policy, provenance and observability.</p></div><span class="enterprise-badge">NODE 24 • POSTGRES-READY • VERSIONED API</span></div>'+
  '<div class="backend-shell"><aside class="backend-side glass"><div class="backend-head"><span class="micro">LIVE HEALTH</span><h3>Control plane</h3><p>These values come from the deployed Vercel Function, not localStorage.</p></div>'+
  '<div class="backend-status"><div class="backend-stat '+healthClass(hh)+'"><span>API</span><b>'+(hh&&hh.ok?"ONLINE":"OFFLINE")+'</b></div>'+
  '<div class="backend-stat '+(db.ok?"good":"warn")+'"><span>POSTGRES</span><b>'+(db.ok?"CONNECTED":db.configured?"ERROR":"NOT CONNECTED")+'</b></div>'+
  '<div class="backend-stat"><span>RUNTIME</span><b>'+((hh&&hh.runtime)||"—")+'</b></div>'+
  '<div class="backend-stat"><span>COMMIT</span><b>'+((hh&&hh.commit)||"—")+'</b></div>'+
  '<div class="backend-stat '+(hh&&hh.verification&&hh.verification.assessment_signing?"good":"warn")+'"><span>RECEIPTS</span><b>'+(hh&&hh.verification&&hh.verification.assessment_signing?"SIGNED":"UNSIGNED")+'</b></div>'+
  '<div class="backend-stat"><span>CLIENT</span><b>'+B.clientId().slice(0,8)+'</b></div></div>'+
  '<div class="backend-actions"><button class="primary" id="backendHealth">↻ Refresh live backend</button><button id="backendSmoke">✓ Run server smoke test</button><button id="backendPlan">✦ Generate adaptive plan</button><button id="backendSync">⇅ Sync proficiency snapshot</button><button id="backendEvent">＋ Emit idempotent event</button></div></aside>'+
  '<section class="backend-main glass"><div class="backend-arch"><span class="micro">REFERENCE REQUEST PATH</span><div class="backend-flow">'+
  [['Browser','client + local evidence'],['Vercel Function','contract + request ID'],['Policy Engine','grade / recommend'],['Postgres','events + snapshots'],['Receipt','hash + HMAC']].map(function(x,i){return '<div class="backend-node"><b>'+x[0]+'</b><span>'+x[1]+'</span></div>'+(i<4?'<div class="backend-arrow">→</div>':'');}).join("")+
  '</div></div><div class="backend-route-list">'+routes().map(function(r){return '<div class="backend-route"><code>'+r[0]+'</code><div><b>'+r[1]+'</b><span>'+r[2]+'</span></div><em>'+r[3]+'</em></div>';}).join("")+'</div>'+
  '<div class="backend-console"><div class="backend-console-head"><span>LIVE API OUTPUT</span><span>request IDs + structured response</span></div><pre id="backendOutput">'+pretty(last||hh)+'</pre></div></section>'+
  '<aside class="backend-observe glass"><div class="backend-head"><span class="micro">ADVANCED BACKEND PATTERNS</span><h3>What the engineer must explain</h3><p>These are architecture decisions, not vocabulary flashcards.</p></div><div class="backend-patterns">'+[
   ["Idempotency","Mutating event APIs require an Idempotency-Key and enforce uniqueness in Postgres."],
   ["Append-only evidence","Learning events are immutable facts; current proficiency is stored separately as versioned snapshots."],
   ["Privacy by design","Assessment answers/evidence can be hashed; the database need not retain raw content to prove provenance."],
   ["Tamper evidence","Verified attempts can receive an HMAC-signed receipt over score, rubric, dimensions and answer hash."],
   ["Queue + outbox foundation","The schema includes durable job and transactional-outbox primitives for future async work."],
   ["Observability","Every Function emits structured JSON with request ID, method, path, status and duration."],
   ["Graceful capability degradation","Stateless grading/recommendations stay live even when persistence is not configured."]
  ].map(function(x){return '<div class="backend-pattern"><b>'+x[0]+'</b><p>'+x[1]+'</p></div>';}).join("")+'</div>'+
  '<div class="backend-test"><span class="micro">REAL SERVER-SIDE GRADING TEST</span><textarea id="backendGradeText">I would make the command idempotent because retries must converge on one business effect. I would preserve source evidence, reconcile counts and keys before publication, monitor an SLO, and keep a known-good rollback path. Instead of assuming job success means correctness, I would validate business state and least-privilege access.</textarea><button id="backendGrade">Grade on server + generate receipt</button></div></aside></div>';
  $("#backendHealth").onclick=runHealth;$("#backendSmoke").onclick=runSmoke;$("#backendPlan").onclick=runPlan;$("#backendSync").onclick=runSync;$("#backendEvent").onclick=runEvent;$("#backendGrade").onclick=runGrade;
 });
}
function install(){
 var nav=$("#nav"),work=$("#workspace");if(!nav||!work)return;
 var b=document.createElement("button");b.className="nav-item";b.dataset.view="backend";b.innerHTML="<span>⬡</span><b>Backend Control Plane</b><em>22</em>";
 b.onclick=function(){CO.setView("backend");$("#pageTitle").textContent="Backend Control Plane";render();};nav.appendChild(b);
 var sec=document.createElement("section");sec.className="view";sec.id="view-backend";work.appendChild(sec);render();
}
window.CloudOdysseyBackendConsole={render:render};
install();
})();