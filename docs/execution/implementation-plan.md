# Implementation Plan — mock shell → real platform

> Dependency-ordered phases. Each phase lists what it builds, what it unblocks,
> the rules/invariants it must honor, and its exit criteria. Phases are
> sequential unless noted; within a phase, order is flexible.
>
> Since there is no existing data or consumers, there is no expand→contract
> migration strategy — this is build-out, not brownfield migration. The brownfield
> care applies to the landing page and the demo UI being refactored into real pages.

## Phase 0 — Baseline + platform scaffolding

- **Goal**: deployable skeleton; canonical verification command.
- **Work**:
  - Add `wrangler.jsonc` (worker name `vmedithon`, `assets.directory="./dist"`,
    SPA not-found handling, recent `compatibility_date`, `observability.enabled`,
    `nodejs_compat` flag), `worker/index.ts` health route, `migrations/` dir.
  - Provision D1 database + two R2 buckets + queue `vmedithon-jobs` (+DLQ) via
    wrangler (IDs go into config, per `deployment.md`).
  - Add `scripts/verify`: `typecheck → lint → test → build → wrangler types --check`.
  - Add `react-router` and introduce routes without changing behavior: `/`,
    `/verify/:id` (renders the existing verify UI as a page), keeping the overlay
    dashboard working at `/` for now.
  - Add vitest + `@cloudflare/vitest-pool-workers`; playwright config + one
    landing-page smoke spec (TEST-E2E-01) so the existing page is characterized
    before later refactors.
- **Clerk**: create instance (dev), enable Organizations (membership **optional**),
  create the "VMEDITHON staff" org, note `CLERK_ORG_ID`.
- **Invariants**: none yet — establishes the harness they get verified in.
- **Exit criteria**: `wrangler deploy --env staging` serves the site + `GET
  /api/health`; `bun run verify` green; Playwright smoke passes on `wrangler dev`.

## Phase 1 — Identity, staff access, invitations

- **Depends on**: Phase 0. **Unblocks**: everything staff-facing.
- **Work**:
  - `@clerk/react` provider + `VITE_CLERK_PUBLISHABLE_KEY`; sign-in routes;
    `getToken()` API client. Gate `/platform/*` on `isLoaded && isSignedIn`.
  - Worker auth: `authenticateRequest`/`verifyToken` against the instance;
    `requireAuth` + `requireStaff(module?)` helpers resolving `staff_members`.
  - D1 migration 001: `users`, `staff_members`, `staff_invitations`,
    `webhook_events`, `audit_log`, `settings`.
  - API-HOOK-01 webhook ingress (verify, dedupe, EVT-CLERK-USER-*/ORG-*).
  - API-PEOPLE-01..04: invite (D1 pending row → Clerk `createOrganizationInvitation`
    → store `clerk_invitation_id`), revoke, list, patch role/permissions,
    deactivate. Acceptance webhook activates the stored role (RULE-ACC-02).
  - Seed the first `master_admin` manually (documented in `deployment.md` runbook).
  - Refactor Control Room overlay → routed `/platform/staff/*` pages; sidebar
    items hidden per resolved permissions (UX only — Worker still enforces).
- **Invariants**: INV-AUTH-01/02, INV-ACC-01, INV-IDEM-01 (webhook side),
  INV-AUDIT-01 (staff mutations logged).
- **Tests**: TEST-AUTH-01/02 authz matrix, TEST-ACC-01 last-admin guard,
  TEST-IDEM-01 webhook replay, TEST-HOOK-01 bad-signature rejection.
- **Exit criteria**: a master admin can invite a committee member who signs in via
  the emailed link and can reach staff pages; a participant account cannot.

## Phase 2 — Teams, registration, pitch submission

- **Depends on**: Phase 1 (auth, users table). **Unblocks**: review, forms,
  certificates.
