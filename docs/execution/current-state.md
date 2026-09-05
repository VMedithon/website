# Current State — what actually exists

> Descriptive truth, evidence-based. This is a **status ledger, not a changelog** —
> update entries as capabilities land; delete obsolete gaps. Normative intent
> lives in `../product/product-spec.md` and `../domain/`. Last verified:
> 2026-09-04 (baseline checks below).

## Project status

**MOSTLY IMPLEMENTED**: the marketing site, backend worker, D1/R2/Queue bindings,
auth, and frontend routes are in place. The Control Room dashboard and participant
portal are wired to the worker API for core read and create operations.

## Baseline verification (2026-09-04)

|| Check | Result |
|---|---|---|
|| `bun install` (deps present) | OK — bun.lock committed |
|| `bun run typecheck` (`tsc -b`) | PASS (app + worker) |
|| `bun run lint` (`biome check .`) | PASS |
|| `bun run build` (`tsc -b && vite build`) | PASS → `dist/` (~227 kB JS, ~21 kB CSS) |
|| `bun run test` | PASS — `tests/state.test.ts` (unit tests for state machines) |
|| `./scripts/verify` | PASS — typecheck, lint, test, build, `wrangler types --check` |
|| Deploy config | `wrangler.jsonc`, `migrations/`, `worker/` in place; secrets need real values. |

Treat these as the green baseline — distinguish future regressions from
pre-existing absences.

## Implemented capabilities

- **Landing page** (`src/App.tsx`, `src/styles.css`, `src/data.ts`): nav with
  mobile menu, hero, proof strip, tracks, journey, experience, partners, closing
  CTA, footer.
- **Frontend routing** (`src/main.tsx`, `src/App.tsx`): `BrowserRouter` with `/`,
  `/platform` (staff), `/participant` (team portal), and `/verify`;
  `ClerkProvider` wraps the app when `VITE_CLERK_PUBLISHABLE_KEY` is configured.
- **Public certificate verification** (`/verify` route, `worker/routes/public.ts`):
  calls `GET /api/public/certificates/:certificate_id` and displays real result.
- **Cloudflare Worker backend** (`worker/`):
  - D1 schema in `migrations/0001_init.sql` and `migrations/0002_seed_settings.sql`.
  - Clerk auth middleware, staff role/permission resolution.
  - Participant routes: teams, team members, pitch submissions, forms and
    responses.
  - Staff routes: overview, teams, submissions, reviews, imports, forms studio,
    finance, certificate templates and issuance, people/invitations, settings.
  - Clerk webhooks (`/api/webhooks/clerk`) for user and invitation sync.
  - Queue consumer (`worker/queue.ts`) for certificate SVG generation and
    Devnovate import stubs.
- **Tooling**: Biome lint (formatter and assist **disabled** — style is manual),
  strict TypeScript (`noUncheckedIndexedAccess`,
  `exactOptionalPropertyTypes`), Vite 7, React 19, lucide-react, Bun, wrangler,
  vitest.

## Partially implemented

- **Control Room dashboard** (`src/Dashboard.tsx`) loads live data and supports
  create/edit mutations for finance requests, forms (with field builder),
  certificate templates/issuance, people/invitations, and settings. The certificate
  background file replacement, printed certificate rendering, and reviewer
  assignment are still partial or cosmetic.
- Dashboard sidebar "Invitations" and "People & access" both render the same
  `People` view (intentional or unfinished — UNKNOWN INTENT).

## Missing capabilities

- Certificate background replacement, PDF/PNG rendering and signed verification
  payload (`COMP-VERIFY-01` is partially met by SVG artifacts; payload not yet signed).
- Real Devnovate import CSV mapping and queue processing.
- Playwright E2E tests and worker integration tests.
- Production D1 / R2 / Queue provisioning and `wrangler deploy`.

## Architecture currently in use

Single Cloudflare Worker (`worker/index.ts`) serves API and is paired with the
Vite-built static SPA in `dist/`. `wrangler.jsonc` configures D1, R2, Queue, and
assets. `Clerk` handles identity; the worker resolves staff authorization from
D1 (`staff_members`).

## Data stores / integrations / deployment

- D1: `migrations/0001_init.sql` creates all tables.
- R2: `UPLOADS` (pitches, imports) and `ARTIFACTS` (certificate SVGs,
  certificate backgrounds).
- Queue: `JOBS` for certificate generation and import processing.
- Secrets: `CLERK_SECRET_KEY` and `CLERK_WEBHOOK_SIGNING_SECRET` must be set
  in `.dev.vars` locally or via `wrangler secret put` for production.
- `dist/` is the disposable Vite build output.

## Known limitations / debt

- `src/Dashboard.tsx` and `src/Participant.tsx` now load live data and support
  core create/edit; remaining partial flows are certificate background
  replacement, reviewer assignment, and Devnovate import mapping.
- `src/styles.css` is compacted: large diffs are hard to review; edits should be
  targeted string replacements.
- `index.html` title/description are set; no favicon or social meta.
- Several commits on `feat/frontend-event-platform`.

## UNKNOWN INTENT markers

|| Observation | Question |
|---|---|---|
|| Dashboard greets "Srijan G. — Master admin" | Placeholder identity; real staff list sourced from `staff_members` table. |
|| "Import Devnovate dataset" | Devnovate's export format is unspecified — obtain a sample file before Phase 7 import work. |
|| "Registration payment confirmed" pipeline stat | Round one is stated free; whether later rounds charge a fee is undecided (product-spec assumes none — DECISION REQUIRED if wrong). |
|| Event date in hero: "21—22 September 2026" | Treated as authoritative product fact. |
|| Participants: account vs accountless registration | Spec assumes Clerk participant accounts (submission tracking, certificates). Reasonable default — flag if organizers prefer accountless. |

## Unresolved discoveries

None blocking. The demo numbers (842 teams, ₹48.2K finance) are illustrative.
