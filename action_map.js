
(function(){
"use strict";
if(!window.CloudOdyssey){console.error("Action Map requires CloudOdyssey");return;}
var CO=window.CloudOdyssey,D=document,$=(s,r=D)=>r.querySelector(s),$$=(s,r=D)=>Array.from((r||D).querySelectorAll(s));
var esc=s=>String(s||"").replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));

var actions=[
["Command Center","Resume active mission","nav","Opens the last active mission, or mission 1 if none exists.","No backend; updates local app view/state.","good"],
["Command Center","Explore worlds / View PROJECTS* / KPI action buttons","nav","Navigates to the requested module.","No backend call.","good"],
["Command Center","Give me a hint / Push me harder","local","Changes BYTE coaching text.","Local browser state only.","good"],
["Command Center","Quick Win / Build Something / Talk It Through / Break Production / Cloud Adventure / Explain My Work","nav","Routes you into the corresponding training mode.","No backend call.","good"],
["Command Center","Surprise me","local","Randomly selects a world + mission and opens it.","Local random selection; no backend.","good"],
["Command Center","Campaign Explore / Start quest","nav","Explore opens a world modal; Start quest opens that world's first mission.","Local UI/navigation only.","good"],
["Command Center","Telemetry Inspect / Diagnose","sim","Inspect explains a simulated signal; Diagnose routes to Incident War Room.","Telemetry values are simulated; no production telemetry backend.","warn"],
["World Map","− / 100% / +","local","Changes map zoom.","Browser visual state only.","good"],
["World Map","World card / Enter World / Revisit","nav","Opens the world's mission detail modal.","No backend call.","good"],
["World Map","Launch mission","nav","Loads that mission into Cloud Lab.","Local state + navigation.","good"],
["Missions","All / Open / Mastered","local","Filters the 30 mission rows.","Browser UI only.","good"],
["Missions","Launch / Revisit","nav","Loads selected mission into Cloud Lab.","Local state + navigation.","good"],
["Cloud Lab","Choose a mission","nav","Opens Mission Control.","Navigation only.","good"],
["Cloud Lab","Brief / Architecture / Acceptance / Business","local","Switches the mission-side explanation panel.","Local UI only.","good"],
["Cloud Lab","solution.py / tests.py / pipeline.yaml","local","Switches between separate editor buffers.","Browser memory only; FIXED in current build.","good"],
["Cloud Lab","Format","browser","Formats the currently open editor buffer.","Runs in browser only.","good"],
["Cloud Lab","Run tests","sim","Runs the mission's heuristic token/contract checks and writes runtime-log output.","Simulation/local grader; does not execute your production code on a server.","warn"],
["Cloud Lab","Reveal solution","local","Loads the reference solution into solution.py and records that it was revealed.","LocalStorage/browser only.","good"],
["Cloud Lab","Grade mission","local","Scores four local production gates and can mark the mission mastered.","Local heuristic grading + LocalStorage.","warn"],
["Cloud Lab","clear runtime logs","local","Clears the visible log panel.","Browser UI only.","good"],
["Cloud Lab","Run cell","sim","Displays a simulated validation result for the mission notebook.","Hard-coded simulation; no Databricks backend.","warn"],
["Incident War Room","Generate incident","sim","Creates a new randomized incident scenario.","Local simulation only.","good"],
["Incident War Room","Incident answer choices","sim","Scores your next-action decision and updates local incident streak.","Local simulation/LocalStorage.","good"],
["PROJECTS*","Artifact checkboxes","local","Marks project artifacts complete/incomplete.","LocalStorage only; does not inspect a real repo artifact.","warn"],
["PROJECTS*","Open world / Practice project / Explain it","nav","Routes to world, mission, or stakeholder practice.","Navigation only.","good"],
["Skills Matrix","Practice / Prove it in code / Practice explanation","nav","Routes to Pattern Match, Coding Forge, or Stakeholder Room.","Navigation only.","good"],
["Relic Vault","View world / Unlock path / Revalidate","nav","Routes to the related world or mission.","Navigation only.","good"],
["Enterprise Drill","Start / resume 120-minute drill","local","Starts a browser timer and stores drill state.","LocalStorage + browser clock.","good"],
["Enterprise Drill","Run acceptance gates","local","Calculates current acceptance-gate count.","Local calculation only.","good"],
["Enterprise Drill","15 stage buttons","local","Switches recovery stage.","Local UI/LocalStorage.","good"],
["Enterprise Drill","120 deep-task checkboxes","local","Tracks task completion.","LocalStorage only.","good"],
["Enterprise Drill","Run Python","browser","Executes Python in-browser using Pyodide.","REAL browser execution; downloads runtime from CDN, no app backend.","good"],
["Enterprise Drill","Run SQL","browser","Executes SQLite logic through the in-browser Python runtime.","REAL browser execution; no database server.","good"],
["Enterprise Drill","Launch Monaco editor","browser","Loads Monaco/VS Code editor from CDN and opens it.","Real browser/CDN load; no code-server backend.","good"],
["Platform Simulators","Tool console buttons","sim","Switch Databricks/Kafka/Delta/MLflow/Airflow/dbt/GitHub/AWS/Azure simulated consoles.","Local simulation only.","good"],
["Platform Simulators","Run healthy path / Inject fault / Recover / clear","sim","Adds simulated operator events to the selected platform console.","Local simulation only; no platform API calls.","warn"],
["Interview Arena","Incident commander / System design / Code defense","local","Changes interview mode.","Local UI only.","good"],
["Interview Arena","Start 45-minute timer","local","Starts/stops browser interview timer.","Local browser clock.","good"],
["Interview Arena","Evaluate answer","local","Keyword/length based interview score.","Local heuristic grading; no LLM backend.","warn"],
["Interview Arena","Next question / Reveal ideal outline / Generate STAR","local","Moves question or displays locally stored reference guidance.","Local only.","good"],
["Engineering Sprint","Assign my next ticket","local","Moves first backlog ticket to In Progress.","LocalStorage simulation.","good"],
["Engineering Sprint","ADVANCE →","local","Moves a simulated ticket through Backlog → In Progress → Review → Done.","LocalStorage simulation.","good"],
["Engineering Sprint","PagerDuty OPEN","nav","Opens War Room or Platform Simulators.","Navigation only; no PagerDuty backend.","warn"],
["Portfolio & Cert","Print / save certificate","browser","Opens browser print/save-PDF flow.","Browser print API.","good"],
["Portfolio & Cert","Copy","browser","Copies generated story text to clipboard.","Browser clipboard API.","good"],
["Stakeholder Room","Audience buttons","local","Changes the audience lens (executive, DE, BI, MLOps, SRE, etc.).","Local UI only.","good"],
["Stakeholder Room","Talk track / Translate / Handoff / Questions / Cross-team map","local","Changes practice mode.","Local UI only.","good"],
["Stakeholder Room","Show answer / Load 90-sec model","local","Reveals local reference content.","Local only.","good"],
["Stakeholder Room","Grade explanation","local","Scores answer with local rules.","Local heuristic grading.","warn"],
["Stakeholder Room","Copy","browser","Copies talk-track content.","Browser clipboard API.","good"],
["Vocab + STAR","Vocabulary / STAR mode buttons and selectors","local","Switches exam type/category/scenario.","Local UI/LocalStorage.","good"],
["Vocab + STAR","MCQ options + Check answer","local","Scores vocabulary recognition.","Local grading only.","good"],
["Vocab + STAR","Grade contrast / natural use / rapid answer","local","Scores typed production-language response.","Local heuristic grading.","warn"],
["Vocab + STAR","Reveal model / Show natural example","local","Shows stored reference answer.","Local only.","good"],
["Vocab + STAR","Voice answer / Dictate full answer","device","Uses browser speech recognition when supported.","Device/browser microphone API; no app backend.","warn"],
["Vocab + STAR","Random term / Random scenario / Next","local","Changes practice item.","Local only.","good"],
["Vocab + STAR","Grade STAR answer","local","Scores STAR sections locally.","Local heuristic grading.","warn"],
["Elite Coach","Speak problem","browser","Uses browser speech synthesis to read the problem aloud.","Browser speech API.","good"],
["Elite Coach","Voice ON/OFF / New problem","local","Changes local voice preference or scenario.","Local only.","good"],
["Elite Coach","Dictate","device","Uses browser speech recognition.","Device/browser microphone API.","warn"],
["Elite Coach","Reveal solve","local","Displays locally stored solve path and lowers blind-attempt weight.","Local state only.","good"],
["Elite Coach","Grade my answer","local","Scores seven dimensions with local rules.","Local heuristic grading/LocalStorage.","warn"],
["Elite Coding Forge","Mode / domain selectors / Random challenge","local","Changes coding mode, domain, or challenge.","Local UI only.","good"],
["Elite Coding Forge","▶ Run","browser","SQL/Python execute in-browser through Pyodide; PySpark is structurally simulated.","Real browser execution for SQL/Python, simulation for PySpark; no Spark cluster.","warn"],
["Elite Coding Forge","Reset / Next challenge","local","Resets editor or moves to next challenge.","Local only.","good"],
["Elite Coding Forge","Grade production solution","local","Scores required patterns, explanation, file discipline, and first-pass evidence.","Local heuristic grading.","warn"],
["Elite Coding Forge","Reveal reference + WHY","local","Shows stored reference code + reasoning.","Local only.","good"],
["Elite Coding Forge","File path choices","local","Checks whether you selected expected repository path.","Local grading only.","good"],
["Elite Coding Forge","File picker","browser","Reads the selected local filename for practice.","Browser file picker; file is NOT uploaded.","good"],
["Pattern Match","Category / New round","local","Changes match set or reshuffles round.","Local only.","good"],
["Pattern Match","Left/right match buttons","local","Scores whether problem and pattern IDs match.","Local only.","good"],
["Adaptive Ladder","11 stage buttons","local","Switches the current mastery stage.","Local state only.","good"],
["Adaptive Ladder","Grade this stage","local","Scores current answer using local pattern/WHY checks.","Local heuristic grading.","warn"],
["Adaptive Ladder","Show reference only after attempt","local","Shows stored solution once an attempt exists.","Local only.","good"],
["Adaptive Ladder","Next stage / Next pattern","local","Moves through ladder or challenge.","Local only.","good"],
["Cloud + Lakehouse Forge","AWS / GCP provider tabs","local","Switches provider curriculum.","Local UI only.","good"],
["Cloud + Lakehouse Forge","24 project buttons","local","Switches the selected cloud project.","Local UI only.","good"],
["Cloud + Lakehouse Forge","288 stage checkboxes","local","Tracks completion of 12 stages × 24 projects.","LocalStorage only; does not validate actual cloud resources.","warn"],
["Cloud + Lakehouse Forge","▶ Run command","sim","Parses command text and returns simulated CLI/Terraform output.","SIMULATION ONLY. It does NOT call AWS, GCP, Terraform Cloud, or a shell.","bad"],
["Cloud + Lakehouse Forge","Save evidence note","local","Stores your pasted sanitized evidence note.","LocalStorage only; no server upload.","warn"],
["Action Map","Run safe tab test","local","Programmatically clicks every nav tab, verifies its target view activates, then returns to Action Map.","Browser-only QA; no destructive buttons clicked.","good"],
["Action Map","Scan visible buttons","local","Checks currently rendered buttons for a click handler and reports suspicious dead controls.","Browser-only QA.","good"],
["Backend Control Plane","Refresh live backend","external","Calls GET /api/v1/health on the deployed Vercel Function.","REAL server-side request; reports Node runtime, commit, DB/signing state.","good"],
["Backend Control Plane","Generate adaptive plan","external","Calls the server-side adaptive recommendation policy using local proficiency signals.","REAL server-side computation; no database required.","good"],
["Backend Control Plane","Grade on server + generate receipt","external","Sends the answer to the server rubric engine and returns score, dimensions, hash, and optional signed receipt.","REAL server-side computation; receipt signing requires ASSESSMENT_SIGNING_SECRET.","good"],
["Backend Control Plane","Sync proficiency snapshot","external","Writes a versioned proficiency snapshot.","REAL backend + Postgres; requires DATABASE_URL and migration.","warn"],
["Backend Control Plane","Emit idempotent event","external","Writes an append-only event using Idempotency-Key.","REAL backend + Postgres; requires DATABASE_URL and migration.","warn"],
["Backend Systems Forge","Project selectors + 144 checkpoints","local","Tracks architecture work across 12 advanced backend systems.","Local progress evidence; does not claim deployment.","good"],
["Backend Systems Forge","Grade architecture defense on real server","external","Calls /api/v1/assessments/grade with project-specific required concepts.","REAL server-side grading; signing/persistence depend on configured secrets.","good"],
["Backend Systems Forge","Run live backend smoke proof","external","Calls /api/v1/smoke and returns live server diagnostics.","REAL Vercel Function execution.","good"],
["Graduation Gate","Simulation/Live access matrix","local","Calculates project-level simulation completion, blind-defense grade, and live unlock state.","No project can enter live mode before 12/12 simulation + defense ≥85.","good"],
["Graduation Gate","Open project / Continue simulation","nav","Routes directly to the selected Cloud or Backend Forge project.","Preserves mandatory simulation-first mode on entry.","good"],
["Sardine Mission Forge","23 project selectors + 322 assignments","local","Tracks end-to-end Sardine production work across ingestion, features, ML, KYC/AML, graph, governance and technical direction.","Local simulation evidence until a project passes its blind defense.","good"],
["Sardine Mission Forge","WHO/WHAT/WHERE/WHEN/WHY views","local","Translates each project into business, ownership, architecture and timing language.","Local role-specific training content.","good"],
["Sardine Mission Forge","Stakeholder mock discussion","external","Grades shareholder, fraud analyst, backend, DS, ML and compliance explanations on the real server grader.","REAL server-side grading; answer text is sent to Cloud Odyssey grading API.","good"],
["Sardine Mission Forge","Instant pattern match","local","Tests recognition of 64 production patterns against project incidents.","Local scoring and repetition.","good"],
["Sardine Mission Forge","Break / Fix incident command","external","Grades end-to-end incident reasoning on the real server grader.","REAL server-side grading; reference stays hidden until requested.","good"],
["Sardine Mission Forge","STAR Method grade","external","Grades project-specific STAR + WHY stories.","REAL server-side grading.","good"],
["Sardine Mission Forge","60-term thesaurus mastery","local","Tracks define + contrast + natural-use confidence for production vocabulary.","LocalStorage only.","good"],
["Sardine Mission Forge","Blind architecture defense","external","Server-grades project architecture defense; 14/14 + ≥85 unlocks live practicum.","REAL server-side grading and mandatory simulation-first gate.","good"],
["Sardine Mission Forge","Check GCP connector","external","Reads server-side connector state only after project graduation.","REAL backend connector-registry call; does not mutate GCP.","good"],
["Cloud + Lakehouse Forge","Simulation / Live mode switch","local","Live mode stays locked until the selected project has 12/12 simulation checkpoints and ≥85 server defense.","Mandatory progression gate; no credential can bypass it.","good"],
["Cloud + Lakehouse Forge","Run connector readiness check","external","Calls the server connector registry after simulation graduation.","Reports configured/disconnected truthfully; does not execute provider mutations.","good"],
["Backend Systems Forge","Simulation / Live practicum switch","local","Unlocks live control-plane calls only after 12/12 simulation + ≥85 server defense.","Mandatory project graduation gate.","good"],
["Backend Systems Forge","Live practicum API buttons","external","Calls real deployed Cloud Odyssey APIs after project graduation.","Real server requests; durable writes still depend on Postgres capability.","good"]
];

