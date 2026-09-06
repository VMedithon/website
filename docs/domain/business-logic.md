# Business Logic — domain rules and workflows

> **Scope update (2026-09-06):** With the backend removed, rules below are
> informational. The frontend does not enforce staff/participant permissions,
> does not store money, and does not issue or verify certificates. Any future
> backend will re-implement the invariants explicitly.


> Normative. Each rule has a stable ID (RULE-*) for cross-reference. Related
> invariants live in `invariants.md`; endpoints in `../contracts/api-contract.md`.
> For whether a rule is currently enforced, see `../execution/gap-analysis.md`.

## Conventions

- **Actor checks**: every rule lists the minimum authorization. "Staff + module X"
  means a staff member holding module permission `X`; `master_admin` holds all
  implicitly. `faculty_coordinator` has event-wide read + review management.
- **Money** is always integer paise (₹1 = 100 paise). Never floats.
- **IDs**: public-facing IDs (certificates) are human-readable; internal IDs are
  UUIDs (`crypto.randomUUID()`), never `Math.random()`.
- All timestamps UTC ISO-8601; UI renders local.

---

## CAP-REG — Registration & teams

**Workflow:** participant signs in → creates team → invites members → team is
`registered` → submits pitch (CAP-SUB) → review assigns track → team becomes
`selected`/`waitlisted`/`rejected` → selected teams attend on campus.

| Rule | Statement |
|---|---|
| RULE-REG-01 | A team is created by one signed-in participant, who becomes `lead`. |
| RULE-REG-02 | Team name is required (1–80 chars); duplicate names are allowed (teams are identified by ID, not name). |
| RULE-REG-03 | A user can belong to at most one team (INV-TEAM-01). Leaving/deleting a team is master-admin or lead action before pitch submission. |
| RULE-REG-04 | Member invitations are by email. An invitee without an account appears as an unclaimed roster entry (`user_id` NULL) and is claimed on first sign-in matching that email. |
| RULE-REG-05 | Team size is bounded: minimum 1, maximum 5 members (ASSUMPTION — confirm with organizers; adjust constant `TEAM_MAX_MEMBERS` in one place). |
| RULE-REG-06 | Round-one registration carries no payment and no fee logic. |
| RULE-REG-07 | Registration closes at a configurable deadline (`settings.registration_closes_at`); after it, creation/submission endpoints reject with `409 closed`. |

**Team state machine:** `registered → submitted → selected | waitlisted | rejected`.
`submitted` is set when a valid pitch exists for round 1. Terminal states are set by
review outcome only; no self-service transitions after `submitted`.

---

## CAP-SUB — Submissions & review

| Rule | Statement |
|---|---|
| RULE-SUB-01 | One pitch submission per team per round (unique `(team_id, round, kind)`, INV-SUB-01). Re-upload replaces the file only while the round is open and before review starts. |
| RULE-SUB-02 | Accepted file types for pitches: `.ppt`, `.pptx`, `.pdf`. Max size 25 MB. Type/size validated server-side, not by file extension alone (sniff content type where feasible). |
| RULE-SUB-03 | Every submission names a `proposed_track` (RESEARCH/INDUSTRY/PROJECT). The final `assigned_track` is set by staff and may differ — reviewers "place it on the path that gives it the strongest future." |
| RULE-SUB-04 | Reviewer assignment is many-to-many: a submission may have multiple reviewers; a reviewer must not be assigned their own team's submission (conflict check). |
| RULE-SUB-05 | A review = score (0–100) + optional notes + optional track recommendation. One review per (submission, reviewer) pair. |
| RULE-SUB-06 | Devnovate imports create `submissions` rows flagged `source = 'devnovate'` with the import batch ID; imported rows never overwrite platform-native submissions for the same team — conflicts land in an import-conflict report. |
| RULE-SUB-07 | Track assignment and selection decisions are recorded with actor + timestamp (INV-AUDIT-01). |

**Review state machine (per submission):** `received → in_review → scored → assigned`.
`assigned` means a final track + selection state has been set. Submission files are
immutable once `assigned` (INV-SUB-02).

---

## CAP-FORM — Form studio

| Rule | Statement |
|---|---|
| RULE-FORM-01 | Forms have lifecycle `draft → published → closed`. Only `published` forms accept responses; only `draft` forms are structurally editable. |
| RULE-FORM-02 | Once a form has responses, its field schema is frozen — clone it to make changes (prevents response/schema skew, INV-FORM-01). |
| RULE-FORM-03 | Field types (v1): `short_text`, `long_text`, `number`, `single_choice`, `multi_choice`, `checkbox`, `date`. Each field has `label`, `required`, `position`, type-specific `config`. |
| RULE-FORM-04 | Responses validate against the published schema snapshot stored on the form at publish time, not the live field set. |
| RULE-FORM-05 | Forms may target `team` (one response per team) or `participant` (one per user). Duplicate submissions rejected by unique constraint. |
| RULE-FORM-06 | Closing a form is explicit or automatic at `closes_at`; late submissions get `409 closed`. |

