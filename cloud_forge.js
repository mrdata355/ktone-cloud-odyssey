
(function(){
"use strict";
if(!window.CloudOdyssey){console.error("Cloud Forge requires CloudOdyssey");return;}
var CO=window.CloudOdyssey, KEY="cloud_odyssey_cloud_forge_v1";
var st=Object.assign({provider:"aws",project:0,checks:{},evidence:{},terminal:{}},JSON.parse(localStorage.getItem(KEY)||"{}"));
var $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>Array.from((r||document).querySelectorAll(s));
var save=()=>localStorage.setItem(KEY,JSON.stringify(st));
var esc=s=>String(s||"").replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));

function Project(id,provider,title,icon,scenario,services,flow,why,alt,files,commands){
 return {id,provider,title,icon,scenario,services,flow,why,alt,files,commands};
}
var commonStages=[
["Architecture & grain","Declare business outcome, source/target grain, authoritative state, boundaries and expected failure modes."],
["Identity & IAM","Create least-privilege identities/roles, service-to-service permissions, secrets and tenant/data boundaries."],
["Infrastructure as Code","Provision core resources with Terraform/CloudFormation/CDK or Terraform for GCP; plan before apply."],
["Ingestion / API contract","Define schema, idempotency key, versioning, retries, dead-letter/quarantine behavior and source evidence."],
["Transform / compute","Implement deterministic transformations with bounded state, partitioning and replay/backfill behavior."],
["Storage / serving model","Choose partitioning/clustering/indexing/table format and declare current vs historical state semantics."],
["Orchestration / CI-CD","Version workflows, tests, approvals, environment config and promotion/rollback gates."],
["Data quality / tests","Add contract, uniqueness, completeness, freshness, reconciliation and failure-injection tests."],
["Observability / SLO","Instrument logs, metrics, traces, lag/freshness/error budgets and business-level alerts."],
["Performance / FinOps","Measure bytes/events, compute, queue/spill, request rates and unit cost; optimize before scaling blindly."],
["Incident / rollback","Inject a realistic failure, preserve evidence, bound blast radius, recover from known-good/proven state and reconcile."],
["Stakeholder handoff","Explain business impact, architecture WHY, residual risk, runbook, ownership and evidence to technical + executive audiences."]
];
var aws=[
Project("aws-serverless-api","aws","Serverless Reservation API","λ","Build a production reservation API that remains idempotent under client retries and scales without managing servers.",["API Gateway","Lambda","DynamoDB","IAM","CloudWatch","X-Ray"],["Client","API Gateway","Lambda","DynamoDB","CloudWatch"],"Serverless fits bursty request-driven traffic while DynamoDB conditional writes can protect idempotent reservation commands.","A long-running EC2 service gives more control but adds patching, scaling and capacity operations.",[
["infra/main.tf","Core API Gateway, Lambda, DynamoDB resources."],["src/handler.py","Reservation command handler."],["tests/test_idempotency.py","Proves duplicate request IDs create one effect."],["iam.tf","Least-privilege runtime policy."],["runbook.md","Timeout, throttling and rollback procedure."]
],["aws sts get-caller-identity","terraform plan","aws dynamodb describe-table --table-name reservations","aws logs tail /aws/lambda/reservation-api --follow"]),
Project("aws-streaming","aws","Real-Time Reservation Stream","≋","Ingest reservation events continuously, preserve raw evidence, deduplicate replay, and publish trusted occupancy data.",["Kinesis Data Streams","Managed Service for Apache Flink","S3","Glue Data Catalog","Redshift","CloudWatch"],["Producers","Kinesis","Flink","S3 Bronze","Redshift Gold"],"Managed streaming plus durable object storage separates transport/replay evidence from serving state.","Batch-only Glue jobs can be simpler when sub-minute freshness is not required.",[
["infra/stream.tf","Kinesis/Flink/S3 resources."],["flink/job.py","Stateful dedupe/window logic."],["sql/reconcile.sql","Source-to-Gold reconciliation."],["tests/replay_fixture.json","Duplicate/late-event fixture."],["runbook.md","Checkpoint/savepoint recovery."]
],["aws kinesis describe-stream-summary --stream-name reservations","aws s3 ls s3://reservation-bronze/","terraform plan","aws cloudwatch get-metric-data --metric-data-queries file://queries.json"]),
Project("aws-lakehouse","aws","Governed S3 Lakehouse","◫","Build Bronze/Silver/Gold datasets on S3 with governed catalog access and queryable table semantics.",["S3","AWS Glue","Lake Formation","Athena","EMR Serverless","CloudTrail"],["Sources","S3 Bronze","Glue/EMR Silver","S3 Gold","Athena"],"Object storage plus catalog/governance gives low-cost durable history with separated raw and certified layers.","Loading every dataset directly into a warehouse can be simpler for small structured workloads but costs more for raw history.",[
["infra/lakehouse.tf","Buckets, catalog and permissions."],["jobs/silver_transform.py","Validated transformation."],["sql/gold_occupancy.sql","Business-serving model."],["governance/lakeformation.md","Role/data-location permissions."],["tests/data_contract.yml","Schema and quality expectations."]
],["aws s3api list-buckets","aws glue get-databases","aws athena start-query-execution --query-string 'SELECT 1' --result-configuration OutputLocation=s3://query-results/","terraform plan"]),
Project("aws-redshift","aws","Redshift Analytics Platform","▥","Create a dimensional warehouse for reservation, resort, customer and revenue analytics with bounded incremental loads.",["Redshift Serverless","S3","Glue Data Catalog","IAM","CloudWatch"],["S3","COPY/External","Staging","Dim/Fact","BI"],"Redshift is appropriate for governed SQL analytics where dimensional models and predictable warehouse serving matter.","Athena can be lower-ops for sporadic query-on-lake workloads; Redshift provides a stronger persistent warehouse serving model.",[
["infra/redshift.tf","Namespace/workgroup/network/IAM."],["sql/stg_reservation.sql","Typed staging."],["sql/fct_reservation_night.sql","Declared-grain fact model."],["sql/reconcile.sql","Source-to-fact checks."],["runbook.md","WLM/query regression response."]
],["aws redshift-serverless list-workgroups","terraform plan","aws s3 ls s3://warehouse-stage/","aws cloudwatch list-metrics --namespace AWS/Redshift-Serverless"]),
Project("aws-event-etl","aws","Event-Driven ETL Orchestration","⇢","When a partner file arrives, validate it, transform it, publish curated data, and notify downstream consumers with rerunnable workflow state.",["S3","EventBridge","Step Functions","Lambda","Glue","SNS"],["Partner S3","EventBridge","Step Functions","Lambda Validate","Glue","SNS"],"Step Functions makes cross-service workflow state, retries and compensation visible rather than burying orchestration in one Lambda.","A single Lambda is simpler for short atomic tasks but becomes hard to operate as steps and retries multiply.",[
["infra/workflow.tf","EventBridge/Step Functions/Glue resources."],["statemachine.asl.json","Workflow states/retries."],["src/validate.py","Contract validation."],["tests/failure_cases.json","Malformed/duplicate/timeout fixtures."],["runbook.md","Partial-step recovery."]
],["aws stepfunctions list-state-machines","aws events list-rules","terraform plan","aws glue get-jobs"]),
Project("aws-realtime-ml","aws","Real-Time Risk Scoring","⚡","Score reservation or payment events in real time with controlled feature freshness, latency and fallback behavior.",["Kinesis","Lambda","SageMaker","DynamoDB","CloudWatch"],["Events","Kinesis","Lambda Feature Lookup","SageMaker Endpoint","Decision Store"],"Separating streaming transport, feature lookup and model endpoint creates explicit latency/failure boundaries.","Batch scoring is simpler and cheaper when decisions do not require low-latency responses.",[
["infra/ml_serving.tf","Stream, endpoint, roles, alarms."],["src/score.py","Feature lookup + inference."],["tests/test_fallback.py","Stale/missing feature behavior."],["monitoring/alarms.tf","Latency/error/freshness alarms."],["runbook.md","Endpoint/model rollback."]
],["aws sagemaker list-endpoints","aws kinesis list-streams","aws cloudwatch list-alarms","terraform plan"]),
Project("aws-sagemaker-mlops","aws","SageMaker MLOps Factory","◇","Train, evaluate, register, approve, deploy and monitor models with reproducible lineage and rollback.",["SageMaker Pipelines","Model Registry","ECR","S3","CloudWatch","CodeBuild"],["S3 Training Data","Pipeline","Model Registry","Approval","Endpoint"],"A registry and gated pipeline separate experiment success from controlled production promotion.","Notebook-to-endpoint manual deployment is faster for prototypes but weak for auditability and rollback.",[
["infra/mlops.tf","Pipeline roles/buckets/ECR."],["pipeline/pipeline.py","Train/evaluate/register flow."],["tests/model_gate.py","Slice + threshold checks."],["monitoring/model_monitor.md","Drift/quality policy."],["runbook.md","Champion rollback."]
],["aws sagemaker list-model-package-groups","aws sagemaker list-pipelines","aws ecr describe-repositories","terraform plan"]),
Project("aws-bedrock-rag","aws","Bedrock Knowledge Assistant","✦","Create a governed resort-policy assistant that answers only from approved current evidence and traces its sources.",["Amazon Bedrock","S3","Knowledge Bases for Amazon Bedrock","Lambda","API Gateway","CloudWatch"],["Approved Docs","S3","Knowledge Base","Bedrock","API"],"Retrieval grounding keeps changing policy knowledge outside model weights and makes citations/version evidence possible.","Fine-tuning can shape behavior but is not the best mechanism for frequently changing factual policy content.",[
["infra/rag.tf","Buckets/API/roles."],["src/retrieve_answer.py","Retrieval + answer flow."],["eval/eval_set.json","Grounding/citation tests."],["governance/document_policy.md","Effective-date/source rules."],["runbook.md","Bad-source rollback."]
],["aws bedrock list-foundation-models","aws s3 ls","terraform plan","aws logs describe-log-groups"]),
Project("aws-governance","aws","Lake Governance & Data Quality","⌂","Apply least privilege, sensitive-data controls, quality gates and access evidence across a multi-zone data platform.",["Lake Formation","Glue Data Quality","Macie","CloudTrail","S3","IAM"],["Raw S3","Catalog","Quality Gate","Governed Views","Consumers"],"Governance must be executable through permissions, quality rules and audit evidence—not only documentation.","Broad shared IAM roles are easier initially but create uncontrolled data access and weak accountability.",[
["infra/governance.tf","IAM/Lake Formation/Macie resources."],["quality/ruleset.txt","Data-quality rules."],["tests/rbac_negative.md","Unauthorized-access tests."],["classification/pii.yml","Sensitive fields."],["audit/README.md","CloudTrail evidence procedure."]
],["aws lakeformation list-permissions","aws macie2 get-macie-session","aws cloudtrail describe-trails","terraform plan"]),
Project("aws-airflow","aws","Managed Airflow Data Platform","⌁","Orchestrate batch ingestion, validation, dbt/SQL models and publish gates with observable retries and backfills.",["MWAA","S3","Glue","Redshift","CloudWatch","Secrets Manager"],["Sources","MWAA","Glue","Redshift Models","Publish Gate"],"Airflow is useful when dependencies, scheduling, retries and backfills span multiple data jobs and systems.","Step Functions may be better for event-driven service workflows; Airflow excels at data DAG scheduling/backfill semantics.",[
["dags/reservation_daily.py","Production DAG."],["infra/mwaa.tf","Environment/network/roles."],["tests/test_dag.py","DAG structure/contract checks."],["sql/reconcile.sql","Publish gate."],["runbook.md","Backfill and failed-task recovery."]
],["aws mwaa list-environments","aws secretsmanager list-secrets","terraform plan","aws cloudwatch list-metrics --namespace AmazonMWAA"]),
Project("aws-finops","aws","Cloud Data FinOps Control Plane","$","Attribute cloud data-platform cost, detect regressions, enforce budgets, and connect cost to workload/business units.",["Cost and Usage Reports","S3","Athena","AWS Budgets","Cost Explorer","QuickSight"],["CUR","S3","Athena","Cost Mart","Budgets/Dashboard"],"Cost attribution and unit economics let teams optimize workload design rather than reacting only to monthly totals.","Simply shrinking instances can reduce performance without addressing scan, idle time or inefficient workload shape.",[
["infra/finops.tf","CUR bucket/budgets."],["sql/cost_by_workload.sql","Tagged cost attribution."],["sql/unit_cost.sql","Cost per 1K events/jobs."],["alerts/budget_policy.md","Threshold/owner/action."],["runbook.md","Cost anomaly response."]
],["aws ce get-cost-and-usage --time-period Start=2026-09-01,End=2026-10-01 --granularity MONTHLY --metrics UnblendedCost","aws budgets describe-budgets --account-id 000000000000","terraform plan","aws athena list-work-groups"]),
Project("aws-dr","aws","Multi-System Incident Recovery","⛨","Design a resilient data service with backup, replay, known-good release, cross-region considerations and evidence-driven recovery.",["S3","DynamoDB","Route 53","EventBridge","CloudWatch","AWS Backup"],["Primary Region","Durable Evidence","Recovery Workflow","Secondary Path","Certified Resume"],"Recovery design must prove data/business continuity, not merely that infrastructure can restart.","Active-active everywhere can reduce failover time but adds complex consistency and cost; choose it only where objectives justify it.",[
["infra/dr.tf","Backup/replication/failover resources."],["recovery/reconcile.py","State verification."],["tests/failure_injection.md","Region/service failure scenarios."],["runbook.md","RTO/RPO and failover sequence."],["postmortem/template.md","Evidence + corrective actions."]
],["aws backup list-backup-vaults","aws route53 list-hosted-zones","aws dynamodb list-tables","terraform plan"])
];

