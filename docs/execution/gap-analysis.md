# Gap Analysis — current vs desired

> Each GAP-* records a meaningful discrepancy between observed reality
> (`current-state.md`) and the spec (`product-spec.md`, `business-logic.md`,
> `invariants.md`). Resolve through the implementation plan; remove entries once
> closed. No data migration is needed — there is no existing production data.

|| ID | Area | Current state | Desired state | Risk if unaddressed | Resolution (phase) |
|---|---|---|---|---|---|---|
|| GAP-UI-01 | Dashboard mutations | `Dashboard.tsx` supports core create/edit for finance, forms (with field builder), certificates (with background upload), people, submissions/reviewer assignment, and settings; printed certificate rendering is still pending | Full CRUD UI for forms, certificates, finance, submissions, and reviewer assignment | Staff cannot complete workflows in the browser | Phase 2 |
|| GAP-UI-02 | Participant portal | `/participant` supports team create/invite, pitch upload, form list, and form filling | Team create/invite, pitch upload, form fill flows in the frontend | Participants cannot complete form responses in the browser | Phase 2 |
|| GAP-IMPORT-01 | Devnovate import | Queue consumer exists but the CSV/XLSX mapping is a stub | Parse Devnovate export and create teams/submissions (EVT-IMPORT-01, RULE-SUB-06). **Blocker: need a sample export file to define the mapping.** | External submission data unusable | Phase 7 |
|| GAP-EMAIL-01 | Email | "Not connected" settings card | Deferred — Clerk covers invitation emails; transactional email is out of scope until a provider decision (new ADR) | Missed notifications | Post-event backlog |
|| GAP-TEST-02 | Integration tests | `tests/state.test.ts` only covers state machines | Worker integration tests with `@cloudflare/vitest-pool-workers` and Playwright E2E per `testing-strategy.md` | Regressions ship silently | Phase 1+ |
|| GAP-RENDER-01 | Certificate render | SVG artifacts generated with embedded background images; public verification returns HMAC-SHA256 signature; certificate file available at `/api/public/certificates/:id/file`; PNG/PDF download from the browser is not yet implemented | PDF/PNG render and signed verification payload honoring `COMP-VERIFY-01` | Printed certificates lack credibility | Phase 6 |

## Recently closed (moved to `current-state.md`)

- GAP-AUTH-01/02, GAP-API-01, GAP-DATA-01, GAP-ROUTE-01, GAP-REG-01,
  GAP-SUB-01, GAP-FORM-01, GAP-FIN-01, GAP-CERT-01, GAP-CERT-02,
  GAP-ACC-01, GAP-LOCK-01, GAP-TEST-01 (baseline `scripts/verify`),
  GAP-DEPLOY-01 (`wrangler.jsonc` exists), GAP-AUDIT-01 (`audit_log` wired).

## Compatibility notes

- **No existing consumers** — nothing external calls this codebase, so no
  compatibility shims are needed during the mock→real transition. The Control
  Room overlay's internal component contracts are free to change.
- The only forward-compat obligation created by this project is
  **COMP-VERIFY-01** (printed certificate verification) — it starts applying the
  moment real certificates ship, not before.
