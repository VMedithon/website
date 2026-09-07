# Current State — what actually exists

> Descriptive truth, evidence-based. This is a **status ledger, not a changelog**.
> Last verified: 2026-09-06.

## Project status

**FRONTEND-ONLY**. All backend services, Cloudflare Worker bindings,
migrations, auth integration, and deployment configuration have been removed.
The repository is now a static single-page application built with Vite + React.

## Baseline verification (2026-09-06)

| Check | Result |
|---|---|
| `bun install` | OK |
| `bun run typecheck` | PASS |
| `bun run lint` | PASS |
| `bun run build` | PASS -> `dist/` |

## Scope

- **Public marketing site** (`src/App.tsx`, `src/styles.css`, `src/data.ts`,
  `src/ParticipantDashboard.tsx`): a single-page landing experience plus a
  local-only participant dashboard.
- **Sections implemented**: Hero / registration CTAs, About, 9-stage journey,
  two-round format, Round 1 evaluation criteria, sample problem statements,
  shortlisting and next steps, Round 2 schedule, mentor groups,
  industry-refinement areas, innovation / patentability, final judging criteria,
  sponsors/partners, sponsor CTA, venue, FAQ, certificate verification,
  results/winners, footer.
- **Participant dashboard** (`/dashboard`): local-storage-only draft submission
  form with team, problem statement, research fields, PPT placeholder,
  shortlisting status, announcements, mentor information, and results/certificate
  placeholders.
- **Navigation** (`src/data.ts`): Home, About, Challenges, Event Flow, Schedule,
  Mentors, Speakers/Judges, Sponsors, FAQ, Dashboard, plus a highlighted
  Register CTA.

## Removed

- `worker/` Cloudflare Worker, D1/R2/Queue bindings, migrations, Clerk auth
- `wrangler.jsonc`, `worker-configuration.d.ts`, `tsconfig.worker.json`,
  `tsconfig.node.json`, `vitest.config.ts`, `playwright.config.ts`, `scripts/`
- `@clerk/backend`, `@clerk/react`, `hono`, `@cloudflare/*`, `playwright`,
  `vitest` dependencies

## Data and auth

- No backend API. No persisted user data. The participant dashboard stores
  drafts in the browser's `localStorage` only. Any backend wiring will require
  a fresh design.

## Known limitations

- Event details such as final problem statements, sponsor logos, speaker/judge
  names, exact schedule, reporting time, eligibility, team size, food/overnight
  policy, and certificates are displayed as "to be announced" / "pending
  confirmation" until the organising committee confirms them.
- Internal operational data (budget approvals, finance requests, staffing,
  infrastructure emails, CTS/UDS requests) is intentionally not exposed.
