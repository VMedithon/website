# Event Contracts

> Two kinds of events: **inbound Clerk webhooks** (external, Svix-delivered) and
> **internal queue messages** (Cloudflare Queues between Worker request handlers
> and consumers). All processing is idempotent (INV-IDEM-01).

## Inbound: Clerk webhooks — `POST /api/webhooks/clerk` (API-HOOK-01)

- **Verification**: Svix signature via `verifyWebhook` (Clerk SDK), secret in
  `CLERK_WEBHOOK_SIGNING_SECRET`. Reject before any processing. The route is
  session-public but signature-gated.
- **Delivery**: at-least-once, retries on non-2xx (Svix schedule), replayable
  from the Clerk dashboard. Order between different entities is not guaranteed.
- **Dedupe**: insert `svix-id` into `webhook_events`; a duplicate insert → 200,
  no reprocessing.
- **Never synchronous-critical**: webhooks are eventually consistent. Anything the
  acting user must see immediately (e.g., "I just accepted an invite") is read
  from Clerk session/API directly, not from our mirror. Webhooks exist for data
  about *other* users and for lifecycle sync.

| ID | Event | Handling |
|---|---|---|
| EVT-CLERK-USER-01 | `user.created` / `user.updated` | Upsert `users` row (id, primary email, name). |
| EVT-CLERK-USER-02 | `user.deleted` | Mark `users` row deleted; deactivate any `staff_members` row (audit). |
| EVT-CLERK-ORG-01 | `organizationInvitation.accepted` | Match `staff_invitations.clerk_invitation_id` → create/activate `staff_members` with the **stored** role+permissions (never trust event-supplied role, RULE-ACC-02). Mark invitation `accepted`. |
| EVT-CLERK-ORG-02 | `organizationMembership.deleted` | Deactivate the corresponding `staff_members` row (audited). |
| EVT-CLERK-ORG-03 | `organizationInvitation.revoked` | Mark invitation `revoked`. |

Not handled (recorded, ignored): `session.*`, `organization.*` other than above,
billing events. Unknown event types → 200 + log, never error (prevents retry
storms on irrelevant events).

## Internal: queue `vmedithon-jobs`

Producer: API routes (`ctx.waitUntil`-free — `await env.JOBS.send(...)` before
responding so send failures surface). Consumer: `queue()` handler in the same
Worker. Config: retries on failure (default exponential), dead-letter queue
`vmedithon-jobs-dlq`. Messages carry a `type` discriminator and are treated as
idempotent commands.

### EVT-IMPORT-01 — `import.process`

```jsonc
{ "type": "import.process", "import_id": "uuid", "file_key": "imports/.../data.xlsx", "requested_by": "staff_id" }
```

- Consumer parses the R2 file (CSV/XLSX), creates `submissions` rows with
  `source='devnovate'`, collects per-row conflicts (existing platform submission
  for the same team — RULE-SUB-06), writes `imports.status` + `stats` JSON.
- Idempotent per row: reprocessing a batch updates `stats` but unique constraints
  prevent duplicate submissions. Failed batches are retried; a poison file lands
  in the DLQ and `imports.status='failed'`.

### EVT-CERT-01 — `cert.generate`

```jsonc
{ "type": "cert.generate", "certificate_row_id": "uuid" }
```

- Enqueued by API-CERT-03 **after** the `certificates` row + `certificate_id` are
  committed (RULE-CERT-03: verify answers `pending` immediately).
- Consumer renders the file to `vmedithon-artifacts` and flips `status` to
  `issued` + `issued_at`. Retry-safe: regenerating overwrites the same key.
- DLQ landing = certificate stuck `pending` — surfaced in observability
  (see `../operations/observability.md`).

## Deferred: outbound email

`email.send` is **not specified** — transactional email infrastructure is a
deferred integration (RULE-EVT-03, GAP-EMAIL-01). Clerk sends its own invitation
emails. When email lands, add `EVT-EMAIL-*` entries here and a provider decision
ADR before implementing.
