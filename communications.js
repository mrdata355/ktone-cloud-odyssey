
(function(){
"use strict";
if(!window.CloudOdyssey){console.error("Stakeholder Room requires CloudOdyssey");return;}
var CO=window.CloudOdyssey, KEY="cloud_odyssey_comms_v1";
var state=Object.assign({audience:"shareholder",context:"active",tab:"talk",scores:{},answers:{}},JSON.parse(localStorage.getItem(KEY)||"{}"));
var $=function(s,r){return (r||document).querySelector(s);};
var $$=function(s,r){return Array.prototype.slice.call((r||document).querySelectorAll(s));};
var save=function(){localStorage.setItem(KEY,JSON.stringify(state));};
var esc=function(s){return String(s||"").replace(/[&<>"]/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;"}[c];});};

var audiences={
shareholder:{icon:"◆",name:"Shareholder / Executive",tag:"VALUE",cares:["Business outcome","Revenue / cost","Risk exposure","Speed to value","Customer trust"],avoid:["Framework names first","Implementation detail before outcome","Technical green without business proof"],ask:["What changed for the business?","What risk did this remove?","How do we know it worked?","What did it cost?","What happens if it fails again?"],keys:["business","risk","cost","customer","proof","result"]},
product:{icon:"◉",name:"Product / Data Product",tag:"OUTCOME",cares:["User outcome","Acceptance criteria","Dependencies","Release scope","Roadmap"],avoid:["Only schemas and code","Ignoring user-visible failures","No definition of done"],ask:["What user problem did this solve?","What defines done?","What can delay release?","What is rollback behavior?"],keys:["user","acceptance","metric","dependency","release","rollback"]},
architect:{icon:"⬡",name:"Data Architect",tag:"DESIGN",cares:["Boundaries","Contracts / grain","Lineage","State ownership","Failure domains"],avoid:["Service lists without boundaries","Mixed identities","Hidden authoritative state"],ask:["What is system of record?","Where is the boundary?","What is the business key?","How do retries converge?"],keys:["boundary","grain","key","lineage","state","contract"]},
dataeng:{icon:"⌘",name:"Data Engineering",tag:"PIPELINES",cares:["Source contracts","Replay","Stateful processing","Data quality","Backfill"],avoid:["Hand-wave late data","Batch ID as business ID","Full-history incident scans"],ask:["What is source grain?","How do we replay safely?","Checkpoint strategy?","How are bad records handled?"],keys:["source","grain","replay","checkpoint","quarantine","backfill"]},
analytics:{icon:"▥",name:"Analytics / BI",tag:"SEMANTICS",cares:["Metric definitions","Fact grain","Dimensions","Reconciliation","Freshness"],avoid:["Raw incident state","Silent metric changes","Partial publication"],ask:["Which metric changed?","What is the grain?","How did you reconcile totals?","When is data certified?"],keys:["metric","grain","reconcile","dimension","freshness","certified"]},
datascience:{icon:"∿",name:"Data Science",tag:"MODELING",cares:["Features","Labels","Leakage","Experiment design","Slices"],avoid:["Future-data leakage","Aggregate metrics only","Lost experiment lineage"],ask:["How did you prevent leakage?","What is the label?","Which slices regressed?","Can I reproduce training?"],keys:["feature","label","leakage","slice","experiment","reproduce"]},
mleng:{icon:"⚙",name:"ML Engineering",tag:"SERVING",cares:["Feature parity","Inference latency","Serving contracts","Fallback"],avoid:["Separate train/serve logic","Ignored latency budgets","No stale-feature behavior"],ask:["How do offline/online stay aligned?","Serving SLO?","What if features are stale?","Safe fallback?"],keys:["feature","online","offline","latency","serving","fallback"]},
mlops:{icon:"◇",name:"MLOps / Model Platform",tag:"LIFECYCLE",cares:["Experiment lineage","Registry","Promotion","Rollback","Drift"],avoid:["Newest model wins","Retrain on every drift","No model/data binding"],ask:["Why promoted?","What blocks promotion?","How rollback?","Which drift triggers action?"],keys:["registry","promotion","rollback","drift","lineage","version"]},
platform:{icon:"▣",name:"Platform / DevOps / SRE",tag:"RELIABILITY",cares:["SLOs","Error budgets","Deployment","Observability","Recovery"],avoid:["Job success equals business success","Restart before evidence","Ignore commit ambiguity"],ask:["What SLO was at risk?","Blast radius?","What survives restart?","How rollback?"],keys:["slo","blast","observability","rollback","alert","recovery"]},
governance:{icon:"▤",name:"Governance / Security",tag:"CONTROL",cares:["RBAC","PII","Audit","Lineage","Tenant isolation"],avoid:["Broad admin proof","Raw rejects to readers","Secrets in logs"],ask:["Who sees Raw?","How tenant isolation?","What is audit trail?","Can roles bypass certified data?"],keys:["rbac","role","tenant","audit","lineage","pii"]},
quality:{icon:"✓",name:"Data Quality / QA",tag:"EVIDENCE",cares:["Acceptance","Edge cases","Determinism","Failure injection","Regression"],avoid:["Happy path only","Zero rows means complete","No rerun test"],ask:["Pass/fail gates?","Which failures injected?","Does rerun stay identical?","How prove completeness?"],keys:["test","acceptance","failure","deterministic","complete","regression"]},
finops:{icon:"$",name:"Finance / FinOps",tag:"ECONOMICS",cares:["Cloud spend","Unit cost","Scan efficiency","Budget","ROI"],avoid:["Unmeasured claims","Hidden serverless cost","Scale before pruning"],ask:["Recovery cost?","Cost per 1K?","Why scan changed?","Budget guardrail?"],keys:["cost","credits","scan","budget","warehouse","roi"]},
operations:{icon:"!",name:"Business Operations",tag:"RUNBOOK",cares:["Continuity","Fallback","Escalation","Recovery time","Ownership"],avoid:["Code-only status","No runbook","Partial state hidden"],ask:["What do I do on alert?","Who owns next step?","Safe fallback?","How know data is trusted?"],keys:["runbook","owner","fallback","recovery","customer","certified"]}
};

function getContext(){
 var s=CO.getState(), a=s.active;
 if(state.context==="enterprise")return {name:"Campaign Writeback Recovery",world:"Enterprise Recovery",skill:"Distributed business-state recovery",stack:["Databricks CDF","Snowflake","Segment","Legacy CRM"],risk:"Promotion state diverged across source history, authorization history, external destinations and certified analytics.",task:"Recover source continuity, authorization-before-send, idempotent external effects, reconciliation, access controls and certified publication."};
 if(state.context.indexOf("world-")===0){
  var wi=+state.context.split("-")[1],w=CO.worlds[wi];
  return {name:w.name+" program",world:w.name,skill:w.skills.join(" / "),stack:w.stack,risk:"This domain can fail through replay, contract drift, partial state, weak observability or unsafe releases.",task:"Operate "+w.desc.toLowerCase()+" with deterministic state, automated validation, observability and recovery."};
 }
 if(a){
  var aw=CO.worlds[a.w],m=aw.missions[a.m];
  return {name:m.title,world:aw.name,skill:aw.skills[a.m],stack:aw.stack,risk:m.risk,task:m.task};
 }
 var w0=CO.worlds[0],m0=w0.missions[0];
 return {name:m0.title,world:w0.name,skill:w0.skills[0],stack:w0.stack,risk:m0.risk,task:m0.task};
}
function impact(c){
 var x=(c.world+" "+c.skill+" "+c.risk).toLowerCase();
 if(/inventory|reservation|ingestion|stream/.test(x))return "Protects booking and inventory truth, reducing duplicate or missing reservation effects.";
 if(/forecast/.test(x))return "Improves staffing and occupancy decisions with measurable forecast quality.";
 if(/customer/.test(x))return "Gives sales, service and analytics one trusted customer view.";
 if(/feature|model|mlflow|ml /.test(x))return "Reduces model-production risk through governed features, lineage, monitoring and rollback.";
 if(/rag|knowledge|ai/.test(x))return "Reduces incorrect AI answers by grounding them in governed evidence.";
 return "Improves reliability, auditability and decision trust while reducing operational rework.";
}
function metrics(a){
 var m={
 shareholder:["Business KPI","Incident/rework risk","Cloud/unit cost","Recovery time"],
 product:["Outcome KPI","Acceptance pass rate","Release lead time","Defect escape"],
 architect:["Contract violations","Lineage completeness","State divergence","Recovery boundaries"],
 dataeng:["Freshness","Replay/duplicate rate","DQ failures","Backfill time"],
 analytics:["Reconciliation delta","Freshness","Metric consistency","Certified coverage"],
 datascience:["Model metric","Slice error","Leakage checks","Feature stability"],
 mleng:["p95 latency","Feature parity","Feature freshness","Serving errors"],
 mlops:["Promotion gates","Drift by slice","Rollback RTO","Reproducibility"],
 platform:["SLO/error budget","MTTR","Alert lead time","Capacity"],
 governance:["Unauthorized tests","Lineage coverage","PII exposure","Audit completeness"],
 quality:["Acceptance gates","Regression pass rate","Failure coverage","Deterministic rerun"],
 finops:["Credits/cost","Bytes scanned","Cost per 1K","Utilization"],
 operations:["Business downtime","Recovery ETA","Manual exceptions","Runbook completion"]
 };
 return m[a]||m.dataeng;
}
function summary(a,c){
 var A=audiences[a], imp=impact(c), common="Declared identity/grain → deterministic processing → tests → observability → reconciliation → rollback.";
 var map={
 shareholder:["Outcome",imp,"Risk","Incorrect or duplicated state reaching business decisions.","Proof",common,"Ask","Align on acceptance and risk tolerance."],
 product:["User outcome",imp,"Definition of done","Reconciled, observable, reversible and accepted.","Dependency","Source/downstream contracts and release ownership.","Ask","Confirm acceptance metrics."],
 architect:["Design","Authoritative state and boundaries are explicit.","Risk","Ambiguous ownership creates divergent state.","Proof","Keys, contracts, lineage, failure domains.","Ask","Validate system of record."],
 dataeng:["Pipeline","Bounded source → validation → durable state → certified publish.","Risk","Replay, late data and schema drift.","Proof","Contracts, checkpoints, idempotency, reconciliation.","Ask","Confirm source and replay ownership."],
 analytics:["Semantic output","Only reconciled/certified data reaches BI.","Risk","Partial or stale data changes metrics silently.","Proof","Fact grain, dimensions, freshness and reconciliation.","Ask","Confirm KPI definitions."],
 datascience:["Model data","Features and labels preserve time correctness.","Risk","Leakage or slice regression creates false confidence.","Proof","Feature/label contracts, backtests, slices.","Ask","Confirm evaluation slices."],
 mleng:["Serving","Offline and online behavior stays aligned.","Risk","Training-serving skew or stale features.","Proof","Parity, latency, freshness and fallback.","Ask","Confirm SLO/fallback."],
 mlops:["Lifecycle","Models are tracked, gated, monitored and reversible.","Risk","Uncontrolled promotion or retraining.","Proof","Registry, lineage, drift policy, rollback.","Ask","Confirm promotion owner."],
 platform:["Reliability","SLOs, evidence, recovery and rollback are explicit.","Risk","Local success hides downstream failure.","Proof","Traces, error budget, runbook, known-good release.","Ask","Confirm on-call/RTO."],
 governance:["Control","Only authorized principals see needed data.","Risk","Raw/recovery data crosses tenant or role boundaries.","Proof","RBAC, tenant filters, audit and negative tests.","Ask","Approve role/retention policy."],
 quality:["Validation","Correctness is encoded in permanent gates.","Risk","Happy-path tests miss retries/conflicts/timeouts.","Proof","Failure injection and deterministic fixtures.","Ask","Agree must-pass gates."],
 finops:["Economics","Bound the work before scaling compute.","Risk","Brute-force scans inflate cost without correctness.","Proof","Bytes, credits, unit cost, utilization.","Ask","Confirm budget ceiling."],
 operations:["Runbook","Detect → scope → recover → validate → escalate.","Risk","Technical recovery leaves partial business state.","Proof","Business reconciliation and certified signal.","Ask","Confirm escalation/fallback."]
 };
 return map[a]||map.dataeng;
}
function talk(a,c,len){
 var A=audiences[a], imp=impact(c), ms=metrics(a).join(", ");
 if(len==="30"){
  if(a==="shareholder")return "I fixed a production reliability problem in "+c.world+" so the business does not act on missing, duplicated, or unverified data. I made retries deterministic, added measurable acceptance and recovery controls, and tied technical completion to business reconciliation. The outcome is lower incident risk, faster recovery, and more trustworthy decisions.";
  return "In "+c.world+", I "+c.task.charAt(0).toLowerCase()+c.task.slice(1)+" I used "+c.skill+" because it gives us a deterministic, testable production contract instead of relying on happy-path success. I proved it with tests, observability, reconciliation and rollback evidence. For "+A.name+", the key outcome is "+imp;
 }
 if(len==="90")return "The problem was: "+c.risk+" My responsibility was to "+c.task.charAt(0).toLowerCase()+c.task.slice(1)+" The main design decision was where the authoritative state and failure boundary live, not just which tool to use. I used "+c.skill+" across "+c.stack.join(", ")+" with stable identity, deterministic retry/replay behavior, explicit validation, observability and a recovery path. I did not treat a green job as proof that the business result was correct; I reconciled downstream state before certification. For "+A.name+", the important outcome is "+imp+" I would prove it with "+ms+".";
 return "Problem\n• "+c.risk+"\n\nWhat I changed\n• "+c.task+"\n• Pattern: "+c.skill+"\n• Platform: "+c.stack.join(" → ")+"\n\nWhy\n• Declared identity/grain and authoritative state first.\n• Made retry, replay and partial failure deterministic.\n• Kept rejected/uncertain work observable.\n• Published only after reconciliation and acceptance gates.\n\nWhat this audience cares about\n• "+A.cares.join("\n• ")+"\n\nEvidence\n• "+metrics(a).join("\n• ")+"\n\nBusiness impact\n• "+imp+"\n\nHandoff\n• Owners, contracts, dashboards, alerts, runbook, rollback target and open risks.";
}
function handoff(a){
 var maps={
 shareholder:[["Decision memo","Problem, investment, result, residual risk."],["KPI snapshot","Business KPI, reliability, cost, recovery."],["Risk register","Remaining failure modes and controls."],["Next decision","Scale, pause or fund next control."]],
 product:[["Acceptance criteria","User/business outcomes that define done."],["Dependency map","Upstream/downstream contracts."],["Release notes","What changed and user impact."],["Rollback behavior","What product does after reversal."]],
 architect:[["Architecture diagram","State, boundaries, ownership."],["ADR","Chosen method vs rejected alternatives."],["Lineage map","Source to certified consumer."],["Failure model","Retries, replay, partial commits."]],
 dataeng:[["Source contract","Grain, schema, keys, replay."],["Pipeline DAG","Checkpoints, quarantine, gates."],["Reconciliation SQL","Expected vs actual state."],["Backfill runbook","Bounded ranges and validation."]],
 analytics:[["Metric contract","Grain, dimensions, exclusions."],["Certified model","Safe tables/views."],["Freshness SLA","When metrics are current."],["Reconciliation report","Source vs semantic totals."]],
 datascience:[["Feature spec","Definition, time semantics, owner."],["Label spec","Outcome and leakage boundary."],["Evaluation report","Overall + slices."],["Dataset lineage","Exact reproducible data versions."]],
 mleng:[["Serving contract","Input/output + latency/error SLO."],["Parity suite","Offline/online equivalence."],["Fallback plan","Stale/missing feature behavior."],["Load profile","Throughput and saturation."]],
 mlops:[["MLflow lineage","Run/data/code/artifacts."],["Promotion policy","Gates and approvals."],["Rollback target","Last-known-good activation."],["Drift policy","Signal → action."]],
 platform:[["SLO dashboard","Freshness, latency, errors, backlog."],["Alert map","Signal → owner → action."],["Runbook","Triage to validation."],["Capacity plan","Peak/degraded behavior."]],
 governance:[["RBAC matrix","Principal → object → privilege."],["Classification","Sensitive fields and movement."],["Audit evidence","Access/query/release history."],["Retention","Evidence lifecycle."]],
 quality:[["Acceptance matrix","Requirement → test → evidence."],["Failure matrix","Replay, timeout, conflict, rerun."],["Regression suite","Incident lesson → permanent test."],["Certification report","All gates present/current."]],
 finops:[["Cost profile","Warehouse/serverless/API attribution."],["Efficiency","Scan, spill, queue, utilization."],["Budget guardrail","Stop/alert threshold."],["Unit economics","Cost per 1K events/keys."]],
 operations:[["Runbook","Detect to escalate."],["Ownership","Primary and backup."],["Fallback","Safe degraded mode."],["Trust signal","How certified state is known."]]
 };
 return maps[a]||maps.dataeng;
}
function practicePrompt(a){
 var q={
 shareholder:"Explain what you changed, why it matters, how you know it worked, and what risk remains.",
 product:"Explain why a green pipeline is not enough to ship and define done.",
 architect:"Defend authoritative state and failure/transaction boundaries.",
 dataeng:"Explain replay/backfill and why it cannot double-count.",
 analytics:"Explain how metrics remain correct during corrections and late data.",
 datascience:"Explain leakage prevention and reproducibility.",
 mleng:"Explain training-serving parity and stale-feature fallback.",
 mlops:"Explain promotion/rollback and why drift alone does not mean retrain.",
 platform:"Explain SLO, blast radius, evidence preservation and recovery.",
 governance:"Explain Raw access and tenant-safe proof.",
 quality:"Explain failure injection and rerun safety.",
 finops:"Explain bounded scans before scale and cost proof.",
 operations:"Explain operator steps until business state is trustworthy."
 };
 return q[a]||q.dataeng;
}
function grade(a,text){
 var low=text.toLowerCase(), hits=audiences[a].keys.map(function(k){return [k,low.indexOf(k)>=0];});
 var score=Math.round(hits.filter(function(x){return x[1];}).length/hits.length*65)+Math.min(20,Math.floor(text.length/70));
 if(/why|because|so that|therefore/.test(low))score+=5;
 if(/proof|metric|reconcile|validate|evidence/.test(low))score+=5;
 if(/risk|rollback|recover|fail/.test(low))score+=5;
 return {score:Math.min(100,score),hits:hits,ts:Date.now()};
}
function questions(a,c){
 return audiences[a].ask.map(function(q){return [q,"I would answer this using the declared "+c.skill+" contract, show "+metrics(a).slice(0,2).join(" and ")+", then connect it to "+impact(c).toLowerCase()];});
}
function teamMap(c){
 var lines={
 shareholder:"Translate engineering into value, risk, cost and proof.",
 product:"Align data behavior to acceptance criteria and outcomes.",
 architect:"Own state boundaries, contracts and failure model.",
 dataeng:"Own source, replay/backfill, state and quality behavior.",
 analytics:"Own semantic grain, metrics, freshness and reconciliation.",
 datascience:"Own features, labels, leakage and evaluation.",
 mleng:"Own serving parity, latency, freshness and fallback.",
 mlops:"Own lineage, promotion, drift and rollback.",
 platform:"Own SLOs, observability, capacity and recovery.",
 governance:"Own access, tenant boundaries, audit and retention.",
 quality:"Turn requirements/incidents into permanent tests.",
 finops:"Make cost and performance measurable.",
 operations:"Turn recovery into a usable runbook and trust signal."
 };
 return Object.keys(audiences).map(function(k){var A=audiences[k];return '<div class="team-card"><b>'+A.icon+' '+A.name+'</b><span>'+A.tag+' • '+A.cares.slice(0,2).join(" / ")+'</span><p>'+lines[k]+'</p></div>';}).join("");
}
function contextOptions(){
 var x='<option value="active">Active mission</option><option value="enterprise">Enterprise recovery drill</option>';
 CO.worlds.forEach(function(w,i){x+='<option value="world-'+i+'">'+w.name+'</option>';});
 return x;
}
function practiceResult(a){
 var r=state.scores[a];
 if(!r)return '<div class="practice-score"><span>NO SCORE YET</span><div class="score">—</div><div class="practice-feedback"><div>Cover outcome, risk, proof and what this audience needs next.</div></div></div>';
 return '<div class="practice-score"><span>AUDIENCE FIT</span><div class="score">'+r.score+'%</div><div class="practice-feedback">'+r.hits.map(function(x){return '<div class="'+(x[1]?"hit":"miss")+'">'+(x[1]?"✓ ":"× ")+x[0]+'</div>';}).join("")+'</div></div>';
}
function render(){
 var root=$("#view-stakeholder"); if(!root)return;
 var c=getContext(),a=state.audience,A=audiences[a],s=summary(a,c),qs=questions(a,c);
 var cards="";
 for(var i=0;i<8;i+=2)cards+='<div class="summary-card"><span>'+esc(s[i])+'</span><b>'+esc(s[i+1])+'</b></div>';
 var tracks=["30","90","deep"].map(function(len){
  var label=len==="30"?"30-SECOND EXECUTIVE":len==="90"?"90-SECOND INTERVIEW":"DEEP-DIVE DESIGN REVIEW";
  return '<div class="talk-track" style="margin-bottom:8px"><div class="track-label"><span>'+label+'</span><button class="copy-btn" data-copy="'+len+'">Copy</button></div><p style="white-space:pre-line">'+esc(talk(a,c,len))+'</p></div>';
 }).join("");
 var hand=handoff(a).map(function(x){return '<article class="handoff-card"><h4>'+x[0]+'</h4><p>'+x[1]+'</p><code>Owner: '+A.name+' / Data Platform\nStatus: evidence required before close</code></article>';}).join("");
 var qhtml=qs.map(function(x,i){return '<article class="stake-question"><b>'+x[0]+'</b><p class="hidden" id="sq-'+i+'">'+esc(x[1])+'</p><button data-answer="'+i+'">Show answer</button></article>';}).join("");
 root.innerHTML='<div class="view-heading"><div><span class="micro">STAKEHOLDER TRANSLATION • TEAM HANDOFF</span><h2>Stakeholder Room</h2><p>Explain the same production work differently to executives, product, architects, data engineering, BI, data science, ML engineering, MLOps, SRE, governance, QA, FinOps and operations.</p></div><span class="enterprise-badge">AUDIENCE-AWARE</span></div>'+
 '<div class="stakeholder-shell"><aside class="stakeholder-sidebar glass"><div class="audience-list">'+Object.keys(audiences).map(function(k){var v=audiences[k];return '<button class="audience-btn '+(k===a?"active":"")+'" data-audience="'+k+'"><span class="aud-icon">'+v.icon+'</span><div><b>'+v.name+'</b><span>'+v.tag+'</span></div><em>→</em></button>';}).join("")+'</div><div class="context-selector"><span class="micro">PROJECT CONTEXT</span><select id="commsContext">'+contextOptions()+'</select></div></aside>'+
 '<section class="stakeholder-main glass"><div class="stakeholder-hero"><div class="role-line"><span class="enterprise-badge">'+A.icon+' '+A.name+'</span><span class="micro">'+c.world+' • '+c.skill+'</span></div><h2>'+c.name+'</h2><p>'+c.risk+'</p></div>'+
 '<div class="comms-tabs"><button class="comms-tab '+(state.tab==="talk"?"active":"")+'" data-tab="talk">Talk track</button><button class="comms-tab '+(state.tab==="translate"?"active":"")+'" data-tab="translate">Translate</button><button class="comms-tab '+(state.tab==="handoff"?"active":"")+'" data-tab="handoff">Handoff</button><button class="comms-tab '+(state.tab==="questions"?"active":"")+'" data-tab="questions">Questions</button><button class="comms-tab '+(state.tab==="map"?"active":"")+'" data-tab="map">Cross-team map</button></div>'+
 '<div class="comms-content"><div class="comms-pane '+(state.tab==="talk"?"active":"")+'">'+ '<div class="audience-summary">'+cards+'</div>'+tracks+'</div>'+
 '<div class="comms-pane '+(state.tab==="translate"?"active":"")+'"><div class="translation-grid"><article class="translation-card good"><h4>What they care about</h4><ul>'+A.cares.map(function(x){return "<li>"+x+"</li>";}).join("")+'</ul></article><article class="translation-card warn"><h4>Do not lead with</h4><ul>'+A.avoid.map(function(x){return "<li>"+x+"</li>";}).join("")+'</ul></article><article class="translation-card"><h4>Technical → team language</h4><ul><li><b>Technical:</b> '+esc(c.task)+'</li><li><b>Team outcome:</b> '+esc(s[1])+'</li><li><b>Risk:</b> '+esc(s[3])+'</li></ul></article><article class="translation-card"><h4>Proof they trust</h4><ul>'+metrics(a).map(function(x){return "<li>"+x+"</li>";}).join("")+'</ul></article></div></div>'+
 '<div class="comms-pane '+(state.tab==="handoff"?"active":"")+'"><div class="handoff-grid">'+hand+'</div></div>'+
 '<div class="comms-pane '+(state.tab==="questions"?"active":"")+'"><div class="question-list">'+qhtml+'</div></div>'+
 '<div class="comms-pane '+(state.tab==="map"?"active":"")+'"><div class="team-map">'+teamMap(c)+'</div></div></div></section>'+
 '<aside class="stakeholder-practice glass"><div class="practice-head"><span class="micro">MEETING SIMULATOR</span><h3>Practice speaking to '+A.name+'</h3></div><div class="practice-body"><div class="practice-prompt">'+practicePrompt(a)+'</div><textarea id="practiceAnswer" class="practice-answer" placeholder="Explain it in this audience\'s language...">'+esc(state.answers[a]||"")+'</textarea><div class="practice-actions"><button class="primary" id="gradeComms">Grade explanation</button><button id="loadModel">Load 90-sec model</button></div><div id="practiceResult">'+practiceResult(a)+'</div></div></aside></div>';
 $("#commsContext").value=state.context;
 $$("[data-audience]",root).forEach(function(b){b.onclick=function(){state.audience=b.dataset.audience;save();render();};});
 $("#commsContext").onchange=function(e){state.context=e.target.value;save();render();};
 $$("[data-tab]",root).forEach(function(b){b.onclick=function(){state.tab=b.dataset.tab;save();render();};});
 $$("[data-copy]",root).forEach(function(b){b.onclick=function(){navigator.clipboard&&navigator.clipboard.writeText(talk(a,c,b.dataset.copy));CO.toast("Copied");};});
 $$("[data-answer]",root).forEach(function(b){b.onclick=function(){var p=$("#sq-"+b.dataset.answer);p.classList.toggle("hidden");b.textContent=p.classList.contains("hidden")?"Show answer":"Hide answer";};});
 $("#gradeComms").onclick=function(){var text=$("#practiceAnswer").value;state.answers[a]=text;state.scores[a]=grade(a,text);save();render();CO.toast("Audience explanation scored "+state.scores[a].score+"%");};
 $("#loadModel").onclick=function(){$("#practiceAnswer").value=talk(a,c,"90");};
}
function install(){
 var nav=$("#nav"),work=$("#workspace");if(!nav||!work)return;
 var b=document.createElement("button");b.className="nav-item";b.dataset.view="stakeholder";b.innerHTML="<span>☍</span><b>Stakeholder Room</b><em>14</em>";
 b.onclick=function(){CO.setView("stakeholder");$("#pageTitle").textContent="Stakeholder Room";render();};nav.appendChild(b);
 var sec=document.createElement("section");sec.className="view";sec.id="view-stakeholder";work.appendChild(sec);render();
}
install();
})();