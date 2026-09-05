# Deployment

> The deployable is a single Cloudflare Worker that serves the built frontend as
> static assets and answers `/api/*`. **Workers static hosting, not Pages**
> (ADR-0001). `wrangler.jsonc` and the worker entry point exist; binding IDs and
> secrets still need to be provisioned.

## Topology

| Environment | Worker name | Purpose |
|---|---|---|
| local | `wrangler dev` | Dev; local-simulated D1/R2/Queue by default |
| staging | `vmedithon-staging` | Pre-prod; own D1/R2/Queue + Clerk dev instance |
| production | `vmedithon` | Live event; Clerk prod instance |

Environments are `env.staging` / `env.production` blocks in `wrangler.jsonc` with
separate binding IDs — never share D1 databases or R2 buckets across envs.

## `wrangler.jsonc` shape (target)

```jsonc
{
  "$schema": "./node_modules/wrangler/config-schema.json",
  "name": "vmedithon",
  "main": "worker/index.ts",
  "compatibility_date": "<recent, within ~30 days>",
  "compatibility_flags": ["nodejs_compat"],
  "assets": {
    "directory": "./dist",
    "not_found_handling": "single-page-application"
  },
  "d1_databases": [{ "binding": "DB", "database_name": "vmedithon", "database_id": "<id>", "migrations_dir": "./migrations" }],
  "r2_buckets": [
    { "binding": "UPLOADS", "bucket_name": "vmedithon-uploads" },
    { "binding": "ARTIFACTS", "bucket_name": "vmedithon-artifacts" }
  ],
  "queues": {
    "producers": [{ "binding": "JOBS", "queue": "vmedithon-jobs" }],
    "consumers": [{ "queue": "vmedithon-jobs", "dead_letter_queue": "vmedithon-jobs-dlq" }]
  },
  "observability": { "enabled": true, "head_sampling_rate": 1 },
  "vars": { "ENVIRONMENT": "production", "CLERK_ORG_ID": "org_..." },
  "env": { "staging": { "name": "vmedithon-staging", "vars": { "ENVIRONMENT": "staging" } } }
}
```

After any binding change: `wrangler types` (regenerate `Env` — never hand-write it).

## Local development secrets

Copy `.dev.vars.example` to `.dev.vars` and fill in the real values:

```bash
cp .dev.vars.example .dev.vars
```

`CLERK_SECRET_KEY` and `CLERK_WEBHOOK_SIGNING_SECRET` are used by the worker
locally. Do not commit `.dev.vars`.

## Config & secrets matrix

| Value | Where | Mechanism |
|---|---|---|
| `VITE_CLERK_PUBLISHABLE_KEY` | frontend build | `.env` / CI env at build time (publishable = non-secret) |
| `CLERK_SECRET_KEY` | Worker | `wrangler secret put` (never CLI args, never in config) |
| `CLERK_WEBHOOK_SIGNING_SECRET` | Worker | `wrangler secret put` — from the Clerk dashboard webhook endpoint |
| `CERTIFICATE_SIGNING_SECRET` | Worker | `wrangler secret put` — HMAC-signs public certificate verification responses |
| `CLERK_ORG_ID` | Worker | `vars` (non-secret identifier) |
| Local dev secrets | `.dev.vars` | gitignored; mirror the Worker secret names |

Clerk webhook endpoint registered in the Clerk dashboard points at
`https://<host>/api/webhooks/clerk` per environment. For local webhook testing use
the Clerk CLI tunnel (`clerk webhooks listen`).

## Deploy procedure

```bash
bun run build                          # produces dist/
wrangler d1 migrations apply vmedithon --remote   # pending migrations first
wrangler deploy --env production       # or --env staging
```

Order matters: **migrations before deploy** when a migration adds columns the new
code requires; for destructive changes use expand→contract (add-compatible first,
contract in a later release). All current migrations are greenfield — no data to
preserve yet.

## Rollback

- `wrangler rollback` (or `wrangler rollback <VERSION_ID>`) restores the previous
  Worker version — static assets included, since they deploy together.
- Migrations are forward-only; a bad migration is corrected by a new migration,
  not by editing applied ones.
- `wrangler deploy --dry-run` before risky deploys.

## First-run checklist (Phase 0/1)

1. `wrangler d1 create vmedithon` (+ staging), `wrangler r2 bucket create` ×2 (+DLQ
   queue), `wrangler queues create vmedithon-jobs` (+ `-dlq`); record IDs in
   `wrangler.jsonc`.
2. Clerk: dev instance + Organizations enabled (membership optional) + "VMEDITHON
   staff" org → set `CLERK_ORG_ID`, webhook endpoint, secrets.
3. Deploy staging, verify `GET /api/health` + site loads.
4. Seed first `master_admin` (insert `staff_members` row for the operator's Clerk
   user after their first sign-in — documented SQL in the seed migration or a
   `wrangler d1 execute` command in a runbook).
5. Configure production Clerk instance + custom domain **(DECISION REQUIRED —
   domain not yet registered/known)**.

## Out of scope (deferred)

- Transactional email provider (GAP-EMAIL-01) — needs a decision ADR first.
- Backup/audit export stream (CAP-EVT-02) — surface in settings as "not connected"
  until implemented.
- CI/CD pipeline — no CI exists; when added, it should run `scripts/verify` and
  `wrangler deploy --dry-run`.
