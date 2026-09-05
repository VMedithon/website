import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import type { AppEnv } from "../types";
import { requireUser } from "../lib/auth";
import { all, first, getDb, run } from "../lib/db";
import { getUploads } from "../lib/bindings";
import { newId, now, parseJson } from "../lib/utils";
import { requireTeamName } from "../lib/validation";
import { isTrack } from "../lib/state";

const ALLOWED_PITCH_EXTENSIONS = [".ppt", ".pptx", ".pdf"];
const MAX_PITCH_SIZE = 25 * 1024 * 1024; // 25 MB

const participantApp = new Hono<AppEnv>();

async function getRegistrationDeadline(db: D1Database): Promise<string | null> {
	const row = await first<{ value: string }>(db, "SELECT value FROM settings WHERE key = 'registration_closes_at'");
	return parseJson<string | null>(row?.value ?? null) ?? null;
}

function isDeadlinePassed(deadline: string | null): boolean {
	if (!deadline) return false;
	const d = new Date(deadline);
	return !Number.isNaN(d.getTime()) && d.getTime() < Date.now();
}

async function assertRegistrationOpen(db: D1Database): Promise<void> {
	const deadline = await getRegistrationDeadline(db);
	if (isDeadlinePassed(deadline)) {
		throw new HTTPException(409, { message: "registration_closed" });
	}
}

participantApp.post("/teams", async (c) => {
	const db = getDb(c);
	const userId = await requireUser(c);
	const userEmail = c.get("userEmail");
	if (!userEmail) {
		return c.json({ error: { code: "missing_email", message: "User email not available" } }, 400);
	}

	await assertRegistrationOpen(db);

	const existing = await first<{ team_id: string }>(db, "SELECT team_id FROM team_members WHERE user_id = ?", userId);
	if (existing) {
		return c.json({ error: { code: "already_in_team", message: "You are already in a team" } }, 409);
	}

	const body = await c.req.json<{ name: unknown; proposed_track?: unknown }>();
	const name = requireTeamName(body.name);
	const proposedTrack = body.proposed_track && isTrack(body.proposed_track) ? body.proposed_track : null;

	const teamId = newId();
	const createdAt = now();
	await run(
		db,
		"INSERT INTO teams (id, name, lead_user_id, state, proposed_track, created_at, updated_at) VALUES (?, ?, ?, 'registered', ?, ?, ?)",
		teamId,
		name,
		userId,
		proposedTrack,
		createdAt,
		createdAt,
	);
	await run(
		db,
		"INSERT INTO team_members (id, team_id, user_id, email, display_name, role, created_at) VALUES (?, ?, ?, ?, ?, 'lead', ?)",
		newId(),
		teamId,
		userId,
		userEmail,
		c.get("userName") ?? userEmail,
		createdAt,
	);

	return c.json({ id: teamId, name, state: "registered", proposed_track: proposedTrack }, 201);
});

participantApp.get("/me/team", async (c) => {
	const db = getDb(c);
	const userId = await requireUser(c);
	const membership = await first<{ team_id: string }>(db, "SELECT team_id FROM team_members WHERE user_id = ?", userId);
	if (!membership) {
		return c.json({ error: { code: "not_found", message: "You are not in a team" } }, 404);
	}

	const team = await first<{
		id: string;
		name: string;
		state: string;
		proposed_track: string | null;
		assigned_track: string | null;
	}>(db, "SELECT id, name, state, proposed_track, assigned_track FROM teams WHERE id = ?", membership.team_id);
	if (!team) {
		return c.json({ error: { code: "not_found", message: "Team not found" } }, 404);
	}

	const members = await all<{ id: string; email: string; display_name: string | null; role: string }>(
		db,
		"SELECT id, email, display_name, role FROM team_members WHERE team_id = ?",
		team.id,
	);

	return c.json({ ...team, members });
});

participantApp.post("/me/team/members", async (c) => {
	const db = getDb(c);
	const userId = await requireUser(c);
	await assertRegistrationOpen(db);

	const membership = await first<{ team_id: string }>(
		db,
		"SELECT team_id FROM team_members WHERE user_id = ? AND role = 'lead'",
		userId,
	);
	if (!membership) {
		return c.json({ error: { code: "forbidden", message: "Only the team lead can invite members" } }, 403);
	}

	const body = await c.req.json<{ email: unknown; name?: unknown }>();
	const email = (body.email as string).toLowerCase().trim();
	if (!email.includes("@")) {
		return c.json({ error: { code: "invalid_email", message: "Invalid email" } }, 400);
	}

	const current = await all<{ id: string }>(db, "SELECT id FROM team_members WHERE team_id = ?", membership.team_id);
	if (current.length >= 5) {
		return c.json({ error: { code: "team_full", message: "Team cannot exceed 5 members" } }, 409);
	}

	const existingInTeam = await first<{ id: string }>(
		db,
		"SELECT id FROM team_members WHERE team_id = ? AND email = ?",
		membership.team_id,
		email,
	);
	if (existingInTeam) {
		return c.json({ error: { code: "duplicate_member", message: "This email is already on the team" } }, 409);
	}

	const otherTeam = await first<{ id: string }>(
		db,
		"SELECT id FROM team_members WHERE user_id = (SELECT id FROM users WHERE email = ?) AND user_id IS NOT NULL",
		email,
	);
	if (otherTeam) {
		return c.json({ error: { code: "already_in_team", message: "This user is already in another team" } }, 409);
	}

	const user = await first<{ id: string }>(db, "SELECT id FROM users WHERE email = ?", email);
	const memberId = newId();
	await run(
		db,
		"INSERT INTO team_members (id, team_id, user_id, email, display_name, role, created_at) VALUES (?, ?, ?, ?, ?, 'member', ?)",
		memberId,
		membership.team_id,
		user?.id ?? null,
		email,
		body.name ?? email,
		now(),
	);

	return c.json({ id: memberId, email, user_id: user?.id ?? null }, 201);
});

