-- Cloud Odyssey SaaS foundation v1
-- Safe/idempotent schema initialization for authenticated multi-device progress.

create table if not exists odyssey_users (
  user_id text primary key,
  email text,
  display_name text,
  auth_provider text not null default 'jwt',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now()
);

create table if not exists odyssey_tenants (
  tenant_id text primary key,
  name text not null,
  plan text not null default 'free',
  owner_user_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists odyssey_memberships (
  tenant_id text not null,
  user_id text not null,
  role text not null default 'member',
  created_at timestamptz not null default now(),
  primary key (tenant_id,user_id)
);

create table if not exists odyssey_learning_events (
  event_id uuid primary key,
  tenant_id text not null,
  user_id text,
  client_id text not null,
  event_type text not null,
  schema_version integer not null default 1,
  occurred_at timestamptz not null,
  correlation_id text,
  idempotency_key text not null,
  payload jsonb not null default '{}'::jsonb,
  received_at timestamptz not null default now(),
  unique (tenant_id,client_id,idempotency_key)
);
alter table odyssey_learning_events add column if not exists user_id text;

create table if not exists odyssey_proficiency_snapshots (
  snapshot_id uuid primary key,
  tenant_id text not null,
  user_id text,
  client_id text not null,
  version bigint not null,
  overall_score numeric(5,2) not null default 0,
  signals jsonb not null default '{}'::jsonb,
  source text not null default 'browser',
  captured_at timestamptz not null default now(),
  unique (tenant_id,client_id,version)
);
alter table odyssey_proficiency_snapshots add column if not exists user_id text;

create table if not exists odyssey_assessment_attempts (
  attempt_id uuid primary key,
  tenant_id text not null,
  user_id text,
  client_id text not null,
  assessment_type text not null,
  rubric_version text not null,
  blind boolean not null default true,
  reveal_used boolean not null default false,
  duration_ms bigint not null default 0,
  answer_hash text not null,
  score numeric(5,2) not null default 0,
  dimensions jsonb not null default '{}'::jsonb,
  signals jsonb not null default '{}'::jsonb,
  receipt text,
  verification text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
alter table odyssey_assessment_attempts add column if not exists user_id text;

create table if not exists odyssey_evidence_items (
  evidence_id uuid primary key,
  tenant_id text not null,
  user_id text,
  client_id text not null,
  artifact_type text not null,
  platform text not null default 'general',
  artifact_name text not null,
  evidence_sha256 text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
alter table odyssey_evidence_items add column if not exists user_id text;

create table if not exists odyssey_mission_sessions (
  session_id uuid primary key,
  tenant_id text not null,
  user_id text,
  client_id text not null,
  mission_id text not null,
  world_id text not null,
  mission_title text not null,
  mission_type text,
  skill text,
  revisit boolean not null default false,
  metadata jsonb not null default '{}'::jsonb,
  started_at timestamptz not null default now(),
  completed_at timestamptz
);

create table if not exists odyssey_project_work_orders (
  work_order_id text not null,
  tenant_id text not null,
  user_id text,
  client_id text not null,
  kind text not null,
  title text not null,
  status text not null default 'active',
  payload jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  primary key (tenant_id,client_id,work_order_id)
);

create table if not exists odyssey_artifact_evidence (
  artifact_id uuid primary key,
  work_order_id text not null,
  tenant_id text not null,
  user_id text,
  client_id text not null,
  expected_path text not null,
  file_name text not null,
  content_hash text not null,
  score numeric(5,2) not null,
  verified boolean not null default false,
  dimensions jsonb not null default '{}'::jsonb,
  signals jsonb not null default '[]'::jsonb,
  purpose text,
  naming_reason text,
  created_at timestamptz not null default now()
);

create index if not exists idx_odyssey_events_user_time on odyssey_learning_events(tenant_id,user_id,received_at desc);
create index if not exists idx_odyssey_progress_user_time on odyssey_proficiency_snapshots(tenant_id,user_id,captured_at desc);
create index if not exists idx_odyssey_assessments_user_time on odyssey_assessment_attempts(tenant_id,user_id,created_at desc);
create index if not exists idx_odyssey_evidence_user_time on odyssey_evidence_items(tenant_id,user_id,created_at desc);
create index if not exists idx_odyssey_sessions_user_time on odyssey_mission_sessions(tenant_id,user_id,started_at desc);
create index if not exists idx_odyssey_work_user_time on odyssey_project_work_orders(tenant_id,user_id,updated_at desc);
create index if not exists idx_odyssey_artifacts_work on odyssey_artifact_evidence(tenant_id,user_id,work_order_id,created_at desc);

-- Authenticated users should be unique across devices at the logical layer.
create unique index if not exists uq_odyssey_progress_user_version
  on odyssey_proficiency_snapshots(tenant_id,user_id,version)
  where user_id is not null;
