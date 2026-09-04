# Documentation Index — context router

Load the **minimum** set of documents for your task. Every document listed here is
authoritative for its scope; `AGENTS.md` explains the hierarchy.

## Document map

| File | Owns |
|---|---|
| `product/product-spec.md` | What the product is, actors, capabilities (CAP-*), scale assumptions |
| `domain/business-logic.md` | Business rules (RULE-*) and workflows per capability |
| `domain/invariants.md` | Invariants (INV-*) that must never become false |
| `architecture/system-architecture.md` | Target architecture, trust boundaries, current-vs-target |
| `architecture/decisions/` | ADRs — why key choices were made |
| `contracts/data-model.md` | D1 schema, entities, R2 objects, integrity rules |
| `contracts/api-contract.md` | Every API endpoint (API-*), auth, errors, compatibility (COMP-*) |
| `contracts/event-contracts.md` | Clerk webhook events + internal queue messages (EVT-*) |
| `execution/current-state.md` | What actually exists right now (descriptive truth) |
| `execution/gap-analysis.md` | Current-vs-desired discrepancies (GAP-*) |
| `execution/implementation-plan.md` | Dependency-ordered phases to build the platform |
| `quality/testing-strategy.md` | Test layers, verification commands (TEST-*) |
| `operations/deployment.md` | Environments, wrangler deploy, secrets, rollback |
| `operations/observability.md` | Logging, monitoring, failure signals |

## Task → files to load

| Task | Load |
|---|---|
| Understand what exists today | `execution/current-state.md` |
| Understand what to build next | `execution/implementation-plan.md` → `execution/gap-analysis.md` |
| Work on the landing page | `execution/current-state.md` → `product/product-spec.md` (CAP-SITE-*) |
| Add or change an API endpoint | `contracts/api-contract.md` → `domain/business-logic.md` → `domain/invariants.md` → `contracts/data-model.md` if persisting |
| Add authentication / staff access | `architecture/decisions/0002-*` → `domain/invariants.md` (INV-AUTH-*) → `contracts/api-contract.md` |
| Change the database schema | `contracts/data-model.md` → `domain/invariants.md` → `operations/deployment.md` (migrations) |
| Build registration / pitch submission | `domain/business-logic.md` (CAP-REG-*, CAP-SUB-*) → `contracts/api-contract.md` → `contracts/data-model.md` |
| Build the form engine | `domain/business-logic.md` (CAP-FORM-*) → `contracts/data-model.md` → `contracts/api-contract.md` |
| Build the finance desk | `domain/business-logic.md` (CAP-FIN-*) → `domain/invariants.md` (INV-FIN-*, INV-AUDIT-01) |
| Build certificates / verification | `domain/business-logic.md` (CAP-CERT-*) → `contracts/api-contract.md` (COMP-VERIFY-01) → `contracts/event-contracts.md` |
| Wire up Clerk webhooks | `contracts/event-contracts.md` → `architecture/decisions/0002-*` |
| Change deployment / infra | `operations/deployment.md` → `architecture/decisions/0001-*` → `operations/observability.md` |
| Add tests | `quality/testing-strategy.md` |
| Replace or redesign a component | `execution/current-state.md` → `execution/gap-analysis.md` → relevant ADR → `quality/testing-strategy.md` |

## Fact ownership rules

Each fact has **one** authoritative location. Cross-reference by ID, never copy:

- Product truth → `product-spec.md` (CAP-*)
- Business rules → `business-logic.md` (RULE-*)
- Never-false properties → `invariants.md` (INV-*)
- Decisions and their rationale → `architecture/decisions/` (ADR-*)
- API truth → `api-contract.md` (API-*)
- Event truth → `event-contracts.md` (EVT-*)
- Observed reality → `current-state.md`
- Current-vs-desired gaps → `gap-analysis.md` (GAP-*)
- Sequencing → `implementation-plan.md`

If you need to state a fact that has no home, add it to its owner document first,
then reference it.
