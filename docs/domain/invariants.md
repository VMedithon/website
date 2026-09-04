# Invariants — properties that must never become false

> Normative. Each invariant states the property, where it should be enforced, and
> its current compliance status. Status values: `UNIMPLEMENTED` (nothing exists),
> `ENFORCED`, `VIOLATED`, `PARTIAL`. Current status is evidence-based — see
> `../execution/current-state.md` and `../execution/gap-analysis.md`.

Since no backend exists yet, every invariant below is currently **UNIMPLEMENTED**
unless noted. They are listed here so that implementation phases can wire them in
from the start rather than retrofitting.

## Authentication & authorization

### INV-AUTH-01 — Staff authorization is server-side
- **Statement**: Every `/api/staff/*` request must be authenticated and authorized
  in the Worker. Frontend role state is never trusted.
- **Enforced at**: Worker auth middleware/dependency on every staff route.
- **Verified by**: authz test matrix (TEST-AUTH-01) hitting every staff route as
  each role + as anonymous + as participant.
- **Related**: RULE-ACC-*, ADR-0002.

### INV-AUTH-02 — Module access is default-deny
- **Statement**: An `organizing_committee` member with no module grants can access
  nothing under `/api/staff/*` beyond their own profile.
- **Enforced at**: `requirePermission(module)` check resolving from `staff_members`.
- **Verified by**: TEST-AUTH-02.

### INV-TENANT-01 — Participants see only their own team
- **Statement**: No endpoint may return another team's data to a participant,
  including via enumerable IDs. All participant queries are scoped by `user_id` →
  `team_id`.
- **Enforced at**: data-access layer (team-scoped queries, no raw ID lookups for
  participant routes).
- **Verified by**: TEST-TENANT-01 (cross-team ID probing returns 404, not 403, to
  avoid existence leaks).

### INV-TEAM-01 — One user, one team
- **Statement**: A user account belongs to at most one team (as lead or member).
  Unclaimed roster entries (email-only, `user_id` NULL) do not count until claimed.
- **Enforced at**: partial unique index on `team_members(user_id)` (see
  `../contracts/data-model.md`) + application check on team create and invite
  acceptance.
- **Verified by**: TEST-TEAM-01.
- **Related**: RULE-REG-03, CAP-REG-03.

### INV-ACC-01 — At least one active master admin always exists
- **Statement**: The last active `master_admin` cannot be demoted or deactivated.
- **Enforced at**: role-change/deactivation endpoints + a D1 `BEFORE UPDATE` guard
  or application-level transaction that counts remaining admins.
- **Verified by**: TEST-ACC-01.

## Data & integrity

### INV-FIN-01 — Money is integer paise
- **Statement**: All monetary amounts are stored and computed as integers in
  paise. No REAL/float columns or float arithmetic anywhere in the finance path.
- **Enforced at**: schema (INTEGER columns), validation layer, code review.
- **Verified by**: schema lint in migration tests + TEST-FIN-01.

### INV-FIN-02 — No self-approval of finance requests
- **Statement**: `raised_by != decided_by` for approve/reject/mark-paid.
- **Enforced at**: finance transition endpoint.
- **Verified by**: TEST-FIN-02.

### INV-SUB-01 — One pitch per team per round
- **Statement**: `UNIQUE(team_id, round, kind)` on submissions.
- **Enforced at**: D1 unique constraint (schema-level, not application-level).
- **Verified by**: migration test + TEST-SUB-01.

### INV-SUB-02 — Submission files immutable after assignment
- **Statement**: Once a submission reaches `assigned`, its file cannot be replaced
  or deleted.
- **Enforced at**: submission update endpoint state check.
- **Verified by**: TEST-SUB-02.

### INV-FORM-01 — Published form schemas are frozen once responses exist
- **Statement**: Field structure edits are rejected once any response exists;
  responses validate against the publish-time schema snapshot.
- **Enforced at**: form update endpoint + response validation path.
- **Verified by**: TEST-FORM-01, TEST-FORM-02.

