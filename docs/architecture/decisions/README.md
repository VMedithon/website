# Architecture Decision Records

ADRs capture decisions a future agent might otherwise re-litigate without the
original reasoning. Create one when a choice has real alternatives and lasting
consequences — not for routine implementation.

## Format

```markdown
# NNNN. Title

- Status: Proposed | Accepted | Superseded by NNNN | Deprecated | Rejected
- Date: YYYY-MM-DD

## Context
## Decision
## Alternatives considered
## Consequences
## Conditions for reconsideration
```

## Index

| ADR | Title | Status |
|---|---|---|
| [0001](0001-cloudflare-clerk-monorepo.md) | Cloudflare Workers static hosting + Worker API, D1/R2/Queues, Clerk auth, single repo | Accepted |
| [0002](0002-staff-authorization-model.md) | Staff authorization in D1; Clerk org for identity + invitations | Accepted |
