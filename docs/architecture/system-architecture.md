# System Architecture

> Describes the **target** architecture and, where they differ, the **current**
> architecture. Do not read "target" as implemented — check
> `../execution/current-state.md`. Rationale for the stack is in
> `decisions/0001-cloudflare-clerk-monorepo.md` and `decisions/0002-*`.

## Current architecture (observed)

```
Browser → Vite dev server / static dist/
          └── Single-page React app (no router, no backend calls)
```

One deployable artifact: a static site. No server, no database, no auth. The
"Control Room" is a client-side overlay rendering hardcoded data.

## Target architecture

```
                     ┌─────────────────────────── Cloudflare ───────────────────────────┐
                     │                                                                    │
  Browser ──────────▶│  Worker "vmedithon"                                                 │
    (React SPA)      │    ├─ /*        → static assets binding (built frontend, dist/)    │
                     │    ├─ /api/*    → API routes (Hono or hand-rolled router)          │
    Clerk JS         │    ├─ /api/webhooks/clerk → Clerk webhook ingress (Svix verify)    │
    (login/token)    │    └─ queue consumers (import processing, certificate rendering)   │
                     │                                                                    │
                     │  Bindings:                                                          │
                     │    D1        relational data (teams, forms, finance, certs, staff)  │
                     │    R2        files (pitch uploads, cert backgrounds, issued certs)  │
                     │    Queue     async jobs (dataset import, certificate generation)    │
                     │                                                                    │
                     └────────────────────────────────────────────────────────────────────┘
                                        │                        ▲
                    Clerk Backend API ◀─┘ (JWT verify, orgs,     │ webhooks
                    invitations, JWKS)                           │ (user.*, orgMembership.*)
```

### Why one Worker serves both static assets and API

- Single hostname → no CORS surface, cookies/Authorization headers trivially same-site.
- Workers static assets hosting is free-tier friendly at this scale and avoids a
  separate Pages project (explicitly chosen over Pages — ADR-0001).
- `/api/*` routes are checked first; everything else falls through to the SPA asset
  handler with `not_found_handling: "single-page-application"` so deep links work.

### Frontend

- Existing Vite + React 19 SPA stays at repo root (`src/`), building to `dist/`.
- **Add `react-router`** (v7) — the platform needs real URLs for invitation
  acceptance, certificate verification links, and deep-linking into Control Room
  views. The current modal-overlay preview becomes routed pages under `/platform/*`.
- Auth via `@clerk/react`: `ClerkProvider` at root, `useAuth()` guards, API calls
  attach `Authorization: Bearer <session JWT>` from `getToken()`.
- Public pages (`/`, `/verify/:id`) render without auth; `/platform/*` requires
  sign-in; `/platform/staff/*` additionally requires staff status resolved
  server-side (the UI hides, the Worker denies — INV-AUTH-01).

### API Worker (`worker/`)

- Routes under `/api`. Thin route handlers → service functions → D1/R2. Keep
  authorization checks at the service boundary so they cannot be bypassed by
  adding a route (INV-AUTH-01).
