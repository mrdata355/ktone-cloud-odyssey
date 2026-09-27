# Cloud Odyssey SaaS Foundation — Production Activation

This runbook activates the durable/authenticated SaaS layer that is already implemented in source.

## Safety rule

Never place passwords, database URLs, auth secrets, OAuth secrets, or signing secrets in GitHub source or browser JavaScript. They belong in Neon/Vercel server-side configuration only.

## 1. Select or create the Neon production project

Cloud Odyssey needs one Neon project and its production/default branch. The connected Neon tool in the current ChatGPT session is unscoped and cannot list projects, so the production project ID must be selected in Neon Console or supplied to the connector before automated database mutation.

Record:
- Neon project ID
- Production branch ID
- Database name (normally `neondb`)
- Region

## 2. Apply the database migration

Run:

`migrations/001_saas_foundation.sql`

The migration is idempotent and creates the Cloud Odyssey durable model:
- users
- tenants
- memberships
- learning events
- proficiency snapshots
- assessment attempts
- evidence items
- mission sessions
- project work orders
- artifact evidence

After `DATABASE_URL` is attached, verify:

`GET /api/v1/schema-status`

Required result:
- `ready: true`
- 10/10 tables found
- 7/7 user-scoped identity columns found

## 3. Enable Managed Better Auth

In Neon Console:
Project -> production branch -> Auth -> Enable Auth.

Cloud Odyssey uses Managed Better Auth because auth state lives with the Neon database and can branch with preview/test environments.

Record the Auth Base URL from the Auth Configuration screen.

Add the production site as an Auth trusted domain:

`https://ktone-cloud-odyssey.vercel.app`

Do the same for any custom production domain before using it for sign-in.

## 4. Configure Vercel server environment

In Vercel:
Cloud Odyssey project -> Settings -> Environment Variables.

Set for Production (and Preview only when intentionally testing preview auth/data):

- `DATABASE_URL` = Neon connection string
- `NEON_AUTH_BASE_URL` = Neon Managed Better Auth Base URL
- `AUTH_REQUIRED=false` for initial smoke testing
- `ASSESSMENT_SIGNING_SECRET` = securely generated random secret

Optional overrides:
- `NEON_AUTH_JWKS_URL`
- `AUTH_ISSUER`
- `AUTH_AUDIENCE`

By default Cloud Odyssey derives:
- JWKS = `<NEON_AUTH_BASE_URL>/.well-known/jwks.json`
- issuer = origin of `NEON_AUTH_BASE_URL`
- audience = origin of `NEON_AUTH_BASE_URL`

Redeploy after environment changes.

## 5. Production smoke sequence

Open **Account & Sync** and verify in this order:

1. Backend API = ONLINE
2. Postgres + schema = READY
3. Managed Better Auth = configured
4. Create a test account
5. Sign out
6. Sign back in
7. Launch a project work order
8. Complete one checklist item
9. Verify one project artifact
10. Sync proficiency
11. Open another browser/device and sign in
12. Confirm the latest server work order and proficiency restore

Also verify:
- `GET /api/v1/health`
- `GET /api/v1/schema-status`
- `GET /api/v1/me`

## 6. Turn on enforced authentication

Only after the full smoke sequence passes, change:

`AUTH_REQUIRED=true`

Redeploy and repeat:
- signed-out protected API call -> 401
- sign-in -> protected API call succeeds
- expired JWT -> browser refreshes token through same-origin Auth session proxy and retries once
- sign-out -> session/JWT cleared

Do not enable `AUTH_REQUIRED=true` before the auth flow is proven, or guest study flows may be blocked.

## 7. Evidence signing

When `ASSESSMENT_SIGNING_SECRET` is active:
- server grading receipts become cryptographically signed
- evidence can be independently tied to a server-issued receipt

Rotate the signing secret through a controlled key-version process before treating certificates as long-lived externally verifiable credentials.

## 8. Next production gates

After database + auth:
- server-authoritative project/mastery state
- Stripe subscription + entitlement service
- Free / Pro / Team / Enterprise plan enforcement
- rate limits and abuse controls
- RLS/RBAC hardening
- deletion/export workflows
- backups + restore drill
- synthetic monitoring and alerting
- privacy policy / terms / support process
- employer/team pilot analytics

## Rollback

If auth causes a production issue:
1. Set `AUTH_REQUIRED=false`
2. Redeploy
3. Keep guest/local recovery mode available
4. Preserve database/auth logs
5. Fix the session/JWT/trusted-domain issue
6. Re-run smoke tests before re-enabling enforcement

If database connectivity fails, the app should report persistence unavailable rather than claim durable synchronization.
