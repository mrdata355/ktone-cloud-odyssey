# Cloud Odyssey — Production Lab OS

Cloud Odyssey is a stateful Senior ML / AI Data Engineer simulation platform focused on Hilton Grand Vacations-style production systems.

## Core platform

- 10 production worlds / projects
- 30 hands-on missions
- 60 PROJECTS* production deliverables
- XP, levels, mastery, streaks and relics
- break/fix incident war room
- business-impact and architecture reasoning
- local progress persistence
- Vercel-ready static deployment

## Enterprise expansion

- 120-task Campaign Writeback Recovery drill
- 15 deep recovery stages covering:
  - business invariants
  - source continuity
  - Delta CDF recovery
  - canonical identities and dispositions
  - Snowflake history/current repair
  - multi-destination idempotent delivery
  - legacy acknowledgement loop safety
  - worker fencing and restart semantics
  - certified publication
  - RBAC and tenant isolation
  - failure injection
  - reconciliation and observability
  - performance / scale / cost
  - runbooks and rollback
  - STAR / system-design explanation
- six acceptance gates
- weighted senior-level grading rubric
- 120-minute timed production drill
- real in-browser Python runtime using pinned Pyodide
- real browser SQL scratchpad using sqlite3 through Pyodide
- optional Monaco / VS Code editor
- Databricks workspace simulator
- Kafka topic / consumer simulator
- Delta Lake / CDF explorer
- MLflow model lifecycle simulator
- Airflow workflow simulator
- dbt lineage simulator
- GitHub PR / release-gate simulator
- AWS architecture console
- Azure architecture console
- adaptive interview arena
- AI engineering-manager sprint board
- PagerDuty-style incident queue
- STAR / resume-story generator
- readiness certificate and evidence portfolio

## Included deep lab

The repository includes the full Campaign Writeback Recovery practice pack at:

`labs/campaign-writeback-recovery/`

Files:
- `README.md`
- `fixture.json`
- `snowflake_fixture.sql`
- `faulty_job.py`
- `mock_destinations.py`

## Deployment

Recommended Vercel project name:

`ktone-cloud-odyssey`

No environment variables are required for the current static build. External browser runtimes load only when the user invokes them.
