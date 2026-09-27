# Cloud Odyssey Backend Control Plane

## Objective

Cloud Odyssey is evolving from a local-first simulation into a production-grade learning platform. The backend is designed to support:

- server-side grading and adaptive recommendations
- durable progress and event history
- verified assessment receipts
- evidence provenance without unnecessarily retaining raw evidence
- eventual multi-user subscriptions, RBAC, teams, and enterprise cohorts
- operational observability and recovery

## Current runtime

**Compute:** Vercel Functions on Node.js 24  
**Persistence adapter:** Neon/Postgres through `@neondatabase/serverless`  
**Frontend:** static Cloud Odyssey application  
**API contract:** `openapi.yaml`

The API remains useful if Postgres is unavailable. Stateless grading, recommendations, capabilities, health, and diagnostics continue to function. Persistent routes explicitly return a capability error instead of silently pretending a write succeeded.

## Request path

```text
Browser
  ↓
Versioned /api/v1 contract
  ↓
Request ID + validation + structured logging
  ↓
Policy engine
  ├── deterministic grading
  ├── adaptive recommendation policy
  └── evidence hashing / assessment signing
  ↓
Postgres capability boundary
  ├── append-only learning events
  ├── versioned proficiency snapshots
  ├── assessment attempt metadata
  ├── evidence digests
  ├── entitlements
  ├── durable jobs
  └── transactional outbox foundation
```

## Core invariants

1. **Job success is not business correctness.** Persistent state must be reconciled against business invariants.
2. **Mutations are idempotent.** Event writes require an idempotency key.
3. **Facts and projections are different.** Learning events are append-only; current proficiency is a versioned projection/snapshot.
4. **Verification is versioned.** Every assessment result identifies the rubric version used.
5. **Raw evidence is not required for provenance.** SHA-256 digests can establish evidence identity without storing the evidence body.
6. **Capabilities degrade explicitly.** If the database or signing secret is absent, the response states that capability is unavailable.
7. **Every request is traceable.** APIs emit request IDs and structured duration/status logs.

## Database model

See `db/migrations/001_core.sql`.

The first migration creates:

- `odyssey_learning_events`
- `odyssey_proficiency_snapshots`
- `odyssey_assessment_attempts`
- `odyssey_evidence_items`
- `odyssey_entitlements`
- `odyssey_jobs`
- `odyssey_outbox`

The job table is intentionally designed for a future worker using row leasing / `FOR UPDATE SKIP LOCKED`. The outbox table is the foundation for reliable asynchronous webhook, notification, analytics, and email delivery.

## Verified assessment model

Practice scores and verified scores should never be conflated.

A verified attempt should eventually require:

- authenticated identity
- blind/unseen variant
- no solution reveal
- server-side timing
- immutable rubric version
- server-side grading
- answer hash
- signed result receipt
- replay protection
- retention test on a later date

The current API can already generate the hash and an HMAC receipt when `ASSESSMENT_SIGNING_SECRET` is configured.

## Multi-tenant hardening roadmap

Before selling Cloud Odyssey as a multi-user product:

1. add end-user authentication
2. create tenant memberships and role claims
3. enforce tenant ID from the authenticated principal, never from a trusted client field
4. add server-side entitlement checks
5. add distributed rate limiting / abuse controls
6. add object storage for portfolio evidence
7. add webhook signature verification
8. add billing-event idempotency
9. add worker/outbox consumers
10. add SLOs, traces, dashboards, backup/restore tests, and chaos exercises

## Why this architecture

The goal is not maximal complexity. Each pattern exists because it closes a specific production failure mode:

- event ledger → auditability and replay
- snapshots → efficient current-state reads
- idempotency → safe retries
- signed receipts → tamper evidence
- outbox → reliable cross-system side effects
- capability degradation → honest failure semantics
- request IDs → incident correlation
- versioned contracts → safe evolution

That tradeoff discipline is the engineering skill Cloud Odyssey should teach.
