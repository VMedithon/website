# Product Specification — VMEDITHON 2026

> Normative document. Describes what the product MUST do. For what currently exists,
> see `../execution/current-state.md`. For rules that implement this spec, see
> `../domain/business-logic.md`.

## What the product is

VMEDITHON 2026 is a 36-hour overnight hackathon at **VIT Vellore, India, on
September 21–22, 2026**. It positions itself against "weekend hackathons" whose
output dies on Sunday: every team is routed into one of three tracks so the work
has a durable outcome — a research paper, a working prototype, or a patent-ready
design.

The platform has two faces:

1. **Public site** — marketing, event information, public certificate verification.
2. **Control Room** — an authenticated platform used by participants (to register
   and submit) and by staff (to run the event: forms, review, finance,
   certificates, people, settings).

## The event model

```
PITCH → MENTOR → MAKE → PUBLISH
```

| Stage | What happens |
|---|---|
| 01 Pitch | Online, free. Team submits one PPT. Reviewers align the idea to a track. |
| 02 Mentor | Faculty review. Mentor assigned; idea defended and refined. |
| 03 Make | 36 hours on campus, overnight. Meals, workspaces, expert checkpoints. |
| 04 Publish | Showcase. Paper or patent file submitted; industry showcase. |

### Tracks (fixed — there are exactly three)

| Track | Expected output |
|---|---|
| `RESEARCH` | Research paper (publication-ready) |
| `INDUSTRY` | Working prototype |
| `PROJECT` | Patent-ready design |

"Round one is free." Payment may apply to later rounds/on-campus participation
(the finance desk tracks internal event spend, not ticket sales — see
`business-logic.md` CAP-FIN-01).

## Actors

| Actor | Description | Identity |
|---|---|---|
| Visitor | Unauthenticated. Reads the site, verifies certificates. | None |
| Participant | Team member. Registers a team, submits pitch, answers forms. | Clerk personal account |
| Team lead | The participant who created the team. Extra capabilities (manage members, submit). | `team_members.role = 'lead'` |
| Staff | Runs the event. Five roles, below. | Clerk account + member of the VMEDITHON Clerk org |

### Staff roles (authoritative list)

| Role | Scope |
|---|---|
| `master_admin` | Everything: all systems, data, finance, permission controls, deployment-lock override |
| `faculty_coordinator` | Event-wide view, reviewer assignment, reporting, overrides |
| `organizing_committee` | Granular access — per-module permission grants (forms / submissions / finance / certificates) |
| `judge` | Review and score assigned submissions; showcase judging |
| `mentor` | View assigned teams' submissions; mentorship touchpoints |

Module permission grants (for `organizing_committee` and any delegated access):
`forms`, `submissions`, `finance`, `certificates`. Master admin implicitly has all.

> DECISION: authorization is resolved from our own `staff_members` table in D1;
> Clerk provides identity and delivers invitations. See ADR-0002. Role state in the
> frontend is never authoritative (INV-AUTH-02).

## Capabilities (CAP-*)

### Public site — IMPLEMENTED

- **CAP-SITE-01** Marketing landing page: hero, tracks, journey, experience,
  partners, closing CTA, footer. Anchor navigation only.
- **CAP-SITE-02** Responsive layout down to ~320px width (media queries at
  900px/600px breakpoints exist).
- **CAP-SITE-03** Platform preview: the Control Room dashboard opens as a
  full-screen overlay from "Open platform" / "View platform preview" /
  "Preview participant portal". Currently demo-only (see GAP-*).
- **CAP-SITE-04** "Verify certificate" modal. Currently a stub that always shows a
  demo notice — must become real (CAP-CERT-02).

### Registration and teams — REQUIRED

- **CAP-REG-01** A participant can create a team (name, member roster). Round-one
  registration is free; no payment step exists for round one.
- **CAP-REG-02** A team lead can invite members by email. Members may join with or
  without existing accounts.
- **CAP-REG-03** A participant belongs to at most one team (INV-TEAM-01).
- **CAP-REG-04** The public registration flow must handle unauthenticated visitors
  gracefully (sign-up happens inline, not as a separate product).