**Workflow example:** "Overnight stay preference" — published to confirmed teams,
fields: team ID (short text), staying overnight? (single choice), member count
(number), dietary requirements (checkboxes). This shape is the reference fixture
for the form engine (see TEST-FORM-01).

---

## CAP-FIN — Finance desk

| Rule | Statement |
|---|---|
| RULE-FIN-01 | A finance request records: title, raised_by, payee name, UPI ID, amount (integer paise), optional category/notes. |
| RULE-FIN-02 | State machine: `pending → approved | rejected`; `approved → paid`. `rejected` and `paid` are terminal. `review` is a non-terminal flag status meaning "needs clarification" (`pending → review → pending`). |
| RULE-FIN-03 | Only staff with `finance` permission can approve/reject/mark-paid. The raiser cannot approve their own request (INV-FIN-02). |
| RULE-FIN-04 | Every state transition writes an audit entry with actor, from-state, to-state, timestamp (INV-AUDIT-01). |
| RULE-FIN-05 | Amount and payee details are editable only while `pending` or `review`. |
| RULE-FIN-06 | Budget summary is derived, never stored as mutable counters: total approved = sum(amount where status in approved,paid); pending = sum(status in pending,review); remaining = configured budget − approved. |
| RULE-FIN-07 | UPI ID is a string field (format `name@handle`), validated loosely — no payment is actually initiated; "Paid" is a bookkeeping assertion. |

---

## CAP-CERT — Certificates & verification

| Rule | Statement |
|---|---|
| RULE-CERT-01 | A template has: name, optional track scope, `id_prefix` (e.g. `VMT26-R-`), background image (R2), recipient-name field mapping, status `draft/published`. Only published templates issue certificates. |
| RULE-CERT-02 | Certificate public IDs are `{prefix}{zero-padded seq}` where seq is a per-prefix monotonic counter. IDs are unique and never reused, even after revocation (INV-CERT-01). |
| RULE-CERT-03 | Issuance is asynchronous via queue (EVT-CERT-01): allocate ID → render file to R2 → mark `issued`. The verify endpoint must resolve an ID the moment it is allocated, answering `pending` until the file exists. |
| RULE-CERT-04 | Public verification returns only: valid/revoked/pending status, recipient name, track, event name, issue date — exactly what is printed on the certificate. No email, team internals, or scores (INV-DATA-01). |
| RULE-CERT-05 | Revocation requires `certificates` permission + a reason string; revoked certs verify as invalid and remain in the database (INV-CERT-02). |
| RULE-CERT-06 | Issuance is idempotent per (recipient, template, kind): re-issuing returns the existing certificate rather than minting a second ID (INV-IDEM-01). |

---

## CAP-ACC — People & access

| Rule | Statement |
|---|---|
| RULE-ACC-01 | Staff onboarding is invitation-only. There is no staff self-signup path. |
| RULE-ACC-02 | An invitation binds an email → role → module-permission set before the invitee ever signs in; the invitee cannot change their own role during acceptance (the "magic-link" promise). |
| RULE-ACC-03 | Only `master_admin` can invite, change roles, change permissions, or deactivate staff. |
| RULE-ACC-04 | The system must always retain at least one active `master_admin` — the last one cannot be demoted or deactivated (INV-ACC-01). |
| RULE-ACC-05 | Role/permission changes take effect on the next API request (D1 is authoritative; no session staleness window — ADR-0002). |
| RULE-ACC-06 | Deactivation is soft: `status = 'deactivated'` denies access but preserves audit history. |

---

## CAP-EVT — Event settings

| Rule | Statement |
|---|---|
| RULE-EVT-01 | Deployment lock is a boolean setting. While locked: no new published forms, no track changes, no template publication, no deadline changes. `master_admin` may override; every override is audited with the reason (INV-LOCK-01). |
| RULE-EVT-02 | Settings hold event metadata (name, dates, venue, deadlines) that drives UI copy — public pages should read these values rather than hardcoding where feasible. |
| RULE-EVT-03 | Email (SMTP/transactional) and the append-only backup stream are deferred integrations; settings UI shows their status as "Not connected" until implemented. |

---

## Cross-cutting authorization summary

| Capability | Participant | judge | mentor | committee* | faculty_coordinator | master_admin |
|---|---|---|---|---|---|---|
| Own team / submissions | RW | — | — | — | R | RW |
| Public verify | R | R | R | R | R | R |
| Forms build | — | — | — | `forms` | R | RW |
| Submissions read all | — | assigned | assigned | `submissions` | R | RW |
| Review/score | — | assigned only | — | — | R | RW |
| Finance | — | — | — | `finance` | R | RW |
| Certificates | — | — | — | `certificates` | R | RW |
| People & roles | — | — | — | — | — | RW |
| Settings / lock | — | — | — | — | R | RW |

\* `committee` rows require the named module grant. R = read, RW = read+write.