participantApp.delete("/me/team/members/:member_id", async (c) => {
	const db = getDb(c);
	const userId = await requireUser(c);
	const memberId = c.req.param("member_id");

	const membership = await first<{ team_id: string }>(
		db,
		"SELECT team_id FROM team_members WHERE user_id = ? AND role = 'lead'",
		userId,
	);
	if (!membership) {
		return c.json({ error: { code: "forbidden", message: "Only the team lead can remove members" } }, 403);
	}

	const team = await first<{ state: string }>(db, "SELECT state FROM teams WHERE id = ?", membership.team_id);
	if (team && team.state !== "registered") {
		return c.json({ error: { code: "locked", message: "Cannot change team after submission" } }, 409);
	}

	const member = await first<{ id: string }>(
		db,
		"SELECT id FROM team_members WHERE id = ? AND team_id = ?",
		memberId,
		membership.team_id,
	);
	if (!member) {
		return c.json({ error: { code: "not_found", message: "Member not found" } }, 404);
	}

	await run(db, "DELETE FROM team_members WHERE id = ?", memberId);
	return c.json({ ok: true });
});

participantApp.post("/me/submissions", async (c) => {
	const db = getDb(c);
	const userId = await requireUser(c);
	await assertRegistrationOpen(db);

	const membership = await first<{ team_id: string }>(
		db,
		"SELECT team_id FROM team_members WHERE user_id = ? AND role = 'lead'",
		userId,
	);
	if (!membership) {
		return c.json({ error: { code: "forbidden", message: "Only the team lead can submit" } }, 403);
	}

	const team = await first<{ id: string; state: string }>(db, "SELECT id, state FROM teams WHERE id = ?", membership.team_id);
	if (!team) {
		return c.json({ error: { code: "not_found", message: "Team not found" } }, 404);
	}
	if (team.state === "selected" || team.state === "waitlisted" || team.state === "rejected") {
		return c.json({ error: { code: "closed", message: "Submission is closed for this team" } }, 409);
	}

	const body = await c.req.parseBody({ all: true });
	const title = typeof body.title === "string" && body.title ? body.title : null;
	const proposedTrack = isTrack(body.proposed_track) ? body.proposed_track : null;
	if (!title) {
		return c.json({ error: { code: "missing_title", message: "Title is required" } }, 400);
	}
	if (!proposedTrack) {
		return c.json({ error: { code: "missing_track", message: "Proposed track is required" } }, 400);
	}

	const file = body.file;
	if (!(file instanceof File)) {
		return c.json({ error: { code: "missing_file", message: "A pitch file is required" } }, 400);
	}

	const dot = file.name.lastIndexOf(".");
	const ext = dot >= 0 ? file.name.slice(dot).toLowerCase() : "";
	if (!ALLOWED_PITCH_EXTENSIONS.includes(ext)) {
		return c.json({ error: { code: "invalid_file_type", message: "Only .ppt, .pptx, .pdf files are allowed" } }, 400);
	}
	if (file.size > MAX_PITCH_SIZE) {
		return c.json({ error: { code: "file_too_large", message: "Maximum file size is 25 MB" } }, 400);
	}

	const existing = await first<{ id: string; status: string }>(
		db,
		"SELECT id, status FROM submissions WHERE team_id = ? AND round = 1 AND kind = 'pitch'",
		team.id,
	);
	if (existing && existing.status !== "received") {
		return c.json({ error: { code: "already_submitted", message: "Pitch already in review" } }, 409);
	}

	const submissionId = existing?.id ?? newId();
	const key = `pitches/${team.id}/${submissionId}${ext}`;
	const uploads = getUploads(c);
	await uploads.put(key, file, { httpMetadata: { contentType: file.type || "application/octet-stream" } });

	if (existing) {
		await run(
			db,
			"UPDATE submissions SET title = ?, file_key = ?, proposed_track = ? WHERE id = ?",
			title,
			key,
			proposedTrack,
			submissionId,
		);
	} else {
		await run(
			db,
			"INSERT INTO submissions (id, team_id, round, kind, title, file_key, proposed_track, status, source, created_at) VALUES (?, ?, 1, 'pitch', ?, ?, ?, 'received', 'platform', ?)",
			submissionId,
			team.id,
			title,
			key,
			proposedTrack,
			now(),
		);
	}

	await run(
		db,
		"UPDATE teams SET state = 'submitted', proposed_track = ? WHERE id = ?",
		proposedTrack,
		team.id,
	);

	return c.json({ id: submissionId, file_key: key, title, proposed_track: proposedTrack, status: "received" }, 201);
});