### INV-CERT-01 — Certificate IDs are unique and never reused
- **Statement**: The public certificate ID (e.g. `VMT26-R-0001`) is unique forever;
  revocation never frees an ID for reuse.
- **Enforced at**: UNIQUE column + monotonic per-prefix counter allocation in one
  transaction.
- **Verified by**: TEST-CERT-01.

### INV-CERT-02 — Issued certificates are never hard-deleted
- **Statement**: Certificates transition `issued → revoked`; rows and files are
  retained for the audit record.
- **Enforced at**: no DELETE endpoint exists for certificates (by design);
  schema has no cascade delete.
- **Verified by**: code review + TEST-CERT-02.

### INV-IDEM-01 — Mutations are safe under retry
- **Statement**: Retried client mutations and replayed webhooks must not create
  duplicates. Webhook handling dedupes on `svix-id` (EVT-*); natural unique
  constraints cover submissions/responses; certificate issuance is idempotent per
  (recipient, template, kind).
- **Enforced at**: unique constraints + `webhook_events` dedupe table + idempotent
  issuance query.
- **Verified by**: TEST-IDEM-01 (replay webhook), TEST-IDEM-02 (double-submit).

### INV-AUDIT-01 — Sensitive actions are audit-logged, append-only
- **Statement**: Finance transitions, role/permission changes, certificate
  issue/revoke, track assignments, and deployment-lock overrides write an
  `audit_log` row (actor, action, entity, diff, timestamp). `audit_log` has no
  update/delete path.
- **Enforced at**: service layer — the same functions that perform the action
  write the log, so it cannot be skipped by a route.
- **Verified by**: TEST-AUDIT-01.

### INV-LOCK-01 — Deployment lock freezes public event structure
- **Statement**: While `settings.deployment_lock` is true, published forms, track
  definitions, certificate template publication, and deadlines cannot change except
  via an audited master-admin override.
- **Enforced at**: settings check in each protected mutation.
- **Verified by**: TEST-LOCK-01.

## Privacy & public surface

### INV-DATA-01 — Public endpoints expose only printed/public data
- **Statement**: The certificate-verify endpoint returns only fields visible on the
  certificate (name, track, event, status, issue date). No emails, team rosters,
  scores, or staff data on any unauthenticated route.
- **Enforced at**: response DTO whitelist on public handlers.
- **Verified by**: TEST-DATA-01 (response-shape assertion + negative field scan).

### INV-VERIFY-01 — Printed verification contract is frozen
- **Statement**: Once physical certificates are printed, the verify URL and its
  response contract cannot change in a breaking way (see COMP-VERIFY-01 in
  `../contracts/api-contract.md`).
- **Enforced at**: API contract test pinning the response shape.
- **Verified by**: TEST-CERT-03.

## Status summary

| Invariant | Current status | Target enforcement phase |
|---|---|---|
| INV-AUTH-01, INV-AUTH-02, INV-ACC-01 | UNIMPLEMENTED | Phase 1 (auth + staff) |
| INV-TENANT-01, INV-TEAM-01 | UNIMPLEMENTED | Phase 2 (teams/submissions) |
| INV-FIN-01, INV-FIN-02 | UNIMPLEMENTED | Phase 5 (finance) |
| INV-SUB-01, INV-SUB-02 | UNIMPLEMENTED | Phase 2–3 |
| INV-FORM-01 | UNIMPLEMENTED | Phase 4 |
| INV-CERT-01, INV-CERT-02, INV-VERIFY-01 | UNIMPLEMENTED | Phase 6 |
| INV-IDEM-01 | UNIMPLEMENTED | Phase 1 (webhooks) onward |
| INV-AUDIT-01 | UNIMPLEMENTED | Phase 2 (table) → wired per module |
| INV-LOCK-01 | UNIMPLEMENTED | Phase 7 |
| INV-DATA-01 | ENFORCED vacuously — the only public surface today is static | Phase 6 keeps it true |