- Clerk session JWTs verified in-Worker via `@clerk/backend`
  (`authenticateRequest` / `verifyToken` with the instance's secret key or JWKS).
  Verified claims + D1 `staff_members` row = effective authorization (ADR-0002).
- **Bindings, not REST**: D1/R2/Queue access goes through bound objects; the only
  external calls are to the Clerk Backend API (invitations, user lookups).
- Async work off the critical path: dataset imports and certificate rendering are
  queued messages (EVT-*), consumers retry with a dead-letter queue.
- No module-level request state; `ctx.waitUntil` for best-effort post-response work
  (e.g., audit flushing if ever made async — audit_log writes are synchronous
  because INV-AUDIT-01 is stronger than best-effort).

### Data & storage split

| Store | Owns |
|---|---|
| D1 | All relational state. Migrations via `wrangler d1 migrations` in `migrations/`. See `../contracts/data-model.md`. |
| R2 | Pitch files, certificate backgrounds, issued certificate files, import uploads. Keys are internal UUIDs; never public URLs — reads are proxied through authorized Worker routes. |
| Queue `vmedithon-jobs` | `import.process`, `cert.generate` messages. Consumer in the same Worker. |
| Clerk | Identity, sessions, staff org membership, invitation emails. Not a data store — D1 `users`/`staff_members` are the authoritative mirrors for anything we query (webhook-synced, EVT-CLERK-*). |

### Trust boundaries

1. **Public → Worker**: unauthenticated requests reach only `/` assets,
   `GET /api/health`, `GET /api/public/certificates/:id` (rate-limited,
   whitelisted response — INV-DATA-01), and `/api/webhooks/clerk`
   (Svix-signature-verified, not session-authenticated).
2. **Participant → staff boundary**: a signed-in user is a participant unless a
   `staff_members` row grants access. Two independent checks: valid Clerk JWT,
   then D1 staff resolution.
3. **Worker → Clerk**: secret key is a Worker secret; never exposed to the
   frontend. Frontend only ever holds the publishable key.
4. **Webhook ingress**: verifies the Svix signature before any processing;
   replays dedupe via `svix-id` (INV-IDEM-01).

### Concurrency & consistency

- D1 is SQLite: single-writer. The mutation paths that must be atomic (certificate
  ID counter allocation, finance transitions, role changes with the
  last-master-admin guard) run as `batch()` transactions.
- Unique constraints are the last line of defense for INV-SUB-01, INV-CERT-01,
  INV-IDEM-01 — applications check, the database enforces.
- Certificate-ID allocation uses a `cert_counters(prefix)` row incremented inside
  the issuance transaction — no gaps-or-dupes race.

### Error handling

- API errors return `{ error: { code, message } }` with stable `code` strings
  (see api-contract.md). 4xx for client/validation, 409 for state conflicts, 5xx
  never leaks internals.
- Queue consumers: transient failures retry (queue config); poison messages go to
  a dead-letter queue and surface in the dashboard "needs attention" style (future).

### Secrets & config

- Build-time (frontend, public): `VITE_CLERK_PUBLISHABLE_KEY`.
- Worker vars (non-secret, `wrangler.jsonc`): `ENVIRONMENT`, `CLERK_ORG_ID`,
  certificate base URL.
- Worker secrets: `CLERK_SECRET_KEY`, `CLERK_WEBHOOK_SIGNING_SECRET`.
- Local dev: `.dev.vars` (gitignored). Full matrix in `../operations/deployment.md`.

### Repository layout (target)

```
/                      repo root — monorepo, bun
├── index.html, src/, dist/      Vite frontend (unchanged location)
├── worker/                      API Worker source (new)
│   ├── index.ts                 fetch + queue entrypoints, route table
│   ├── auth/                    Clerk verify + staff resolution
│   ├── routes/                  route handlers by module
│   └── services/                business logic (writes audit_log)
├── migrations/                  D1 migrations (wrangler d1 migrations)
├── scripts/verify               canonical verification command (new)
├── wrangler.jsonc               Worker config: assets → dist/, D1, R2, Queue
└── docs/                        this documentation
```

Frontend stays where it is; only `worker/`, `migrations/`, `wrangler.jsonc`, and
`scripts/` are added. No package-move churn.

### Technology limitations acknowledged

- D1 suits this scale (~5k users) but is not a general RDBMS substitute: no
  long transactions, limited concurrent writes — fine for an event platform.
- Worker request body limits govern upload size; 25 MB pitch cap (RULE-SUB-02) is
  well within limits. If that changes, move to R2 multipart upload.
- Certificate rendering (PDF/image generation) in a Worker is constrained —
  render to PNG via canvas-free approaches (SVG→R2 or Cloudflare Images/Browser
  Rendering if needed). The spec requires files in R2; the rendering mechanism is
  an implementation detail owned by Phase 6.