participantApp.get("/me/submissions", async (c) => {
	const db = getDb(c);
	const userId = await requireUser(c);
	const membership = await first<{ team_id: string }>(db, "SELECT team_id FROM team_members WHERE user_id = ?", userId);
	if (!membership) {
		return c.json({ error: { code: "not_found", message: "You are not in a team" } }, 404);
	}
	const rows = await all<{
		id: string;
		round: number;
		kind: string;
		title: string;
		proposed_track: string;
		status: string;
		created_at: string;
	}>(
		db,
		"SELECT id, round, kind, title, proposed_track, status, created_at FROM submissions WHERE team_id = ?",
		membership.team_id,
	);
	return c.json({ items: rows });
});

participantApp.get("/forms", async (c) => {
	const db = getDb(c);
	const userId = await requireUser(c);
	const membership = await first<{ team_id: string }>(db, "SELECT team_id FROM team_members WHERE user_id = ?", userId);
	const rows = await all<{ id: string; title: string; audience: string; status: string; closes_at: string | null }>(
		db,
		"SELECT id, title, audience, status, closes_at FROM forms WHERE status = 'published' AND (closes_at IS NULL OR closes_at > ?) ORDER BY created_at DESC",
		now(),
	);
	return c.json({ items: rows.map((f) => ({ ...f, audience: membership ? f.audience : "participant" })) });
});

participantApp.get("/forms/:id", async (c) => {
	const db = getDb(c);
	const formId = c.req.param("id");
	await requireUser(c);

	const form = await first<{ id: string; title: string; description: string | null; audience: string; status: string; closes_at: string | null }>(
		db,
		"SELECT id, title, description, audience, status, closes_at FROM forms WHERE id = ? AND status IN ('published', 'closed')",
		formId,
	);
	if (!form) {
		return c.json({ error: { code: "not_found", message: "Form not found or not published" } }, 404);
	}
	if (form.status === "closed" || (form.closes_at && new Date(form.closes_at).getTime() < Date.now())) {
		return c.json({ error: { code: "closed", message: "This form is closed" } }, 409);
	}

	const fields = await all<{ id: string; position: number; type: string; label: string; required: number; config: string }>(
		db,
		"SELECT id, position, type, label, required, config FROM form_fields WHERE form_id = ? ORDER BY position",
		formId,
	);
	return c.json({
		id: form.id,
		title: form.title,
		description: form.description,
		audience: form.audience,
		fields: fields.map((f) => ({ ...f, required: f.required === 1, config: parseJson(f.config) ?? {} })),
	});
});

participantApp.post("/forms/:id/responses", async (c) => {
	const db = getDb(c);
	const userId = await requireUser(c);
	const formId = c.req.param("id");

	const form = await first<{
		id: string;
		audience: string;
		status: string;
		closes_at: string | null;
		schema_snapshot: string | null;
	}>(db, "SELECT id, audience, status, closes_at, schema_snapshot FROM forms WHERE id = ?", formId);
	if (form?.status !== "published") {
		return c.json({ error: { code: "not_found", message: "Form not found or not published" } }, 404);
	}
	if (form.closes_at && new Date(form.closes_at).getTime() < Date.now()) {
		return c.json({ error: { code: "closed", message: "This form is closed" } }, 409);
	}

	const body = await c.req.json<{ answers: Record<string, unknown> }>();
	const answers = body.answers ?? {};

	let teamId: string | null = null;
	let targetUserId: string | null = null;
	if (form.audience === "team") {
		const membership = await first<{ team_id: string }>(db, "SELECT team_id FROM team_members WHERE user_id = ?", userId);
		if (!membership) {
			return c.json({ error: { code: "not_in_team", message: "You must be in a team to submit" } }, 403);
		}
		teamId = membership.team_id;
		targetUserId = null;
	} else {
		targetUserId = userId;
	}

	const snapshot =
		parseJson<Array<{ id: string; type: string; required: boolean; label?: string }>>(form.schema_snapshot) ?? [];
	for (const field of snapshot) {
		if (field.required && (answers[field.id] === undefined || answers[field.id] === "" || answers[field.id] === null)) {
			return c.json(
				{ error: { code: "missing_answer", message: `Answer for ${field.label ?? field.id} is required` } },
				400,
			);
		}
	}

	const responseId = newId();
	try {
		await run(
			db,
			"INSERT INTO form_responses (id, form_id, team_id, user_id, payload, submitted_at) VALUES (?, ?, ?, ?, ?, ?)",
			responseId,
			formId,
			teamId,
			targetUserId,
			JSON.stringify(answers),
			now(),
		);
	} catch {
		return c.json({ error: { code: "duplicate_response", message: "You have already submitted a response to this form" } }, 409);
	}

	return c.json({ id: responseId }, 201);
});

export default participantApp;
