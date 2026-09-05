# API Contract

> Normative target for the Worker API. The first implementation exists in
> `worker/routes/` and is mounted by `worker/index.ts`. All routes live under
> `/api` on the same Worker that serves the SPA. Base path examples assume the
> production hostname (see `../operations/deployment.md`).

## Conventions

- **Auth**: `Authorization: Bearer <Clerk session JWT>` from `getToken()`.
  Staff routes additionally require an `active` `staff_members` row with the
  needed module grant (ADR-0002, INV-AUTH-01/02).
- **Errors**: `{ "error": { "code": "string_constant", "message": "human text" } }`.
  Codes are stable API surface; messages are not.
- **Status codes**: 400 validation, 401 unauthenticated, 403 authenticated but
  unauthorized, 404 not found (also used for cross-team probing, INV-TENANT-01),
  409 state conflict (closed, already-exists, invalid transition), 429 rate
  limited, 5xx internal (never leaks internals).
- **Pagination**: `?cursor=` opaque cursor + `?limit=` (default 50, max 200) →
  `{ items: [...], next_cursor: string | null }`.
- **Idempotency**: create endpoints accept `Idempotency-Key` header; natural
  unique constraints back it (INV-IDEM-01). Safe retries must never double-create.
- **Content types**: JSON everywhere except file upload (multipart or raw body
  with `Content-Type` of the file — see API-SUB-01 note).

## Public endpoints (no auth)

| ID | Method & path | Purpose |
|---|---|---|
| API-HEALTH-01 | `GET /api/health` | Liveness. `{ ok: true }`. |
| API-VERIFY-01 | `GET /api/public/certificates/{certificate_id}` | Verify a printed certificate. Response includes: `{ status: 'issued'\|'revoked'\|'pending', recipient_name, track, event_name, issued_at, signature }`. The `signature` is an HMAC-SHA256 hex digest over the response payload, signed with `CERTIFICATE_SIGNING_SECRET`. Unknown ID → 404 `{ code: 'not_found' }`. Rate-limited. **COMP-VERIFY-01 below.** |
| API-VERIFY-02 | `GET /api/public/certificates/{certificate_id}/file` | Download the issued certificate SVG artifact. Returns 404 if not issued or file missing. |

### COMP-VERIFY-01 — frozen public verification contract

Once physical certificates are printed, the verify URL
(`/verify/{certificate_id}` page backed by API-VERIFY-01) and its response
contract **cannot break**. Additive fields are allowed; removing or renaming
fields, changing status semantics, or moving the path requires a redirect/compat
layer that stays until all printed stock is out of circulation. Pinned by
TEST-CERT-03.

## Webhook ingress (signature-authenticated, no session)

| ID | Method & path | Purpose |
|---|---|---|
| API-HOOK-01 | `POST /api/webhooks/clerk` | Clerk event ingress. Svix signature verified before any processing (`verifyWebhook` semantics; see `event-contracts.md`). Dedupe on `svix-id` (INV-IDEM-01). Always 2xx after verification unless payload unprocessable. |

## Participant endpoints (Clerk JWT required)

