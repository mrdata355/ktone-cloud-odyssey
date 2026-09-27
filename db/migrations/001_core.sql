-- Cloud Odyssey control-plane schema v1
-- Apply to a Postgres/Neon database before enabling durable APIs.

create table if not exists odyssey_learning_events (
  event_id uuid primary key,
  tenant_id text not null,
  client_id text not null,
  event_type text not null,
  schema_version integer not null default 1 check (schema_version > 0),
  occurred_at timestamptz not null,
  received_at timestamptz not null default now(),
  correlation_id text,
  idempotency_key text not null,
  payload jsonb not null default '{}'::jsonb,
  unique (tenant_id, client_id, idempotency_key)
);
create index if not exists odyssey_learning_events_client_time_idx
  on odyssey_learning_events (tenant_id, client_id, received_at desc);
create index if not exists odyssey_learning_events_type_time_idx
  on odyssey_learning_events (event_type, received_at desc);

create table if not exists odyssey_proficiency_snapshots (
  snapshot_id uuid not null unique,
  tenant_id text not null,
  client_id text not null,
  version bigint not null check (version >= 0),
  overall_score numeric(5,2) not null check (overall_score between 0 and 100),
  signals jsonb not null default '{}'::jsonb,
  source text not null default 'browser',
  captured_at timestamptz not null default now(),
  primary key (tenant_id, client_id, version)
);
create index if not exists odyssey_proficiency_latest_idx
  on odyssey_proficiency_snapshots (tenant_id, client_id, captured_at desc);

create table if not exists odyssey_assessment_attempts (
  attempt_id uuid primary key,
  tenant_id text not null,
  client_id text not null,
  assessment_type text not null,
  rubric_version text not null,
  blind boolean not null,
  reveal_used boolean not null,
  duration_ms bigint not null default 0 check (duration_ms >= 0),
  answer_hash text not null,
  score smallint not null check (score between 0 and 100),
  dimensions jsonb not null,
  signals jsonb not null,
  receipt text,
  verification text not null check (verification in ('signed','unsigned')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists odyssey_assessment_client_time_idx
  on odyssey_assessment_attempts (tenant_id, client_id, created_at desc);

create table if not exists odyssey_evidence_items (
  evidence_id uuid primary key,
  tenant_id text not null,
  client_id text not null,
  artifact_type text not null,
  platform text not null,
  artifact_name text not null,
  evidence_sha256 text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists odyssey_evidence_client_time_idx
  on odyssey_evidence_items (tenant_id, client_id, created_at desc);
create unique index if not exists odyssey_evidence_digest_idx
  on odyssey_evidence_items (tenant_id, client_id, artifact_type, evidence_sha256);

create table if not exists odyssey_entitlements (
  tenant_id text not null,
  client_id text not null,
  plan text not null default 'free',
  status text not null default 'active',
  features jsonb not null default '{}'::jsonb,
  valid_until timestamptz,
  updated_at timestamptz not null default now(),
  primary key (tenant_id, client_id)
);

-- Future asynchronous control-plane work. Producers write jobs; a worker claims
-- them with SELECT ... FOR UPDATE SKIP LOCKED.
create table if not exists odyssey_jobs (
  job_id uuid primary key,
  tenant_id text not null,
  client_id text,
  job_type text not null,
  state text not null default 'queued' check (state in ('queued','running','succeeded','failed','canceled')),
  idempotency_key text not null,
  payload jsonb not null default '{}'::jsonb,
  result jsonb,
  attempt_count integer not null default 0,
  run_after timestamptz not null default now(),
  locked_at timestamptz,
  locked_by text,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, idempotency_key)
);
create index if not exists odyssey_jobs_claim_idx
  on odyssey_jobs (state, run_after, created_at);

-- Transactional outbox foundation for future email/webhook/analytics delivery.
create table if not exists odyssey_outbox (
  outbox_id uuid primary key,
  tenant_id text not null,
  aggregate_type text not null,
  aggregate_id text not null,
  event_type text not null,
  payload jsonb not null,
  created_at timestamptz not null default now(),
  published_at timestamptz
);
create index if not exists odyssey_outbox_pending_idx
  on odyssey_outbox (created_at) where published_at is null;
