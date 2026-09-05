PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users (
	id TEXT PRIMARY KEY,
	email TEXT NOT NULL,
	full_name TEXT,
	created_at TEXT NOT NULL,
	updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS staff_members (
	id TEXT PRIMARY KEY,
	user_id TEXT NOT NULL UNIQUE REFERENCES users(id),
	role TEXT NOT NULL CHECK (role IN ('master_admin', 'faculty_coordinator', 'organizing_committee', 'judge', 'mentor')),
	permissions TEXT NOT NULL DEFAULT '[]',
	status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('pending', 'active', 'deactivated')),
	invited_by TEXT REFERENCES staff_members(id),
	created_at TEXT NOT NULL,
	activated_at TEXT
);

CREATE TABLE IF NOT EXISTS staff_invitations (
	id TEXT PRIMARY KEY,
	email TEXT NOT NULL,
	role TEXT NOT NULL,
	permissions TEXT NOT NULL DEFAULT '[]',
	clerk_invitation_id TEXT UNIQUE,
	status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'revoked', 'expired')),
	created_by TEXT NOT NULL REFERENCES staff_members(id),
	created_at TEXT NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_invite_pending ON staff_invitations(email) WHERE status = 'pending';

CREATE TABLE IF NOT EXISTS teams (
	id TEXT PRIMARY KEY,
	name TEXT NOT NULL CHECK (length(name) BETWEEN 1 AND 80),
	lead_user_id TEXT NOT NULL REFERENCES users(id),
	state TEXT NOT NULL DEFAULT 'registered' CHECK (state IN ('registered', 'submitted', 'selected', 'waitlisted', 'rejected')),
	proposed_track TEXT CHECK (proposed_track IN ('RESEARCH', 'INDUSTRY', 'PROJECT')),
	assigned_track TEXT CHECK (assigned_track IN ('RESEARCH', 'INDUSTRY', 'PROJECT')),
	created_at TEXT NOT NULL,
	updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS team_members (
	id TEXT PRIMARY KEY,
	team_id TEXT NOT NULL REFERENCES teams(id),
	user_id TEXT REFERENCES users(id),
	email TEXT NOT NULL,
	display_name TEXT,
	role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('lead', 'member')),
	created_at TEXT NOT NULL,
	UNIQUE (team_id, email)
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_member_user ON team_members(user_id) WHERE user_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS forms (
	id TEXT PRIMARY KEY,
	title TEXT NOT NULL,
	description TEXT,
	audience TEXT NOT NULL CHECK (audience IN ('team', 'participant')),
	status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'closed')),
	schema_snapshot TEXT,
	closes_at TEXT,
	created_by TEXT NOT NULL REFERENCES staff_members(id),
	created_at TEXT NOT NULL,
	published_at TEXT
);

CREATE TABLE IF NOT EXISTS form_fields (
	id TEXT PRIMARY KEY,
	form_id TEXT NOT NULL REFERENCES forms(id) ON DELETE CASCADE,
	position INTEGER NOT NULL,
	type TEXT NOT NULL CHECK (type IN ('short_text', 'long_text', 'number', 'single_choice', 'multi_choice', 'checkbox', 'date')),
	label TEXT NOT NULL,
	required INTEGER NOT NULL DEFAULT 0,
	config TEXT NOT NULL DEFAULT '{}'
);

CREATE TABLE IF NOT EXISTS form_responses (
	id TEXT PRIMARY KEY,
	form_id TEXT NOT NULL REFERENCES forms(id),
	team_id TEXT REFERENCES teams(id),
	user_id TEXT REFERENCES users(id),
	payload TEXT NOT NULL,
	submitted_at TEXT NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_response_form_team ON form_responses(form_id, team_id) WHERE team_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS uq_response_form_user ON form_responses(form_id, user_id) WHERE user_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS imports (
	id TEXT PRIMARY KEY,
	source TEXT NOT NULL DEFAULT 'devnovate',
	file_key TEXT NOT NULL,
	status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'processing', 'done', 'failed')),
	stats TEXT,
	created_by TEXT NOT NULL REFERENCES staff_members(id),
	created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS submissions (
	id TEXT PRIMARY KEY,
	team_id TEXT NOT NULL REFERENCES teams(id),
	round INTEGER NOT NULL DEFAULT 1,
	kind TEXT NOT NULL CHECK (kind IN ('pitch', 'final')),
	title TEXT NOT NULL,
	file_key TEXT NOT NULL,
	proposed_track TEXT NOT NULL CHECK (proposed_track IN ('RESEARCH', 'INDUSTRY', 'PROJECT')),
	status TEXT NOT NULL DEFAULT 'received' CHECK (status IN ('received', 'in_review', 'scored', 'assigned')),
	source TEXT NOT NULL DEFAULT 'platform' CHECK (source IN ('platform', 'devnovate')),
	import_id TEXT REFERENCES imports(id),
	created_at TEXT NOT NULL,
	UNIQUE (team_id, round, kind)
);

