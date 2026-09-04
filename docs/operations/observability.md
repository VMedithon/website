# Observability

> Target state — nothing is instrumented yet. Keep this proportional to the
> system: one Worker, one D1, one queue. Do not add APM tooling that costs more
> than it saves at event scale.

## Logs

- `observability.enabled: true` in `wrangler.jsonc` with
  `head_sampling_rate: 1` during build-out (reduce if volume becomes noisy).
- Worker code logs **structured JSON** (`console.log(JSON.stringify({...}))`)
  with at minimum: `event`, `route`, `actor_user_id` (when present), `outcome`.
- Live debugging: `wrangler tail` (`--status error`, `--search`, `--format json`).
- Never log secrets, full JWTs, UPI IDs, or file contents.

## What to watch

| Signal | Source | Why |
|---|---|---|
| 5xx rate on `/api/*` | Workers metrics / tail | User-facing failures |
| `vmedithon-jobs-dlq` depth | Queue metrics | Stuck imports / certificates stuck `pending` (EVT-IMPORT-01, EVT-CERT-01) |
| Webhook non-2xx responses | Tail + Clerk dashboard retry log | Identity drift between Clerk and D1 mirrors |
| `certificates` stuck in `pending` | D1 query / dashboard check | CERT generation failures map to unhappy verify lookups |
| D1 storage/rows | `wrangler d1 info` | Headroom at event scale |

## Health

`GET /api/health` (API-HEALTH-01) is the liveness probe. Deeper checks
(D1 reachable, queue sendable) belong in a staff-only `/api/staff/diagnostics`
if ever needed — do not expose dependency status publicly.

## Failure-mode quick reference

| Symptom | Likely cause | First move |
|---|---|---|
| Verify returns `pending` forever | CERT consumer failing → DLQ | `wrangler tail` + check `vmedithon-jobs-dlq`; replay or re-enqueue |
| Staff can't access anything | `staff_members` row missing/deactivated, or org membership not synced | Check row + `webhook_events` for the acceptance event |
| All auth failing | Clerk keys wrong env (dev vs prod keys swapped) | Confirm `CLERK_SECRET_KEY`/`VITE_CLERK_PUBLISHABLE_KEY` pair belongs to the same instance |
| Duplicate submissions | Unique constraint missing (migration not applied) | `wrangler d1 migrations list --remote` |
| Webhook 400s | Signing secret mismatch | Rotate `CLERK_WEBHOOK_SIGNING_SECRET` to match the dashboard endpoint |