var filter="all";
function counts(){
 var o={total:actions.length,nav:0,local:0,browser:0,sim:0,device:0,external:0};
 actions.forEach(a=>{o[a[2]]=(o[a[2]]||0)+1;});return o;
}
function runTabTest(){
 var nav=$$("#nav .nav-item[data-view]"),rows=[],pass=0;
 nav.forEach(b=>{
   var view=b.dataset.view,target=$("#view-"+view);
   try{
     b.click();
     var ok=!!target&&target.classList.contains("active");
     if(ok)pass++;
     rows.push({view:view,label:(b.querySelector("b")||b).textContent.trim(),ok:ok});
   }catch(e){rows.push({view:view,label:(b.querySelector("b")||b).textContent.trim(),ok:false,error:String(e)});}
 });
 var me=nav.find(b=>b.dataset.view==="action-map");if(me)me.click();
 return {pass:pass,total:nav.length,rows:rows};
}
function buttonScan(){
 var view=$(".view.active"),buttons=view?$$("button",view):[];
 var rows=buttons.map(b=>({
   label:(b.textContent||b.title||b.id||"(unnamed)").replace(/\s+/g," ").trim().slice(0,80),
   id:b.id||"",
   wired:typeof b.onclick==="function" || !!b.closest("[data-rich-action]")
 }));
 return {total:rows.length,dead:rows.filter(x=>!x.wired),rows:rows};
}
function render(){
 var root=$("#view-action-map");if(!root)return;
 var c=counts(),rows=filter==="all"?actions:actions.filter(a=>a[2]===filter||a[0]===filter);
 var groups={};rows.forEach(a=>(groups[a[0]]=groups[a[0]]||[]).push(a));
 root.innerHTML='<div class="view-heading"><div><span class="micro">BUTTON + BACKEND TRANSPARENCY</span><h2>What every control actually does</h2><p>This page separates navigation, local state, browser execution, simulation, device APIs and real external systems so no click looks more powerful than it really is.</p></div><div class="mission-filters"><button id="runTabAudit">Run safe tab test</button><button id="scanButtons">Scan visible buttons</button></div></div>'+
 '<div class="actionmap-shell"><aside class="actionmap-side glass"><div class="actionmap-side-head"><span class="micro">FILTER</span><h3>Action type</h3><p>“Backend” means an actual server/service outside this static app. Most Cloud Odyssey actions are intentionally local right now.</p></div><div class="actionmap-filter">'+
 [["all","All actions"],["nav","Navigation"],["local","Local state"],["browser","Browser execution"],["sim","Simulation"],["device","Device APIs"]].map(x=>'<button class="'+(filter===x[0]?"active":"")+'" data-action-filter="'+x[0]+'">'+x[1]+'</button>').join("")+
 '</div><div class="actionmap-filter"><button data-action-filter="Cloud + Lakehouse Forge">AWS + GCP only</button><button data-action-filter="Cloud Lab">Cloud Lab only</button><button data-action-filter="Enterprise Drill">Enterprise only</button></div></aside>'+
 '<section class="actionmap-main glass"><div class="actionmap-summary">'+
 '<div class="actionmap-stat"><span>ACTION FAMILIES</span><b>'+c.total+'</b></div>'+
 '<div class="actionmap-stat"><span>NAVIGATION</span><b>'+c.nav+'</b></div>'+
 '<div class="actionmap-stat"><span>LOCAL / BROWSER</span><b>'+((c.local||0)+(c.browser||0))+'</b></div>'+
 '<div class="actionmap-stat"><span>SIMULATION</span><b>'+c.sim+'</b></div>'+
 '<div class="actionmap-stat"><span>REAL CLOUD CALLS</span><b>0</b></div>'+
 '</div><div id="actionAuditResult"></div><div class="actionmap-list">'+Object.keys(groups).map(g=>'<section class="actionmap-group"><div class="actionmap-group-head"><h4>'+esc(g)+'</h4><span>'+groups[g].length+' action families</span></div>'+groups[g].map(a=>'<div class="actionmap-row"><b>'+esc(a[1])+'</b><span class="action-type '+a[2]+'">'+a[2].toUpperCase()+'</span><p>'+esc(a[3])+'</p><div><div class="action-backend '+(a[4].startsWith("No backend")?"none":"")+'">'+esc(a[4])+'</div><div class="action-status '+(a[5]==="good"?"good":a[5]==="warn"?"warn":"bad")+'">'+(a[5]==="good"?"WORKING / EXPLICIT":a[5]==="warn"?"WORKING, BUT LOCAL/SIMULATED":"MISLEADING IF EXPECTING REAL BACKEND")+'</div></div></div>').join("")+'</section>').join("")+'</div></section></div>';
 $$("[data-action-filter]",root).forEach(b=>b.onclick=()=>{filter=b.dataset.actionFilter;render();});
 $("#runTabAudit").onclick=()=>{var r=runTabTest();$("#actionAuditResult").innerHTML='<div class="answer-panel"><h4>SAFE TAB TEST • '+r.pass+'/'+r.total+' routes activated</h4><p>'+r.rows.map(x=>(x.ok?"✓ ":"× ")+esc(x.label)).join(" • ")+'</p></div>';};
 $("#scanButtons").onclick=()=>{var r=buttonScan();$("#actionAuditResult").innerHTML='<div class="answer-panel"><h4>VISIBLE BUTTON SCAN • '+(r.total-r.dead.length)+'/'+r.total+' directly wired</h4><p>'+(r.dead.length?"Suspicious: "+r.dead.map(x=>esc(x.label)).join(", "):"No suspicious visible controls in this view.")+'</p></div>';};
}
function classifyButton(b){
 var id=b.id||"",txt=(b.textContent||"").replace(/\\s+/g," ").trim();
 if(b.dataset.view||b.dataset.jump||b.dataset.richAction||b.dataset.dockView)return ["NAVIGATION","Screen/module changed; no backend call."];
 if(/runPython|runSql/.test(id))return ["BROWSER EXECUTION","Python/SQLite executes locally in Pyodide."];
 if(/loadMonaco/.test(id))return ["BROWSER EXECUTION","Monaco loads from CDN into this browser."];
 if(/voice|dictate/i.test(id+txt))return ["DEVICE API","Uses browser speech/microphone support when available."];
 if(/cloudRun|simHealthy|simFault|simRecover|runNotebook|runCode/.test(id))return ["SIMULATION","No production/cloud backend was called."];
 if(/gradeSDefense|gradeSMock|gradeSIncident|gradeSStar/.test(id))return ["REAL SERVER","Cloud Odyssey grading API was called server-side."];
 if(/sconnector/.test(id))return ["REAL BACKEND","Connector registry was checked; no provider mutation was executed."];
 if(/printPortfolio/.test(id))return ["BROWSER API","Opened browser print/save flow."];
 if(/copy/i.test(id+b.className+txt))return ["BROWSER API","Clipboard action in this browser."];
 if(/resetProgress/.test(id))return ["LOCAL DESTRUCTIVE","Changes/removes saved browser progress only."];
 if(b.type==="file")return ["BROWSER FILE","Local file picker; no upload."];
 return ["LOCAL STATE","Changed UI/progress/scoring in this browser; no backend call."];
}
function inspector(){
 if($("#odysseyActionInspector"))return;
 var el=D.createElement("div");el.id="odysseyActionInspector";D.body.appendChild(el);
 D.addEventListener("click",function(e){
   var b=e.target.closest&&e.target.closest("button");if(!b||b.closest("#odysseyActionInspector"))return;
   var x=classifyButton(b),label=(b.textContent||b.title||b.id||"control").replace(/\\s+/g," ").trim().slice(0,70);
   el.innerHTML='<span class="ai-type">'+esc(x[0])+'</span><div><b>'+esc(label)+'</b><br><span>'+esc(x[1])+'</span></div>';
   el.classList.add("show");clearTimeout(el._t);el._t=setTimeout(()=>el.classList.remove("show"),3200);
 },true);
}
function install(){
 var nav=$("#nav"),work=$("#workspace");if(!nav||!work)return;
 var b=D.createElement("button");b.className="nav-item";b.dataset.view="action-map";b.innerHTML="<span>◎</span><b>Button Map</b><em>21</em>";
 b.onclick=()=>{CO.setView("action-map");$("#pageTitle").textContent="Button & Backend Map";render();};nav.appendChild(b);
 var s=D.createElement("section");s.className="view";s.id="view-action-map";work.appendChild(s);render();inspector();
}
window.CloudOdysseyActionMap={actions:actions,runTabTest:runTabTest,buttonScan:buttonScan};
install();
})();