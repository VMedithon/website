# 0002. Staff authorization lives in D1; Clerk provides identity + invitations

- Status: Accepted
- Date: 2026-09-04

## Context

The platform has ~30 staff accounts across five roles (master admin, faculty
coordinator, organizing committee, judge, mentor) plus hundreds–thousands of
participants. The product requires:

- Invitation-based onboarding where role **and a per-person module permission set**
  (forms / submissions / finance / certificates) are chosen by the inviter —
  the invitee never picks their own access.
- Permission changes that take effect immediately and are auditable.

Clerk Organizations provides invitations and roles, but permissions attach to
*roles*, not individuals — modeling "this committee member gets finance + forms"
would require one custom role per permission combination (Clerk caps custom roles
at ~10 per instance) and would push granular grants into session-claim staleness.

## Decision

- **Clerk = identity + delivery.** Participants and staff sign in with Clerk.
  A single Clerk Organization ("VMEDITHON staff") gates staff status and delivers
  magic-link invitations (`organizationInvitation` created via Backend API with
  the invitee's intended role baked into our own `staff_invitations` row).
- **D1 `staff_members` = authorization authority.** Effective access is resolved
  per request: valid Clerk JWT → `staff_members` row → `role` + `permissions`
  JSON grant set. The Clerk org role is not used for authorization decisions.
- Webhooks (`organizationInvitation.accepted`, `organizationMembership.*`,
  `user.*`) keep D1 mirrors in sync; the D1 row is created as `pending` when the
  invitation is sent and activated on acceptance.

## Alternatives considered

- **Clerk org roles/permissions as the authority**: rejected — per-person module
  grants don't map to role-based permissions without role explosion, and session
  claims add a staleness window for revocation.
- **`publicMetadata` role flags**: rejected for the same staleness reason and
  weaker auditability.
- **Staff-only sign-in allowlist with no org**: workable but loses Clerk's
  invitation email delivery, which is the product's "magic-link" UX.

## Consequences

- +1 request-time D1 read on staff routes (cheap at this scale; may be cached in
  `ctx` per request).
- Role/permission changes are instant and fully inside our audit trail
  (INV-AUDIT-01), including the "who granted what" record Clerk cannot provide
  for module grants.
- We must handle the case: Clerk org membership exists but `staff_members` row is
  missing/deactivated → deny (staff table is authoritative, INV-AUTH-02).
- Invitation flow has two writes (D1 pending row + Clerk invitation); the D1 row
  is created first so a Clerk failure leaves no dangling access.

## Conditions for reconsideration

- If staff count or role complexity grows to where re-implementing Clerk's
  org model is a burden, or if Clerk adds per-member permission grants,
  migrating authorization into Clerk is reasonable — the `staff_members` schema
  keeps role and permissions as separable columns to allow that move.
