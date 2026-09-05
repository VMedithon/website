# AGENTS.md — VMEDITHON 2026 Platform

This file is the primary entry point for AI coding agents. Read it first, then load only
the documents you need via `docs/INDEX.md`.

## What this repository is

The platform for **VMEDITHON 2026**, a 36-hour overnight hackathon at VIT Vellore
(September 21–22, 2026). It contains a public marketing site plus a participant and
staff platform ("Control Room") covering registration, pitch submission and review,
dynamic forms, finance requests, and certificate issuance + public verification.

## Project mode: MOSTLY IMPLEMENTED

| Subsystem | Mode | Reality |
|---|---|---|
| Marketing landing site (`src/App.tsx`) | Brownfield | Implemented and working; includes `/`, `/platform`, `/participant`, and `/verify` |
| Backend, auth, persistence, platform API | Implemented | Cloudflare Worker, D1, R2, Queues, Clerk; all routes live under `/api` |
| Public certificate verification | Implemented | `worker/routes/public.ts` and `/verify` |
| Control Room dashboard (`src/Dashboard.tsx`) | Implemented | Loads live data at `/platform`; create/edit flows exist for finance, forms, certificates, people, and settings |
| Participant portal (`src/Participant.tsx`) | Implemented | `/participant` team create/invite, pitch upload, and forms list are wired to the API |

**Treat `docs/execution/current-state.md` and `docs/execution/gap-analysis.md`
as the source of truth for what is and is not yet complete.**

## Authority hierarchy (what SHOULD be true)

1. `docs/product/product-spec.md` — product requirements and capabilities (CAP-*)
2. `docs/domain/business-logic.md` — business rules (RULE-*)
3. `docs/domain/invariants.md` — invariants that must never break (INV-*)
4. `docs/architecture/decisions/` — accepted architecture decisions (ADR-*)
5. `docs/contracts/` — data model, API, and event contracts (API-*, EVT-*)
6. `docs/execution/implementation-plan.md` — sequencing
7. Implementation

Descriptive truth (what IS true) lives in `docs/execution/current-state.md` and
`docs/execution/gap-analysis.md`. Descriptive docs never override normative docs —
when they disagree, that disagreement is a GAP-* entry, not a spec change.

## Navigation

Start at `docs/INDEX.md`. It maps each kind of task to the minimum set of files to
load. Do not read every doc before a small change.

## Commands

Package manager is **Bun** (`bun.lock` is committed).

```bash
bun install            # install dependencies
bun run dev            # Vite dev server (frontend only, for now)
bun run typecheck      # tsc -b --pretty false — must pass
bun run lint           # biome check . — must pass
bun run build          # tsc -b && vite build → dist/
```

Target verification:
`./scripts/verify` runs typecheck + lint + tests + build + `wrangler types --check`.
Keep this green before committing. For a faster local check:
`bun run typecheck && bun run lint && bun run build`.

## Engineering rules

- TypeScript strict mode is on (`noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`).
  Do not weaken `tsconfig` to make code compile.
- Biome **lints but does not format** (`formatter.enabled: false` in `biome.json`).
  Match surrounding style manually. The codebase uses **tabs**.
- `src/styles.css` is intentionally written as a few very long lines (compact CSS).
  Edit it carefully with targeted replacements; do not run a formatter over it.
- `bun run test` runs `vitest` on `tests/**/*.test.ts` and `**/*.test.ts`.
  Unit tests for state machines exist in `tests/state.test.ts`. Worker integration
  tests and Playwright E2E tests are still to be added.
- `src/Dashboard.tsx` and `src/Participant.tsx` now load live data from the
  worker API. Some complex UI flows (form field builder, certificate background
  replacement, reviewer assignment) are still partial.
- Never commit secrets. Clerk/Cloudflare secrets go in `.dev.vars` (local) or
  `wrangler secret put` (deployed). See `docs/operations/deployment.md`.
- Workers code must follow Cloudflare best practices: no module-level request state,
  no floating promises, `ctx.waitUntil` for post-response work, Web Crypto for IDs,
  bindings over the Cloudflare REST API. `wrangler.jsonc` (JSONC) is the config format.

## Hard constraints — never do these

- Do not break the public certificate-verification contract once certificates are
  printed (`COMP-VERIFY-01` in `docs/contracts/api-contract.md`).
- Do not expose staff or participant data on public endpoints (`INV-DATA-01`).
- Do not implement authorization by trusting frontend role state — every `/api/staff/*`
  check is enforced in the Worker (`INV-AUTH-01`, `INV-AUTH-02`).
- Do not store money as floating point — integer paise only (`INV-FIN-01`).
- Do not hand-write `Env` binding interfaces — run `wrangler types`.

## Documentation synchronization (part of every change, not cleanup)

| Change | Must update |
|---|---|
| Business behavior | `docs/domain/business-logic.md`, affected INV-*, tests |
| API surface | `docs/contracts/api-contract.md` (+ compatibility notes if public) |
| Schema / migration | `docs/contracts/data-model.md`, `migrations/` |
| Architecture decision | new ADR in `docs/architecture/decisions/` |
| Feature implemented | `docs/execution/current-state.md` (it is a status ledger, not a changelog) |
| New current-vs-desired gap found | `docs/execution/gap-analysis.md` |
| Deployment / ops | `docs/operations/deployment.md`, `observability.md` |
| Recurring implementation trap | this file |

## Recurring implementation traps

- Hono routes must be typed with `AppEnv` (in `worker/types.ts`) for `c.get`
  variables and `c.env` bindings to resolve. Use `new Hono<AppEnv>()` and
  `Context<AppEnv>` everywhere, not `Hono<{ Bindings: Env }>`.
- `@clerk/backend`'s `verifyToken` wraps the raw `JwtReturnType` and throws on
  errors. To stay compatible with its current d.ts and runtime return shape,
  treat the result as `unknown` and then handle either `{ data: JwtPayload }` or
  a bare `JwtPayload` object.
- `c.body(data, status, headers)` requires a `Record<string, string | string[]>`
  for headers — pass a plain object, not a `Headers` instance.
- Run `wrangler types` after any `wrangler.jsonc` change and keep
  `worker-configuration.d.ts` up to date. `worker/types.ts` should not define an
  `Env` interface by hand; it reuses the generated `Cloudflare.Env` via
  `AppEnv`.

## Key warnings

- **UNKNOWN INTENT areas are marked** in `current-state.md`. Investigate before
  changing behavior they describe.
- The `dist/` build output is gitignored — treat it as disposable.
- `.omo/` is an empty local tool directory; it is not project infrastructure.
