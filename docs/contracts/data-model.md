# Data Model — target schema (D1 / SQLite)

> Normative target. Nothing below exists yet — `../execution/current-state.md`
> confirms there is no database. Schema lives in `migrations/` via
> `wrangler d1 migrations`; this document is its semantic contract.

## Design notes

- **Single event** — no `event_id` columns. The platform serves VMEDITHON 2026
  only (product-spec non-goal). A future second event is a deliberate migration.
- IDs are `TEXT` UUIDs (`crypto.randomUUID()`) except public-facing certificate
  IDs. Timestamps are `TEXT` ISO-8601 UTC. Money is `INTEGER` paise (INV-FIN-01).
- Enums are `TEXT` + `CHECK` constraints. Soft-delete where audit requires
  (staff, certificates); hard-delete elsewhere is fine.
- Every mutating business action funnels through service functions that also
  write `audit_log` (INV-AUDIT-01).

## Tables

### users — Clerk identity mirror (webhook-synced)
```sql
id            TEXT PRIMARY KEY,            -- Clerk user id (e.g. "user_2abc...")
email         TEXT NOT NULL,
full_name     TEXT,
created_at    TEXT NOT NULL,
updated_at    TEXT NOT NULL
```
Populated by `user.created/updated/deleted` webhooks (EVT-CLERK-USER-*). Never
write to this table from app code — it follows Clerk.

### staff_members — authorization authority (ADR-0002)
```sql
id            TEXT PRIMARY KEY,
user_id       TEXT NOT NULL UNIQUE REFERENCES users(id),
role          TEXT NOT NULL CHECK (role IN
              ('master_admin','faculty_coordinator','organizing_committee','judge','mentor')),
permissions   TEXT NOT NULL DEFAULT '[]',  -- JSON array of 'forms','submissions','finance','certificates'
status        TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('pending','active','deactivated')),
invited_by    TEXT REFERENCES staff_members(id),
created_at    TEXT NOT NULL,
activated_at  TEXT
```
- `pending` = invitation sent, not yet accepted. `deactivated` denies access,
  preserves history (RULE-ACC-06).
- Application must guarantee ≥1 active `master_admin` (INV-ACC-01).

### staff_invitations — pending invite records
```sql
id            TEXT PRIMARY KEY,
email         TEXT NOT NULL,
role          TEXT NOT NULL,               -- same enum as staff_members.role
permissions   TEXT NOT NULL DEFAULT '[]',
clerk_invitation_id TEXT UNIQUE,           -- Clerk org invitation id
status        TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','accepted','revoked','expired')),
created_by    TEXT NOT NULL REFERENCES staff_members(id),
created_at    TEXT NOT NULL
)
-- one live invite per email:
-- CREATE UNIQUE INDEX uq_invite_pending ON staff_invitations(email) WHERE status='pending';
```

### teams
```sql
id            TEXT PRIMARY KEY,
name          TEXT NOT NULL CHECK (length(name) BETWEEN 1 AND 80),
lead_user_id  TEXT NOT NULL REFERENCES users(id),
state         TEXT NOT NULL DEFAULT 'registered' CHECK (state IN
              ('registered','submitted','selected','waitlisted','rejected')),
proposed_track  TEXT CHECK (proposed_track IN ('RESEARCH','INDUSTRY','PROJECT')),
assigned_track  TEXT CHECK (assigned_track IN ('RESEARCH','INDUSTRY','PROJECT')),
created_at    TEXT NOT NULL,
updated_at    TEXT NOT NULL
```

### team_members
```sql
id            TEXT PRIMARY KEY,
team_id       TEXT NOT NULL REFERENCES teams(id),
user_id       TEXT REFERENCES users(id),   -- NULL until claimed (RULE-REG-04)
email         TEXT NOT NULL,
display_name  TEXT,
role          TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('lead','member')),
created_at    TEXT NOT NULL,
UNIQUE (team_id, email)
```
INV-TEAM-01 (one team per user) is enforced by a partial unique index:
`CREATE UNIQUE INDEX uq_member_user ON team_members(user_id) WHERE user_id IS NOT NULL;`
plus an application check on team create (a lead already in a team is rejected).