var gcp=[
Project("gcp-streaming","gcp","Pub/Sub → Dataflow → BigQuery","≋","Stream reservation events into BigQuery with replay-safe processing, dead-letter handling and business reconciliation.",["Pub/Sub","Dataflow","BigQuery","Cloud Storage","Cloud Monitoring","IAM"],["Producers","Pub/Sub","Dataflow","BigQuery","BI"],"Pub/Sub plus Dataflow gives managed event transport and stateful stream processing while BigQuery serves analytical state.","Batch Cloud Storage loads are simpler when latency requirements are hourly/daily rather than near-real-time.",[
["infra/main.tf","Topics, subscriptions, datasets, roles."],["dataflow/pipeline.py","Beam transformations."],["sql/reconcile.sql","Source-to-BigQuery checks."],["tests/replay_fixture.json","Duplicate/late-event cases."],["runbook.md","DLQ/replay/restart."]
],["gcloud pubsub topics list","gcloud dataflow jobs list --region=us-central1","bq ls","terraform plan"]),
Project("gcp-bigquery","gcp","BigQuery Analytics Platform","▥","Build partitioned/clustering-aware reservation and revenue marts with tested semantic grain and bounded incremental processing.",["BigQuery","Cloud Storage","Dataform","Cloud Monitoring","IAM"],["Cloud Storage","BigQuery Raw","Dataform Staging","Fact/Dim","BI"],"BigQuery is strong for serverless analytical SQL and can separate storage/compute while using partitioning/clustering for scan control.","Cloud SQL is better for transactional row-oriented workloads requiring frequent point updates and OLTP semantics.",[
["infra/bigquery.tf","Datasets/tables/IAM."],["definitions/fct_reservation.sqlx","Fact model."],["definitions/assertions.sqlx","Quality assertions."],["sql/cost_reconcile.sql","Bytes/business reconciliation."],["runbook.md","Query regression response."]
],["gcloud projects list","bq ls","bq query --use_legacy_sql=false 'SELECT 1'","terraform plan"]),
Project("gcp-cloud-run","gcp","Cloud Run Reservation Service","◉","Deploy a containerized reservation API that autoscales, uses external durable state, and handles request retries safely.",["Cloud Run","Artifact Registry","Cloud SQL","Secret Manager","Cloud Logging","IAM"],["Client","Cloud Run","Cloud SQL","Logging"],"Cloud Run is fully managed container compute; a request-driven reservation API maps naturally to a managed service while durable state remains external.","GKE provides deeper orchestration/control but carries more platform complexity when a managed stateless service is sufficient.",[
["infra/cloud_run.tf","Service, IAM, database connectivity."],["src/app.py","Reservation API."],["Dockerfile","Container build."],["tests/test_idempotency.py","Retry-safe API behavior."],["runbook.md","Revision rollback and DB failure."]
],["gcloud run services list","gcloud artifacts repositories list","gcloud sql instances list","terraform plan"]),
Project("gcp-lake","gcp","Cloud Storage Lakehouse","◫","Create governed raw/clean/curated data zones with Spark processing and BigQuery serving.",["Cloud Storage","Dataproc Serverless","BigQuery","Dataplex Universal Catalog","IAM","Cloud Logging"],["Sources","GCS Raw","Dataproc Clean","BigQuery Curated","Consumers"],"Cloud Storage preserves inexpensive durable history while Dataproc/BigQuery provide compute paths and Dataplex adds governance/catalog capabilities.","Putting raw semi-structured history directly into curated BigQuery tables can simplify small use cases but weakens separation of evidence and serving state.",[
["infra/lake.tf","Buckets, datasets, service accounts."],["jobs/silver.py","Spark cleaning."],["sql/gold.sql","Curated BigQuery model."],["governance/catalog.md","Dataplex/catalog policy."],["runbook.md","Bad partition/reprocess."]
],["gcloud storage buckets list","gcloud dataproc batches list --region=us-central1","bq ls","terraform plan"]),
Project("gcp-composer","gcp","Cloud Composer Data Orchestration","⌁","Orchestrate ingestion, Dataflow/BigQuery transforms, quality gates and backfills with Airflow semantics.",["Cloud Composer","BigQuery","Dataflow","Cloud Storage","Secret Manager","Cloud Monitoring"],["Sources","Composer DAG","Dataflow/BigQuery","Quality Gate","Publish"],"Composer gives managed Airflow dependency/backfill semantics for data workflows spanning GCP services.","Workflows can be lighter for service orchestration that does not need Airflow-style DAG/backfill behavior.",[
["dags/reservation_daily.py","Airflow DAG."],["infra/composer.tf","Environment/network/roles."],["tests/test_dag.py","Dependency checks."],["sql/reconcile.sql","Publish gate."],["runbook.md","Backfill/retry."]
],["gcloud composer environments list --locations us-central1","gcloud dataflow jobs list --region=us-central1","terraform plan","gcloud logging logs list"]),
Project("gcp-vertex-mlops","gcp","Vertex AI MLOps Factory","◇","Train, evaluate, register, deploy and monitor models with reproducible datasets, artifacts and promotion gates.",["Vertex AI Pipelines","Vertex AI Model Registry","Artifact Registry","Cloud Storage","Cloud Monitoring"],["Training Data","Pipeline","Model Registry","Approval","Endpoint"],"A managed pipeline/registry separates experimentation from governed production lifecycle and rollback.","Notebook-only manual deployment is appropriate for prototypes but weak for repeatability and production change control.",[
["infra/vertex.tf","Buckets, service accounts, registry resources."],["pipeline/pipeline.py","Train/evaluate/register."],["tests/model_gate.py","Slice/quality gates."],["monitoring/drift.md","Monitoring policy."],["runbook.md","Endpoint/model rollback."]
],["gcloud ai models list --region=us-central1","gcloud ai endpoints list --region=us-central1","gcloud artifacts repositories list","terraform plan"]),
Project("gcp-rag","gcp","Vertex AI RAG Assistant","✦","Build a resort-policy assistant with approved documents, retrieval evidence, citations, security boundaries and controlled deployment.",["Vertex AI","Vertex AI Vector Search","Cloud Storage","Cloud Run","Secret Manager","Cloud Logging"],["Approved Docs","Cloud Storage","Vector Index","Vertex AI","Cloud Run API"],"External retrieval keeps changing policy knowledge versioned and inspectable while the generation layer remains replaceable.","Fine-tuning can improve style/task behavior but should not be the sole store for frequently changing operational policy facts.",[
["infra/rag.tf","Storage, index, service, IAM."],["src/retrieve.py","Retrieval and grounding."],["eval/eval_set.json","Citation/grounding evaluation."],["governance/source_policy.md","Approved/effective documents."],["runbook.md","Bad-index/source rollback."]
],["gcloud run services list","gcloud storage buckets list","gcloud ai indexes list --region=us-central1","terraform plan"]),
Project("gcp-dataform","gcp","BigQuery Dataform Transformation Factory","▤","Version SQL transformations, dependencies, assertions and release configs for analytics marts.",["Dataform","BigQuery","Cloud Build","IAM","Cloud Monitoring"],["BigQuery Raw","Dataform Staging","Intermediate","Marts","Assertions"],"Dataform makes BigQuery SQL dependencies, assertions and releases explicit in a native transformation workflow.","Ad-hoc scheduled queries may be simpler for one small job but become harder to review and govern as dependencies grow.",[
["workflow_settings.yaml","Project defaults."],["definitions/stg_reservation.sqlx","Staging model."],["definitions/fct_occupancy.sqlx","Fact model."],["definitions/assertions.sqlx","Quality checks."],["README.md","Release and ownership guide."]
],["gcloud dataform repositories list --region=us-central1","bq ls","terraform plan","gcloud builds list"]),
Project("gcp-dataplex","gcp","Dataplex Governance & Quality","⌂","Create discoverable, classified, quality-controlled data products with clear ownership and access boundaries.",["Dataplex Universal Catalog","BigQuery","Cloud Storage","IAM","Cloud Audit Logs","Sensitive Data Protection"],["Raw/Curated Assets","Catalog","Quality/Classification","Authorized Consumers"],"Governance becomes operational when metadata, quality, access and audit evidence are attached to actual data assets.","A spreadsheet inventory is easier initially but cannot enforce access or stay synchronized with platform state.",[
["infra/governance.tf","IAM/catalog resources."],["quality/rules.yml","Quality contract."],["classification/pii.yml","Sensitive fields."],["tests/access_negative.md","Unauthorized-access tests."],["runbook.md","Policy violation response."]
],["gcloud dataplex lakes list --location=us-central1","gcloud logging logs list","bq ls","terraform plan"]),
Project("gcp-event","gcp","Event-Driven Cloud Run Pipeline","⇢","React to storage or Pub/Sub events, validate payloads, run bounded work, and preserve retry-safe state.",["Eventarc","Pub/Sub","Cloud Run","Cloud Storage","Firestore","Cloud Logging"],["Event Source","Eventarc/PubSub","Cloud Run","Firestore State","Downstream"],"Eventarc/Pub/Sub with Cloud Run keeps event routing separate from stateless application compute and durable state.","A polling cron job is simpler for low-volume systems where event latency and scale are not important.",[
["infra/events.tf","Eventarc/PubSub/Run/IAM."],["src/worker.py","Event handler."],["tests/test_replay.py","Duplicate-event behavior."],["monitoring/alerts.tf","Failure/age alarms."],["runbook.md","Poison event and retry."]
],["gcloud eventarc triggers list","gcloud pubsub topics list","gcloud run services list","terraform plan"]),
Project("gcp-finops","gcp","GCP Data FinOps Control Plane","$","Export billing data, attribute cost to projects/workloads, detect query regressions and enforce budget actions.",["Cloud Billing export","BigQuery","Budgets & alerts","Cloud Monitoring","Looker Studio"],["Billing Export","BigQuery Cost Mart","Unit Economics","Budgets/Dashboard"],"Billing export plus workload labels creates queryable cost evidence and supports unit economics instead of monthly-total guessing.","Only watching the billing console reacts after spend occurs and does not explain which workload design caused it.",[
["infra/billing.tf","Budget/notification resources."],["sql/cost_by_project.sql","Cost attribution."],["sql/bq_query_cost.sql","BigQuery scan/unit-cost analysis."],["alerts/budget.md","Threshold/action policy."],["runbook.md","Cost anomaly response."]
],["gcloud billing accounts list","bq ls","gcloud billing budgets list --billing-account=XXXX","terraform plan"]),
Project("gcp-dr","gcp","GCP Incident Recovery & DR","⛨","Design a recoverable cloud data service with durable evidence, tested restore paths, known-good releases and explicit RTO/RPO.",["Cloud Storage","BigQuery","Cloud Run","Cloud SQL","Cloud Monitoring","Backup and DR"],["Primary","Durable Evidence","Recovery Workflow","Secondary/Restore","Certified Resume"],"DR must prove both infrastructure recovery and correct business/data state before traffic or analytics resume.","Multi-region everything can reduce some outage exposure but increases cost and consistency complexity; objectives should drive the topology.",[
["infra/dr.tf","Backup/replication/failover configuration."],["recovery/reconcile.py","Business-state verification."],["tests/failure_injection.md","Zone/region/service scenarios."],["runbook.md","RTO/RPO and restore sequence."],["postmortem/template.md","Evidence and corrective actions."]
],["gcloud storage buckets list","gcloud sql backups list --instance=example","gcloud run revisions list --service=example --region=us-central1","terraform plan"])
];

