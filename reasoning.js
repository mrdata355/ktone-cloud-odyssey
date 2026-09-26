
(function(){
"use strict";
if(!window.CloudOdyssey){console.error("Why Engine requires CloudOdyssey runtime");return;}
var CO=window.CloudOdyssey;
var D=document;
var $=function(s,r){return (r||D).querySelector(s);};
var $$=function(s,r){return Array.prototype.slice.call((r||D).querySelectorAll(s));};

var skillWhy={
"Kafka contracts":{
 why:"An explicit Kafka contract makes producer change observable before malformed data becomes downstream business state. It gives both sides a versioned agreement and a controlled failure path.",
 alternative:"Schema inference or SELECT * at consumption time",
 whyNot:"Inference reacts after the fact and can silently reinterpret types or omit fields. It also makes replay behavior dependent on whatever schema the consumer happens to infer that day.",
 when:"Inference is reasonable for exploratory/raw landing zones where no business contract is promised and all original payloads are still retained."
},
"Schema evolution":{
 why:"Versioned compatibility checks let producers evolve while protecting existing consumers. The quarantine/rescued path preserves rejected evidence instead of converting incompatibility into silent data loss.",
 alternative:"Allow every new field/type change and fix consumers later",
 whyNot:"That makes producer deployment the moment at which downstream correctness is gambled. A breaking timestamp or key change can corrupt state before anyone notices.",
 when:"Loose evolution can work for append-only, non-critical event archives where downstream interpretation is deliberately deferred."
},
"Idempotency":{
 why:"A stable business key plus version/revision makes the same logical event produce the same business effect under retry or replay.",
 alternative:"Generate a new UUID on every attempt or rely on transport-level producer idempotence",
 whyNot:"A new UUID makes retries look new. Producer idempotence protects some transport retries, but it does not deduplicate distinct logical writes delivered again later.",
 when:"Random operation IDs are fine for truly independent commands that are supposed to create separate effects."
},
"Delta Lake":{
 why:"ACID Delta state provides atomic writes, version history, and deterministic updates so inventory truth is not left between partially written files.",
 alternative:"Overwrite CSV/Parquet folders or manually replace partitions",
 whyNot:"File replacement has weaker transactional semantics and makes concurrent writers, partial failures, and rollback much harder to prove.",
 when:"Simple immutable Parquet files are appropriate for append-only archival datasets with no concurrent state mutation."
},
"MERGE":{
 why:"MERGE expresses deterministic upsert behavior against a declared business key so retries can converge on one target state.",
 alternative:"Overwrite the whole table or UPDATE/INSERT in separate uncoordinated statements",
 whyNot:"Full overwrite increases blast radius and cost. Separate statements can race or leave partial state if one succeeds and the other fails.",
 when:"Full overwrite is useful for small, fully reproducible snapshot tables where atomic replacement is cheap and intentional."
},
"SCD2":{
 why:"SCD2 preserves what was true during each effective interval, which is required when historical reporting or model features depend on prior states.",
 alternative:"Overwrite the current dimension row",
 whyNot:"Overwrite destroys the historical state and makes prior reports impossible to reproduce.",
 when:"Type 1 overwrite is valid when only current truth matters and prior values have no audit or analytical meaning."
},
"Entity resolution":{
 why:"Deterministic identifiers first reduce false merges; fuzzy scoring is then reserved for ambiguous cases and can carry confidence/evidence.",
 alternative:"Fuzzy-match every record from names and addresses",
 whyNot:"Broad fuzzy matching can merge distinct guests and create irreversible contamination of customer history.",
 when:"Fuzzy-first approaches can be acceptable in discovery/research datasets where matches remain suggestions and do not mutate authoritative identity."
},
"Dimensional modeling":{
 why:"A declared fact grain with conformed dimensions gives BI one stable semantic contract and prevents metric definitions from drifting dashboard by dashboard.",
 alternative:"One giant denormalized table or ad-hoc joins in every dashboard",
 whyNot:"Those approaches duplicate business logic, increase reconciliation work, and make changes hard to govern.",
 when:"A wide table can be a good serving layer for one tightly scoped use case after the underlying semantic grain is already governed."
},
"Data quality":{
 why:"Freshness, uniqueness, null, referential, and volume checks cover different failure classes and create a fail-closed publish gate.",
 alternative:"Check row count only",
 whyNot:"Row count can be correct while keys are duplicated, values are null, references are broken, or yesterday's data was reloaded.",
 when:"A single count check is fine as one lightweight smoke test, not as the full quality contract."
},
"CI/CD":{
 why:"Tests and policy gates before promotion stop known-bad artifacts from becoming production incidents and create repeatable release evidence.",
 alternative:"Deploy directly and validate in production",
 whyNot:"That shifts cheap pre-release failures into expensive customer-facing failures and weakens rollback confidence.",
 when:"Direct deployment can be acceptable in disposable sandboxes with no production data or users."
},
"Databricks Asset Bundles":{
 why:"One versioned bundle defines jobs/resources across environments while environment-specific values are explicit, reducing configuration drift.",
 alternative:"Configure jobs manually in each workspace",
 whyNot:"Manual edits are hard to diff, reproduce, review, and roll back. Dev and prod slowly stop representing the same release.",
 when:"Manual setup can be fine for a short-lived experiment that will never be promoted as a production asset."
},
"Rollback":{
 why:"Restoring the last known-good artifact/configuration reduces recovery uncertainty because the target state has already been validated.",
 alternative:"Patch production forward while the incident is active",
 whyNot:"Forward patching changes multiple variables during diagnosis and can widen the blast radius before the original failure is understood.",
 when:"A forward fix is appropriate when rollback would lose irreversible state or when the defect is fully isolated and the forward change is safer than reverting."
},
"Feature engineering":{
 why:"A reusable feature needs an owner, definition, lineage, freshness target, and serving contract so models consume the same meaning over time.",
 alternative:"Copy feature SQL/notebook snippets into each model project",
 whyNot:"Duplicated logic drifts and creates training-serving disagreement that is difficult to trace.",
 when:"Local feature code is reasonable for one-off experimentation before a feature becomes shared production infrastructure."
},
"Point-in-time joins":{
 why:"Point-in-time joins ensure every training row only sees information available at the label time, preventing future leakage.",
 alternative:"Ordinary equality join on entity ID",
 whyNot:"An equality join can attach future feature values and create unrealistically strong offline metrics that collapse in production.",
 when:"A standard join is valid when all joined attributes are static or explicitly valid for the entire historical interval."
},
"Online serving":{
 why:"Sharing feature definitions and checking offline/online parity reduces training-serving skew and makes production scores reproducible.",
 alternative:"Maintain independent training SQL and serving code",
 whyNot:"Independent implementations drift in null handling, windows, defaults, and timing semantics.",
 when:"Separate implementations may be necessary across runtimes, but they still need a shared contract and automated parity tests."
},
"Time series":{
 why:"Time-respecting validation reproduces the real forecasting problem: predicting the future from only the past.",
 alternative:"Random train/test shuffle",
 whyNot:"Random splits leak future seasonal patterns and produce optimistic metrics for time-dependent data.",
 when:"Random splitting is appropriate when observations are IID and time order carries no predictive or operational meaning."
},
"Backtesting":{
 why:"Multiple historical cutoffs test whether the forecasting strategy remains reliable across seasons and regimes rather than one lucky window.",
 alternative:"Evaluate one holdout period or training error",
 whyNot:"A single period may hide holiday, demand-shift, or destination-specific failures.",
 when:"One holdout can be adequate for an early feasibility experiment, not a production promotion decision."
},
"Forecast monitoring":{
 why:"Slice-aware error thresholds tied to staffing/revenue impact make model drift actionable rather than merely statistically interesting.",
 alternative:"Alert on any distribution change",
 whyNot:"Not every drift matters, and noisy alerts train operators to ignore the system.",
 when:"Broad drift alerts are useful during model discovery to learn which changes later deserve business-calibrated thresholds."
},
"RAG":{
 why:"Governed retrieval plus citations constrains generated answers to approved evidence and makes claims auditable.",
 alternative:"Ask the model to answer from parametric memory",
 whyNot:"The model may be stale, hallucinate, or conflate policies without exposing evidence.",
 when:"Memory-only generation is fine for creative or low-stakes tasks where exact factual grounding is not required."
},
"Embeddings":{
 why:"Versioning embedding model, chunking, source version, and index ties retrieval behavior to a reproducible configuration.",
 alternative:"Re-embed whenever convenient without lineage",
 whyNot:"Retrieval quality can change even when prompts stay identical, leaving no way to explain regressions.",
 when:"Unversioned indexes are acceptable for disposable prototypes that have no evaluation or audit requirements."
},
"AI guardrails":{
 why:"Policy, PII, retrieval-boundary, and audit checks control distinct risk surfaces before and after generation.",
 alternative:"Rely on a longer system prompt",
 whyNot:"Prompt instructions alone are not a deterministic security or compliance boundary.",
 when:"Prompt-only steering is suitable for low-risk tone/style behavior where failure does not create policy or data exposure."
},
"SLOs":{
 why:"An SLO ties reliability to a measurable user/business expectation and gives operators an error budget for prioritization.",
 alternative:"Monitor CPU and ticket volume only",
 whyNot:"Infrastructure can look healthy while data is stale or business outputs are wrong.",
 when:"Resource metrics remain useful supporting signals; they just do not replace service-level outcome objectives."
},
"Root cause analysis":{
 why:"Scope impact, preserve evidence, isolate the last change, then verify one hypothesis at a time. This reduces accidental mutation of the system under investigation.",
 alternative:"Restart everything immediately",
 whyNot:"Restarting destroys transient evidence and may temporarily mask rather than explain the defect.",
 when:"Immediate restart is appropriate when the runbook explicitly treats the service as stateless and availability risk exceeds forensic value."
},
"Runbooks":{
 why:"A runbook turns recovery knowledge into an executable sequence with detection, validation, escalation, and rollback gates.",
 alternative:"Rely on senior engineer memory during incidents",
 whyNot:"Memory is inconsistent under pressure and creates person-dependent recovery behavior.",
 when:"Ad-hoc response is unavoidable for a novel incident, but the learned sequence should become a runbook afterward."
},
"Structured Streaming":{
 why:"Durable checkpoints plus idempotent sinks let a restarted stream reproduce processing state without duplicating business effects.",
 alternative:"Delete checkpoints whenever the stream is stuck",
 whyNot:"Deleting state can cause unbounded replay, duplicates, or skipped progress unless a bounded recovery plan exists.",
 when:"A checkpoint reset can be valid during a controlled bootstrap when source offsets and sink reconciliation are independently proven."
},
"Auto Loader":{
 why:"Auto Loader scales incremental file discovery while preserving schema/control metadata and checkpointed progress.",
 alternative:"List the whole object-storage directory on every run",
 whyNot:"Repeated full listings become slow/costly at scale and make incremental progress harder to reason about.",
 when:"Directory listing is fine for small bounded folders or one-time batch loads."
},
"Checkpoints":{
 why:"A checkpoint is processing-state evidence. Recovery must still reconcile external sink effects before assuming business completion.",
 alternative:"Treat checkpoint completion as proof that Snowflake/API writes committed",
 whyNot:"External effects can commit after/before acknowledgement or timeout independently of the streaming checkpoint.",
 when:"Checkpoint state alone is sufficient only when every effect is inside the same exactly-once transactional boundary."
},
"MLflow":{
 why:"Tracking parameters, metrics, artifacts, code/data lineage makes an experiment reproducible and lets production issues map back to a specific run.",
 alternative:"Save the model file and notebook only",
 whyNot:"That omits the exact configuration and evidence needed to reproduce or compare the model.",
 when:"A standalone artifact is adequate for a throwaway experiment that will never be promoted."
},
"Model registry":{
 why:"Promotion gates, approvals, lineage, and rollback metadata make model deployment a controlled release rather than a recency contest.",
 alternative:"Newest model automatically wins",
 whyNot:"A new model can regress important slices even when aggregate metrics improve.",
 when:"Automatic promotion is reasonable for low-risk systems only when robust automated policy gates already encode the acceptance criteria."
},
"Model drift":{
 why:"Drift must be evaluated by relevant slices, labeled quality, and business effect before triggering retraining or rollback.",
 alternative:"Retrain on every statistical distribution change",
 whyNot:"Unimportant drift can create unnecessary model churn, cost, and regression risk.",
 when:"Aggressive retraining may be valid for rapidly changing domains when labels arrive quickly and promotion gates are strong."
}
};

function defaultReasoning(skill,mission,world){
 return {
   why:"This method keeps the production change deterministic, observable, testable, and recoverable. It reduces the chance that retry, partial failure, or scale changes the business meaning.",
   alternative:"Use the shortest implementation that produces the expected happy-path output",
   whyNot:"Happy-path equivalence does not prove replay safety, failure behavior, lineage, or rollback. Senior production design must preserve those properties too.",
   when:"The simpler method is acceptable in a disposable prototype where failure, replay, governance, and audit requirements are intentionally out of scope."
 };
}
function missionReasoning(){
 var s=CO.getState(); if(!s.active)return null;
 var w=CO.worlds[s.active.w], m=w.missions[s.active.m], skill=w.skills[s.active.m];
 var base=skillWhy[skill]||defaultReasoning(skill,m,w);
 return {world:w,mission:m,skill:skill,why:base.why,alternative:base.alternative,whyNot:base.whyNot,when:base.when};
}
function reasoningHTML(r,title){
 return '<div class="reasoning-panel" id="missionWhyPanel">'+
 '<div class="reasoning-head"><div><div class="reasoning-icon">WHY</div><div><b>'+(title||"Reasoning Engine")+'</b><span>'+r.skill+' • method comparison</span></div></div><span class="reasoning-pill">WHY MODE ON</span></div>'+
 '<div class="reasoning-body"><div class="reason-block correct"><div class="reason-label">✓ WHY THIS METHOD</div><p>'+r.why+'</p></div>'+
 '<div class="reasoning-diff"><div class="method-card good"><strong>Chosen pattern</strong><p>'+r.mission.title+' → '+r.skill+'</p></div><div class="method-card bad"><strong>Tempting alternative</strong><p>'+r.alternative+'</p></div></div>'+
 '<div class="reason-block compare"><div class="reason-label">⚖ WHY NOT THE OTHER METHOD</div><p>'+r.whyNot+'</p></div>'+
 '<div class="reason-block when"><div class="reason-label">↔ WHEN THE ALTERNATIVE IS VALID</div><p>'+r.when+'</p></div>'+
 '<div class="reason-block rule"><div class="reason-label">⌁ INTERVIEW RULE TO REMEMBER</div><p>'+interviewRule(r.skill)+'</p></div></div></div>';
}
function interviewRule(skill){
 var rules={
 "Point-in-time joins":"If time matters, join on entity AND availability time—not entity alone.",
 "Idempotency":"Retry must reuse identity; a retry with a new identity is a new business command.",
 "Checkpoints":"Processing-state proof is not external business-commit proof.",
 "MERGE":"Upsert only after you can state the exact business key and winning precedence rule.",
 "RAG":"No evidence, no authoritative answer.",
 "CI/CD":"A release gate should fail before the customer does.",
 "Rollback":"Rollback targets a known-good state; it does not erase incident evidence.",
 "Data quality":"Row count is a signal, not a quality contract.",
 "Model registry":"Promotion is a policy decision, not a timestamp decision."
 };
 return rules[skill]||"State the grain/identity, failure boundary, validation evidence, observability, and rollback before calling a method production-safe.";
}
function renderMissionWhy(){
 var r=missionReasoning(), lab=$(".lab-workspace"); if(!r||!lab||lab.classList.contains("hidden"))return;
 var old=$("#missionWhyPanel"); if(old)old.remove();
 var command=$(".lab-commandbar"); if(command)command.insertAdjacentHTML("afterend",reasoningHTML(r,"Why this solution?"));
 enhanceTestRows();
}
function enhanceTestRows(){
 var notes={
 "contract_or_grain":"WHY: without a declared grain or contract, two implementations can both run successfully while representing different business facts.",
 "deterministic_retry":"WHY: production retries are inevitable. The same input must converge on the same state instead of creating another effect.",
 "observable_failure":"WHY: a safe system must make rejected or partial work visible enough to diagnose and reconcile.",
 "business_validation":"WHY: technical success is insufficient if inventory, guest, revenue, or model outputs are still wrong."
 };
 $$(".test-row").forEach(function(row){
   if(row.querySelector(".why-mini-btn"))return;
   var name=(row.children[1]&&row.children[1].textContent)||"";
   var b=D.createElement("button");b.type="button";b.className="why-mini-btn";b.textContent="WHY?";
   b.onclick=function(e){e.stopPropagation();var n=row.querySelector(".why-inline");if(n){n.remove();return;}row.insertAdjacentHTML("beforeend",'<div class="why-inline">'+(notes[name]||"WHY: this check proves a separate production property; passing the happy path does not imply this property is safe.")+'</div>');};
   row.appendChild(b);
 });
}
function incidentReasoning(title){
 var t=(title||"").toLowerCase();
 if(t.indexOf("duplication")>=0)return {why:"Freeze unsafe publication and compare offsets/checkpoints before replay because the business effect may already exist even if the processing acknowledgement was lost.",alt:"Delete the checkpoint and restart",no:"That can replay a wider range before you know which effects already committed.",when:"Checkpoint reset is valid only after a bounded replay range and idempotent sink/reconciliation are proven."};
 if(t.indexOf("feature")>=0)return {why:"Scope stale-feature impact and inspect the failed checkpoint chain before changing the model; the model may be healthy while its inputs are stale.",alt:"Promote or retrain a model",no:"Changing the model treats a data freshness incident as a model-quality incident.",when:"Model rollback/retrain is valid when fresh features are proven correct and labeled model quality still regressed."};
 if(t.indexOf("model")>=0)return {why:"Compare the new champion against the prior version by the failing slice, then rollback under the same gate evidence.",alt:"Retrain immediately on all data",no:"Retraining changes data and model simultaneously and obscures whether the release itself caused the regression.",when:"Retraining is appropriate after the regression cause is isolated and new evidence justifies a new candidate."};
 return {why:"Preserve evidence, identify the last change, and bound impact before mutation.",alt:"Scale or restart immediately",no:"Changing production before hypothesis testing can erase evidence and widen the blast radius.",when:"Immediate restart is valid for explicitly stateless runbook cases where availability dominates forensic value."};
}
function renderIncidentWhy(clicked){
 var title=$("#incidentTitle"); if(!title)return;
 var fb=$("#incidentFeedback"); if(!fb)return;
 var r=incidentReasoning(title.textContent);
 var old=$("#incidentWhyPanel");if(old)old.remove();
 var div=D.createElement("div");div.id="incidentWhyPanel";div.className="reasoning-panel";
 div.innerHTML='<div class="reasoning-head"><div><div class="reasoning-icon">WHY</div><div><b>Incident decision reasoning</b><span>Evidence-first recovery</span></div></div></div>'+
 '<div class="reasoning-body"><div class="reason-block correct"><div class="reason-label">✓ WHY THE SAFE MOVE</div><p>'+r.why+'</p></div>'+
 '<div class="reason-block compare"><div class="reason-label">⚖ WHY NOT '+escapeText(r.alt).toUpperCase()+'</div><p>'+r.no+'</p></div>'+
 '<div class="reason-block when"><div class="reason-label">↔ WHEN THAT ALTERNATIVE IS VALID</div><p>'+r.when+'</p></div></div>';
 fb.insertAdjacentElement("afterend",div);
}
function escapeText(s){return String(s||"").replace(/[<>]/g,"");}

function taskWhy(title,desc){
 var x=(title+" "+desc).toLowerCase();
 if(x.indexOf("continuity")>=0||x.indexOf("archive")>=0||x.indexOf("table identity")>=0)return ["Prove source continuity before reconstruction so the recovery input is independently complete.","Use the current snapshot or rebuilt table as historical truth.","A current snapshot can be internally consistent while missing the exact historical events that authorized past effects.","Snapshot substitution is fine only when the business contract explicitly defines current state—not historical lineage—as sufficient."];
 if(x.indexOf("batch_id")>=0||x.indexOf("operation id")>=0||x.indexOf("idempot")>=0)return ["Stable business operation identity survives retries, deployments, and checkpoint resets.","Use batch ID, worker ID, or a fresh UUID for each retry.","Those identities describe execution, not the business command, so the same command can be applied again.","Execution IDs are valid for telemetry correlation; they should not be the deduplication key for business effects."];
 if(x.indexOf("history")>=0||x.indexOf("authorization")>=0)return ["Durable authorization history proves a business revision was approved before outbound side effects.","Infer authorization from the fact that the destination already changed.","Observed side effects do not prove who authorized them or when; this would legitimize the incident after the fact.","Destination state can be supporting evidence during incident reconstruction, but not a substitute for approval history."];
 if(x.indexOf("ack")>=0||x.indexOf("feedback")>=0)return ["Feedback must remain evidence about delivery, not re-enter the authoring decision stream.","Treat acknowledgement events like normal promotion decisions.","That creates a feedback loop where delivery evidence can generate another delivery.","Feedback can update operation status/telemetry, but it should not create a new DECISION_SEQ."];
 if(x.indexOf("checkpoint")>=0||x.indexOf("frontier")>=0)return ["Resume from the last proven business frontier, not merely the last record observed by the processor.","Restart from LAST_SEEN or delete the checkpoint.","Seen does not prove downstream history/API effects completed, so restart can skip unresolved work or duplicate it.","A checkpoint reset is valid only after external outcomes are independently reconciled."];
 if(x.indexOf("conflict")>=0||x.indexOf("same-sequence")>=0)return ["Same key + same sequence + different canonical body is contradictory business evidence and must block.","Break the tie with event ID, arrival time, or latest ingestion timestamp.","Those are transport facts, not approved business precedence, so choosing one hides a real conflict.","A deterministic tiebreaker is valid only when the business contract explicitly defines it as precedence."];
 if(x.indexOf("rbac")>=0||x.indexOf("role")>=0||x.indexOf("tenant")>=0)return ["Least privilege protects recovered evidence while allowing users to see only the certified tenant-safe interface.","Grant broad read access during recovery and clean it up later.","Incident urgency is exactly when sensitive raw/failed data is most likely to leak or become permanent privilege debt.","Temporary elevation can be valid through an audited break-glass role with expiry, approval, and post-incident review."];
 if(x.indexOf("scan")>=0||x.indexOf("cost")>=0||x.indexOf("20 minute")>=0||x.indexOf("performance")>=0)return ["Bound by exact ranges/keys first, then scale. This reduces scan, cost, and failure blast radius simultaneously.","Increase warehouse/cluster size before pruning the workset.","More compute cannot fix unnecessary I/O and may simply make an unsafe full-history scan more expensive.","Scale-up is appropriate after the query/dataflow is already bounded and profiles show compute—not scan design—is the bottleneck."];
 if(x.indexOf("rollback")>=0||x.indexOf("pointer")>=0)return ["Rollback should activate a known-safe immutable release while preserving failed evidence for audit and forward repair.","Delete bad rows or overwrite the failed release in place.","That destroys evidence and makes it impossible to explain what users may already have observed.","Destructive replacement is acceptable only for disposable non-audited environments."];
 return ["This task proves one production property independently so success is evidence-based rather than inferred from a green job.","Assume the happy path proves the property automatically.","Distributed systems can report local success while a different boundary is incomplete or contradictory.","The shortcut is acceptable only when the omitted boundary truly does not exist in that system."];
}
function enhanceDeepTasks(){
 $$(".deep-task").forEach(function(label){
   if(label.querySelector(".why-mini-btn"))return;
   var b=D.createElement("button");b.type="button";b.className="why-mini-btn";b.textContent="WHY / VS?";
   b.onclick=function(e){
     e.preventDefault();e.stopPropagation();
     var old=label.querySelector(".why-inline");if(old){old.remove();return;}
     var title=(label.querySelector("b")||{}).textContent||"", desc=(label.querySelector("p")||{}).textContent||"", r=taskWhy(title,desc);
     label.insertAdjacentHTML("beforeend",'<div class="why-inline"><b>WHY:</b> '+r[0]+'<br><br><b>VS:</b> '+r[1]+'<br><b>Why not:</b> '+r[2]+'<br><b>Use it when:</b> '+r[3]+'</div>');
   };
   label.appendChild(b);
 });
}
function interviewWhy(question){
 var q=(question||"").toLowerCase();
 if(q.indexOf("batch_id")>=0)return {why:"Stable business identity survives checkpoint resets and deployments; batch_id describes one execution attempt.",alt:"Use batch_id as the idempotency key",no:"A reset or new deployment can reuse batch numbers and duplicate business effects.",when:"batch_id is excellent for logging and tracing one microbatch, not business deduplication."};
 if(q.indexOf("timed out")>=0||q.indexOf("timeout")>=0)return {why:"Query the same operation ID because timeout means the response is unknown, not that the side effect failed.",alt:"POST again with a new operation ID",no:"The first request may already have applied, so a new identity can create a duplicate effect.",when:"A new operation is valid only after the prior operation has a definitive failed/non-applied outcome."};
 if(q.indexOf("checkpoint")>=0||q.indexOf("last_seen")>=0)return {why:"Restart from the proven frontier because it binds processing to durable downstream completion evidence.",alt:"Restart from the latest seen/processed record",no:"Observation is not proof that external effects completed.",when:"Seen and proven are equivalent only when all effects participate in the same transactional boundary."};
 if(q.indexOf("distributed transaction")>=0)return {why:"A saga with durable authorization, stable idempotent commands, outcome lookup, reconciliation, and certified publication replaces an unavailable cross-system transaction.",alt:"Pretend the four systems share exactly-once transaction semantics",no:"They do not share one atomic commit boundary; network timeouts and independent commits remain ambiguous.",when:"A real distributed transaction is appropriate only when every participant implements and operationally supports the same transaction protocol."};
 return {why:"The senior answer explains identity, boundary, evidence, failure behavior, and rollback—not just the happy path.",alt:"Describe only the implementation steps",no:"Steps without failure semantics do not prove production correctness.",when:"A short implementation-only answer is fine for a narrowly scoped syntax question."};
}
function renderInterviewWhy(){
 var box=$("#idealBox"), q=$(".question-card h3");if(!box||!q)return;
 var r=interviewWhy(q.textContent);
 var old=$("#interviewWhyPanel");if(old)old.remove();
 box.insertAdjacentHTML("beforeend",'<div class="reasoning-panel" id="interviewWhyPanel"><div class="reasoning-head"><div><div class="reasoning-icon">WHY</div><div><b>Reasoning vs alternative</b><span>interview transfer</span></div></div></div><div class="reasoning-body"><div class="reason-block correct"><div class="reason-label">✓ WHY</div><p>'+r.why+'</p></div><div class="reason-block compare"><div class="reason-label">⚖ ALTERNATIVE: '+r.alt+'</div><p>'+r.no+'</p></div><div class="reason-block when"><div class="reason-label">↔ WHEN ALTERNATIVE WORKS</div><p>'+r.when+'</p></div></div></div>');
}
function simulatorWhy(){
 var active=$(".tool-btn.active"), root=$("#view-simulators");if(!active||!root)return;
 var name=(active.querySelector("b")||active).textContent;
 var map={
 "Databricks Workspace":["Use checkpointed state plus external reconciliation because a successful Spark/Databricks task does not prove every external effect committed.","Treat job SUCCESS as end-to-end business success."],
 "Kafka / Event Stream":["Separate physical offset identity from logical business identity so replay at a new offset cannot double-count.","Deduplicate only by Kafka offset."],
 "Delta Lake / CDF Explorer":["Bind table identity and version range; a rebuilt table with the same name is not automatically historical continuity.","Assume table name continuity."],
 "MLflow Observatory":["Promote with explicit quality/slice gates and rollback metadata.","Newest model automatically becomes champion."],
 "Airflow / Workflow Orchestrator":["Use durable task-side idempotency and outcome checks because scheduler retries can repeat external effects.","Assume DAG task retry is harmless."],
 "dbt Lineage Studio":["Test grain/relationships and reconcile semantic outputs before exposure.","Assume successful model build means the business mart is correct."],
 "GitHub Release Control":["Gate production on tests, approvals, and rollback evidence.","Merge because CI is green even if required operational evidence is missing."],
 "Cloud Architecture Console":["Design each boundary with ownership, timeout, retry, and evidence semantics.","Describe services only, without failure boundaries."]
 };
 var r=map[name]||["Make each platform boundary prove its own completion and failure semantics.","Assume local success propagates automatically end-to-end."];
 var old=$("#simulatorWhyPanel");if(old)old.remove();
 var body=$(".sim-body");if(body)body.insertAdjacentHTML("beforeend",'<div class="reasoning-panel" id="simulatorWhyPanel"><div class="reasoning-head"><div><div class="reasoning-icon">WHY</div><div><b>'+name+' reasoning</b><span>production method comparison</span></div></div></div><div class="reasoning-body"><div class="reason-block correct"><div class="reason-label">✓ WHY THIS OPERATING MODEL</div><p>'+r[0]+'</p></div><div class="reason-block compare"><div class="reason-label">⚖ WHY NOT THE SHORTCUT</div><p>'+r[1]+'</p></div></div></div>');
}
function addWhyBadge(){
 var top=$(".top-stats");if(!top||$("#whyModeBadge"))return;
 var b=D.createElement("div");b.id="whyModeBadge";b.className="hud-stat";b.innerHTML="<span>WHY ENGINE</span><b>ON</b>";top.insertBefore(b,top.lastElementChild);
}
D.addEventListener("click",function(e){
 var id=e.target&&e.target.id;
 if(id==="revealSolution"||id==="submitLab"||id==="runCode")setTimeout(renderMissionWhy,30);
 if(e.target.closest&&e.target.closest(".incident-choice"))setTimeout(function(){renderIncidentWhy(e.target.closest(".incident-choice").textContent);},40);
 if(id==="idealInterview"||id==="gradeInterview"||id==="starInterview")setTimeout(renderInterviewWhy,50);
 if(id==="simHealthy"||id==="simFault"||id==="simRecover")setTimeout(simulatorWhy,50);
});
var labTitle=$("#labTitle");if(labTitle)new MutationObserver(function(){setTimeout(renderMissionWhy,20);}).observe(labTitle,{childList:true,subtree:true});
var observer=new MutationObserver(function(){
 enhanceDeepTasks();
 enhanceTestRows();
 if($("#view-simulators")&&$("#view-simulators").classList.contains("active"))simulatorWhy();
});
observer.observe(D.body,{childList:true,subtree:true});
addWhyBadge();renderMissionWhy();enhanceDeepTasks();enhanceTestRows();
})();