### forms
```sql
id            TEXT PRIMARY KEY,
title         TEXT NOT NULL,
description   TEXT,
audience      TEXT NOT NULL CHECK (audience IN ('team','participant')),
status        TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published','closed')),
schema_snapshot TEXT,                      -- JSON: frozen field list at publish (INV-FORM-01)
closes_at     TEXT,
created_by    TEXT NOT NULL REFERENCES staff_members(id),
created_at    TEXT NOT NULL,
published_at  TEXT
```

### form_fields
```sql
id            TEXT PRIMARY KEY,
form_id       TEXT NOT NULL REFERENCES forms(id) ON DELETE CASCADE,
position      INTEGER NOT NULL,
type          TEXT NOT NULL CHECK (type IN
              ('short_text','long_text','number','single_choice','multi_choice','checkbox','date')),
label         TEXT NOT NULL,
required      INTEGER NOT NULL DEFAULT 0,
config        TEXT NOT NULL DEFAULT '{}'   -- JSON: options[], min/max, etc.
```

### form_responses
```sql
id            TEXT PRIMARY KEY,
form_id       TEXT NOT NULL REFERENCES forms(id),
team_id       TEXT REFERENCES teams(id),   -- audience='team'
user_id       TEXT REFERENCES users(id),   -- audience='participant'
payload       TEXT NOT NULL,               -- JSON answers keyed by field id
submitted_at  TEXT NOT NULL
-- one response per (form, team) or (form, user): enforce via filtered unique indexes
```

### submissions
```sql
id            TEXT PRIMARY KEY,
team_id       TEXT NOT NULL REFERENCES teams(id),
round         INTEGER NOT NULL DEFAULT 1,
kind          TEXT NOT NULL CHECK (kind IN ('pitch','final')),
title         TEXT NOT NULL,
file_key      TEXT NOT NULL,               -- R2 object key
proposed_track TEXT NOT NULL CHECK (proposed_track IN ('RESEARCH','INDUSTRY','PROJECT')),
status        TEXT NOT NULL DEFAULT 'received' CHECK (status IN
              ('received','in_review','scored','assigned')),
source        TEXT NOT NULL DEFAULT 'platform' CHECK (source IN ('platform','devnovate')),
import_id     TEXT REFERENCES imports(id),
created_at    TEXT NOT NULL,
UNIQUE (team_id, round, kind)              -- INV-SUB-01
```

### review_assignments / reviews
```sql
review_assignments: id PK, submission_id FK, reviewer_id FK users(id),
                    assigned_by FK staff_members(id), created_at,
                    UNIQUE (submission_id, reviewer_id)
reviews:            id PK, submission_id FK, reviewer_id FK users(id),
                    score INTEGER CHECK (score BETWEEN 0 AND 100),
                    notes TEXT, track_recommendation TEXT
                    CHECK (track_recommendation IN ('RESEARCH','INDUSTRY','PROJECT') OR track_recommendation IS NULL),
                    created_at, UNIQUE (submission_id, reviewer_id)
```
RULE-SUB-04 conflict check (reviewer not on the team) is application-level.

### finance_requests
```sql
id            TEXT PRIMARY KEY,
title         TEXT NOT NULL,
raised_by     TEXT NOT NULL REFERENCES staff_members(id),
payee_name    TEXT NOT NULL,
upi_id        TEXT NOT NULL,
amount_paise  INTEGER NOT NULL CHECK (amount_paise > 0),
category      TEXT,
notes         TEXT,
status        TEXT NOT NULL DEFAULT 'pending' CHECK (status IN
              ('pending','review','approved','rejected','paid')),
decided_by    TEXT REFERENCES staff_members(id),
decided_at    TEXT,
created_at    TEXT NOT NULL
```
Transitions per RULE-FIN-02; `decided_by != raised_by` checked in app (INV-FIN-02).

