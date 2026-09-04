# 0001. Cloudflare Workers static hosting + Worker API + D1/R2 + Clerk, in one repo

- Status: Accepted
- Date: 2026-09-04

## Context

The repository contains a working Vite + React static frontend and a Control Room
UI that is entirely mock data. The product requires a real backend (auth, teams,
submissions, forms, finance, certificates, invitations). The site footer already
lists Cloudflare and Clerk as build partners. Constraints: event-scale load
(hundreds of teams, ~5k users), small team, tight timeline (event Sept 21–22,
2026), no existing infrastructure to preserve.

The deploy target was specified directly: **Cloudflare Workers static hosting —
not Pages.**

## Decision

- **One Cloudflare Worker** serves the built frontend via the static-assets
  binding (`assets.directory = "./dist"`, SPA not-found handling) and answers
  `/api/*` itself. No CORS, one hostname, one deploy.
- **D1** (SQLite) for relational data, **R2** for files, **one Queue** for async
  jobs (dataset import, certificate generation).
- **Clerk** for authentication (`@clerk/react` SPA + JWT verification in the
  Worker via `@clerk/backend`) and for staff invitation delivery via a single
  staff Organization.
- **Monorepo**: frontend remains at repo root; the Worker is added under
  `worker/` with `migrations/` and a root `wrangler.jsonc`. Bun is the package
  manager. No workspace restructure — the frontend does not move.

## Alternatives considered

- **Cloudflare Pages + separate API Worker**: two deployables and a cross-origin
  or routed boundary for no benefit at this scale; the user explicitly excluded
  Pages.
- **Supabase + Clerk**: adds a second vendor and a Postgres dependency; Cloudflare
  is already a listed partner and D1 is sufficient for this scale.
- **Vercel**: referenced in `.gitignore` boilerplate only; not chosen.
- **Separate backend repo**: rejected — contracts, migrations, and frontend evolve
  together; one repo keeps them atomic in a single commit.

## Consequences

- One `wrangler deploy` ships frontend + API + config atomically.
- Worker-side auth must verify Clerk JWTs in the Workerd runtime — use
  `@clerk/backend`'s request verification, not Node-only SDK paths; keep
  `nodejs_compat` flag available.
- D1's single-writer model is acceptable here but means no heavy concurrent-write
  features (e.g., live collaborative editing) without revisiting this decision.
- The repo has no backend conventions yet — the structure in
  `system-architecture.md` is created by Phase 0 of the implementation plan.

## Conditions for reconsideration

- Sustained load or data volume beyond D1's comfort zone → evaluate Postgres +
  Hyperdrive.
- Need for long-running or stateful coordination → evaluate Workflows or Durable
  Objects rather than adding ad-hoc state.
- If a second event/tenant is required, the single-event data model assumption
  must be revisited first.