var projects={aws:aws,gcp:gcp};
function p(){return projects[st.provider][st.project%projects[st.provider].length];}
function checkKey(stage){return st.provider+"-"+p().id+"-"+stage;}
function done(){return commonStages.filter((_,i)=>st.checks[checkKey(i)]).length;}
function score(){
 let d=done(),ev=st.evidence[st.provider+"-"+p().id]||"",real=ev.trim().length>30?1:0;
 return Math.round((d/12)*85+real*15);
}
function totalScore(provider){
 let ps=projects[provider],sum=0;ps.forEach(pr=>{let count=commonStages.filter((_,i)=>st.checks[provider+"-"+pr.id+"-"+i]).length,ev=st.evidence[provider+"-"+pr.id]||"";sum+=Math.round(count/12*85+(ev.trim().length>30?15:0));});return Math.round(sum/ps.length);
}
function architecture(pr){
 return '<div class="architecture-flow">'+pr.flow.map((x,i)=>'<div class="arch-node"><b>'+esc(x)+'</b><span>'+(i===0?"source / caller":i===pr.flow.length-1?"business output":"managed boundary")+'</span></div>'+(i<pr.flow.length-1?'<div class="arch-arrow">→</div>':'')).join("")+'</div>';
}
function terminalRun(pr,cmd){
 let out="$ "+cmd+"\n";
 if(!cmd.trim())return "$ enter a command";
 if(/terraform plan/.test(cmd))out+="Plan: "+pr.services.length+" service groups modeled. No real cloud changes are executed in simulation mode.";
 else if(/list|describe|get-| ls|bq /.test(cmd))out+="SIMULATED: request accepted for "+st.provider.toUpperCase()+" project "+pr.id+"\nReview identity, region/project/account, resource scope, and expected evidence.";
 else out+="SIMULATION: command syntax captured. Real validation requires an authenticated AWS/GCP sandbox or account.";
 return out;
}
function render(){
 var root=$("#view-cloud-forge"); if(!root)return;
 var pr=p(), ps=projects[st.provider], sc=score();
 var projectButtons=ps.map(function(x,i){
   var cnt=commonStages.filter(function(_,s){return st.checks[st.provider+"-"+x.id+"-"+s];}).length;
   return `<button class="cloud-project-btn ${i===st.project?"active ":""}${cnt===12?"complete":""}" data-project="${i}">
     <span class="ico">${x.icon}</span>
     <div><b>${esc(x.title)}</b><span>${esc(x.services.slice(0,3).join(" • "))}</span></div>
     <em>${cnt}/12</em>
   </button>`;
 }).join("");
 var serviceChips=pr.services.map(function(s){return `<span class="cloud-service-chip">${esc(s)}</span>`;}).join("");
 var stageCards=commonStages.map(function(stage,i){
   return `<label class="cloud-stage">
     <input type="checkbox" data-cloud-stage="${i}" ${st.checks[checkKey(i)]?"checked":""}>
     <div><b>${String(i+1).padStart(2,"0")}. ${stage[0]}</b><p>${stage[1]}</p></div>
     <em>+${Math.round(85/12)}%</em>
     <div class="why"><b>Project application:</b> ${stageWhy(pr,i)}</div>
   </label>`;
 }).join("");
 var proofHTML=proofChecks(pr).map(function(x){
   return `<div class="proof-check ${x[1]?"pass":""}"><i></i><div><b>${x[0]}</b><span>${x[3]}</span></div><em>${x[2]}</em></div>`;
 }).join("");
 var fileHTML=pr.files.map(function(file){
   return `<div class="cloud-file"><code>${esc(file[0])}</code><p>${esc(file[1])}</p></div>`;
 }).join("");
 var mapHTML=ps.map(function(x){
   return `<article class="cloud-map-card"><b>${x.icon} ${esc(x.title)}</b><span>${esc(x.services.join(" • "))}</span><p>${esc(x.why)}</p></article>`;
 }).join("");
 var evidence=(st.evidence[st.provider+"-"+pr.id]||"");
 root.innerHTML=`
 <div class="view-heading">
   <div><span class="micro">MULTI-CLOUD PRODUCTION CAMPAIGNS</span><h2>AWS + GCP Project Forge</h2>
   <p>Twenty-four end-to-end cloud projects. Simulation builds architecture and operational reasoning now; real-cloud evidence later upgrades the same project with actual CLI/job/deployment proof.</p></div>
   <span class="enterprise-badge">24 PROJECTS • 288 STAGES</span>
 </div>
 <div class="cloud-forge-shell">
   <aside class="cloud-track glass">
     <div class="cloud-track-head"><span class="micro">CLOUD CAMPAIGN</span><h3>Choose provider</h3><p>AWS readiness ${totalScore("aws")}% • GCP readiness ${totalScore("gcp")}%</p></div>
     <div class="cloud-provider-tabs">
       <button class="cloud-provider-tab ${st.provider==="aws"?"active":""}" data-provider="aws">AWS</button>
       <button class="cloud-provider-tab ${st.provider==="gcp"?"active":""}" data-provider="gcp">GCP</button>
     </div>
     <div class="cloud-project-list">${projectButtons}</div>
   </aside>
   <section class="cloud-project-main glass">
     <div class="cloud-project-head">
       <span class="micro">${st.provider.toUpperCase()} • PROJECT ${String(st.project+1).padStart(2,"0")}</span>
       <h2>${pr.icon} ${esc(pr.title)}</h2><p>${esc(pr.scenario)}</p>
       <div class="cloud-service-chips">${serviceChips}</div>
     </div>
     <div class="architecture-canvas"><span class="micro">REFERENCE ARCHITECTURE</span>${architecture(pr)}
       <div class="pattern-proof">
         <div class="proof-card good"><b>WHY THIS ARCHITECTURE</b><p>${esc(pr.why)}</p></div>
         <div class="proof-card warn"><b>WHY NOT THE ALTERNATIVE</b><p>${esc(pr.alt)}</p></div>
       </div>
     </div>
     <div class="cloud-stage-grid">${stageCards}</div>
     <div class="cloud-terminal">
       <div class="cloud-terminal-head"><span>${st.provider.toUpperCase()} CLI / TERRAFORM SIMULATOR</span><button id="cloudRun">▶ Run command</button></div>
       <textarea id="cloudCommand">${esc(pr.commands[0])}</textarea>
       <pre id="cloudOut">$ simulation ready — no real cloud resources will be changed</pre>
     </div>
   </section>
   <aside class="cloud-proof glass">
     <div class="proof-head"><span class="micro">PROJECT EVIDENCE</span><h3>Production readiness</h3><div class="proof-score">${sc}%</div>
       <span>${done()}/12 simulated stages • ${evidence.trim().length>30?"real evidence logged":"real evidence missing"}</span>
     </div>
     <div class="proof-checks">${proofHTML}</div>
     <div class="cloud-files"><span class="micro">REQUIRED REPOSITORY FILES</span><h4>Name files by purpose</h4>${fileHTML}</div>
     <div class="real-proof"><span class="micro">REAL-CLOUD EVIDENCE</span>
       <p style="font-size:7px;color:#8094ad">Paste sanitized evidence from an AWS/GCP sandbox: deployment/job ID, test output, query/job profile, alarm evidence, or architecture review. Never paste secrets or credentials.</p>
       <textarea id="realEvidence" placeholder="Example: deployment/job ID + what it proves...">${esc(evidence)}</textarea>
       <button id="saveEvidence">Save evidence note</button>
     </div>
   </aside>
 </div>
 <div class="cloud-map-grid">${mapHTML}</div>`;
 wire(pr);
}
function stageWhy(pr,i){
 let specifics=[
 "State the business grain and where authoritative truth lives across "+pr.flow.join(" → ")+".",
 "Give each service only the permissions required for its role; separate deploy, runtime and analyst identities.",
 "Make the environment reproducible and reviewable before any console click becomes production state.",
 "Retries and schema changes must preserve source evidence and one logical business effect.",
 "Choose partition/state strategy from the data shape and replay boundary, not from service defaults.",
 "Serving layout must support the access pattern without erasing history or making correction semantics ambiguous.",
 "A release is a versioned artifact with tests, approvals and a known-good rollback target.",
 "Green infrastructure is insufficient; validate business contracts and reconcile expected versus actual state.",
 "Alert on user/data outcomes such as lag, freshness, errors and reconciliation—not CPU alone.",
 "Measure unit cost and bytes/work before increasing compute; remove unnecessary work first.",
 "Recovery begins by preserving evidence and bounding impact; resume only after business state is proven.",
 "Translate the project into value, risk reduced, metrics, ownership and residual uncertainty."
 ];
 return specifics[i];
}
function proofChecks(pr){
 let ev=(st.evidence[st.provider+"-"+pr.id]||"").trim();
 return [
 ["Architecture",st.checks[checkKey(0)],st.checks[checkKey(0)]?"PASS":"OPEN","Grain, boundaries and authoritative state"],
 ["Security/IAM",st.checks[checkKey(1)],st.checks[checkKey(1)]?"PASS":"OPEN","Least privilege and secret boundaries"],
 ["IaC",st.checks[checkKey(2)],st.checks[checkKey(2)]?"PASS":"OPEN","Reproducible resource definitions"],
 ["Tests + DQ",st.checks[checkKey(7)],st.checks[checkKey(7)]?"PASS":"OPEN","Failure and business validation"],
 ["Observability",st.checks[checkKey(8)],st.checks[checkKey(8)]?"PASS":"OPEN","SLO/alerts/traceability"],
 ["Incident recovery",st.checks[checkKey(10)],st.checks[checkKey(10)]?"PASS":"OPEN","Bounded recovery + rollback"],
 ["Real cloud proof",ev.length>30,ev.length>30?"LOGGED":"MISSING","Actual sandbox/account evidence"]
 ];
}
function wire(pr){
 $$("[data-provider]").forEach(b=>b.onclick=()=>{st.provider=b.dataset.provider;st.project=0;save();render();});
 $$("[data-project]").forEach(b=>b.onclick=()=>{st.project=+b.dataset.project;save();render();});
 $$("[data-cloud-stage]").forEach(c=>c.onchange=()=>{st.checks[checkKey(+c.dataset.cloudStage)]=c.checked;save();render();});
 $("#cloudRun").onclick=()=>{$("#cloudOut").textContent=terminalRun(pr,$("#cloudCommand").value);};
 $("#saveEvidence").onclick=()=>{st.evidence[st.provider+"-"+pr.id]=$("#realEvidence").value;save();CO.toast("Cloud evidence note saved");render();};
}
function install(){
 let nav=$("#nav"),work=$("#workspace");if(!nav||!work)return;
 let b=document.createElement("button");b.className="nav-item";b.dataset.view="cloud-forge";b.innerHTML="<span>☁</span><b>AWS + GCP Forge</b><em>20</em>";b.onclick=()=>{CO.setView("cloud-forge");$("#pageTitle").textContent="AWS + GCP Project Forge";render();};nav.appendChild(b);
 let s=document.createElement("section");s.className="view";s.id="view-cloud-forge";work.appendChild(s);render();
}
window.CloudOdysseyCloudForge={projects:projects,getState:()=>st};
install();
})();