### Submissions and review — REQUIRED

- **CAP-SUB-01** A team submits exactly one pitch (PPT file) per round
  (INV-SUB-01). Stored in object storage; metadata in D1.
- **CAP-SUB-02** Staff can import an external submission dataset ("Devnovate
  dataset", CSV/XLSX) to seed or merge pitch records (GAP-IMPORT-01).
- **CAP-SUB-03** Staff assign faculty reviewers to submissions; unassigned counts
  are surfaced.
- **CAP-SUB-04** Reviewers score and comment; scores drive track assignment.
- **CAP-SUB-05** Review outcome assigns each advancing team to one of the three
  tracks and (later) a mentor.

### Form studio — REQUIRED

- **CAP-FORM-01** Staff build forms from typed fields (short answer, multiple
  choice, number, checkboxes, …), publish, and close them.
- **CAP-FORM-02** Published forms collect responses scoped to teams or
  participants; responses are exportable.
- **CAP-FORM-03** Form lifecycle: `draft → published → closed`. Closing is
  deadline-aware ("closes in 2 days" surfaced in UI).

### Finance desk — REQUIRED

- **CAP-FIN-01** Staff raise finance requests (e.g., dinner advance, print
  collateral, mentor travel) with payee details including UPI ID.
- **CAP-FIN-02** Requests flow through a strict state machine
  (`pending → approved/rejected`, `approved → paid`), with an audit trail
  (INV-FIN-01, INV-AUDIT-01).
- **CAP-FIN-03** Budget summary: total approved, awaiting approval, remaining.
  Reports exportable.

### Certificates — REQUIRED

- **CAP-CERT-01** Staff design certificate templates (background image, recipient
  name field, ID prefix like `VMT26-R-`) and publish them.
- **CAP-CERT-02** Certificates are issued with unique public IDs
  (`VMT26-<TRACK>-<seq>`), rendered to files, and publicly verifiable at a stable
  URL. The public lookup exposes only what is printed on the certificate
  (INV-DATA-01, COMP-VERIFY-01).
- **CAP-CERT-03** Certificates can be revoked; a revoked certificate verifies as
  invalid but is never deleted (INV-CERT-02).

### People & access — REQUIRED

- **CAP-ACC-01** Master admins invite staff by email with a pre-selected role and
  module permissions ("magic-link onboarding" — the invitee never picks their own
  role). Implemented via Clerk organization invitations (ADR-0002).
- **CAP-ACC-02** Invitations can be listed and revoked; acceptance activates the
  staff record (EVT-CLERK-ORG-*).

### Event settings — REQUIRED

- **CAP-EVT-01** Deployment lock: once enabled, public event structure (tracks,
  published forms, certificate templates) cannot change without a master-admin
  override, and overrides are audited (INV-LOCK-01).
- **CAP-EVT-02** Email configuration and a backup/audit stream are visible in
  settings but are **deferred integrations** — see GAP-EMAIL-01 and the
  implementation plan.

## Scale assumptions

- Event scale: **hundreds of teams, low thousands of participants** (the demo
  numbers — 842 teams / 614 submissions — are illustrative, not load targets).
  Design for ~5k users, ~1k concurrent at most around deadlines.
- File uploads: pitch decks, tens of MB at most; certificate backgrounds ~2–5 MB.
- This scale does not justify multi-region data, sharding, or heavy caching.
  D1 + R2 + Queues are sufficient (ADR-0001).

## Non-goals

- No ticket sales or payment processing in this platform (round one is free;
  on-campus payment handling, if any, is out of scope for the data model).
- No real-time collaboration features.
- No multi-event tenancy — the platform serves one event. Entity design does not
  carry an `event_id`; if a second event is ever added, that is a deliberate
  migration (see data-model notes).
- No public API beyond certificate verification. The Control Room API is consumed
  only by our frontend.

## Partners shown on the site

Devnovate (submission dataset source), Cloudflare (hosting), Clerk (identity),
VIT Vellore (host institution). These are display facts; only Devnovate has a
functional integration (CAP-SUB-02).