### certificate_templates
```sql
id            TEXT PRIMARY KEY,
name          TEXT NOT NULL,
track         TEXT CHECK (track IN ('RESEARCH','INDUSTRY','PROJECT') OR track IS NULL),
kind          TEXT NOT NULL DEFAULT 'participant' CHECK (kind IN
              ('participant','winner','mentor','judge','organizer')),
id_prefix     TEXT NOT NULL,               -- e.g. 'VMT26-R-'
background_key TEXT,                       -- R2 key
name_field    TEXT NOT NULL DEFAULT 'full_name',
status        TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published')),
created_by    TEXT NOT NULL REFERENCES staff_members(id),
created_at    TEXT NOT NULL
```

### cert_counters — per-prefix ID allocator (INV-CERT-01)
```sql
prefix        TEXT PRIMARY KEY,
next_seq      INTEGER NOT NULL             -- increment inside issuance transaction
```

### certificates
```sql
id            TEXT PRIMARY KEY,
certificate_id TEXT NOT NULL UNIQUE,       -- 'VMT26-R-0001' — never reused
template_id   TEXT NOT NULL REFERENCES certificate_templates(id),
recipient_name TEXT NOT NULL,
team_id       TEXT REFERENCES teams(id),
user_id       TEXT REFERENCES users(id),
track         TEXT,
status        TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','issued','revoked')),
file_key      TEXT,                        -- R2 key once rendered
revoke_reason TEXT,
issued_at     TEXT,
created_at    TEXT NOT NULL
)
-- idempotent issuance (RULE-CERT-06, INV-IDEM-01) — one live cert per
-- (template, recipient); a revoked cert does not block re-issuance.
-- Certificate kind lives on certificate_templates.kind:
-- CREATE UNIQUE INDEX uq_cert_recipient ON certificates
--   (template_id, COALESCE(team_id, user_id)) WHERE status != 'revoked';
```

### imports — external dataset batches (RULE-SUB-06)
```sql
id            TEXT PRIMARY KEY,
source        TEXT NOT NULL DEFAULT 'devnovate',
file_key      TEXT NOT NULL,               -- uploaded CSV/XLSX in R2
status        TEXT NOT NULL DEFAULT 'queued' CHECK (status IN
              ('queued','processing','done','failed')),
stats         TEXT,                        -- JSON: rows, created, conflicts
created_by    TEXT NOT NULL REFERENCES staff_members(id),
created_at    TEXT NOT NULL
```

### settings — single-row event config
```sql
key           TEXT PRIMARY KEY,
value         TEXT NOT NULL                -- JSON
```
Known keys: `deployment_lock`, `registration_closes_at`, `budget_total_paise`,
`event_meta` (name/dates/venue).

### audit_log — append-only (INV-AUDIT-01)
```sql
id            TEXT PRIMARY KEY,
actor_user_id TEXT NOT NULL,
action        TEXT NOT NULL,               -- e.g. 'finance.approve','cert.issue','staff.role_change'
entity_type   TEXT NOT NULL,
entity_id     TEXT NOT NULL,
diff          TEXT,                        -- JSON before/after
created_at    TEXT NOT NULL
```
No UPDATE/DELETE paths. Written synchronously inside the action's transaction.

### webhook_events — ingress idempotency (INV-IDEM-01)
```sql
svix_id       TEXT PRIMARY KEY,            -- 'svix-id' header
type          TEXT NOT NULL,
received_at   TEXT NOT NULL,
processed_at  TEXT
```

## R2 object conventions

| Bucket | Key shape | Access |
|---|---|---|
| `vmedithon-uploads` | `pitches/{team_id}/{submission_id}.{ext}`, `imports/{import_id}/{filename}`, `cert-backgrounds/{template_id}` | Worker-proxied; owner team or staff only |
| `vmedithon-artifacts` | `certificates/{certificate_id}.png` | Public verify serves the file or a metadata view; direct R2 URLs never exposed |

## Indexes (minimum)

- `team_members(team_id)`, `form_responses(form_id)`, `submissions(status)`,
  `review_assignments(reviewer_id)`, `finance_requests(status)`,
  `certificates(certificate_id)` (unique, above), `audit_log(entity_type, entity_id)`.
