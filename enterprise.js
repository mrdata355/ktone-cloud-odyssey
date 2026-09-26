
(function(){
'use strict';
if(!window.CloudOdyssey){console.error('CloudOdyssey runtime missing');return;}
const CO=window.CloudOdyssey;
const STAGES=[{"title": "Incident contract & invariants", "domain": "Business contract", "tools": "Architecture • Data contracts", "why": "Freeze what must be true before debugging implementation details.", "tasks": [["Declare the complete business key", "Use TENANT_ID + CUSTOMER_ID + CAMPAIGN_ID everywhere; prove there are no tenant collisions."], ["Define revision precedence", "DECISION_SEQ is the authoring-system precedence for a key; source timestamp cannot override a higher sequence."], ["Define ACTIVE contract", "ACTIVE requires a non-null offer and becomes the desired downstream offer state."], ["Define WITHDRAWN contract", "WITHDRAWN carries no offer and must remove/disable the prior active state without inventing another decision."], ["Separate source and audit time", "Preserve SOURCE_UPDATED_AT and actual RECORDED_AT independently; recovered history cannot be backdated."], ["Authorization before outbound", "Every approved revision needs durable history before any new destination attempt."], ["Define delete semantics", "A physical delete can purge a row already withdrawn; it cannot authorize a new business revision."], ["Fence acknowledgement semantics", "WRITEBACK_ACK is acknowledgement evidence only and can never become a promotion decision."]]}, {"title": "Evidence pack & source continuity", "domain": "Forensics", "tools": "Delta CDF • Archive manifests", "why": "Prove exact source lineage before deciding what can be recovered.", "tasks": [["Bind original source table identity", "Record delta-G1 as the authoritative incident source identity, not merely the table name."], ["Bind closed recovery range", "Freeze versions 701–706 inclusive as the recovery range and stop discovering latest during child steps."], ["Verify archive counts", "Prove the independent archive has the expected per-version record counts and full source events."], ["Verify archive hashes", "Compare manifest SHA-256 values before using archive records for repair."], ["Explain replacement-table discontinuity", "Treat delta-G2 version 3 as a different source identity until continuity is explicitly approved."], ["Prove live CDF gap", "Document that live CDF no longer contains versions 701–703 and therefore cannot alone recover the incident."], ["Block unsafe snapshot substitution", "Do not replace missing historical CDF with the current snapshot and call it complete."], ["Create continuity decision record", "Persist approval, evidence, source IDs, ranges, hashes, and the frontier from which streaming may resume."]]}, {"title": "Databricks CDF capture & reconstruction", "domain": "Streaming / Databricks", "tools": "Structured Streaming • Delta CDF", "why": "Recover all source evidence without turning preimages, duplicates, or deletes into phantom decisions.", "tasks": [["Read bounded archive only", "Read the declared source table ID and versions 701–706 instead of scanning 600M historical rows."], ["Preserve CDF metadata", "Keep _change_type, _commit_version, _commit_timestamp, source_table_id and event_id for every capture."], ["Classify preimages", "Preimages are retraction/audit evidence and cannot create new approved decision revisions."], ["Classify postimages/inserts", "Postimages and inserts can represent intended business revisions after contract validation."], ["Classify delete", "R09 delete is physical cleanup of the already WITHDRAWN revision and creates zero extra revision."], ["Account for duplicate captures", "Twelve physical captures map to ten distinct source events; duplicate deliveries need replay dispositions."], ["Preserve late source timestamp", "R08's older SOURCE_UPDATED_AT cannot cause decision-sequence regression."], ["Remove driver collect risk", "Use distributed transforms and bounded key sets; never collect production recovery input onto an 8-GiB driver."]]}, {"title": "Identity, canonicalization & dispositions", "domain": "Correctness", "tools": "Hashing • Ledger", "why": "Keep physical delivery, business revision, command identity, and acknowledgement identity separate.", "tasks": [["Create physical capture identity", "Bind source table ID, commit version, event/capture identity so transport duplicates remain auditable."], ["Create logical source-event identity", "Use stable EVENT_ID plus source table identity to recognize duplicate source-event deliveries."], ["Create business revision identity", "Bind complete business key + DECISION_SEQ + normalized offer/status content."], ["Canonicalize command body", "Normalize the exact six destination fields before body hashing or operation-ID generation."], ["Detect same-sequence conflict", "Equal key/sequence with different normalized content is a blocking conflict, never an arbitrary tie."], ["Mark logical replay", "Equal business revision + equal content delivered again becomes REPLAY with zero new business effect."], ["Enumerate terminal dispositions", "Every captured source/feedback record ends as approved, superseded, replay, conflict, delete-only, acknowledgement, or rejected."], ["Persist disposition evidence", "Store rule version, canonical hash, reason code, capture identity, and workset/release binding."]]}, {"title": "Snowflake history, current state & audit truth", "domain": "Warehouse state", "tools": "Snowflake SQL • Transactions", "why": "Repair durable authorization and current business state without manufacturing history.", "tasks": [["Reconstruct five missing approvals", "Insert one honest history record for each intended new decision revision that lacks authorization history."], ["Label two prior violations", "Keep the two already-applied C100 seq8 effects explicitly flagged as pre-existing history-before-delivery violations."], ["Reach exactly nine decision revisions", "Prove four baseline + five new distinct approved revisions and no extras from preimages/deletes/replays/acks."], ["Build current state by full key", "Current state must contain five expected business keys with correct sequence/offer/status."], ["Freeze original history timestamps", "Retries may append attempt telemetry but cannot rewrite original RECORDED_AT or source timestamps."], ["Separate history from delivery attempts", "History proves authorization; DELIVERY_ATTEMPT records transport/outcome evidence only."], ["Use deterministic bounded mutation", "MERGE or transactionally mutate only affected full keys with explicit fields."], ["Create immutable release snapshot", "Candidate publication points to an immutable reconciled snapshot, not MAX(timestamp) or newest random run."]]}, {"title": "Destination delivery saga", "domain": "Distributed reliability", "tools": "Idempotency • APIs", "why": "Prove two external receivers converge without a distributed transaction.", "tasks": [["Derive stable operation ID", "Operation identity binds destination + business key + sequence + canonical command body."], ["Write history before send", "Refuse POST when matching durable authorization history is absent."], ["Treat 202 as accepted-not-complete", "Record receipt but query operation status until a definitive destination result exists."], ["Resolve timeout after apply", "GET the same operation ID before any resend; never invent a fresh ID after a lost response."], ["Handle 429 with bounded backoff", "Honor Retry-After and keep aggregate request rate within the contract."], ["Handle PENDING", "Do not publish COMPLETE while any intended destination operation is still pending."], ["Detect receiver conflict", "Equal sequence with changed body must surface RECEIVER_CONFLICT and block certification."], ["Prove exactly ten new applications", "Two were already applied; recovery adds eight and retries add zero extra business effects."]]}, {"title": "Legacy feedback & acknowledgement loop", "domain": "Feedback safety", "tools": "Bronze • Event filtering", "why": "Prevent delivery feedback from re-entering the authoring decision stream.", "tasks": [["Tag source kind", "Require explicit source_kind for authoring decisions versus WRITEBACK_ACK feedback."], ["Bind origin operation ID", "Persist origin_operation_id from acknowledgements to the destination attempt they refer to."], ["Reject ack as decision", "Acknowledgement rows bypass promotion decision materialization entirely."], ["Deduplicate ack replay", "Repeated WRITEBACK_ACK messages produce zero new business applications or history rows."], ["Audit acknowledgement state", "Feedback may update operation evidence but never DECISION_SEQ or offer state."], ["Separate feedback checkpoint", "Use independent feedback-consumer progress from decision-source continuity."], ["Test loop prevention", "Inject a replayed ack and prove outbound application count is unchanged."], ["Document ownership", "Assign producer/consumer owners and explicit schema contract for feedback messages."]]}, {"title": "Sender concurrency, fencing & restart semantics", "domain": "Concurrency", "tools": "Leases • Checkpoints", "why": "Stop old/new workers from concurrently owning the same external effect.", "tasks": [["Detect split-brain worker", "Document old worker batch 441 and new worker batch 0 overlap as an incident mechanism."], ["Fence sender ownership", "Use lease/epoch or compare-and-swap ownership per bounded workset/key partition."], ["Do not trust batch_id", "batch_id resets after checkpoint changes and cannot be a global operation identity."], ["Separate seen vs proven frontier", "LAST_SEEN_VERSION may advance while LAST_PROVEN_VERSION moves only with durable completion evidence."], ["Recover checkpoint safely", "Do not silently drop startingVersion after history-unavailable errors and point at a rebuilt table."], ["Restart from proven frontier", "Resume only after source continuity and destination/outcome evidence are reconciled."], ["Serialize same-key mutations", "Two workers may run only when key ownership is disjoint or explicitly serialized."], ["Make same recovery rerunnable", "Rerun/restart/overlap must preserve identical business state and history."]]}, {"title": "Certification & publication", "domain": "Release safety", "tools": "Release manifest • CAS", "why": "Keep the last certified interface active until every required proof is complete.", "tasks": [["Build candidate manifest", "Bind source identity/range, archive hashes, code version, affected keys, history and destination outcomes."], ["Define six acceptance gates", "Materialize each business/reliability/security/performance acceptance result as a required gate."], ["Fail closed on missing gate", "Missing, duplicate, stale, or unknown validation is failure—not zero-row success."], ["Verify both destinations", "Each intended revision must have a definitive result at Segment and Legacy."], ["Verify source-to-current reconciliation", "Every changed key links source evidence, approval history, current state, and destination results."], ["Compare expected predecessor", "Publish only when currently certified release equals the candidate's expected predecessor."], ["Use atomic pointer swap", "One publication writer changes the certified interface pointer with compare-and-swap semantics."], ["Keep failed candidate immutable", "Never delete failed evidence; rollback changes the pointer, not historical proof."]]}, {"title": "Governance, RBAC & tenant isolation", "domain": "Security", "tools": "Unity Catalog • Snowflake RBAC", "why": "Make evidence available to operators without exposing Raw or cross-tenant data to readers.", "tasks": [["Separate service roles", "Use distinct ingestion, validation, mutation, delivery and publication service identities."], ["Restrict sender data", "Outbound sender reads only bounded authorized command fields, not unrestricted Raw or guest PII."], ["Create tenant-safe final interface", "Marketing reads certified semantic view filtered to authorized tenant scope."], ["Block Raw/ops access", "Marketing has no SELECT on Raw/CDF archive/attempt ledger/conflicts/failed candidates."], ["Implement Unity Catalog grants", "Provide executable GRANT/REVOKE for jobs, schemas, tables/views and service principals."], ["Implement Snowflake grants", "Use least-privilege warehouse/database/schema/view permissions for analytics and recovery roles."], ["Test secondary-role bypass", "Run negative tests and record zero unauthorized successes."], ["Audit evidence access", "Retain query/access evidence for secured incident payloads and recovered audit records."]]}, {"title": "Failure injection matrix", "domain": "Resilience testing", "tools": "Fault injection • Unit/integration tests", "why": "Prove the design survives the failures that caused or could repeat the incident.", "tasks": [["Replay same recovery", "Run identical workset twice and prove byte-equivalent business state plus no duplicate history/application."], ["Reset sender process", "Kill sender between acceptance and status resolution; recover same operation identity."], ["Overlap two workers", "Start competing senders and prove fencing/serialization blocks duplicate effects."], ["Delay one destination", "Hold one receiver pending while the other applies; certified release remains unchanged."], ["Inject 429", "Exercise retry-after/backoff under the 600 req/s combined contract."], ["Timeout after apply", "Apply then lose client response; GET resolves original operation before retry."], ["Inject same-sequence conflict", "Changed body for same key/sequence blocks false COMPLETE."], ["Alter/miss archive evidence", "Missing archive version or changed hash blocks continuity and preserves previous certified release."]]}, {"title": "Observability & reconciliation evidence", "domain": "Operations", "tools": "Metrics • Queries • Lineage", "why": "Make every business claim traceable to measurable system evidence.", "tasks": [["Build changed-key reconciliation", "Show source event → decision revision → history row → both destination outcomes → certified row."], ["Track capture counts", "Prove 12 physical captures, 10 distinct source events and terminal disposition count equality."], ["Track business revisions", "Prove exactly five intended new decisions and nine total approved revisions."], ["Track destination applications", "Prove exactly ten new receiver applications including the two incident applications."], ["Record query/job IDs", "Capture Spark job IDs and Snowflake query IDs used by each phase."], ["Measure scan bytes", "Record Snowflake bytes scanned and denominator for bounded-scope assertions."], ["Measure Spark behavior", "Record tasks, retries, skew, spill, executor memory and no full-input driver collect."], ["Create incident dashboard", "Expose lag, pending/unknown operations, authorization gaps, release gates and business reconciliation."]]}, {"title": "Performance, scale & cost engineering", "domain": "Scale", "tools": "Spark tuning • Snowflake cost", "why": "Meet production targets with evidence, not bigger clusters and optimistic claims.", "tasks": [["Target 86K affected keys", "Design bounded key materialization for the stated recovery population."], ["Target 172K distinct CDF events", "Partition and process event evidence without full-history scans."], ["Target 206,400 physical captures", "Deduplicate transport replay while retaining capture-level audit evidence."], ["Stay under 20 minutes", "Measure end-to-end wall clock including queueing, retries and outcome resolution."], ["Stay at/below 8 warehouse credits", "Attribute Snowflake warehouse credits and report other platform costs separately."], ["Stay at/below 600 adapter req/s", "Rate-limit POST + GET combined; retries and status queries count against the cap."], ["Scan at/below 120 GiB", "Use affected-key/range pruning; original 1.8 TiB scan is a regression baseline."], ["Separate measured vs unverified", "Local fixture correctness is measured; native production-scale targets remain UNVERIFIED until rehearsed."]]}, {"title": "Recovery runbook & rollback boundaries", "domain": "Incident response", "tools": "Runbooks • Rollback", "why": "Turn the recovery design into an executable operator sequence.", "tasks": [["0–2 min: hold publication", "Freeze certified interface changes, fence writers and bind known-safe baseline."], ["2–5 min: prove continuity", "Validate source table identity, archive manifests, ranges and live-CDF boundaries."], ["5–10 min: classify bounded workset", "Read only declared evidence, build dispositions and affected-key set."], ["10–15 min: repair durable state", "Reconstruct history/current state and destination command plan with authorization-before-send."], ["15–18 min: resolve destinations", "Converge both adapters, reconcile attempts, acknowledgements and changed keys."], ["18–20 min: certify/publish", "Run security negative tests, acceptance gates and atomic release activation."], ["Define rollback pointer", "Rollback reactivates known-safe immutable certified release and retains failed evidence."], ["Define streaming resume", "Normal streaming resumes only from a proven source frontier after recovery ownership closes."]]}, {"title": "Senior explanation, STAR & hand-off", "domain": "Communication", "tools": "Interview • Design review", "why": "Be able to defend the system, not merely produce code.", "tasks": [["Give 90-second architecture answer", "Explain source evidence, durable authorization, idempotent delivery saga and certified publication."], ["Explain why checkpoint is insufficient", "A stream checkpoint does not prove Snowflake history or external destination application."], ["Explain why receipt is insufficient", "HTTP 202/timeout cannot establish final receiver state; operation lookup closes ambiguity."], ["Explain why timestamp loses to sequence", "Business precedence is DECISION_SEQ; older source time may still be newer decision."], ["Explain failure-boundary tradeoffs", "Describe why no distributed transaction exists and how ledger + idempotency + reconciliation replace it."], ["Explain scale strategy", "Bounded ranges/keys, distributed transforms, no driver collect, rate limiting and pruned warehouse reads."], ["Produce STAR story", "Situation, task, actions, measured/result targets, safeguards and lessons."], ["Write hand-off checklist", "Owners, dashboards, runbooks, alerts, release IDs, open risks and rehearsal requirements."]]}];
const ACCEPTANCE=["Final certified interface has five expected business keys: four ACTIVE offers and one WITHDRAWN, with zero tenant collisions.", "History has exactly nine approved revisions; all 12 captured CDF inputs are dispositioned and preimages/deletes/replays/acks create no extra decisions.", "Both destinations converge with exactly ten new applications including the two already applied; recovery adds eight and creates no new history-before-send violation.", "Rerun, restart, overlapping workers, delayed destination, 429 and timeout-after-apply cannot change final values, duplicate history or rewrite original history timestamps.", "Source/destination mismatch is zero; ack replay creates zero new applications; restricted-role negative tests have zero unauthorized successes.", "Production rehearsal target: 86K affected keys / 172K distinct CDF events / 206,400 physical captures within 20 minutes, <=8 Snowflake warehouse credits, <=600 combined adapter req/s, <=120 GiB scanned."];
const RUBRIC=[["Correctness", 35], ["Production reliability & data quality", 25], ["Scalability / performance / cost", 15], ["Governance / security", 10], ["Testing / observability", 10], ["Explanation / tradeoffs", 5]];
const INTERVIEW_QUESTIONS=[{"mode": "incident", "q": "The job dashboard says SUCCESS, but Segment and the legacy CRM disagree. What evidence do you establish before sending anything again?", "keys": ["source", "history", "operation", "destination", "reconcile"], "ideal": "Bind source table/range/archive proof; compare durable authorization history; resolve old operation IDs at both destinations; build the affected-key workset; hold publication until reconciliation is complete."}, {"mode": "system", "q": "Design the end-to-end exactly-once business effect without a distributed transaction across Delta, Snowflake, Segment, and the legacy adapter.", "keys": ["idempotent", "operation", "history", "ledger", "reconcile", "publish"], "ideal": "Use durable authorization-before-send, stable operation IDs, receiver lookup after uncertain outcomes, append-only attempts, key-level reconciliation, and fail-closed certified publication."}, {"mode": "code", "q": "Why is batch_id a bad idempotency key for foreachBatch delivery?", "keys": ["reset", "checkpoint", "deployment", "business", "stable"], "ideal": "batch_id can reset with checkpoint changes or deployments. Idempotency must bind stable business revision/destination/body identity, not execution numbering."}, {"mode": "incident", "q": "A POST timed out after the receiver applied it. What is the next action and why?", "keys": ["get", "operation", "lookup", "resend", "idempotent"], "ideal": "Query the receiver using the same operation ID. Do not resend under a new ID until the original outcome is definitive."}, {"mode": "system", "q": "How do you prove delta-G2 is safe to continue from after delta-G1 history disappeared?", "keys": ["table", "continuity", "archive", "hash", "approve"], "ideal": "Do not infer continuity from table name/current snapshot. Verify G1 archive/range and hashes, explicitly approve continuity to G2, then persist the decision and new frontier."}, {"mode": "code", "q": "What CDF records should create approved promotion history from update_preimage, update_postimage, delete, duplicate replay, and WRITEBACK_ACK?", "keys": ["postimage", "insert", "preimage", "delete", "ack", "replay"], "ideal": "Validated postimage/insert semantics create revisions. Preimages, physical delete of withdrawn state, duplicate captures and acknowledgement feedback are evidence/dispositions only."}, {"mode": "incident", "q": "LAST_SEEN_VERSION is 706 but LAST_PROVEN_VERSION is 700. Which one can drive restart?", "keys": ["proven", "700", "evidence", "completion"], "ideal": "The proven frontier. Seen means observed; proven means durable end-to-end completion evidence exists."}, {"mode": "system", "q": "How would you keep two recovery workers from applying the same customer/campaign change?", "keys": ["fence", "lease", "key", "serialize", "owner"], "ideal": "Assign fenced ownership over workset or disjoint key ranges; serialize same-key mutation and destination issuance; verify owner before mutation/send."}, {"mode": "code", "q": "What is the conceptual Snowflake transaction boundary for current-state repair?", "keys": ["transaction", "history", "current", "affected", "commit"], "ideal": "Materialize bounded work tables first; in one DML transaction validate owner/baseline, insert missing approval history if absent, deterministically update affected current keys, write commit evidence, and commit."}, {"mode": "incident", "q": "One destination is APPLIED and the other remains PENDING. Can you publish COMPLETE?", "keys": ["no", "pending", "both", "certified"], "ideal": "No. Certified release requires definitive outcomes for every intended destination effect."}, {"mode": "system", "q": "Why separate authorization history from delivery attempts?", "keys": ["authorization", "transport", "audit", "retry"], "ideal": "History proves the business revision was authorized before outbound. Attempts record transport/outcome retries without creating business history or rewriting original timestamps."}, {"mode": "code", "q": "How would you test a same-key same-sequence conflicting body?", "keys": ["conflict", "block", "same", "sequence", "different"], "ideal": "Inject equal full key + decision_seq with different canonical offer/status; ensure conflict disposition, no send, no false complete release, and prior certified state remains active."}, {"mode": "incident", "q": "The original recovery scanned 1.8 TiB. What do you change before simply scaling compute?", "keys": ["bounded", "range", "keys", "prune", "scan"], "ideal": "Bind exact source range and affected keys, materialize compact worksets, prune warehouse reads, aggregate before joins, and measure bytes scanned/query profiles."}, {"mode": "system", "q": "What should Marketing be able to query after recovery?", "keys": ["certified", "view", "tenant", "raw"], "ideal": "Only the tenant-authorized certified semantic interface; not Raw/CDF archive, recovery ledger, rejects, failed candidates, or unrestricted ops metadata."}, {"mode": "incident", "q": "Give the rollback boundary if a bad release was already visible.", "keys": ["pointer", "safe", "audit", "incident", "evidence"], "ideal": "Treat it as an incident: repoint to known-safe immutable certified release, retain failed evidence and access audit, repair forward; rollback cannot undo prior reads."}];
const SPRINT_TICKETS=[["CO-101", "Prove delta-G1 continuity archive", "P0", "Backlog"], ["CO-102", "Build CDF disposition ledger", "P0", "Backlog"], ["CO-103", "Reconstruct missing authorization history", "P0", "In Progress"], ["CO-104", "Implement stable destination operation IDs", "P0", "In Progress"], ["CO-105", "Resolve timeout-after-apply", "P0", "Review"], ["CO-106", "Fence overlapping sender workers", "P0", "Backlog"], ["CO-107", "Build source->history->destination reconciliation", "P1", "Backlog"], ["CO-108", "Create certified release CAS", "P0", "Backlog"], ["CO-109", "Add tenant-safe semantic view", "P1", "Review"], ["CO-110", "Inject 429 / pending / conflict failures", "P1", "Backlog"], ["CO-111", "Add bounded performance evidence", "P1", "Backlog"], ["CO-112", "Write operator recovery runbook", "P1", "Done"]];
const SIM_DATA={"databricks": {"name": "Databricks Workspace", "stats": [["Cluster", "RUNNING"], ["DBR", "16.4 LTS"], ["Active jobs", "7"], ["Failed runs", "1"]], "rows": [["promo_cdf_recovery", "RUNNING", "job-1842", "3m12s"], ["guest_features", "SUCCESS", "job-1839", "6m08s"], ["inventory_stream", "SUCCESS", "job-1838", "continuous"], ["promo_export", "FAILED", "job-1837", "history gap"]]}, "kafka": {"name": "Kafka / Event Stream", "stats": [["Topics", "18"], ["Partitions", "96"], ["Consumer lag", "1.4m"], ["Replay rate", "0.08%"]], "rows": [["reservation.events", "96", "42.8K/min", "healthy"], ["promo.writeback", "24", "2.8K/min", "healthy"], ["legacy.ack", "12", "820/min", "replay-safe"], ["deadletter.events", "6", "14/min", "inspect"]]}, "delta": {"name": "Delta Lake / CDF Explorer", "stats": [["Tables", "37"], ["CDF enabled", "22"], ["Open versions", "706"], ["Table ID", "delta-G1"]], "rows": [["promo_assignment", "701-706", "CDF", "archived"], ["promo_assignment_rebuild", "0-3", "current", "unproven continuity"], ["promo_cdf_archive", "701-706", "immutable", "hash verified"], ["promo_current", "-", "gold", "reconcile"]]}, "mlflow": {"name": "MLflow Observatory", "stats": [["Experiments", "34"], ["Registered", "12"], ["Champion", "v18"], ["Drift alerts", "1"]], "rows": [["occupancy_forecast", "v18", "Production", "slice alert"], ["guest_propensity", "v42", "Production", "healthy"], ["cancel_risk", "v11", "Staging", "gate pending"], ["upgrade_model", "v8", "Archived", "retired"]]}, "airflow": {"name": "Airflow / Workflow Orchestrator", "stats": [["DAGs", "21"], ["Running", "3"], ["Failed", "1"], ["SLA miss", "1"]], "rows": [["promo_recovery", "running", "recover_history", "12:08"], ["daily_inventory", "success", "publish_gold", "08:05"], ["customer_360", "success", "dbt_test", "07:43"], ["feature_backfill", "failed", "point_in_time_join", "06:51"]]}, "dbt": {"name": "dbt Lineage Studio", "stats": [["Models", "148"], ["Tests", "612"], ["Failures", "3"], ["Exposure", "HGV exec"]], "rows": [["stg_promo_assignment", "view", "24 tests", "green"], ["int_promo_current", "incremental", "18 tests", "green"], ["fct_promo_delivery", "table", "22 tests", "green"], ["mart_promo_status", "table", "31 tests", "3 failing"]]}, "github": {"name": "GitHub Release Control", "stats": [["Open PRs", "6"], ["Checks", "47"], ["Blocked", "2"], ["Prod SHA", "d9f6f20"]], "rows": [["PR #184", "promo recovery", "12/12", "ready"], ["PR #185", "checkpoint hotfix", "8/10", "blocked"], ["PR #186", "rbac tightening", "9/9", "ready"], ["PR #187", "cost guardrail", "6/7", "blocked"]]}, "cloud": {"name": "Cloud Architecture Console", "stats": [["Regions", "2"], ["Services", "14"], ["SLO", "99.9%"], ["Open risks", "3"]], "rows": [["Streaming plane", "Kafka + Databricks", "east", "healthy"], ["Warehouse", "Snowflake", "multi-AZ", "healthy"], ["API saga", "Segment + Legacy", "external", "degraded"], ["Observability", "OTel + logs", "global", "healthy"]]}};
const EXT_KEY='cloud_odyssey_extensive_v1';
const EXT_DEFAULT={
 tasks:{},stage:0,drillStarted:null,drillMinutes:120,
 runtime:{pythonRuns:0,sqlRuns:0},
 interview:{mode:'incident',scores:{},index:0,started:null,seconds:2700,answers:{}},
 sprint:{},sim:{tool:'databricks',events:[]}
};
let ext=Object.assign({},EXT_DEFAULT,JSON.parse(localStorage.getItem(EXT_KEY)||'{}'));
ext.runtime=Object.assign({},EXT_DEFAULT.runtime,ext.runtime||{});
ext.interview=Object.assign({},EXT_DEFAULT.interview,ext.interview||{});
ext.sprint=ext.sprint||{};
ext.sim=Object.assign({},EXT_DEFAULT.sim,ext.sim||{});
let pyodideInstance=null,pyodidePromise=null,monacoEditor=null,interviewTimer=null;
const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>Array.from(r.querySelectorAll(s));
const esc=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
function save(){localStorage.setItem(EXT_KEY,JSON.stringify(ext));}
function toast(m){CO.toast(m);}
function completedTasks(){return Object.values(ext.tasks).filter(Boolean).length;}
function taskPct(){return Math.round(completedTasks()/120*100);}
function stageDone(si){return STAGES[si].tasks.filter((t,ti)=>ext.tasks[si+'-'+ti]).length;}
function drillScore(){
 const base=CO.getState(),mission=Math.round(CO.doneCount()/30*100);
 const projects=Math.round(Object.values(base.checks||{}).filter(Boolean).length/60*100);
 return Math.round(taskPct()*.55+mission*.25+projects*.20);
}
function navButton(view,icon,label,num){
 const b=document.createElement('button');b.className='nav-item';b.dataset.view=view;
 b.innerHTML='<span>'+icon+'</span><b>'+label+'</b><em>'+num+'</em>';
 b.onclick=()=>{CO.setView(view);$('#pageTitle').textContent=label;renderEnterpriseView(view);};
 return b;
}
function addEnterpriseViews(){
 const nav=$('#nav');
 [['drill','◫','Enterprise Drill','09'],['simulators','⬡','Platform Simulators','10'],['interview','◉','Interview Arena','11'],['sprint','▤','Engineering Sprint','12'],['portfolio','★','Portfolio & Cert','13']]
 .forEach(x=>nav.appendChild(navButton(...x)));
 $('#workspace').insertAdjacentHTML('beforeend',
 '<section class="view" id="view-drill"></section>'+
 '<section class="view" id="view-simulators"></section>'+
 '<section class="view" id="view-interview"></section>'+
 '<section class="view" id="view-sprint"></section>'+
 '<section class="view" id="view-portfolio"></section>');
}
function renderEnterpriseView(v){
 if(v==='drill')renderDrill();
 if(v==='simulators')renderSimulators();
 if(v==='interview')renderInterview();
 if(v==='sprint')renderSprint();
 if(v==='portfolio')renderPortfolio();
}
function rubricWeightForStage(si){
 if(si<=4)return 35;if(si<=8)return 25;if(si===12)return 15;if(si===9)return 10;if(si===10||si===11)return 10;return 5;
}
function rubricValue(i){
 const map=[[0,1,2,3,4],[5,6,7,8],[12],[9],[10,11],[13,14]],ids=map[i];
 const done=ids.reduce((n,s)=>n+stageDone(s),0),total=ids.length*8;
 return Math.round(done/total*100);
}
function acceptancePass(i){
 const conditions=[[0,1,2,3,4,8],[2,3,4,6,11],[5,7,11],[7,10],[9,11],[12]];
 return conditions[i].every(s=>stageDone(s)>=6);
}
function drillClockText(){
 if(!ext.drillStarted)return '120:00';
 const elapsed=Math.floor((Date.now()-ext.drillStarted)/1000),left=Math.max(0,ext.drillMinutes*60-elapsed);
 return String(Math.floor(left/60)).padStart(3,'0')+':'+String(left%60).padStart(2,'0');
}
function startDrill(){
 if(!ext.drillStarted){ext.drillStarted=Date.now();save();toast('120-minute production drill started');}
 else toast('Drill resumed');
 renderDrill();
}
function pythonFixture(){
 return `# Real browser Python — no network calls
events = [
 {"event":"R02","tenant":"TEN-A","customer":"C100","campaign":"FALL26","seq":8,"offer":"O11","status":"ACTIVE"},
 {"event":"R04","tenant":"TEN-A","customer":"C200","campaign":"FALL26","seq":5,"offer":None,"status":"WITHDRAWN"},
 {"event":"R06","tenant":"TEN-B","customer":"C100","campaign":"FALL26","seq":3,"offer":"O31","status":"ACTIVE"},
 {"event":"R08","tenant":"TEN-B","customer":"C300","campaign":"FALL26","seq":9,"offer":"O41","status":"ACTIVE"},
 {"event":"R10","tenant":"TEN-A","customer":"C400","campaign":"FALL26","seq":1,"offer":"O50","status":"ACTIVE"},
]
def current_state(rows):
 out = {}
 for r in rows:
  key=(r["tenant"],r["customer"],r["campaign"])
  if key not in out or r["seq"] > out[key]["seq"]:
   out[key]=r
 return out

state=current_state(events)
print("keys", len(state))
print("active", sum(v["status"]=="ACTIVE" for v in state.values()))
print("withdrawn", sum(v["status"]=="WITHDRAWN" for v in state.values()))
for k,v in sorted(state.items()):
 print(k, v["seq"], v["offer"], v["status"])`;
}
function sqlFixture(){
 return `-- Executed with Python sqlite3 in the browser.
SELECT tenant_id, customer_id, campaign_id,
       MAX(decision_seq) AS latest_seq
FROM promo_history
GROUP BY tenant_id, customer_id, campaign_id
ORDER BY tenant_id, customer_id;`;
}
function renderDrill(){
 const root=$('#view-drill'),cur=STAGES[ext.stage]||STAGES[0],done=stageDone(ext.stage),total=completedTasks(),score=drillScore();
 root.innerHTML=`
 <div class="drill-hero">
  <article class="drill-intro glass">
   <span class="enterprise-badge">AEGIS-GRADE PRODUCTION DRILL • 120 TASKS</span>
   <h2>Campaign Writeback Recovery — multi-system business-state repair</h2>
   <p>A Databricks promotion export reports success while Segment, a legacy CRM, Snowflake history, feedback messages and certified analytics disagree. Repair source continuity, durable authorization, distributed delivery, audit state, governance and publication—then prove retries and deployments cannot repeat it.</p>
   <div class="hero-actions">
    <button class="primary-btn" id="startDrill">${ext.drillStarted?'Resume 120-minute drill':'Start 120-minute drill'}</button>
    <button class="secondary-btn" id="runAcceptance">Run acceptance gates</button>
    <button class="secondary-btn" id="loadMonaco">Launch Monaco editor</button>
   </div>
  </article>
  <article class="drill-scorecard glass">
   <div class="score-tile"><span>TASKS COMPLETE</span><b>${total}/120</b><em>${taskPct()}% task coverage</em></div>
   <div class="score-tile"><span>READINESS SCORE</span><b>${score}%</b><em>${score>=85?'attempt qualifies':'85 required'}</em></div>
   <div class="score-tile"><span>STAGES</span><b>${STAGES.filter((s,i)=>stageDone(i)===8).length}/15</b><em>8 tasks per stage</em></div>
   <div class="score-tile"><span>TIMEBOX</span><b id="drillClock">${drillClockText()}</b><em>production interview mode</em></div>
  </article>
 </div>
 <div class="enterprise-grid">
  <aside class="enterprise-panel glass"><div class="panel-head"><div><span class="micro">WORK BREAKDOWN</span><h3>15 recovery stages</h3></div><b>${taskPct()}%</b></div><div class="panel-body"><div class="drill-stage-list">${STAGES.map((s,i)=>`<button class="stage-btn ${i===ext.stage?'active':''}" data-stage="${i}"><span class="stage-num">${String(i+1).padStart(2,'0')}</span><div><b>${s.title}</b><span>${s.domain}</span></div><em>${stageDone(i)}/8</em></button>`).join('')}</div></div></aside>
  <section class="enterprise-panel glass">
   <div class="panel-head"><div><span class="micro">STAGE ${String(ext.stage+1).padStart(2,'0')} • ${cur.domain}</span><h3>${cur.title}</h3></div><span class="enterprise-badge">${done}/8</span></div>
   <div class="panel-body">
    <div class="stage-overview"><p>${cur.why}</p><div class="stage-meta"><span class="stage-chip">${cur.tools}</span><span class="stage-chip">Fail-closed evidence</span><span class="stage-chip">Production depth</span></div></div>
    <div class="deep-task-list">${cur.tasks.map((t,ti)=>`<label class="deep-task"><input type="checkbox" data-deep="${ext.stage}-${ti}" ${ext.tasks[ext.stage+'-'+ti]?'checked':''}><div><b>${ti+1}. ${t[0]}</b><p>${t[1]}</p></div><span class="task-points">+${Math.max(1,Math.round(rubricWeightForStage(ext.stage)/8))} pts</span></label>`).join('')}</div>
    <div class="drill-runtime">
     <article class="runtime-card"><div class="runtime-head"><span>PYTHON 3.14 • REAL BROWSER RUNTIME</span><button id="runPython">▶ Run Python</button></div><textarea id="pythonRuntime" class="runtime-code">${esc(pythonFixture())}</textarea><pre id="pythonOut" class="runtime-output">$ runtime cold — first run loads Pyodide</pre></article>
     <article class="runtime-card"><div class="runtime-head"><span>SQL SCRATCHPAD • REAL SQLITE LOGIC</span><button id="runSql">▶ Run SQL</button></div><textarea id="sqlRuntime" class="runtime-code">${esc(sqlFixture())}</textarea><pre id="sqlOut" class="runtime-output">$ sqlite fixture ready after Python runtime initializes</pre></article>
    </div>
    <div id="monacoZone" class="runtime-card hidden" style="margin-top:10px"><div class="runtime-head"><span>MONACO / VS CODE EDITOR</span><button id="closeMonaco">close</button></div><div id="monacoMount" style="height:360px"></div></div>
   </div>
  </section>
  <aside class="enterprise-panel glass">
   <div class="panel-head"><div><span class="micro">EVIDENCE / GATES</span><h3>Recovery proof</h3></div></div>
   <div class="panel-body">
    <div class="evidence-stack">
     <div class="evidence-card"><b>fixture.json</b><span>Source records, replay captures, baselines, manifests</span><code>delta-G1 • v701–706 • 12 captures</code></div>
     <div class="evidence-card"><b>snowflake_fixture.sql</b><span>Isolated LAB_* schemas + baseline objects</span><code>RAW • CURATED • OPS • ANALYTICS</code></div>
     <div class="evidence-card"><b>faulty_job.py</b><span>Broken foreachBatch recovery path to diagnose</span><code>checkpoint drift • history gap • split brain</code></div>
     <div class="evidence-card"><b>mock_destinations.py</b><span>Deterministic receiver simulator</span><code>202 • 429 • timeout • PENDING • conflict</code></div>
    </div>
    <div style="height:12px"></div><span class="micro">SIX ACCEPTANCE CRITERIA</span>
    <div class="acceptance-list">${ACCEPTANCE.map((a,i)=>`<div class="acceptance-item ${acceptancePass(i)?'pass':''}">${i+1}. ${a}</div>`).join('')}</div>
    <div style="height:12px"></div><span class="micro">WEIGHTED GRADING</span>
    <div class="rubric">${RUBRIC.map((r,i)=>{const v=rubricValue(i);return `<div class="rubric-row"><span>${r[0]}</span><div class="rubric-track"><i style="width:${v}%"></i></div><b>${v}%</b></div>`;}).join('')}</div>
   </div>
  </aside>
 </div>`;
 $$('[data-stage]',root).forEach(b=>b.onclick=()=>{ext.stage=+b.dataset.stage;save();renderDrill();});
 $$('[data-deep]',root).forEach(c=>c.onchange=()=>{ext.tasks[c.dataset.deep]=c.checked;save();renderDrill();renderPortfolio();});
 $('#startDrill').onclick=startDrill;
 $('#runAcceptance').onclick=()=>toast(ACCEPTANCE.filter((a,i)=>acceptancePass(i)).length+'/6 acceptance gates currently satisfied');
 $('#runPython').onclick=runPythonRuntime;
 $('#runSql').onclick=runSqlRuntime;
 $('#loadMonaco').onclick=launchMonaco;
}
async function ensurePyodide(){
 if(pyodideInstance)return pyodideInstance;
 if(pyodidePromise)return pyodidePromise;
 pyodidePromise=new Promise((resolve,reject)=>{
  const start=async()=>{try{pyodideInstance=await loadPyodide({indexURL:'https://cdn.jsdelivr.net/pyodide/v314.0.7/full/'});resolve(pyodideInstance);}catch(e){reject(e);}};
  if(window.loadPyodide)return start();
  const s=document.createElement('script');s.src='https://cdn.jsdelivr.net/pyodide/v314.0.7/full/pyodide.js';s.onload=start;s.onerror=reject;document.head.appendChild(s);
 });
 return pyodidePromise;
}
async function runPythonRuntime(){
 const out=$('#pythonOut');out.classList.remove('error');out.textContent='$ loading Python runtime...';
 try{
  const py=await ensurePyodide(),buf=[];
  py.setStdout({batched:s=>buf.push(s)});py.setStderr({batched:s=>buf.push('ERR: '+s)});
  await py.runPythonAsync($('#pythonRuntime').value);
  out.textContent=buf.join('\n')||'(no output)';
  ext.runtime.pythonRuns++;save();
 }catch(e){out.classList.add('error');out.textContent=String(e);}
}
async function runSqlRuntime(){
 const out=$('#sqlOut');out.classList.remove('error');out.textContent='$ loading sqlite runtime...';
 try{
  const py=await ensurePyodide();py.globals.set('USER_SQL',$('#sqlRuntime').value);const buf=[];
  py.setStdout({batched:s=>buf.push(s)});py.setStderr({batched:s=>buf.push('ERR: '+s)});
  await py.runPythonAsync(`import sqlite3
con=sqlite3.connect(":memory:")
cur=con.cursor()
cur.execute("CREATE TABLE promo_history(tenant_id TEXT, customer_id TEXT, campaign_id TEXT, decision_seq INTEGER, offer_id TEXT, status TEXT)")
rows=[
("TEN-A","C100","FALL26",7,"O10","ACTIVE"),("TEN-A","C200","FALL26",4,"O20","ACTIVE"),
("TEN-B","C100","FALL26",2,"O30","ACTIVE"),("TEN-B","C300","FALL26",8,"O40","ACTIVE"),
("TEN-A","C100","FALL26",8,"O11","ACTIVE"),("TEN-A","C200","FALL26",5,None,"WITHDRAWN"),
("TEN-B","C100","FALL26",3,"O31","ACTIVE"),("TEN-B","C300","FALL26",9,"O41","ACTIVE"),
("TEN-A","C400","FALL26",1,"O50","ACTIVE")]
cur.executemany("INSERT INTO promo_history VALUES (?,?,?,?,?,?)",rows)
res=cur.execute(USER_SQL)
print(" | ".join(d[0] for d in res.description) if res.description else "ok")
for row in res.fetchall(): print(" | ".join("NULL" if x is None else str(x) for x in row))
con.close()`);
  out.textContent=buf.join('\n');ext.runtime.sqlRuns++;save();
 }catch(e){out.classList.add('error');out.textContent=String(e);}
}
function launchMonaco(){
 $('#monacoZone').classList.remove('hidden');$('#loadMonaco').textContent='Monaco loading...';
 const mount=()=>{require.config({paths:{vs:'https://cdn.jsdelivr.net/npm/monaco-editor@0.56.0/min/vs'}});require(['vs/editor/editor.main'],()=>{
  if(monacoEditor)monacoEditor.dispose();
  monacoEditor=monaco.editor.create($('#monacoMount'),{value:pythonFixture(),language:'python',theme:'vs-dark',fontSize:12,minimap:{enabled:false},automaticLayout:true,scrollBeyondLastLine:false});
  $('#loadMonaco').textContent='Monaco ready';
  $('#closeMonaco').onclick=()=>$('#monacoZone').classList.add('hidden');
 });};
 if(window.require&&window.require.config)return mount();
 const s=document.createElement('script');s.src='https://cdn.jsdelivr.net/npm/monaco-editor@0.56.0/min/vs/loader.js';s.onload=mount;s.onerror=()=>toast('Monaco CDN unavailable — built-in editor remains active');document.head.appendChild(s);
}
function renderSimulators(){
 const root=$('#view-simulators'),tool=ext.sim.tool||'databricks',d=SIM_DATA[tool];
 root.innerHTML=`<div class="view-heading"><div><span class="micro">INTERACTIVE PLATFORM TRAINER</span><h2>Production platform simulators</h2><p>Operate the same surfaces you need to speak through in an interview: Databricks, Kafka, Delta, MLflow, Airflow, dbt, GitHub release gates and cloud architecture.</p></div><span class="enterprise-badge">STATEFUL SIMULATION</span></div>
 <div class="platform-layout"><aside class="tool-rack glass">${Object.entries(SIM_DATA).map(([k,v])=>`<button class="tool-btn ${k===tool?'active':''}" data-tool="${k}"><b>${v.name}</b><span>open console</span></button>`).join('')}</aside>
 <section class="sim-shell glass"><div class="sim-top"><h3>${d.name}</h3><div class="sim-actions"><button id="simHealthy">Run healthy path</button><button id="simFault">Inject fault</button><button id="simRecover">Recover</button></div></div><div class="sim-body">
 <div class="sim-grid">${d.stats.map(x=>`<div class="sim-stat"><span>${x[0]}</span><b>${x[1]}</b></div>`).join('')}</div>
 <div class="sim-table">${d.rows.map(r=>`<div class="sim-row">${r.map((x,j)=>`<span class="${/failed|degraded|blocked|alert|unproven|inspect/i.test(x)?'sim-danger':(j>1?'sim-status':'')}">${x}</span>`).join('')}</div>`).join('')}</div>
 ${renderToolGraph(tool)}
 <div class="runtime-card" style="margin-top:10px"><div class="runtime-head"><span>OPERATOR EVENT LOG</span><button id="clearSim">clear</button></div><pre class="runtime-output">${(ext.sim.events||[]).slice(-12).join('\n')||'$ simulator ready'}</pre></div>
 </div></section></div>`;
 $$('[data-tool]',root).forEach(b=>b.onclick=()=>{ext.sim.tool=b.dataset.tool;save();renderSimulators();});
 $('#simHealthy').onclick=()=>simEvent('HEALTHY '+d.name+': validations green; no action required');
 $('#simFault').onclick=()=>{simEvent('FAULT '+d.name+': '+simFault(tool));toast('Failure injected into '+d.name);};
 $('#simRecover').onclick=()=>{simEvent('RECOVERY '+d.name+': evidence preserved -> bounded repair -> validation green');toast('Recovery sequence completed');};
 $('#clearSim').onclick=()=>{ext.sim.events=[];save();renderSimulators();};
}
function simEvent(msg){ext.sim.events=ext.sim.events||[];ext.sim.events.push(new Date().toLocaleTimeString()+' '+msg);save();renderSimulators();}
function simFault(t){return {databricks:'checkpoint path changed while old worker still owns batch',kafka:'consumer replay duplicated a logical event at new offset',delta:'source table ID changed after rebuild; continuity unproven',mlflow:'new champion regressed one destination slice',airflow:'recovery task timed out after external side effect',dbt:'semantic mart reconciliation test failed',github:'release check missing rollback evidence',cloud:'external adapter response timed out after apply'}[t];}
function renderToolGraph(tool){
 const labels={databricks:['Bronze CDF','Silver disposition','Gold current','Snowflake publish'],kafka:['Producer','96 partitions','Consumer group','Durable sink'],delta:['delta-G1','CDF archive','continuity gate','delta-G2'],mlflow:['Train','Evaluate','Registry','Champion'],airflow:['Extract','Validate','Recover','Certify'],dbt:['stg_source','int_current','fct_delivery','mart_status'],github:['PR','Tests','Approval','Prod'],cloud:['Source','Streaming','Warehouse','Destinations']}[tool];
 return `<div class="graph-canvas">${labels.map((x,i)=>`<div class="graph-node" style="left:${6+i*24}%;top:${55+(i%2)*120}px"><b>${x}</b><span>${i===2?'policy gate':'production node'}</span></div>${i<labels.length-1?`<div class="graph-line" style="left:${16+i*24}%;top:${88+(i%2)*120}px;width:16%;transform:rotate(${i%2?'-28':'28'}deg)"></div>`:''}`).join('')}</div>`;
}
function interviewClock(){
 if(!ext.interview.started)return '45:00';
 const left=Math.max(0,2700-Math.floor((Date.now()-ext.interview.started)/1000));
 return String(Math.floor(left/60)).padStart(2,'0')+':'+String(left%60).padStart(2,'0');
}
function lastInterviewScore(){const vals=Object.values(ext.interview.scores||{});return vals.length?vals.sort((a,b)=>b.ts-a.ts)[0].score:0;}
function interviewFeedbackHTML(){
 const vals=Object.values(ext.interview.scores||{});
 if(!vals.length)return '<div class="feedback-row">No evaluated answer yet. The grader looks for production boundaries, evidence, failure behavior and business correctness.</div>';
 const x=vals.sort((a,b)=>b.ts-a.ts)[0];
 return x.hits.map(h=>`<div class="feedback-row ${h[1]?'good':'bad'}">${h[1]?'✓':'×'} ${h[0]}</div>`).join('');
}
function renderInterview(){
 const root=$('#view-interview'),mode=ext.interview.mode||'incident',filtered=INTERVIEW_QUESTIONS.filter(q=>q.mode===mode),idx=ext.interview.index%filtered.length,q=filtered[idx],score=lastInterviewScore();
 root.innerHTML=`<div class="view-heading"><div><span class="micro">ADAPTIVE SENIOR INTERVIEWER</span><h2>Interview Arena</h2><p>Defend architecture, code, incident decisions and business tradeoffs. Weak domains repeat until your answers become automatic.</p></div><span class="enterprise-badge">45-MINUTE MODE</span></div>
 <div class="interview-layout">
 <aside class="interview-config glass"><span class="micro">INTERVIEW MODE</span><div class="mode-list" style="margin-top:8px">${[['incident','Incident commander'],['system','System design'],['code','Code defense']].map(x=>`<button class="mode-btn ${mode===x[0]?'active':''}" data-mode="${x[0]}">${x[1]}</button>`).join('')}</div><div class="timer-display" id="interviewClock">${interviewClock()}</div><button class="primary-btn" id="toggleInterview">${ext.interview.started?'Pause / reset timer':'Start 45-minute timer'}</button><div style="height:14px"></div><span class="micro">ADAPTIVE RULE</span><p style="font-size:8px;color:#8296b0;line-height:1.5">Scores below 80 remain in weak-domain rotation. 90+ unlocks harder follow-ups and STAR compression.</p></aside>
 <section class="interview-main glass"><span class="micro">${mode.toUpperCase()} • QUESTION ${idx+1}/${filtered.length}</span><div class="question-card"><h3>${q.q}</h3><p>Answer as if the interviewer can inspect every production assumption.</p></div><textarea id="interviewAnswer" class="interview-answer" placeholder="Speak/write your answer here...">${esc(ext.interview.answers[mode+'-'+idx]||'')}</textarea><div class="interview-actions"><button class="primary" id="gradeInterview">Evaluate answer</button><button id="nextInterview">Next question</button><button id="idealInterview">Reveal ideal outline</button><button id="starInterview">Generate STAR</button></div><div id="idealBox"></div></section>
 <aside class="interview-score glass"><span class="micro">LATEST SCORE</span><div class="score-ring" style="--score:${score}%"><b>${score}%</b></div><div class="feedback-list">${interviewFeedbackHTML()}</div></aside></div>`;
 $$('[data-mode]',root).forEach(b=>b.onclick=()=>{ext.interview.mode=b.dataset.mode;ext.interview.index=0;save();renderInterview();});
 $('#toggleInterview').onclick=()=>{ext.interview.started=ext.interview.started?null:Date.now();save();renderInterview();startInterviewTimer();};
 $('#gradeInterview').onclick=()=>gradeInterview(q,mode,idx);
 $('#nextInterview').onclick=()=>{ext.interview.answers[mode+'-'+idx]=$('#interviewAnswer').value;ext.interview.index=(idx+1)%filtered.length;save();renderInterview();};
 $('#idealInterview').onclick=()=>$('#idealBox').innerHTML='<div class="feedback-row good" style="margin-top:9px"><b>Ideal outline:</b><br>'+q.ideal+'</div>';
 $('#starInterview').onclick=()=>$('#idealBox').innerHTML='<div class="feedback-row good" style="margin-top:9px"><b>STAR pattern:</b><br>'+starForQuestion(q)+'</div>';
 startInterviewTimer();
}
function startInterviewTimer(){
 if(interviewTimer)clearInterval(interviewTimer);if(!ext.interview.started)return;
 interviewTimer=setInterval(()=>{const el=$('#interviewClock');if(!el)return clearInterval(interviewTimer);el.textContent=interviewClock();const m=+el.textContent.split(':')[0];el.classList.toggle('warning',m<10);el.classList.toggle('danger',m<3);},1000);
}
function gradeInterview(q,mode,idx){
 const ans=$('#interviewAnswer').value.trim(),low=ans.toLowerCase();ext.interview.answers[mode+'-'+idx]=ans;
 const hits=q.keys.filter(k=>low.includes(k.toLowerCase()));let score=Math.round(hits.length/q.keys.length*75)+Math.min(25,Math.floor(ans.length/35));score=Math.min(100,score);
 ext.interview.scores[mode+'-'+idx]={score,hits:q.keys.map(k=>[k,low.includes(k.toLowerCase())]),ts:Date.now()};save();renderInterview();toast(score>=85?'Senior signal strong: '+score+'%':'Answer needs another pass: '+score+'%');
}
function starForQuestion(q){return 'Situation: production campaign state diverged across source, Snowflake and destinations. Task: restore one certified business truth without duplicate effects. Action: '+q.ideal+' Result: reconciled state, repeatable recovery controls, bounded evidence and explicit release gates.';}
function ticketHTML(t,col){
 return `<article class="ticket"><span class="ticket-key">${t[0]}</span><b>${t[1]}</b><p>Production recovery deliverable with evidence, tests and rollback implications.</p><div class="ticket-footer"><span class="priority ${t[2].toLowerCase()}">${t[2]}</span>${col!=='Done'?`<button data-advance="${t[0]}">ADVANCE →</button>`:'<span class="sim-status">✓ complete</span>'}</div></article>`;
}
function managerMessage(){
 const d=Object.values(ext.sprint).filter(x=>x==='Done').length;
 if(d<3)return 'Do not optimize yet. First prove source continuity, authorization history and stable operation identity. I want one reconciled key end-to-end before scale work.';
 if(d<8)return 'Now harden concurrency and publication. Demonstrate timeout-after-apply, overlapping workers and a blocked same-sequence conflict.';
 return 'Finish with bounded performance evidence, RBAC negative tests, operator runbook and a 90-second design defense.';
}
function advanceTicket(k){const order=['Backlog','In Progress','Review','Done'],i=order.indexOf(ext.sprint[k]);ext.sprint[k]=order[Math.min(order.length-1,i+1)];save();renderSprint();}
function renderSprint(){
 const root=$('#view-sprint'),cols=['Backlog','In Progress','Review','Done'];
 root.innerHTML=`<div class="view-heading"><div><span class="micro">AI ENGINEERING MANAGER • JIRA-STYLE BOARD</span><h2>Recovery Sprint</h2><p>Move tickets from diagnosis to done. The board mirrors how a senior engineer decomposes a production incident into owned deliverables.</p></div><span class="enterprise-badge">${Object.values(ext.sprint).filter(x=>x==='Done').length}/12 DONE</span></div>
 <div class="manager-row"><article class="manager-card glass"><span class="micro">ENGINEERING MANAGER</span><h3>Current direction</h3><p>${managerMessage()}</p><button class="secondary-btn" id="managerAssign">Assign my next ticket</button></article><article class="manager-card glass"><span class="micro">PAGERDUTY QUEUE</span><div class="pager-list"><div class="pager-item"><span class="sev">SEV-1</span><span>Promotion writeback divergence</span><button id="openWar">OPEN</button></div><div class="pager-item"><span class="sev">SEV-2</span><span>Feature freshness near breach</span><button id="openSim">OPEN</button></div></div></article></div>
 <div class="sprint-grid">${cols.map(col=>`<section class="sprint-col glass"><div class="sprint-col-head"><h3>${col}</h3><span>${SPRINT_TICKETS.filter(t=>ext.sprint[t[0]]===col).length}</span></div>${SPRINT_TICKETS.filter(t=>ext.sprint[t[0]]===col).map(t=>ticketHTML(t,col)).join('')}</section>`).join('')}</div>`;
 $$('[data-advance]',root).forEach(b=>b.onclick=()=>advanceTicket(b.dataset.advance));
 $('#managerAssign').onclick=()=>{const t=SPRINT_TICKETS.find(t=>ext.sprint[t[0]]==='Backlog');if(t){ext.sprint[t[0]]='In Progress';save();toast('Manager assigned '+t[0]);renderSprint();}else toast('No backlog tickets left');};
 $('#openWar').onclick=()=>{CO.setView('warroom');$('#pageTitle').textContent='Incident War Room';};
 $('#openSim').onclick=()=>{CO.setView('simulators');$('#pageTitle').textContent='Platform Simulators';renderSimulators();};
}
function portfolioEvidence(){return [
 ['Source continuity','Distinguish table identity from table name, prove archive manifests, and block unapproved source replacement.'],
 ['Streaming correctness','Classify CDF change types, retain physical capture evidence and handle replay without phantom decisions.'],
 ['Distributed delivery','Use authorization-before-send, stable operation IDs, receiver lookup and reconciliation instead of a distributed transaction.'],
 ['Warehouse integrity','Repair bounded Snowflake history/current state while preserving original audit timestamps and immutable release evidence.'],
 ['Incident recovery','Fence workers, preserve evidence, inject failures, bound blast radius and publish only after explicit gates.'],
 ['Governance','Design tenant-safe certified interfaces plus Snowflake and Unity Catalog negative-access tests.'],
 ['Performance','Define measurable time/cost/scan/request-rate targets without claiming unverified production benchmarks.'],
 ['Communication','Convert the system into architecture defense, STAR narrative, rollback explanation and operator hand-off.']
];}
function portfolioStories(){return [
 ['Campaign writeback recovery','Led a multi-system recovery simulation where promotion decisions diverged across Databricks CDF, Snowflake authorization history, Segment and a legacy CRM. Designed bounded source-continuity proof, authorization-before-delivery, stable idempotent operations, reconciliation and atomic certification to prevent duplicate effects and unsafe publication.'],
 ['Streaming reliability','Designed replay-safe processing that separated physical captures from logical business revisions, preserved source-table identity and CDF evidence, fenced overlapping workers, and recovered only from a proven frontier instead of trusting ephemeral batch IDs.'],
 ['Production governance','Implemented a least-privilege pattern separating ingestion, validation, mutation, delivery and publication roles, with tenant-scoped certified views and negative-access tests for Raw, recovery ledgers and failed candidates.']
];}
function renderPortfolio(){
 const root=$('#view-portfolio'),base=CO.getState(),score=Math.round(drillScore()*.7+(lastInterviewScore()||0)*.15+(Object.values(ext.sprint).filter(x=>x==='Done').length/12*100)*.15),stageComplete=STAGES.filter((s,i)=>stageDone(i)===8).length;
 root.innerHTML=`<div class="view-heading"><div><span class="micro">AUTO-GENERATED EVIDENCE PORTFOLIO</span><h2>Production Readiness Portfolio</h2><p>Your portfolio is derived from work completed in the lab—not a self-declared skills list.</p></div><button class="primary-btn" id="printPortfolio">Print / save certificate</button></div>
 <div class="portfolio-hero"><article class="certificate glass"><span class="enterprise-badge">CLOUD ODYSSEY • HGV ML/AI DATA ENGINEER</span><h2>Kellon Lewis</h2><div class="cert-score">${score}%</div><p>Production-readiness evidence across data platform engineering, ML systems, release safety, incident recovery, governance and business-state reconciliation. Based on ${CO.doneCount()} mastered missions, ${completedTasks()} deep-recovery tasks, ${stageComplete} completed stages and ${Object.keys(ext.interview.scores||{}).length} evaluated interview answers.</p></article><article class="portfolio-stats glass"><div class="score-tile"><span>MISSIONS</span><b>${CO.doneCount()}/30</b></div><div class="score-tile"><span>DEEP TASKS</span><b>${completedTasks()}/120</b></div><div class="score-tile"><span>PROJECT ARTIFACTS</span><b>${Object.values(base.checks||{}).filter(Boolean).length}/60</b></div><div class="score-tile"><span>SPRINT TICKETS</span><b>${Object.values(ext.sprint).filter(x=>x==='Done').length}/12</b></div></article></div>
 <section class="portfolio-section glass"><span class="micro">EVIDENCE PACK</span><h3>What the portfolio can prove</h3><div class="evidence-grid">${portfolioEvidence().map(x=>`<div class="evidence-tile"><b>${x[0]}</b><p>${x[1]}</p></div>`).join('')}</div></section>
 <section class="portfolio-section glass"><span class="micro">STAR / RESUME TRANSFER</span><h3>Generated production stories</h3>${portfolioStories().map((x,i)=>`<div class="story-card"><b>${x[0]}</b><p id="story-${i}">${x[1]}</p><button class="copy-btn" data-copy="story-${i}">Copy</button></div>`).join('')}</section>`;
 $('#printPortfolio').onclick=()=>window.print();
 $$('[data-copy]',root).forEach(b=>b.onclick=()=>{if(navigator.clipboard)navigator.clipboard.writeText($('#'+b.dataset.copy).textContent);toast('Copied to clipboard');});
}
function init(){
 SPRINT_TICKETS.forEach(t=>{if(!ext.sprint[t[0]])ext.sprint[t[0]]=t[3];});
 addEnterpriseViews();renderDrill();renderSimulators();renderInterview();renderSprint();renderPortfolio();save();
 setInterval(()=>{if($('#view-drill')&&$('#view-drill').classList.contains('active')&&$('#drillClock'))$('#drillClock').textContent=drillClockText();},1000);
}
init();
})();