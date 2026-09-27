
(function(){
"use strict";
if(!window.CloudOdyssey){console.error("Cloud Forge requires CloudOdyssey");return;}
var CO=window.CloudOdyssey, KEY="cloud_odyssey_cloud_forge_v1";
var st=Object.assign({provider:"aws",project:0,mode:"simulation",checks:{},evidence:{},terminal:{},simGrades:{}},JSON.parse(localStorage.getItem(KEY)||"{}"));
var connectorSnapshot=null,connectorLoadedAt=0,connectorLoading=false;
var $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>Array.from((r||document).querySelectorAll(s));
var save=()=>localStorage.setItem(KEY,JSON.stringify(st));
var esc=s=>String(s||"").replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));

function Project(id,provider,title,icon,scenario,services,flow,why,alt,files,commands){
 return {id,provider,title,icon,scenario,services,flow,why,alt,files,commands};
}
var commonStages=[
["Architecture & grain","Declare business outcome, source/target grain, authoritative state, boundaries and expected failure modes."],
["Identity & access","Create least-privilege identities/roles, service-to-service permissions, secrets and tenant/data boundaries."],
["Infrastructure as Code","Provision core resources through the platform-appropriate IaC/deployment model; validate or plan before apply/deploy."],
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


var azure=[
Project("azure-eventhub-dbx","azure","Event Hubs → Azure Databricks Streaming","≋","Stream reservation events from Azure Event Hubs into a governed Delta lakehouse with replay-safe processing and business reconciliation.",["Azure Event Hubs","Azure Databricks","ADLS Gen2","Delta Lake","Unity Catalog","Azure Monitor"],["Producers","Event Hubs","Azure Databricks","Delta Bronze/Silver","Gold"],"Event Hubs provides managed event transport while Azure Databricks handles stateful streaming and Delta gives durable replayable lakehouse state.","A batch-only ADF pipeline is simpler when freshness is hourly or daily and continuous stream state is unnecessary.",[
["infra/eventhub.tf","Event Hub namespace, storage and identity resources."],["databricks/stream_reservations.py","Structured Streaming ingestion and dedupe."],["sql/reconcile.sql","Event-to-Gold business reconciliation."],["tests/replay_cases.json","Duplicate, late and restart cases."],["runbook.md","Checkpoint and consumer recovery."]
],["az account show","az eventhubs namespace list","databricks jobs list","terraform plan"]),
Project("azure-adls-lakehouse","azure","ADLS Gen2 Governed Lakehouse","◫","Build raw, validated and certified zones on ADLS Gen2 with Azure Databricks and controlled access boundaries.",["ADLS Gen2","Azure Databricks","Unity Catalog","Managed Identities","Key Vault","Azure Monitor"],["Sources","ADLS Raw","Databricks Silver","Delta Gold","Consumers"],"ADLS Gen2 provides durable Azure object storage while Unity Catalog and managed identities make data access explicit and auditable.","A shared storage account key is simpler initially but creates broad credentials and poor accountability.",[
["infra/storage.tf","ADLS, identities and private-access resources."],["databricks/silver.py","Validated transformations."],["sql/gold.sql","Certified serving tables."],["governance/access.md","External locations and grants."],["tests/access_negative.md","Unauthorized-access tests."]
],["az storage account list","az identity list","databricks unity-catalog metastores list","terraform plan"]),
Project("azure-adf-orchestration","azure","Azure Data Factory Orchestration","⇢","Orchestrate partner ingestion, validation, Databricks work, reconciliation and publish gates with rerunnable state.",["Azure Data Factory","Azure Databricks","ADLS Gen2","Key Vault","Azure Monitor"],["Partner Data","ADF","Databricks","Reconcile","Publish"],"ADF is useful when enterprise pipelines coordinate Azure services, schedules, dependencies and operational retries.","Lakeflow Jobs can be simpler when nearly all workflow logic already lives inside Databricks.",[
["infra/adf.tf","Factory, linked services and identities."],["adf/pipeline.json","Pipeline dependencies/retries."],["databricks/validate.py","Contract validation."],["sql/reconcile.sql","Publication gate."],["runbook.md","Failed activity and backfill recovery."]
],["az datafactory list","az monitor activity-log list --max-events 10","terraform plan","databricks jobs list"]),
Project("azure-synapse-serving","azure","Synapse / Lakehouse Serving Pattern","▥","Publish certified reservation and revenue models for governed SQL analytics while controlling scans and data movement.",["Azure Synapse Analytics","ADLS Gen2","Azure Databricks","Microsoft Entra ID","Azure Monitor"],["Delta Gold","Synapse SQL","Semantic Models","BI"],"A SQL-serving layer can provide familiar governed analytics access while Databricks remains the transformation/lakehouse engine.","For workloads already standardized on a single Databricks SQL serving layer, duplicating serving engines can increase cost and governance complexity.",[
["infra/synapse.tf","Workspace, identities and network controls."],["sql/fct_reservation.sql","Declared-grain fact model."],["sql/reconcile.sql","Serving reconciliation."],["monitoring/query_profile.md","Scan and concurrency evidence."],["runbook.md","Query regression response."]
],["az synapse workspace list","az synapse sql pool list --workspace-name example","terraform plan","az monitor metrics list-definitions --resource example"]),
Project("azure-security","azure","Managed Identity + Key Vault Security","⌂","Remove embedded secrets from data workloads and enforce least privilege across orchestration, storage and Databricks.",["Microsoft Entra ID","Managed Identities","Key Vault","Azure RBAC","Unity Catalog","Azure Policy"],["Engineer/Service","Managed Identity","Key Vault/RBAC","Data Platform"],"Managed identity and role-based access reduce long-lived secret exposure and make workload identity auditable.","Shared service-principal secrets can work, but rotation and blast radius become harder to manage.",[
["infra/identity.tf","Managed identities and role assignments."],["governance/rbac.md","Role matrix."],["tests/access_negative.md","Denied-operation tests."],["security/secrets.md","Secretless workload policy."],["runbook.md","Credential/access incident response."]
],["az identity list","az role assignment list","az keyvault list","terraform plan"]),
Project("azure-observability","azure","Azure Data Platform Observability","◎","Instrument freshness, Event Hubs lag, Databricks failures, ADF errors and business reconciliation with actionable SLOs.",["Azure Monitor","Log Analytics","Application Insights","Event Hubs","Azure Databricks","ADF"],["Platform Signals","Log Analytics","SLO Rules","Alerts","Operator"],"Centralized metrics/logs plus business checks make platform health observable beyond simple resource CPU.","Resource metrics alone can look healthy while data is stale, duplicated or unreconciled.",[
["infra/monitoring.tf","Workspaces, alerts and action groups."],["monitoring/queries.kql","Operational KQL queries."],["monitoring/slo.md","Freshness/lag/error objectives."],["tests/alert_injection.md","Alert-path tests."],["runbook.md","Triage and escalation."]
],["az monitor log-analytics workspace list","az monitor metrics list --resource example","terraform plan","az eventhubs eventhub list --resource-group rg --namespace-name ns"]),
Project("azure-finops","azure","Azure Data FinOps","$","Attribute Databricks, storage, streaming and orchestration costs to workloads and detect expensive design regressions.",["Azure Cost Management","Azure Monitor","Azure Databricks system tables","ADLS Gen2","Budgets"],["Cost Export","Cost Mart","Workload Attribution","Budget/Alert"],"Workload-level attribution lets engineers optimize architecture and unit economics instead of only reading a monthly bill.","Reducing compute size blindly can hurt reliability without fixing excessive scans, idle time or poor job design.",[
["infra/budgets.tf","Budgets and alert resources."],["sql/databricks_cost.sql","Workload cost analysis."],["sql/unit_cost.sql","Cost per 1K reservations/jobs."],["monitoring/cost_alerts.md","Threshold actions."],["runbook.md","Cost anomaly response."]
],["az consumption budget list","az costmanagement export list --scope example","databricks system-schemas list","terraform plan"]),
Project("azure-dr","azure","Azure Data Recovery & DR","⛨","Design a recoverable Azure data platform with durable evidence, tested restore/failover paths and explicit RTO/RPO.",["ADLS Gen2","Azure Databricks","Azure Backup","Azure Monitor","Traffic Manager","Azure SQL"],["Primary","Durable Evidence","Recovery Workflow","Secondary/Restore","Certified Resume"],"Recovery must prove both service restoration and correct business/data state before consumers resume.","Active-active across every component can reduce some failover time but increases consistency complexity and cost.",[
["infra/dr.tf","Backup/replication/failover resources."],["recovery/reconcile.py","Business-state validation."],["tests/failure_injection.md","Region/service failure cases."],["runbook.md","RTO/RPO and recovery sequence."],["postmortem/template.md","Evidence and corrective actions."]
],["az storage account list","az backup vault list","az monitor activity-log list --max-events 10","terraform plan"])
];

var databricks=[
Project("dbx-autoloader","databricks","Auto Loader → Lakeflow Pipeline","≋","Ingest arriving reservation files from cloud object storage into governed streaming tables with schema evolution, expectations and replay-safe checkpoints.",["Auto Loader","Lakeflow pipelines","Unity Catalog","Delta Lake","Structured Streaming"],["Object Storage","Auto Loader","Bronze Streaming Table","Silver","Gold"],"Auto Loader handles incremental file discovery while Lakeflow pipelines manage declarative streaming tables and quality constraints.","A custom file-listing loop gives more control but recreates state, schema and recovery machinery Databricks already provides.",[
["databricks.yml","Declarative Automation Bundle configuration."],["src/ingest_reservations.py","Auto Loader/streaming-table logic."],["src/quality.py","Expectations and quarantine rules."],["tests/test_schema_evolution.py","Schema and bad-record tests."],["runbook.md","Checkpoint/schema-location recovery."]
],["databricks pipelines list-pipelines","databricks bundle validate","databricks bundle deploy","databricks jobs list"]),
Project("dbx-structured-streaming","databricks","Production Structured Streaming","⚡","Run a continuous reservation stream with explicit checkpoint ownership, restart semantics, lag/freshness SLOs and bounded replay.",["Structured Streaming","Lakeflow Jobs","Delta Lake","Unity Catalog","Azure Event Hubs/Kafka"],["Event Source","Structured Streaming","Checkpoint","Delta Sink","Reconcile"],"Production streaming correctness depends on durable checkpoint/state semantics plus deterministic downstream business effects.","Starting a stream interactively on all-purpose compute is convenient for development but weak for production lifecycle and recovery.",[
["src/stream.py","Streaming query logic."],["resources/job.yml","Lakeflow Job definition."],["tests/test_replay.py","Restart/replay cases."],["monitoring/stream_slo.sql","Lag/freshness evidence."],["runbook.md","Checkpoint recovery and restart."]
],["databricks jobs list","databricks bundle validate","databricks clusters list","databricks bundle run streaming_job"]),
Project("dbx-delta-cdc","databricks","Delta CDF + SCD2 Recovery","Δ","Use Delta Change Data Feed to reconstruct business revisions, preserve history and publish correct SCD2/current state.",["Delta Lake","Change Data Feed","MERGE","Unity Catalog","SQL Warehouses"],["Delta Source","CDF","Disposition","SCD2 History","Current"],"CDF exposes row-level changes needed for incremental reconstruction while stable business keys and precedence rules determine authoritative state.","A full overwrite is simpler but obscures history, increases work and is dangerous for bounded recovery.",[
["src/cdf_recovery.py","CDF capture and canonicalization."],["sql/scd2_merge.sql","History/current MERGE."],["sql/reconcile.sql","Version and current-state checks."],["tests/cdf_cases.json","Update/delete/replay fixtures."],["runbook.md","CDF-gap and source-replacement response."]
],["databricks tables list","databricks bundle validate","databricks sql warehouses list","databricks bundle run cdf_recovery"]),
Project("dbx-unity-catalog","databricks","Unity Catalog Governance","⌂","Design catalogs, schemas, external locations, volumes, row/column access and lineage for a multi-team data platform.",["Unity Catalog","Catalogs/Schemas","External Locations","Volumes","Lineage","System Tables"],["Cloud Storage","External Location","Catalog/Schema","Governed Tables","Consumers"],"Unity Catalog centralizes data/AI governance and makes grants, ownership and lineage part of the platform boundary.","Workspace-local permissions are simpler but fragment governance and make cross-workspace policy harder to reason about.",[
["governance/catalog_design.md","Catalog/schema/domain model."],["governance/grants.sql","Least-privilege grants."],["tests/access_negative.sql","Denied-access tests."],["monitoring/audit.sql","Audit/system-table queries."],["runbook.md","Access incident response."]
],["databricks catalogs list","databricks schemas list --catalog-name main","databricks grants get TABLE main.default.example","databricks system-schemas list"]),
Project("dbx-lakeflow-jobs","databricks","Lakeflow Jobs Orchestration","⌁","Orchestrate ingestion, transformation, model scoring, reconciliation and publication with parameters, retries and triggers.",["Lakeflow Jobs","Serverless Jobs","Task Dependencies","Triggers","Unity Catalog"],["Trigger","Ingest Task","Transform","Validate","Publish"],"Lakeflow Jobs keeps workflow dependencies and Databricks-native execution lifecycle together, including schedule/table/file/model triggers.","External orchestrators remain useful for cross-platform workflows but add another control plane when the work is Databricks-native.",[
["resources/job.yml","Job tasks, dependencies and triggers."],["src/validate.py","Pre-publish validation."],["tests/test_job_config.py","Job configuration tests."],["monitoring/job_slo.md","Run-time/failure objectives."],["runbook.md","Retry/backfill/repair sequence."]
],["databricks jobs list","databricks bundle validate","databricks bundle deploy","databricks bundle run reservation_job"]),
Project("dbx-bundles","databricks","Declarative Automation Bundles CI/CD","⇢","Package code, tests, jobs, pipelines, dashboards and ML resources into versioned deployment targets with validation and rollback.",["Declarative Automation Bundles","Databricks CLI","GitHub Actions","Lakeflow Jobs","MLflow"],["Git Commit","Bundle Validate","Test","Deploy Target","Run/Verify"],"Bundles make Databricks projects reproducible and reviewable by keeping resource definitions with source code and CI/CD.","Manual workspace edits are quick for experiments but drift from version control and weaken repeatable promotion.",[
["databricks.yml","Bundle targets and variables."],["resources/jobs.yml","Job resource definitions."],["src/","Versioned project code."],["tests/","Unit/integration tests."],[".github/workflows/deploy.yml","Validation and promotion workflow."]
],["databricks bundle validate","databricks bundle deploy -t dev","databricks bundle run -t dev reservation_job","databricks bundle destroy -t dev"]),
Project("dbx-mlflow","databricks","MLflow Model Lifecycle","◇","Train, evaluate, register, promote and monitor a model with lineage, slice gates and rollback to a known-good version.",["MLflow","Unity Catalog models","Model Serving","Feature Engineering","Lakeflow Jobs"],["Training Data","MLflow Run","Registered Model","Serving","Monitoring"],"MLflow plus governed registered models creates reproducible model lineage and controlled promotion rather than notebook-to-production handoffs.","Directly deploying a notebook artifact can be faster for a prototype but makes comparison, rollback and audit weak.",[
["ml/train.py","Training and logging."],["ml/evaluate.py","Slice/business gates."],["resources/model.yml","Model/serving resource definition."],["tests/test_model_gate.py","Promotion tests."],["runbook.md","Champion rollback."]
],["databricks experiments list","databricks registered-models list","databricks serving-endpoints list","databricks bundle validate"]),
Project("dbx-sql-performance","databricks","Databricks SQL Performance & FinOps","▥","Tune a Gold analytical workload using query profile evidence, partition/cluster strategy, Photon/serverless choices and system cost evidence.",["Databricks SQL","Photon","Serverless SQL","Liquid Clustering","System Tables"],["Gold Tables","SQL Warehouse","Query Profile","BI"],"Optimization should begin with query/storage evidence and unit cost rather than blindly scaling warehouse size.","Increasing warehouse size can shorten compute-bound work but does not remove unnecessary scans or poor data layout.",[
["sql/report.sql","Business-serving query."],["sql/profile_notes.md","Query-profile diagnosis."],["sql/optimize.sql","Layout/query optimization."],["sql/cost.sql","System-table cost evidence."],["runbook.md","Regression response."]
],["databricks sql warehouses list","databricks system-schemas list","databricks bundle validate","databricks jobs list"])
];

var snowflake=[
Project("snow-snowpipe-streaming","snowflake","Snowpipe Streaming Ingestion","≋","Ingest low-latency reservation events into Snowflake with stable channels/offsets, replay safety and measurable ingest freshness.",["Snowpipe Streaming","PIPE object","Named/Elastic Channels","Tables","Resource Monitors"],["Producer","Snowpipe Streaming","PIPE/Channel","Raw Table","Curated"],"Snowpipe Streaming is built for row-oriented low-latency ingestion; channels and offset semantics provide a concrete recovery boundary.","Classic Snowpipe is a better fit when upstream already produces files and a batch-oriented latency profile is acceptable.",[
["sql/create_pipe.sql","Target table and PIPE objects."],["src/producer.py","Streaming SDK producer."],["tests/test_offsets.py","Replay/offset tests."],["sql/reconcile.sql","Source-to-table checks."],["runbook.md","Channel/offset recovery."]
],["snow connection test","snow sql -q 'SHOW PIPES'","snow sql -q 'SHOW TABLES'","terraform plan"]),
Project("snow-dynamic-tables","snowflake","Dynamic Tables Pipeline","▤","Build continuously refreshed staging, current-state and analytics layers with explicit target lag and quality checks.",["Dynamic Tables","Virtual Warehouses","Streams","Tasks","Resource Monitors"],["Raw","Dynamic Staging","Dynamic Current","Dynamic Mart","BI"],"Dynamic Tables can express declarative refresh dependencies where target-lag semantics fit the workload.","Streams and Tasks provide more procedural control when refresh logic requires explicit event handling or custom sequencing.",[
["sql/dynamic_staging.sql","Staging dynamic table."],["sql/dynamic_current.sql","Current-state dynamic table."],["sql/dynamic_mart.sql","Serving mart."],["tests/assertions.sql","Quality checks."],["runbook.md","Refresh-lag incident response."]
],["snow sql -q 'SHOW DYNAMIC TABLES'","snow sql -q 'SHOW WAREHOUSES'","snow sql -q 'SELECT SYSTEM$GET_DYNAMIC_TABLE_REFRESH_HISTORY()'","terraform plan"]),
Project("snow-streams-tasks","snowflake","Streams + Tasks CDC","⇢","Process CDC incrementally with Streams and Tasks while preserving business keys, deterministic upserts and retry-safe task behavior.",["Streams","Tasks","MERGE","Tables","Task Graphs"],["Source Table","Stream","Task Graph","MERGE","Current/History"],"Streams expose change records and Tasks provide scheduled/triggered SQL execution, making an explicit incremental CDC pattern.","Full refreshes can be simpler for small data but become wasteful and make mutation history harder to control.",[
["sql/create_stream.sql","CDC stream."],["sql/task_graph.sql","Task dependencies."],["sql/merge_current.sql","Deterministic upsert."],["tests/replay.sql","Repeat-run tests."],["runbook.md","Task/stream recovery."]
],["snow sql -q 'SHOW STREAMS'","snow sql -q 'SHOW TASKS'","snow sql -q 'EXECUTE TASK root_task'","snow sql -q 'SHOW TASK GRAPHS'"]),
Project("snow-dbt","snowflake","dbt + Snowflake Analytics Factory","▥","Build staging, dimensions, facts, tests and exposures for a governed reservation analytics model.",["Snowflake","dbt","Virtual Warehouses","Git","CI/CD"],["Raw","dbt Staging","Intermediate","Facts/Dimensions","BI"],"dbt makes SQL transformations, tests, documentation and lineage versionable while Snowflake provides elastic SQL compute.","Ad-hoc SQL worksheets are useful for exploration but weak as a team-owned production transformation system.",[
["models/staging/stg_reservation.sql","Typed staging."],["models/marts/fct_reservation.sql","Declared-grain fact."],["models/schema.yml","Tests/documentation."],["tests/reconcile.sql","Business reconciliation."],["README.md","Build/run ownership."]
],["dbt debug","dbt build","snow sql -q 'SHOW WAREHOUSES'","dbt docs generate"]),
Project("snow-governance","snowflake","Snowflake Governance & RBAC","⌂","Implement role hierarchy, masking/row-access policies, tags, lineage/audit evidence and least-privilege data products.",["RBAC","Masking Policies","Row Access Policies","Tags","Access History","Horizon"],["Raw Data","Governance Policies","Certified Views","Roles/Consumers"],"Executable role/policy controls make governance enforceable and auditable rather than a documentation exercise.","A single broad analyst role is easy initially but creates excessive access and poor accountability.",[
["governance/roles.sql","Role hierarchy and grants."],["governance/masking.sql","Sensitive-data masking."],["governance/row_access.sql","Tenant/data access policy."],["tests/access_negative.sql","Denied-access tests."],["runbook.md","Access/policy incident response."]
],["snow sql -q 'SHOW ROLES'","snow sql -q 'SHOW MASKING POLICIES'","snow sql -q 'SHOW ROW ACCESS POLICIES'","snow sql -q 'SELECT * FROM SNOWFLAKE.ACCOUNT_USAGE.ACCESS_HISTORY LIMIT 5'"]),
Project("snow-performance","snowflake","Warehouse Performance & FinOps","$","Diagnose a costly analytical workload using query profile, bytes scanned, pruning, spill, warehouse utilization and credit evidence.",["Virtual Warehouses","Query Profile","Query History","Resource Monitors","Clustering"],["Queries","Warehouse","Profile","Cost/Performance Evidence"],"Snowflake tuning should focus on query shape, pruning, data layout and workload economics before simply increasing warehouse size.","Scaling up can help compute-bound queries but can make a poorly pruned workload more expensive without removing unnecessary work.",[
["sql/slow_query.sql","Original workload."],["sql/profile_notes.md","Operator/scan diagnosis."],["sql/optimized.sql","Improved query."],["sql/cost_analysis.sql","Credit/query history evidence."],["runbook.md","Regression response."]
],["snow sql -q 'SHOW WAREHOUSES'","snow sql -q 'SELECT * FROM TABLE(INFORMATION_SCHEMA.QUERY_HISTORY()) LIMIT 10'","snow sql -q 'SHOW RESOURCE MONITORS'","terraform plan"]),
Project("snow-snowpark-spcs","snowflake","Snowpark + Container Services","◉","Run Python data/application logic and a containerized service close to Snowflake data with controlled identity and compute boundaries.",["Snowpark","Snowpark Container Services","Compute Pools","Image Repository","Workload Identity"],["Snowflake Data","Snowpark/Container","Compute Pool","Service Output"],"Snowpark and container services support application/data workloads while preserving Snowflake-governed data proximity and workload identity.","Moving every workload into containers adds operational complexity when SQL/Snowpark alone already fits the requirement.",[
["src/snowpark_job.py","Snowpark logic."],["service/spec.yml","Container service specification."],["sql/compute_pool.sql","Compute-pool resources."],["tests/service_contract.py","Service/data tests."],["runbook.md","Service/compute recovery."]
],["snow spcs compute-pool list","snow spcs service list","snow sql -q 'SHOW IMAGE REPOSITORIES'","snow connection test"]),
Project("snow-cortex","snowflake","Cortex AI / RAG Data Product","✦","Build an governed analytical assistant over approved Snowflake data and documents with evaluation, access control and cost evidence.",["Cortex AI","Cortex Search","Snowflake Tables","RBAC","Resource Monitors"],["Approved Data/Documents","Cortex Search","Cortex AI","Governed App"],"Keeping retrieval, access and evaluation close to governed Snowflake data can simplify analytical AI products while preserving policy boundaries.","An external vector/LLM stack can offer more provider flexibility but adds data movement and another governance surface.",[
["sql/cortex_search.sql","Search service/index resources."],["src/answer.py","Retrieval/answer flow."],["eval/eval_set.json","Grounding/evaluation cases."],["governance/ai_access.sql","Roles and policies."],["runbook.md","Bad-answer/source rollback."]
],["snow sql -q 'SHOW CORTEX SEARCH SERVICES'","snow sql -q 'SHOW ROLES'","snow connection test","terraform plan"])
];

var projects={aws:aws,gcp:gcp,azure:azure,databricks:databricks,snowflake:snowflake};
function p(){return projects[st.provider][st.project%projects[st.provider].length];}
function checkKey(stage){return st.provider+"-"+p().id+"-"+stage;}
function projectKey(pr,provider){return (provider||st.provider)+"-"+pr.id;}
function done(){return commonStages.filter((_,i)=>st.checks[checkKey(i)]).length;}
function simGrade(pr,provider){return Number(st.simGrades[projectKey(pr||p(),provider)]||0);}
function graduated(pr,provider){
 pr=pr||p();provider=provider||st.provider;
 var count=commonStages.filter((_,i)=>st.checks[provider+"-"+pr.id+"-"+i]).length;
 return count===12 && simGrade(pr,provider)>=85;
}
function score(){
 let d=done(),g=simGrade(),ev=st.evidence[projectKey(p())]||"",real=graduated()&&ev.trim().length>30?1:0;
 return Math.round((d/12)*70+(Math.min(100,g)/100)*15+real*15);
}
function totalScore(provider){
 let ps=projects[provider],sum=0;
 ps.forEach(pr=>{
   let count=commonStages.filter((_,i)=>st.checks[provider+"-"+pr.id+"-"+i]).length;
   let g=simGrade(pr,provider),ev=st.evidence[projectKey(pr,provider)]||"";
   let live=graduated(pr,provider)&&ev.trim().length>30?15:0;
   sum+=Math.round(count/12*70+(Math.min(100,g)/100)*15+live);
 });
 return Math.round(sum/ps.length);
}
async function refreshConnectorStatus(force){
 if(connectorLoading)return connectorSnapshot;
 if(!force&&connectorSnapshot&&Date.now()-connectorLoadedAt<30000)return connectorSnapshot;
 if(!window.CloudOdysseyBackend||!window.CloudOdysseyBackend.connectorStatus)return null;
 connectorLoading=true;
 try{connectorSnapshot=await window.CloudOdysseyBackend.connectorStatus();connectorLoadedAt=Date.now();}
 catch(e){connectorSnapshot={ok:false,error:e.message};}
 connectorLoading=false;return connectorSnapshot;
}
function connectorFor(provider){
 return connectorSnapshot&&connectorSnapshot.connectors&&connectorSnapshot.connectors[provider]||null;
}
function architecture(pr){
 return '<div class="architecture-flow">'+pr.flow.map((x,i)=>'<div class="arch-node"><b>'+esc(x)+'</b><span>'+(i===0?"source / caller":i===pr.flow.length-1?"business output":"managed boundary")+'</span></div>'+(i<pr.flow.length-1?'<div class="arch-arrow">→</div>':'')).join("")+'</div>';
}
function terminalRun(pr,cmd){
 let out="$ "+cmd+"\n";
 if(!cmd.trim())return "$ enter a command";
 if(/terraform plan/.test(cmd))out+="Plan: "+pr.services.length+" service groups modeled. No real cloud changes are executed in simulation mode.";
 else if(/list|describe|get-| ls|bq /.test(cmd))out+="SIMULATED: request accepted for "+st.provider.toUpperCase()+" project "+pr.id+"\nReview identity, region/project/account, resource scope, and expected evidence.";
 else out+="SIMULATION: command syntax captured. Real validation requires an authenticated account/workspace for "+st.provider.toUpperCase()+".";
 return out;
}
function providerLabel(k){return {aws:"AWS",gcp:"GCP",azure:"Azure",databricks:"Databricks",snowflake:"Snowflake"}[k]||k.toUpperCase();}
function render(){
 var root=$("#view-cloud-forge"); if(!root)return;
 var pr=p(), ps=projects[st.provider], sc=score(), grad=graduated(), grade=simGrade(), mode=st.mode||"simulation";
 if(mode==="live"&&!grad){st.mode="simulation";mode="simulation";save();}
 var connector=connectorFor(st.provider);
 if(mode==="live"&&!connectorSnapshot&&!connectorLoading)refreshConnectorStatus().then(render);
 var projectButtons=ps.map(function(x,i){
   var cnt=commonStages.filter(function(_,s){return st.checks[st.provider+"-"+x.id+"-"+s];}).length;
   var g=simGrade(x,st.provider),graduate=cnt===12&&g>=85;
   return `<button class="cloud-project-btn ${i===st.project?"active ":""}${graduate?"complete":""}" data-project="${i}">
     <span class="ico">${x.icon}</span>
     <div><b>${esc(x.title)}</b><span>${esc(x.services.slice(0,3).join(" • "))}</span></div>
     <em>${graduate?"GRAD":cnt+"/12"}</em>
   </button>`;
 }).join("");
 var serviceChips=pr.services.map(function(s){return `<span class="cloud-service-chip">${esc(s)}</span>`;}).join("");
 var stageCards=commonStages.map(function(stage,i){
   return `<label class="cloud-stage">
     <input type="checkbox" data-cloud-stage="${i}" ${st.checks[checkKey(i)]?"checked":""}>
     <div><b>${String(i+1).padStart(2,"0")}. ${stage[0]}</b><p>${stage[1]}</p></div>
     <em>SIM</em>
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
 var evidence=(st.evidence[projectKey(pr)]||"");
 var connectorLabel=!connectorSnapshot?"CHECKING":!connector?"UNKNOWN":connector.configured?(connector.validated?"CONNECTED":"CONFIGURED"):"DISCONNECTED";
 var connectorDetail=!connectorSnapshot?"Reading server connector registry...":!connector?"No connector record.":connector.configured?"Server-side credentials are present; provider validation/execution adapter is the next live step.":"No server-side connector credentials are configured for "+providerLabel(st.provider)+".";
 var simBody=`
   <div class="architecture-canvas"><span class="micro">REFERENCE ARCHITECTURE</span>${architecture(pr)}
     <div class="pattern-proof">
       <div class="proof-card good"><b>WHY THIS ARCHITECTURE</b><p>${esc(pr.why)}</p></div>
       <div class="proof-card warn"><b>WHY NOT THE ALTERNATIVE</b><p>${esc(pr.alt)}</p></div>
     </div>
   </div>
   <div class="cloud-stage-grid">${stageCards}</div>
   <div class="cloud-terminal">
     <div class="cloud-terminal-head"><span>${st.provider.toUpperCase()} CLI / TERRAFORM SIMULATOR</span><button id="cloudRun">▶ Run simulated command</button></div>
     <textarea id="cloudCommand">${esc(pr.commands[0])}</textarea>
     <pre id="cloudOut">$ simulation ready — no real cloud resources will be changed</pre>
   </div>
   <div class="cloud-graduation-defense">
     <span class="micro">SIMULATION GRADUATION DEFENSE</span>
     <p>After all 12 simulation checkpoints, defend WHO/WHAT/WHERE/WHEN/WHY, failure boundaries, evidence, rollback and the rejected alternative. Live mode requires 12/12 + server grade ≥85.</p>
     <textarea id="cloudDefense" placeholder="Defend the architecture without looking up the reference answer..."></textarea>
     <button id="gradeCloudDefense">Grade blind defense on server</button>
     <div id="cloudDefenseResult">Current defense grade: <b>${grade}%</b></div>
   </div>`;
 var liveBody=`
   <div class="cloud-live-gate ${grad?"unlocked":"locked"}">
     <span class="micro">LIVE CONNECTOR LAB</span>
     <h3>${grad?"Simulation graduated":"Live mode locked"}</h3>
     <p>${grad?"You earned access to the real-provider phase. Simulation remains available for unlimited safe repetition.":"Complete all 12 simulation checkpoints and earn ≥85 on the blind architecture defense first."}</p>
     <div class="live-gate-grid">
       <div><span>SIM CHECKPOINTS</span><b>${done()}/12</b></div>
       <div><span>DEFENSE</span><b>${grade}%</b></div>
       <div><span>CONNECTOR</span><b>${connectorLabel}</b></div>
     </div>
   </div>
   ${grad?`<div class="cloud-live-console">
      <div class="cloud-terminal-head"><span>${providerLabel(st.provider)} LIVE CONNECTOR</span><button id="refreshConnector">↻ Refresh connector status</button></div>
      <p>${esc(connectorDetail)}</p>
      <div class="live-safety"><b>Safety contract</b><span>Live execution starts read-only. Secrets stay server-side. Destructive operations require an explicit project-specific approval path.</span></div>
      <div class="live-command-plan">
        <span class="micro">FIRST LIVE VALIDATION SEQUENCE</span>
        ${pr.commands.map((cmd,i)=>`<div class="live-command-row"><b>${i+1}</b><code>${esc(cmd)}</code><span>${i===0?"identity / connectivity":i===1?"resource evidence":"project proof"}</span></div>`).join("")}
      </div>
      <button id="liveConnectorCheck">Run connector readiness check</button>
      <pre id="liveConnectorOut">$ no provider action executed yet</pre>
    </div>
    <div class="real-proof"><span class="micro">LIVE EVIDENCE — POST GRADUATION ONLY</span>
      <p style="font-size:7px;color:#8094ad">Paste sanitized deployment/job/run IDs, test output, query/job profiles, alert evidence, or architecture review after actual provider work. Never paste secrets.</p>
      <textarea id="realEvidence" placeholder="Example: deployment/job ID + what it proves...">${esc(evidence)}</textarea>
      <button id="saveEvidence">Save live evidence note</button>
    </div>`:""}`;
 root.innerHTML=`
 <div class="view-heading">
   <div><span class="micro">SIMULATE → GRADUATE → CONNECT LIVE</span><h2>Cloud + Lakehouse Project Forge</h2>
   <p>${Object.values(projects).reduce((n,x)=>n+x.length,0)} end-to-end projects. Every live connector is gated behind completion of its simulation and a blind architecture defense.</p></div>
   <span class="enterprise-badge">48 PROJECTS • 576 SIM CHECKPOINTS</span>
 </div>
 <div class="cloud-mode-switch glass">
   <button class="cloud-mode-btn ${mode==="simulation"?"active":""}" data-cloud-mode="simulation">01 • Simulation</button>
   <button class="cloud-mode-btn ${mode==="live"?"active":""} ${grad?"":"locked"}" data-cloud-mode="live">${grad?"02 • Live Connector":"🔒 02 • Live Connector"}</button>
   <div class="cloud-mode-status"><b>${grad?"SIMULATION GRADUATED":"SIMULATION REQUIRED"}</b><span>${done()}/12 • defense ${grade}%</span></div>
 </div>
 <div class="cloud-forge-shell">
   <aside class="cloud-track glass">
     <div class="cloud-track-head"><span class="micro">PLATFORM CAMPAIGN</span><h3>Choose platform</h3><p>${Object.keys(projects).map(k=>providerLabel(k)+" "+totalScore(k)+"%").join(" • ")}</p></div>
     <div class="cloud-provider-tabs">
       ${Object.keys(projects).map(k=>'<button class="cloud-provider-tab '+(st.provider===k?'active':'')+'" data-provider="'+k+'">'+providerLabel(k)+'</button>').join("")}
     </div>
     <div class="cloud-project-list">${projectButtons}</div>
   </aside>
   <section class="cloud-project-main glass">
     <div class="cloud-project-head">
       <span class="micro">${st.provider.toUpperCase()} • PROJECT ${String(st.project+1).padStart(2,"0")} • ${mode.toUpperCase()}</span>
       <h2>${pr.icon} ${esc(pr.title)}</h2><p>${esc(pr.scenario)}</p>
       <div class="cloud-service-chips">${serviceChips}</div>
     </div>
     ${mode==="simulation"?simBody:liveBody}
   </section>
   <aside class="cloud-proof glass">
     <div class="proof-head"><span class="micro">PROJECT EVIDENCE</span><h3>Two-tier readiness</h3><div class="proof-score">${sc}%</div>
       <span>${done()}/12 simulation • defense ${grade}% • ${evidence.trim().length>30?"live evidence logged":"live evidence pending"}</span>
     </div>
     <div class="proof-checks">${proofHTML}</div>
     <div class="cloud-files"><span class="micro">REQUIRED REPOSITORY FILES</span><h4>Name files by purpose</h4>${fileHTML}</div>
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
 let ev=(st.evidence[projectKey(pr)]||"").trim(),g=simGrade(pr),grad=graduated(pr),conn=connectorFor(st.provider);
 return [
 ["Architecture",st.checks[checkKey(0)],st.checks[checkKey(0)]?"PASS":"OPEN","Grain, boundaries and authoritative state"],
 ["Security/IAM",st.checks[checkKey(1)],st.checks[checkKey(1)]?"PASS":"OPEN","Least privilege and secret boundaries"],
 ["Tests + DQ",st.checks[checkKey(7)],st.checks[checkKey(7)]?"PASS":"OPEN","Failure and business validation"],
 ["Incident recovery",st.checks[checkKey(10)],st.checks[checkKey(10)]?"PASS":"OPEN","Bounded recovery + rollback"],
 ["Simulation complete",done()===12,done()===12?"12/12":done()+"/12","All safe simulation checkpoints complete"],
 ["Blind defense",g>=85,g+"%",">=85 server grade required"],
 ["Live gate",grad,grad?"UNLOCKED":"LOCKED","Live connector cannot open before graduation"],
 ["Connector",!!(conn&&conn.configured),conn&&conn.configured?"CONFIGURED":"OFF","Server-side provider connection status"],
 ["Live proof",grad&&ev.length>30,grad&&ev.length>30?"LOGGED":"PENDING","Accepted only after simulation graduation"]
 ];
}
function wire(pr){
 $$("[data-provider]").forEach(b=>b.onclick=()=>{st.provider=b.dataset.provider;st.project=0;st.mode="simulation";save();render();});
 $$("[data-project]").forEach(b=>b.onclick=()=>{st.project=+b.dataset.project;st.mode="simulation";save();render();});
 $$("[data-cloud-mode]").forEach(b=>b.onclick=()=>{
   var next=b.dataset.cloudMode;
   if(next==="live"&&!graduated()){CO.toast("Finish 12/12 simulation checkpoints and score at least 85 on the blind defense first.");return;}
   st.mode=next;save();render();
 });
 $$("[data-cloud-stage]").forEach(c=>c.onchange=()=>{st.checks[checkKey(+c.dataset.cloudStage)]=c.checked;save();render();});
 var run=$("#cloudRun");if(run)run.onclick=()=>{$("#cloudOut").textContent=terminalRun(pr,$("#cloudCommand").value);};
 var gradeBtn=$("#gradeCloudDefense");if(gradeBtn)gradeBtn.onclick=async()=>{
   var answer=$("#cloudDefense").value.trim();if(!answer){CO.toast("Defend the architecture first");return;}
   var out=$("#cloudDefenseResult");out.textContent="Calling server grader...";
   try{
     if(!window.CloudOdysseyBackend)throw new Error("Backend grader is not loaded");
     var required=["idempotency","evidence","rollback","reconcile","least privilege","failure","business"];
     var r=await window.CloudOdysseyBackend.grade(answer,required,{type:"cloud-simulation:"+st.provider+":"+pr.id,blind:true,duration_ms:90000});
     st.simGrades[projectKey(pr)]=r.score;save();
     out.textContent="SERVER DEFENSE "+r.score+"% • request "+(r.request_id||"—");
     setTimeout(render,350);
   }catch(e){out.textContent=e.data?JSON.stringify(e.data,null,2):e.message;}
 };
 var refresh=$("#refreshConnector");if(refresh)refresh.onclick=async()=>{await refreshConnectorStatus(true);render();};
 var liveCheck=$("#liveConnectorCheck");if(liveCheck)liveCheck.onclick=async()=>{
   var out=$("#liveConnectorOut");out.textContent="$ checking server connector registry...";
   var r=await refreshConnectorStatus(true),conn=r&&r.connectors&&r.connectors[st.provider];
   if(!conn){out.textContent="$ connector status unavailable";return;}
   if(!conn.configured){out.textContent="$ simulation graduated\n$ live connector DISCONNECTED\nRequired server configuration:\n- "+(conn.required||[]).join("\n- ");return;}
   out.textContent="$ simulation graduated\n$ connector configuration FOUND\n$ validation state: "+(conn.validated?"VALIDATED":"NOT YET VALIDATED")+"\n$ no provider mutation executed";
 };
 var saveBtn=$("#saveEvidence");if(saveBtn)saveBtn.onclick=()=>{
   if(!graduated()){CO.toast("Live evidence is locked until simulation graduation");return;}
   st.evidence[projectKey(pr)]=$("#realEvidence").value;save();CO.toast("Live evidence note saved");render();
 };
}
function install(){
 let nav=$("#nav"),work=$("#workspace");if(!nav||!work)return;
 let b=document.createElement("button");b.className="nav-item";b.dataset.view="cloud-forge";b.innerHTML="<span>☁</span><b>Cloud + Lakehouse Forge</b><em>20</em>";b.onclick=()=>{CO.setView("cloud-forge");$("#pageTitle").textContent="Cloud + Lakehouse Project Forge";render();};nav.appendChild(b);
 let s=document.createElement("section");s.className="view";s.id="view-cloud-forge";work.appendChild(s);render();
}
window.CloudOdysseyCloudForge={projects:projects,getState:()=>st};
install();
})();