- **Work**:
  - Migrations: `teams`, `team_members` (partial unique index for INV-TEAM-01),
    `submissions` (UNIQUE for INV-SUB-01).
  - API-TEAM-01..04, API-SUB-01/02; R2 upload path for pitch files with
    server-side type/size validation (RULE-SUB-02); `settings.registration_closes_at`
    enforcement (RULE-REG-07).
  - Participant UI: register team → manage roster → upload pitch → status view.
  - Registration CTA on the landing page becomes real (replaces "Registrations
    soon" copy per `settings.event_meta` when opened).
- **Invariants**: INV-TEAM-01, INV-SUB-01, INV-TENANT-01.
- **Tests**: TEST-TEAM-01 one-team-per-user, TEST-TENANT-01 cross-team probing,
  TEST-SUB-01 duplicate-pitch 409, TEST-IDEM-02 retry-safe create.
- **Exit criteria**: a participant registers, invites a member, uploads a PPT;
  a second account cannot see or re-create their team.

## Phase 3 — Review & track assignment

- **Depends on**: Phase 2. 
- **Work**: `review_assignments`, `reviews` migrations; API-SUBS-01,
  API-REVIEW-01..04; unassigned-pitch surfacing; reviewer UI (assigned list,
  score/notes/track form); faculty-coordinator assignment UI; team
  `selected/waitlisted/rejected` transitions + `assigned_track` (audited).
- **Invariants**: INV-SUB-02, INV-AUDIT-01, conflict rule RULE-SUB-04.
- **Tests**: TEST-REVIEW-01 (one review per pair), TEST-REVIEW-02 (self-team
  conflict rejected), TEST-REVIEW-03 (state machine transitions).
- **Exit criteria**: end-to-end — pitch submitted, assigned, scored, track
  assigned, team sees final state.

## Phase 4 — Form engine

- **Depends on**: Phase 1 (staff) + Phase 2 (teams for `audience='team'`).
- **Work**: `forms`, `form_fields`, `form_responses` migrations; draft edit /
  publish (schema snapshot) / close lifecycle; participant fill + submit;
  staff response list + CSV export. Reference fixture: the "Overnight stay
  preference" form (TEST-FORM-01).
- **Invariants**: INV-FORM-01, INV-LOCK-01 groundwork (publish gated by lock when
  settings land — wire the check now, enforce in Phase 7).
- **Tests**: TEST-FORM-01/02.
- **Exit criteria**: staff builds and publishes a form; a team submits a
  validated response; schema edit is rejected after a response exists.

## Phase 5 — Finance desk

- **Depends on**: Phase 1.
- **Work**: `finance_requests` migration; API-FIN-01..03; transition state
  machine with audit writes; summary derived per RULE-FIN-06; CSV export.
- **Invariants**: INV-FIN-01/02, INV-AUDIT-01.
- **Tests**: TEST-FIN-01 (integer paise through the stack), TEST-FIN-02
  (self-approval rejected), TEST-FIN-03 (invalid transitions 409).
- **Exit criteria**: request raised → approved by a different admin → marked
  paid; audit log shows every hop; totals reconcile.

## Phase 6 — Certificates & public verification

- **Depends on**: Phase 2 (recipients = teams/users), Phase 1.
- **Work**: `certificate_templates`, `certificates`, `cert_counters` migrations;
  template CRUD + publish; API-CERT-03 issue (allocate IDs in transaction →
  enqueue EVT-CERT-01); consumer renders to R2 → `issued`; API-VERIFY-01 public
  lookup + `/verify/:id` page replacing the demo modal; revoke flow.
- **Invariants**: INV-CERT-01/02, INV-DATA-01, INV-IDEM-01, INV-LOCK-01
  (template publish gated).
- **Tests**: TEST-CERT-01 (unique IDs under parallel issue), TEST-CERT-02
  (no delete path), TEST-CERT-03 (contract-shape pin), TEST-DATA-01 (response
  whitelist).
- **Exit criteria**: issue a batch → IDs resolve publicly the moment allocated
  (`pending` → `issued`); revoked cert verifies invalid; verify response
  contains only printed fields.

## Phase 7 — Imports, settings, hardening

- **Depends on**: Phase 3 (imports target submissions), Phase 4.
- **Work**: `imports` migration; API-SUBS-02/03 + EVT-IMPORT-01 consumer with
  conflict report (**needs a real Devnovate export sample** — obtain before
  starting); API-SET-01/02 incl. `deployment_lock` enforcement across mutations;
  rate limiting on public verify; production env cutover.
- **Invariants**: INV-LOCK-01 fully enforced.
- **Tests**: TEST-IMPORT-01 (sample file → expected rows + conflicts),
  TEST-LOCK-01.
- **Exit criteria**: a Devnovate file imports cleanly with a conflict report;
  locked settings reject structural changes except audited master-admin override.

## Cross-phase obligations

- Every phase ships its tests; `bun run verify` must stay green per commit.
- `current-state.md` entries flip to "implemented" as phases land; GAP-* entries
  are removed as they close.
- Docs are updated in the same commit as the behavior they describe (see
  AGENTS.md synchronization table).