CREATE TABLE IF NOT EXISTS review_assignments (
	id TEXT PRIMARY KEY,
	submission_id TEXT NOT NULL REFERENCES submissions(id),
	reviewer_id TEXT NOT NULL REFERENCES users(id),
	assigned_by TEXT NOT NULL REFERENCES staff_members(id),
	created_at TEXT NOT NULL,
	UNIQUE (submission_id, reviewer_id)
);

CREATE TABLE IF NOT EXISTS reviews (
	id TEXT PRIMARY KEY,
	submission_id TEXT NOT NULL REFERENCES submissions(id),
	reviewer_id TEXT NOT NULL REFERENCES users(id),
	score INTEGER CHECK (score BETWEEN 0 AND 100),
	notes TEXT,
	track_recommendation TEXT CHECK (track_recommendation IN ('RESEARCH', 'INDUSTRY', 'PROJECT') OR track_recommendation IS NULL),
	created_at TEXT NOT NULL,
	UNIQUE (submission_id, reviewer_id)
);

CREATE TABLE IF NOT EXISTS finance_requests (
	id TEXT PRIMARY KEY,
	title TEXT NOT NULL,
	raised_by TEXT NOT NULL REFERENCES staff_members(id),
	payee_name TEXT NOT NULL,
	upi_id TEXT NOT NULL,
	amount_paise INTEGER NOT NULL CHECK (amount_paise > 0),
	category TEXT,
	notes TEXT,
	status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'review', 'approved', 'rejected', 'paid')),
	decided_by TEXT REFERENCES staff_members(id),
	decided_at TEXT,
	created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS certificate_templates (
	id TEXT PRIMARY KEY,
	name TEXT NOT NULL,
	track TEXT CHECK (track IN ('RESEARCH', 'INDUSTRY', 'PROJECT') OR track IS NULL),
	kind TEXT NOT NULL DEFAULT 'participant' CHECK (kind IN ('participant', 'winner', 'mentor', 'judge', 'organizer')),
	id_prefix TEXT NOT NULL,
	background_key TEXT,
	name_field TEXT NOT NULL DEFAULT 'full_name',
	status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
	created_by TEXT NOT NULL REFERENCES staff_members(id),
	created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS cert_counters (
	prefix TEXT PRIMARY KEY,
	next_seq INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS certificates (
	id TEXT PRIMARY KEY,
	certificate_id TEXT NOT NULL UNIQUE,
	template_id TEXT NOT NULL REFERENCES certificate_templates(id),
	recipient_name TEXT NOT NULL,
	team_id TEXT REFERENCES teams(id),
	user_id TEXT REFERENCES users(id),
	track TEXT,
	status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'issued', 'revoked')),
	file_key TEXT,
	revoke_reason TEXT,
	issued_at TEXT,
	created_at TEXT NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_cert_recipient ON certificates(template_id, COALESCE(team_id, user_id)) WHERE status != 'revoked';

CREATE TABLE IF NOT EXISTS settings (
	key TEXT PRIMARY KEY,
	value TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS audit_log (
	id TEXT PRIMARY KEY,
	actor_user_id TEXT NOT NULL,
	action TEXT NOT NULL,
	entity_type TEXT NOT NULL,
	entity_id TEXT NOT NULL,
	diff TEXT,
	created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS webhook_events (
	svix_id TEXT PRIMARY KEY,
	type TEXT NOT NULL,
	received_at TEXT NOT NULL,
	processed_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_team_members_team_id ON team_members(team_id);
CREATE INDEX IF NOT EXISTS idx_form_responses_form_id ON form_responses(form_id);
CREATE INDEX IF NOT EXISTS idx_submissions_status ON submissions(status);
CREATE INDEX IF NOT EXISTS idx_review_assignments_reviewer_id ON review_assignments(reviewer_id);
CREATE INDEX IF NOT EXISTS idx_finance_requests_status ON finance_requests(status);
CREATE INDEX IF NOT EXISTS idx_audit_log_entity ON audit_log(entity_type, entity_id);