Participant-scoped: all team data resolved through the caller's `user_id →
team_id`; never by bare IDs (INV-TENANT-01).

| ID | Method & path | Purpose | Rules |
|---|---|---|---|
| API-TEAM-01 | `POST /api/teams` | Create team `{name}`; caller becomes lead. | RULE-REG-01..03, 07 |
| API-TEAM-02 | `GET /api/me/team` | My team + roster + state. | |
| API-TEAM-03 | `POST /api/me/team/members` | Invite member `{email, name?}`. Lead only. | RULE-REG-04/05 |
| API-TEAM-04 | `DELETE /api/me/team/members/{member_id}` | Remove member (lead, pre-submission). | RULE-REG-03 |
| API-SUB-01 | `POST /api/me/submissions` | Submit pitch: file upload → R2 + submission row `{title, proposed_track}`. | RULE-SUB-01/02/03 |
| API-SUB-02 | `GET /api/me/submissions` | My team's submissions + review status. | |
| API-FORM-PUB-01 | `GET /api/forms/{id}` | Published form schema snapshot for filling. | RULE-FORM-04/06 |
| API-FORM-PUB-02 | `POST /api/forms/{id}/responses` | Submit response `{answers}`. | RULE-FORM-04/05/06 |

## Staff endpoints (JWT + staff + module grant)

All under `/api/staff`. Permission column shows the module grant required
(`master_admin` implicit for all; `faculty_coordinator` = read across modules
per the matrix in `business-logic.md`).

| ID | Method & path | Purpose | Grant |
|---|---|---|---|
| API-OVERVIEW-01 | `GET /api/staff/overview` | Dashboard stats: team counts by state, submission pipeline, pending actions. | any staff |
| API-FORM-01 | `GET /api/staff/forms` | List forms + status + response counts. | `forms` |
| API-FORM-02 | `POST /api/staff/forms` | Create draft form `{title, audience, fields[]}`. | `forms` |
| API-FORM-03 | `PATCH /api/staff/forms/{id}` | Edit draft fields/metadata. Rejected once responses exist (INV-FORM-01). | `forms` |
| API-FORM-04 | `POST /api/staff/forms/{id}/publish` | Freeze schema snapshot → `published`. | `forms` |
| API-FORM-05 | `POST /api/staff/forms/{id}/close` | → `closed`. | `forms` |
| API-FORM-06 | `GET /api/staff/forms/{id}/responses` | Paginated responses; `?format=csv` export. | `forms` |
| API-SUBS-01 | `GET /api/staff/submissions` | List/filter submissions (`?track=`, `?status=`, `?unassigned=1`). | `submissions` |
| API-SUBS-02 | `POST /api/staff/submissions/import` | Upload Devnovate CSV/XLSX → queued import (EVT-IMPORT-01). Returns `{import_id}`. | `submissions` |
| API-SUBS-03 | `GET /api/staff/imports/{id}` | Import status + conflict report. | `submissions` |
| API-REVIEW-01 | `POST /api/staff/submissions/{id}/assignments` | Assign reviewers `{reviewer_user_ids[]}`. Conflict-checked (RULE-SUB-04). | `submissions` / faculty_coordinator |
| API-REVIEW-02 | `GET /api/staff/reviews/mine` | My assigned submissions (judge/faculty view). | staff |
| API-REVIEW-03 | `POST /api/staff/submissions/{id}/reviews` | Submit `{score, notes?, track_recommendation?}` — must be assigned. | assigned reviewer |
| API-REVIEW-04 | `POST /api/staff/submissions/{id}/assign-track` | Set `assigned_track` + team state (selected/waitlisted/rejected). Audited. | faculty_coordinator+ |
| API-FIN-01 | `GET /api/staff/finance/requests` | List finance requests + summary (RULE-FIN-06). | `finance` |
| API-FIN-02 | `POST /api/staff/finance/requests` | Raise request. | any staff |
| API-FIN-03 | `POST /api/staff/finance/requests/{id}/transition` | `{to: 'approved'\|'rejected'\|'review'\|'paid'}` per state machine; audited. | `finance`, INV-FIN-02 |
| API-CERT-01 | `GET/POST /api/staff/certificates/templates` | List/create templates (background upload → R2). | `certificates` |
| API-CERT-02 | `POST /api/staff/certificates/templates/{id}/publish` | → `published` (blocked by INV-LOCK-01 when locked). | `certificates` |
| API-CERT-03 | `POST /api/staff/certificates/issue` | Issue batch `{template_id, recipients[]}` → allocates IDs, enqueues EVT-CERT-01. Idempotent (RULE-CERT-06). | `certificates` |
| API-CERT-04 | `POST /api/staff/certificates/{id}/revoke` | `{reason}` → `revoked`; audited. | `certificates` |
| API-PEOPLE-01 | `GET /api/staff/members` | Staff list + invitations. | master_admin |
| API-PEOPLE-02 | `POST /api/staff/invitations` | `{email, role, permissions[]}` → D1 pending row + Clerk org invitation (RULE-ACC-02). | master_admin |
| API-PEOPLE-03 | `POST /api/staff/invitations/{id}/revoke` | Revoke pending invite (D1 + Clerk). | master_admin |
| API-PEOPLE-04 | `PATCH /api/staff/members/{id}` | Change role/permissions or deactivate. INV-ACC-01 guard; audited. | master_admin |
| API-SET-01 | `GET /api/staff/settings` | Event settings + integration status. | staff |
| API-SET-02 | `PATCH /api/staff/settings` | Update settings; `deployment_lock` honored (INV-LOCK-01). | master_admin |

## File access

No public R2 URLs. File reads go through `GET /api/files/{key-scope}` style
authorized routes (owner team or staff); uploads land in `vmedithon-uploads`,
issued certs in `vmedithon-artifacts`. Public certificate file access is served
only alongside a valid API-VERIFY-01 lookup.

## Frontend routes (SPA, not API)

`/`, `/verify/:certificate_id`, `/sign-in`, `/platform/*` (authenticated),
`/platform/staff/*` (staff), `/accept-invite` (Clerk invitation redirect target).
SPA fallback serves `index.html` for all non-`/api` GETs.
