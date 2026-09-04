# Testing Strategy

> Today: **zero tests** exist (Playwright is installed but unused — GAP-TEST-01).
> This document is the target. Tests are written from the spec, traced to RULE-*/
> INV-* IDs — not retrofitted from implementation.

## Canonical verification

```bash
./scripts/verify   # created in Phase 0; runs:
# bun run typecheck && bun run lint && bun run test && bun run build \
#   && wrangler types --check
```

Until `scripts/verify` exists, the baseline is
`bun run typecheck && bun run lint && bun run build` (all currently pass).

## Test layers

| Layer | Tool | Covers |
|---|---|---|
| Domain/unit | Vitest | State machines, validators, ID allocation, permission resolution |
| Worker integration | `vitest` + `@cloudflare/vitest-pool-workers` (real D1/R2/Queue bindings in-workerd) | API routes end-to-end, authz matrix, migrations |
| Schema | Migration tests (apply all migrations to a fresh D1, assert constraints) | UNIQUE/CHECK enforcement (INV-SUB-01, INV-CERT-01, INV-FIN-01 columns) |
| E2E | Playwright against `wrangler dev` | Landing page, participant journey, staff journey, public verify |
| Webhook | Fixture Svix-signed payloads | Signature rejection, dedupe, per-event handling |

## Named test cases (TEST-*)

Traceable to invariants — when an INV-* says "verified by", these are it.

| ID | Verifies | Type |
|---|---|---|
| TEST-E2E-01 | Landing page renders hero, tracks (3 cards), timeline, partners; nav anchors work; mobile menu toggles. **Characterization test for the existing page — write before refactoring it (Phase 0).** | E2E |
| TEST-AUTH-01 | Every `/api/staff/*` route: anonymous → 401, participant → 403, staff-without-module → 403. | Integration |
| TEST-AUTH-02 | `organizing_committee` with no grants reaches nothing staff-side (INV-AUTH-02). | Integration |
| TEST-ACC-01 | Last active master_admin cannot be demoted/deactivated (INV-ACC-01). | Integration |
| TEST-TEAM-01 | One user in two teams rejected (INV-TEAM-01); unclaimed roster entry claimed on matching email sign-in (RULE-REG-04). | Integration |
| TEST-TENANT-01 | Participant probing another team's IDs gets 404, not 403 (INV-TENANT-01). | Integration |
| TEST-SUB-01 | Second pitch same round+kind → 409 (INV-SUB-01); over-size/wrong-type file → 400 (RULE-SUB-02). | Integration |
| TEST-SUB-02 | File replacement blocked once `assigned` (INV-SUB-02). | Integration |
| TEST-REVIEW-01 | Duplicate (submission, reviewer) review rejected. | Integration |
| TEST-REVIEW-02 | Reviewer assigned to own team's submission rejected (RULE-SUB-04). | Integration |
| TEST-REVIEW-03 | Submission status transitions only `received→in_review→scored→assigned`. | Unit |
| TEST-FORM-01 | Reference fixture: "Overnight stay preference" form builds, publishes, accepts a valid response, rejects schema-invalid ones. | Integration |
| TEST-FORM-02 | Field edit after first response → 409; responses validate against publish-time snapshot (INV-FORM-01). | Integration |
| TEST-FIN-01 | Amounts stay integer paise end-to-end; summary math per RULE-FIN-06. | Integration |
| TEST-FIN-02 | `raised_by == decided_by` transition rejected (INV-FIN-02). | Integration |
| TEST-FIN-03 | Illegal transitions (`paid→*`, `rejected→*`) → 409. | Unit |
| TEST-CERT-01 | Parallel issuance never duplicates a `certificate_id` (INV-CERT-01). | Integration (concurrency) |
| TEST-CERT-02 | No delete path; revoked cert persists and verifies `revoked` (INV-CERT-02). | Integration |
| TEST-CERT-03 | API-VERIFY-01 response shape pinned — protects COMP-VERIFY-01. | Contract |
| TEST-DATA-01 | Public verify response contains only the whitelisted fields; grep-assert no `email`/`score`/`team` internals (INV-DATA-01). | Contract |
| TEST-IDEM-01 | Replayed webhook (same `svix-id`) processed once. | Integration |
| TEST-IDEM-02 | Retried create with same `Idempotency-Key` returns one resource. | Integration |
| TEST-AUDIT-01 | Finance transition / role change / cert issue+revoke each write `audit_log`; no code path updates or deletes audit rows. | Integration |
| TEST-LOCK-01 | With `deployment_lock`, publish/structure mutations 409 except audited master-admin override (INV-LOCK-01). | Integration |
| TEST-IMPORT-01 | Sample Devnovate file → expected row set + conflict report; rerun is idempotent (RULE-SUB-06). | Integration |
| TEST-HOOK-01 | Webhook with bad/absent signature rejected before processing. | Integration |

## Conventions

- No mocking of D1/R2 inside worker tests — the vitest workers pool provides real
  local bindings; mocks would defeat the point.
- Frontend unit tests are not required for the demo UI; test real behavior as it
  becomes real. E2E covers the page surface.
- New invariants or RULE-* changes must land with their TEST-* in the same
  change (docs sync rule in AGENTS.md).
