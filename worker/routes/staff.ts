import { createClerkClient } from "@clerk/backend";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import type { AppEnv } from "../types";
import { writeAuditLog } from "../lib/audit";
import { getArtifacts, getQueue, getUploads } from "../lib/bindings";
import { getSecret, requireMasterAdmin, requireStaff } from "../lib/auth";
import { all, first, getDb, run } from "../lib/db";
import { newId, now, parseJson } from "../lib/utils";
import { isTrack, isValidFinanceTransition, isValidSubmissionTransition } from "../lib/state";
import {
	requireArrayOfStrings,
	requireEmail,
	requirePositivePaise,
	requireStaffRole,
	requireString,
	requireStringOptional,
	requireTrack,
} from "../lib/validation";

const staffApp = new Hono<AppEnv>();

async function getSetting(db: D1Database, key: string): Promise<string | null> {
	const row = await first<{ value: string }>(db, "SELECT value FROM settings WHERE key = ?", key);
	return row?.value ?? null;
}

async function isDeploymentLocked(db: D1Database): Promise<boolean> {
	const raw = await getSetting(db, "deployment_lock");
	return raw ? (JSON.parse(raw) as boolean) : false;
}

async function assertNotLocked(db: D1Database): Promise<void> {
	if (await isDeploymentLocked(db)) {
		throw new HTTPException(423, { message: "deployment_locked" });
	}
}

async function audit(
	c: import("hono").Context<AppEnv>,
	action: string,
	entityType: string,
	entityId: string,
	diff: Record<string, unknown>,
): Promise<void> {
	const userId = c.get("userId") ?? "system";
	await writeAuditLog(getDb(c), userId, action, entityType, entityId, diff);
}

staffApp.get("/overview", async (c) => {
	const db = getDb(c);
	requireStaff(c);

	const totalTeams = await first<{ count: number }>(db, "SELECT COUNT(*) as count FROM teams");
	const totalSubmissions = await first<{ count: number }>(db, "SELECT COUNT(*) as count FROM submissions");
	const pendingReviews = await first<{ count: number }>(
		db,
		"SELECT COUNT(*) as count FROM review_assignments WHERE id NOT IN (SELECT submission_id FROM reviews WHERE reviewer_id = review_assignments.reviewer_id)",
	);
	const pendingFinance = await first<{ count: number }>(
		db,
		"SELECT COUNT(*) as count FROM finance_requests WHERE status IN ('pending', 'review')",
	);
	const issuedCerts = await first<{ count: number }>(
		db,
		"SELECT COUNT(*) as count FROM certificates WHERE status = 'issued'",
	);
	const selectedTeams = await first<{ count: number }>(db, "SELECT COUNT(*) as count FROM teams WHERE state = 'selected'");

	return c.json({
		teams: totalTeams?.count ?? 0,
		submissions: totalSubmissions?.count ?? 0,
		pending_reviews: pendingReviews?.count ?? 0,
		pending_finance: pendingFinance?.count ?? 0,
		issued_certificates: issuedCerts?.count ?? 0,
		selected_teams: selectedTeams?.count ?? 0,
	});
});

staffApp.get("/teams", async (c) => {
	const db = getDb(c);
	requireStaff(c);
	const rows = await all<{
		id: string;
		name: string;
		state: string;
		proposed_track: string | null;
		assigned_track: string | null;
		created_at: string;
	}>(db, "SELECT id, name, state, proposed_track, assigned_track, created_at FROM teams ORDER BY created_at DESC");
	return c.json({ items: rows });
});

staffApp.get("/teams/:id", async (c) => {
	const db = getDb(c);
	requireStaff(c);
	const teamId = c.req.param("id");
	const team = await first<{
		id: string;
		name: string;
		state: string;
		proposed_track: string | null;
		assigned_track: string | null;
		created_at: string;
	}>(db, "SELECT id, name, state, proposed_track, assigned_track, created_at FROM teams WHERE id = ?", teamId);
	if (!team) return c.json({ error: { code: "not_found", message: "Team not found" } }, 404);
	const members = await all<{ id: string; email: string; display_name: string | null; role: string }>(
		db,
		"SELECT id, email, display_name, role FROM team_members WHERE team_id = ?",
		teamId,
	);
	const submissions = await all<{
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
		teamId,
	);
	return c.json({ ...team, members, submissions });
});

staffApp.get("/submissions", async (c) => {
	const db = getDb(c);
	requireStaff(c, "submissions");
	const rows = await all<{
		id: string;
		team_id: string;
		team_name: string;
		round: number;
		kind: string;
		title: string;
		proposed_track: string;
		status: string;
		created_at: string;
	}>(
		db,
		"SELECT s.id, s.team_id, t.name as team_name, s.round, s.kind, s.title, s.proposed_track, s.status, s.created_at FROM submissions s JOIN teams t ON t.id = s.team_id ORDER BY s.created_at DESC",
	);
	return c.json({ items: rows });
});

staffApp.get("/submissions/:id", async (c) => {
	const db = getDb(c);
	requireStaff(c, "submissions");
	const submissionId = c.req.param("id");
	const submission = await first<{
		id: string;
		team_id: string;
		team_name: string;
		round: number;
		kind: string;
		title: string;
		proposed_track: string;
		status: string;
		file_key: string;
		source: string;
		created_at: string;
	}>(
		db,
		"SELECT s.id, s.team_id, t.name as team_name, s.round, s.kind, s.title, s.proposed_track, s.status, s.file_key, s.source, s.created_at FROM submissions s JOIN teams t ON t.id = s.team_id WHERE s.id = ?",
		submissionId,
	);
	if (!submission) return c.json({ error: { code: "not_found", message: "Submission not found" } }, 404);

	const reviewers = await all<{
		id: string;
		reviewer_id: string;
		full_name: string | null;
		created_at: string;
	}>(
		db,
		"SELECT ra.id, ra.reviewer_id, u.full_name, ra.created_at FROM review_assignments ra LEFT JOIN users u ON u.id = ra.reviewer_id WHERE ra.submission_id = ?",
		submissionId,
	);
	const reviews = await all<{
		id: string;
		reviewer_id: string;
		full_name: string | null;
		score: number | null;
		notes: string | null;
		track_recommendation: string | null;
		created_at: string;
	}>(
		db,
		"SELECT r.id, r.reviewer_id, u.full_name, r.score, r.notes, r.track_recommendation, r.created_at FROM reviews r LEFT JOIN users u ON u.id = r.reviewer_id WHERE r.submission_id = ?",
		submissionId,
	);
	return c.json({ ...submission, reviewers, reviews });
});

staffApp.get("/submissions/:id/file", async (c) => {
	const db = getDb(c);
	requireStaff(c, "submissions");
	const submissionId = c.req.param("id");
	const submission = await first<{ file_key: string }>(db, "SELECT file_key FROM submissions WHERE id = ?", submissionId);
	if (!submission?.file_key) return c.json({ error: { code: "not_found", message: "File not found" } }, 404);

	const uploads = getUploads(c);
	const object = await uploads.get(submission.file_key);
	if (!object) return c.json({ error: { code: "not_found", message: "File not found in storage" } }, 404);

	const headers: Record<string, string> = {
		"Content-Type": object.httpMetadata?.contentType ?? "application/octet-stream",
		"Content-Length": String(object.size),
	};
	return c.body(object.body, 200, headers);
});

staffApp.post("/submissions/:id/assign-track", async (c) => {
	const db = getDb(c);
	const staff = requireStaff(c, "submissions");
	const submissionId = c.req.param("id");
	await assertNotLocked(db);

	const body = await c.req.json<{ track: unknown }>();
	const track = requireTrack(body.track);

	const submission = await first<{ team_id: string; status: string }>(db, "SELECT team_id, status FROM submissions WHERE id = ?", submissionId);
	if (!submission) return c.json({ error: { code: "not_found", message: "Submission not found" } }, 404);
	if (submission.status === "assigned") return c.json({ error: { code: "already_assigned", message: "Track already assigned" } }, 409);

	const currentStatus = submission.status as "received" | "in_review" | "scored" | "assigned";
	if (!isValidSubmissionTransition(currentStatus, "assigned")) {
		return c.json({ error: { code: "invalid_transition", message: "Cannot assign track from this state" } }, 409);
	}

	await run(db, "UPDATE submissions SET proposed_track = ?, status = 'assigned' WHERE id = ?", track, submissionId);
	await run(db, "UPDATE teams SET assigned_track = ?, state = 'selected' WHERE id = ?", track, submission.team_id);
	await audit(c, "assign_track", "submission", submissionId, { track, by: staff.id });
	return c.json({ ok: true });
});

staffApp.post("/submissions/:id/reviewers", async (c) => {
	const db = getDb(c);
	const staff = requireStaff(c, "submissions");
	const submissionId = c.req.param("id");

	const body = await c.req.json<{ reviewer_ids: unknown }>();
	if (!Array.isArray(body.reviewer_ids)) {
		return c.json({ error: { code: "invalid_ids", message: "reviewer_ids must be an array" } }, 400);
	}

	const submission = await first<{ team_id: string }>(db, "SELECT team_id FROM submissions WHERE id = ?", submissionId);
	if (!submission) return c.json({ error: { code: "not_found", message: "Submission not found" } }, 404);

	for (const reviewerId of body.reviewer_ids) {
		if (typeof reviewerId !== "string") continue;
		const conflict = await first<{ id: string }>(
			db,
			"SELECT id FROM team_members WHERE team_id = ? AND user_id = ?",
			submission.team_id,
			reviewerId,
		);
		if (conflict) {
			return c.json({ error: { code: "conflict", message: "Reviewer cannot be a member of the team" } }, 409);
		}
		const existing = await first<{ id: string }>(
			db,
			"SELECT id FROM review_assignments WHERE submission_id = ? AND reviewer_id = ?",
			submissionId,
			reviewerId,
		);
		if (!existing) {
			await run(
				db,
				"INSERT INTO review_assignments (id, submission_id, reviewer_id, assigned_by, created_at) VALUES (?, ?, ?, ?, ?)",
				newId(),
				submissionId,
				reviewerId,
				staff.id,
				now(),
			);
		}
	}
	await run(db, "UPDATE submissions SET status = 'in_review' WHERE id = ? AND status = 'received'", submissionId);
	await audit(c, "assign_reviewers", "submission", submissionId, { reviewer_ids: body.reviewer_ids });
	return c.json({ ok: true });
});

staffApp.post("/submissions/:id/reviews", async (c) => {
	const db = getDb(c);
	const userId = c.get("userId");
	if (!userId) return c.json({ error: { code: "unauthenticated", message: "Authentication required" } }, 401);

	const submissionId = c.req.param("id");
	const assignment = await first<{ id: string }>(
		db,
		"SELECT id FROM review_assignments WHERE submission_id = ? AND reviewer_id = ?",
		submissionId,
		userId,
	);
	if (!assignment) {
		return c.json({ error: { code: "forbidden", message: "You are not assigned to review this submission" } }, 403);
	}

	const body = await c.req.json<{ score: unknown; notes?: unknown; track_recommendation?: unknown }>();
	const score = typeof body.score === "number" ? body.score : null;
	if (score !== null && (score < 0 || score > 100)) {
		return c.json({ error: { code: "invalid_score", message: "Score must be between 0 and 100" } }, 400);
	}
	const trackRecommendation = isTrack(body.track_recommendation) ? body.track_recommendation : null;
	const existing = await first<{ id: string }>(
		db,
		"SELECT id FROM reviews WHERE submission_id = ? AND reviewer_id = ?",
		submissionId,
		userId,
	);
	if (existing) {
		await run(
			db,
			"UPDATE reviews SET score = ?, notes = ?, track_recommendation = ? WHERE id = ?",
			score,
			body.notes ?? null,
			trackRecommendation,
			existing.id,
		);
	} else {
		await run(
			db,
			"INSERT INTO reviews (id, submission_id, reviewer_id, score, notes, track_recommendation, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
			newId(),
			submissionId,
			userId,
			score,
			body.notes ?? null,
			trackRecommendation,
			now(),
		);
	}

	const totalAssigned = await first<{ count: number }>(
		db,
		"SELECT COUNT(*) as count FROM review_assignments WHERE submission_id = ?",
		submissionId,
	);
	const totalReviews = await first<{ count: number }>(
		db,
		"SELECT COUNT(*) as count FROM reviews WHERE submission_id = ?",
		submissionId,
	);
	if (totalAssigned && totalReviews && totalReviews.count >= totalAssigned.count) {
		await run(db, "UPDATE submissions SET status = 'scored' WHERE id = ? AND status = 'in_review'", submissionId);
	} else {
		await run(db, "UPDATE submissions SET status = 'in_review' WHERE id = ? AND status = 'received'", submissionId);
	}

	return c.json({ ok: true });
});

staffApp.get("/reviews/mine", async (c) => {
	const db = getDb(c);
	const userId = c.get("userId");
	if (!userId) return c.json({ error: { code: "unauthenticated", message: "Authentication required" } }, 401);

	const rows = await all<{
		assignment_id: string;
		submission_id: string;
		title: string;
		team_name: string;
		proposed_track: string;
		status: string;
	}>(
		db,
		"SELECT ra.id as assignment_id, s.id as submission_id, s.title, t.name as team_name, s.proposed_track, s.status FROM review_assignments ra JOIN submissions s ON s.id = ra.submission_id JOIN teams t ON t.id = s.team_id WHERE ra.reviewer_id = ? AND NOT EXISTS (SELECT 1 FROM reviews r WHERE r.submission_id = ra.submission_id AND r.reviewer_id = ra.reviewer_id)",
		userId,
	);
	return c.json({ items: rows });
});

staffApp.post("/imports", async (c) => {
	const db = getDb(c);
	const staff = requireStaff(c, "submissions");
	await assertNotLocked(db);

	const body = await c.req.parseBody({ all: true });
	const file = body.file;
	if (!(file instanceof File)) {
		return c.json({ error: { code: "missing_file", message: "A file is required" } }, 400);
	}

	const importId = newId();
	const ext = file.name.lastIndexOf(".") >= 0 ? file.name.slice(file.name.lastIndexOf(".")) : "";
	const key = `imports/${importId}${ext}`;
	const uploads = getUploads(c);
	await uploads.put(key, file, { httpMetadata: { contentType: file.type || "application/octet-stream" } });

	await run(
		db,
		"INSERT INTO imports (id, source, file_key, status, created_by, created_at) VALUES (?, 'devnovate', ?, 'queued', ?, ?)",
		importId,
		key,
		staff.id,
		now(),
	);

	const queue = getQueue(c);
	await queue.send({ type: "import.process", importId });

	return c.json({ id: importId, status: "queued" }, 201);
});

staffApp.get("/imports/:id", async (c) => {
	const db = getDb(c);
	requireStaff(c, "submissions");
	const importId = c.req.param("id");
	const row = await first<{
		id: string;
		status: string;
		file_key: string;
		stats: string | null;
		created_at: string;
	}>(db, "SELECT id, status, file_key, stats, created_at FROM imports WHERE id = ?", importId);
	if (!row) return c.json({ error: { code: "not_found", message: "Import not found" } }, 404);
	return c.json({ ...row, stats: parseJson(row.stats) });
});

staffApp.get("/forms", async (c) => {
	const db = getDb(c);
	requireStaff(c, "forms");
	const rows = await all<{ id: string; title: string; audience: string; status: string; closes_at: string | null; created_at: string }>(
		db,
		"SELECT id, title, audience, status, closes_at, created_at FROM forms ORDER BY created_at DESC",
	);
	return c.json({ items: rows });
});

staffApp.post("/forms", async (c) => {
	const db = getDb(c);
	const staff = requireStaff(c, "forms");
	await assertNotLocked(db);

	const body = await c.req.json<{ title: unknown; description?: unknown; audience: unknown; fields?: unknown }>();
	const title = requireString(body.title, "title");
	const description = requireStringOptional(body.description, "description");
	const audience = requireString(body.audience, "audience");
	if (audience !== "team" && audience !== "participant") {
		return c.json({ error: { code: "invalid_audience", message: "audience must be team or participant" } }, 400);
	}

	const formId = newId();
	const createdAt = now();
	await run(
		db,
		"INSERT INTO forms (id, title, description, audience, status, created_by, created_at) VALUES (?, ?, ?, ?, 'draft', ?, ?)",
		formId,
		title,
		description,
		audience,
		staff.id,
		createdAt,
	);

	const fields = Array.isArray(body.fields) ? body.fields : [];
	for (let i = 0; i < fields.length; i++) {
		const f = fields[i] as Record<string, unknown>;
		const type = requireString(f.type, "field.type");
		const label = requireString(f.label, "field.label");
		const required = f.required === true ? 1 : 0;
		const config = JSON.stringify(f.config ?? {});
		await run(
			db,
			"INSERT INTO form_fields (id, form_id, position, type, label, required, config) VALUES (?, ?, ?, ?, ?, ?, ?)",
			newId(),
			formId,
			i,
			type,
			label,
			required,
			config,
		);
	}

	await audit(c, "create_form", "form", formId, { title, audience });
	return c.json({ id: formId, title, audience, status: "draft" }, 201);
});

staffApp.get("/forms/:id", async (c) => {
	const db = getDb(c);
	requireStaff(c, "forms");
	const formId = c.req.param("id");
	const form = await first<{
		id: string;
		title: string;
		description: string | null;
		audience: string;
		status: string;
		closes_at: string | null;
		created_at: string;
	}>(db, "SELECT id, title, description, audience, status, closes_at, created_at FROM forms WHERE id = ?", formId);
	if (!form) return c.json({ error: { code: "not_found", message: "Form not found" } }, 404);
	const fields = await all<{ id: string; position: number; type: string; label: string; required: number; config: string }>(
		db,
		"SELECT id, position, type, label, required, config FROM form_fields WHERE form_id = ? ORDER BY position",
		formId,
	);
	return c.json({
		...form,
		fields: fields.map((f) => ({ ...f, required: f.required === 1, config: parseJson(f.config) ?? {} })),
	});
});

staffApp.patch("/forms/:id", async (c) => {
	const db = getDb(c);
	requireStaff(c, "forms");
	await assertNotLocked(db);
	const formId = c.req.param("id");

	const form = await first<{ status: string }>(db, "SELECT status FROM forms WHERE id = ?", formId);
	if (!form) return c.json({ error: { code: "not_found", message: "Form not found" } }, 404);

	const body = await c.req.json<{ title?: unknown; description?: unknown; audience?: unknown; fields?: unknown }>();
	const title = requireStringOptional(body.title, "title");
	const description = requireStringOptional(body.description, "description");
	const audience = typeof body.audience === "string" && (body.audience === "team" || body.audience === "participant") ? body.audience : null;

	if (title || description || audience) {
		await run(
			db,
			"UPDATE forms SET title = COALESCE(?, title), description = COALESCE(?, description), audience = COALESCE(?, audience) WHERE id = ?",
			title,
			description,
			audience,
			formId,
		);
	}

	if (Array.isArray(body.fields)) {
		const responseCount = await first<{ count: number }>(db, "SELECT COUNT(*) as count FROM form_responses WHERE form_id = ?", formId);
		if (responseCount && responseCount.count > 0) {
			return c.json({ error: { code: "has_responses", message: "Cannot edit form fields after responses exist" } }, 409);
		}
		await run(db, "DELETE FROM form_fields WHERE form_id = ?", formId);
		for (let i = 0; i < body.fields.length; i++) {
			const f = body.fields[i] as Record<string, unknown>;
			const type = requireString(f.type, "field.type");
			const label = requireString(f.label, "field.label");
			const required = f.required === true ? 1 : 0;
			const config = JSON.stringify(f.config ?? {});
			await run(
				db,
				"INSERT INTO form_fields (id, form_id, position, type, label, required, config) VALUES (?, ?, ?, ?, ?, ?, ?)",
				newId(),
				formId,
				i,
				type,
				label,
				required,
				config,
			);
		}
	}

	await audit(c, "update_form", "form", formId, { title, description, audience });
	return c.json({ ok: true });
});

staffApp.post("/forms/:id/publish", async (c) => {
	const db = getDb(c);
	requireStaff(c, "forms");
	await assertNotLocked(db);
	const formId = c.req.param("id");

	const form = await first<{ status: string }>(db, "SELECT status FROM forms WHERE id = ?", formId);
	if (!form) return c.json({ error: { code: "not_found", message: "Form not found" } }, 404);
	if (form.status !== "draft") return c.json({ error: { code: "invalid_state", message: "Only draft forms can be published" } }, 409);

	const fields = await all<{ id: string; position: number; type: string; label: string; required: number }>(
		db,
		"SELECT id, position, type, label, required FROM form_fields WHERE form_id = ? ORDER BY position",
		formId,
	);
	const snapshot = fields.map((f) => ({ id: f.id, type: f.type, label: f.label, required: f.required === 1 }));
	await run(
		db,
		"UPDATE forms SET status = 'published', schema_snapshot = ?, published_at = ? WHERE id = ?",
		JSON.stringify(snapshot),
		now(),
		formId,
	);
	return c.json({ ok: true });
});

staffApp.post("/forms/:id/close", async (c) => {
	const db = getDb(c);
	requireStaff(c, "forms");
	await assertNotLocked(db);
	const formId = c.req.param("id");
	const form = await first<{ status: string }>(db, "SELECT status FROM forms WHERE id = ?", formId);
	if (!form) return c.json({ error: { code: "not_found", message: "Form not found" } }, 404);
	await run(db, "UPDATE forms SET status = 'closed', closes_at = ? WHERE id = ?", now(), formId);
	return c.json({ ok: true });
});

staffApp.get("/forms/:id/responses", async (c) => {
	const db = getDb(c);
	requireStaff(c, "forms");
	const formId = c.req.param("id");
	const rows = await all<{
		id: string;
		team_id: string | null;
		user_id: string | null;
		team_name: string | null;
		user_name: string | null;
		payload: string;
		submitted_at: string;
	}>(
		db,
		"SELECT fr.id, fr.team_id, fr.user_id, t.name as team_name, u.full_name as user_name, fr.payload, fr.submitted_at FROM form_responses fr LEFT JOIN teams t ON t.id = fr.team_id LEFT JOIN users u ON u.id = fr.user_id WHERE fr.form_id = ? ORDER BY fr.submitted_at DESC",
		formId,
	);
	return c.json({
		items: rows.map((r) => ({ ...r, payload: parseJson(r.payload) })),
	});
});

staffApp.get("/finance", async (c) => {
	const db = getDb(c);
	requireStaff(c, "finance");
	const rows = await all<{
		id: string;
		title: string;
		raised_by: string;
		payee_name: string;
		upi_id: string;
		amount_paise: number;
		category: string | null;
		status: string;
		created_at: string;
	}>(db, "SELECT * FROM finance_requests ORDER BY created_at DESC");
	const approved = await first<{ total: number }>(
		db,
		"SELECT COALESCE(SUM(amount_paise), 0) as total FROM finance_requests WHERE status = 'approved'",
	);
	const paid = await first<{ total: number }>(
		db,
		"SELECT COALESCE(SUM(amount_paise), 0) as total FROM finance_requests WHERE status = 'paid'",
	);
	return c.json({
		items: rows,
		summary: { approved_paise: approved?.total ?? 0, paid_paise: paid?.total ?? 0 },
	});
});

staffApp.post("/finance", async (c) => {
	const db = getDb(c);
	const staff = requireStaff(c);
	await assertNotLocked(db);

	const body = await c.req.json<{
		title: unknown;
		payee_name: unknown;
		upi_id: unknown;
		amount_paise: unknown;
		category?: unknown;
		notes?: unknown;
	}>();
	const title = requireString(body.title, "title");
	const payeeName = requireString(body.payee_name, "payee_name");
	const upiId = requireString(body.upi_id, "upi_id");
	const amountPaise = requirePositivePaise(body.amount_paise);
	const category = requireStringOptional(body.category, "category");
	const notes = requireStringOptional(body.notes, "notes");

	const id = newId();
	await run(
		db,
		"INSERT INTO finance_requests (id, title, raised_by, payee_name, upi_id, amount_paise, category, notes, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?)",
		id,
		title,
		staff.id,
		payeeName,
		upiId,
		amountPaise,
		category,
		notes,
		now(),
	);
	await audit(c, "create_finance_request", "finance_request", id, { title, amount_paise: amountPaise });
	return c.json({ id }, 201);
});

staffApp.post("/finance/:id/transition", async (c) => {
	const db = getDb(c);
	const staff = requireStaff(c, "finance");
	const requestId = c.req.param("id");

	const body = await c.req.json<{ status: unknown }>();
	const toStatus = requireString(body.status, "status");
	if (!isValidFinanceTransition("pending" as never, toStatus as never) && !isValidFinanceTransition("review" as never, toStatus as never)) {
		return c.json({ error: { code: "invalid_transition", message: "Invalid finance status transition" } }, 400);
	}

	const request = await first<{
		status: string;
		raised_by: string;
		amount_paise: number;
	}>(db, "SELECT status, raised_by, amount_paise FROM finance_requests WHERE id = ?", requestId);
	if (!request) return c.json({ error: { code: "not_found", message: "Finance request not found" } }, 404);

	const fromStatus = request.status as "pending" | "review" | "approved" | "rejected" | "paid";
	if (!isValidFinanceTransition(fromStatus, toStatus as "pending" | "review" | "approved" | "rejected" | "paid")) {
		return c.json({ error: { code: "invalid_transition", message: "Invalid status transition" } }, 409);
	}

	if (request.raised_by === staff.id && (toStatus === "approved" || toStatus === "rejected")) {
		return c.json({ error: { code: "self_approval", message: "You cannot approve or reject your own request" } }, 403);
	}

	await run(
		db,
		"UPDATE finance_requests SET status = ?, decided_by = ?, decided_at = ? WHERE id = ?",
		toStatus,
		staff.id,
		now(),
		requestId,
	);
	await audit(c, "finance_transition", "finance_request", requestId, { from: fromStatus, to: toStatus, by: staff.id });
	return c.json({ ok: true });
});

staffApp.get("/certificates/templates", async (c) => {
	const db = getDb(c);
	requireStaff(c, "certificates");
	const rows = await all<{
		id: string;
		name: string;
		track: string | null;
		kind: string;
		id_prefix: string;
		status: string;
		created_at: string;
	}>(db, "SELECT id, name, track, kind, id_prefix, status, created_at FROM certificate_templates ORDER BY created_at DESC");
	return c.json({ items: rows });
});

staffApp.post("/certificates/templates", async (c) => {
	const db = getDb(c);
	const staff = requireStaff(c, "certificates");
	await assertNotLocked(db);

	const body = await c.req.parseBody({ all: true });
	const name = requireString(body.name, "name");
	const kind = requireString(body.kind, "kind");
	const idPrefix = requireString(body.id_prefix, "id_prefix");
	const nameField = typeof body.name_field === "string" ? body.name_field : "full_name";
	const track = isTrack(body.track) ? body.track : null;

	const templateId = newId();
	let backgroundKey: string | null = null;
	const file = body.file;
	if (file instanceof File) {
		const ext = file.name.lastIndexOf(".") >= 0 ? file.name.slice(file.name.lastIndexOf(".")) : "";
		backgroundKey = `certificate-backgrounds/${templateId}${ext}`;
		const artifacts = getArtifacts(c);
		await artifacts.put(backgroundKey, file, { httpMetadata: { contentType: file.type || "application/octet-stream" } });
	}

	await run(
		db,
		"INSERT INTO certificate_templates (id, name, track, kind, id_prefix, background_key, name_field, status, created_by, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, 'draft', ?, ?)",
		templateId,
		name,
		track,
		kind,
		idPrefix,
		backgroundKey,
		nameField,
		staff.id,
		now(),
	);
	return c.json({ id: templateId, background_key: backgroundKey }, 201);
});

staffApp.get("/certificates/templates/:id", async (c) => {
	const db = getDb(c);
	requireStaff(c, "certificates");
	const templateId = c.req.param("id");
	const row = await first<{
		id: string;
		name: string;
		track: string | null;
		kind: string;
		id_prefix: string;
		background_key: string | null;
		name_field: string;
		status: string;
		created_at: string;
	}>(db, "SELECT * FROM certificate_templates WHERE id = ?", templateId);
	if (!row) return c.json({ error: { code: "not_found", message: "Template not found" } }, 404);
	return c.json(row);
});

staffApp.post("/certificates/templates/:id/publish", async (c) => {
	const db = getDb(c);
	requireStaff(c, "certificates");
	await assertNotLocked(db);
	const templateId = c.req.param("id");
	await run(db, "UPDATE certificate_templates SET status = 'published' WHERE id = ?", templateId);
	return c.json({ ok: true });
});

staffApp.get("/certificates", async (c) => {
	const db = getDb(c);
	requireStaff(c, "certificates");
	const rows = await all<{
		id: string;
		certificate_id: string;
		recipient_name: string;
		template_id: string;
		track: string | null;
		status: string;
		issued_at: string | null;
		created_at: string;
	}>(db, "SELECT * FROM certificates ORDER BY created_at DESC");
	return c.json({ items: rows });
});

staffApp.post("/certificates/issue", async (c) => {
	const db = getDb(c);
	const staff = requireStaff(c, "certificates");
	await assertNotLocked(db);

	const body = await c.req.json<{
		template_id: unknown;
		recipient_ids: unknown;
		recipient_type?: unknown;
	}>();
	const templateId = requireString(body.template_id, "template_id");
	const template = await first<{ id: string; id_prefix: string; kind: string; track: string | null; name_field: string }>(
		db,
		"SELECT id, id_prefix, kind, track, name_field FROM certificate_templates WHERE id = ? AND status = 'published'",
		templateId,
	);
	if (!template) return c.json({ error: { code: "not_found", message: "Published template not found" } }, 404);

	const recipientType = typeof body.recipient_type === "string" ? body.recipient_type : "team";
	if (!Array.isArray(body.recipient_ids)) {
		return c.json({ error: { code: "invalid_recipients", message: "recipient_ids must be an array" } }, 400);
	}

	const counterRow = await first<{ next_seq: number }>(
		db,
		"SELECT next_seq FROM cert_counters WHERE prefix = ?",
		template.id_prefix,
	);
	if (!counterRow) {
		await run(db, "INSERT INTO cert_counters (prefix, next_seq) VALUES (?, 1)", template.id_prefix);
	}

	const createdIds: string[] = [];
	for (const recipientId of body.recipient_ids) {
		if (typeof recipientId !== "string") continue;

		let name: string | null = null;
		let teamId: string | null = null;
		let userId: string | null = null;
		let track = template.track;

		if (recipientType === "team") {
			const team = await first<{ id: string; name: string; assigned_track: string | null }>(
				db,
				"SELECT id, name, assigned_track FROM teams WHERE id = ?",
				recipientId,
			);
			if (!team) continue;
			name = team.name;
			teamId = team.id;
			track = team.assigned_track ?? track;
		} else {
			const user = await first<{ id: string; full_name: string | null }>(db, "SELECT id, full_name FROM users WHERE id = ?", recipientId);
			if (!user) continue;
			name = user.full_name ?? "Participant";
			userId = user.id;
		}

		await run(db, "UPDATE cert_counters SET next_seq = next_seq + 1 WHERE prefix = ?", template.id_prefix);
		const next = await first<{ next_seq: number }>(db, "SELECT next_seq FROM cert_counters WHERE prefix = ?", template.id_prefix);
		const seq = next?.next_seq ?? 1;
		const certificateId = `${template.id_prefix}-${String(seq).padStart(4, "0")}`;

		const id = newId();
		await run(
			db,
			"INSERT OR IGNORE INTO certificates (id, certificate_id, template_id, recipient_name, team_id, user_id, track, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', ?)",
			id,
			certificateId,
			templateId,
			name,
			teamId,
			userId,
			track,
			now(),
		);
		createdIds.push(id);
	}

	if (createdIds.length > 0) {
		const queue = getQueue(c);
		await queue.send({ type: "cert.generate", certificateIds: createdIds });
	}

	await audit(c, "issue_certificates", "certificate", templateId, { count: createdIds.length, by: staff.id });
	return c.json({ ids: createdIds, count: createdIds.length }, 201);
});

staffApp.post("/certificates/:id/revoke", async (c) => {
	const db = getDb(c);
	const staff = requireStaff(c, "certificates");
	const certId = c.req.param("id");

	const cert = await first<{ status: string; file_key: string | null }>(db, "SELECT status, file_key FROM certificates WHERE id = ?", certId);
	if (!cert) return c.json({ error: { code: "not_found", message: "Certificate not found" } }, 404);

	await run(db, "UPDATE certificates SET status = 'revoked', revoke_reason = 'staff_revoke' WHERE id = ?", certId);
	if (cert.file_key) {
		const artifacts = getArtifacts(c);
		await artifacts.delete(cert.file_key);
	}
	await audit(c, "revoke_certificate", "certificate", certId, { by: staff.id });
	return c.json({ ok: true });
});

staffApp.get("/members", async (c) => {
	const db = getDb(c);
	requireStaff(c);
	const rows = await all<{
		id: string;
		user_id: string;
		full_name: string | null;
		email: string;
		role: string;
		permissions: string;
		status: string;
		created_at: string;
	}>(
		db,
		"SELECT sm.id, sm.user_id, u.full_name, u.email, sm.role, sm.permissions, sm.status, sm.created_at FROM staff_members sm JOIN users u ON u.id = sm.user_id ORDER BY sm.created_at DESC",
	);
	return c.json({
		items: rows.map((r) => ({ ...r, permissions: parseJson<string[]>(r.permissions) ?? [] })),
	});
});

staffApp.get("/invitations", async (c) => {
	const db = getDb(c);
	requireStaff(c);
	const rows = await all<{
		id: string;
		email: string;
		role: string;
		permissions: string;
		clerk_invitation_id: string | null;
		status: string;
		created_at: string;
	}>(db, "SELECT * FROM staff_invitations ORDER BY created_at DESC");
	return c.json({
		items: rows.map((r) => ({ ...r, permissions: parseJson<string[]>(r.permissions) ?? [] })),
	});
});

staffApp.post("/invitations", async (c) => {
	const db = getDb(c);
	const staff = requireStaff(c);
	await assertNotLocked(db);

	const body = await c.req.json<{ email: unknown; role: unknown; permissions?: unknown }>();
	const email = requireEmail(body.email);
	const role = requireStaffRole(body.role);
	const permissions = requireArrayOfStrings(body.permissions ?? [], "permissions");

	const existing = await first<{ id: string }>(
		db,
		"SELECT id FROM staff_invitations WHERE email = ? AND status = 'pending'",
		email,
	);
	if (existing) {
		return c.json({ error: { code: "duplicate_invite", message: "A pending invitation already exists for this email" } }, 409);
	}

	const inviteId = newId();
	await run(
		db,
		"INSERT INTO staff_invitations (id, email, role, permissions, status, created_by, created_at) VALUES (?, ?, ?, ?, 'pending', ?, ?)",
		inviteId,
		email,
		role,
		JSON.stringify(permissions),
		staff.id,
		now(),
	);

	const secretKey = getSecret(c.env, "CLERK_SECRET_KEY");
	const orgId = getSecret(c.env, "CLERK_ORG_ID");
	if (secretKey && orgId) {
		try {
			const clerk = createClerkClient({ secretKey });
			const invitation = await clerk.organizations.createOrganizationInvitation({
				organizationId: orgId,
				emailAddress: email,
				role: "basic_member",
				inviterUserId: staff.user_id,
			});
			if (invitation.id) {
				await run(db, "UPDATE staff_invitations SET clerk_invitation_id = ? WHERE id = ?", invitation.id, inviteId);
			}
		} catch (error) {
			const message = error instanceof Error ? error.message : "clerk_invite_failed";
			return c.json({ error: { code: "clerk_invite_failed", message }, id: inviteId }, 502);
		}
	}

	await audit(c, "invite_staff", "staff_invitation", inviteId, { email, role });
	return c.json({ id: inviteId }, 201);
});

staffApp.post("/invitations/:id/revoke", async (c) => {
	const db = getDb(c);
	const staff = requireStaff(c);
	const inviteId = c.req.param("id");
	await assertNotLocked(db);

	const invite = await first<{
		id: string;
		clerk_invitation_id: string | null;
		email: string;
	}>(db, "SELECT id, clerk_invitation_id, email FROM staff_invitations WHERE id = ? AND status = 'pending'", inviteId);
	if (!invite) return c.json({ error: { code: "not_found", message: "Pending invitation not found" } }, 404);

	const secretKey = getSecret(c.env, "CLERK_SECRET_KEY");
	const orgId = getSecret(c.env, "CLERK_ORG_ID");
	if (secretKey && orgId && invite.clerk_invitation_id) {
		try {
			const clerk = createClerkClient({ secretKey });
			await clerk.organizations.revokeOrganizationInvitation({
				organizationId: orgId,
				invitationId: invite.clerk_invitation_id,
				requestingUserId: staff.user_id,
			});
		} catch {
			// proceed to mark revoked locally even if Clerk call fails
		}
	}

	await run(db, "UPDATE staff_invitations SET status = 'revoked' WHERE id = ?", inviteId);
	await audit(c, "revoke_invitation", "staff_invitation", inviteId, { email: invite.email });
	return c.json({ ok: true });
});

staffApp.patch("/members/:id", async (c) => {
	const db = getDb(c);
	requireMasterAdmin(c);
	const memberId = c.req.param("id");
	await assertNotLocked(db);

	const body = await c.req.json<{ role?: unknown; permissions?: unknown; status?: unknown }>();
	const member = await first<{ id: string; role: string; status: string; user_id: string }>(
		db,
		"SELECT id, role, status, user_id FROM staff_members WHERE id = ?",
		memberId,
	);
	if (!member) return c.json({ error: { code: "not_found", message: "Member not found" } }, 404);

	const newRole = typeof body.role === "string" ? body.role : member.role;
	const newPermissions = Array.isArray(body.permissions) ? JSON.stringify(body.permissions) : null;
	const newStatus = typeof body.status === "string" ? body.status : member.status;

	if (member.role === "master_admin" && newStatus !== "active") {
		const count = await first<{ total: number }>(
			db,
			"SELECT COUNT(*) as total FROM staff_members WHERE role = 'master_admin' AND status = 'active'",
		);
		if (count && count.total <= 1) {
			return c.json({ error: { code: "last_master_admin", message: "Cannot deactivate the last master admin" } }, 409);
		}
	}

	await run(
		db,
		"UPDATE staff_members SET role = ?, permissions = COALESCE(?, permissions), status = ? WHERE id = ?",
		newRole,
		newPermissions,
		newStatus,
		memberId,
	);
	await audit(c, "update_staff_member", "staff_member", memberId, { role: newRole, status: newStatus });
	return c.json({ ok: true });
});

staffApp.get("/settings", async (c) => {
	const db = getDb(c);
	requireStaff(c);
	const rows = await all<{ key: string; value: string }>(db, "SELECT key, value FROM settings ORDER BY key");
	const settings: Record<string, unknown> = {};
	for (const row of rows) {
		settings[row.key] = parseJson(row.value) ?? row.value;
	}
	return c.json(settings);
});

staffApp.patch("/settings", async (c) => {
	const db = getDb(c);
	requireMasterAdmin(c);

	const body = (await c.req.json()) as Record<string, unknown>;
	const currentlyLocked = await isDeploymentLocked(db);

	for (const [key, value] of Object.entries(body)) {
		if (key === "deployment_lock") {
			const locked = value === true || value === "true";
			await run(db, "INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)", key, JSON.stringify(locked));
			continue;
		}
		if (currentlyLocked) {
			return c.json({ error: { code: "deployment_locked", message: "Cannot change settings while deployment is locked" } }, 423);
		}
		if (key === "budget_total_paise") {
			const paise = typeof value === "number" && Number.isInteger(value) && value >= 0 ? value : 0;
			await run(db, "INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)", key, JSON.stringify(paise));
		} else if (key === "registration_closes_at") {
			const valid = value === null || (typeof value === "string" && !Number.isNaN(new Date(value).getTime()));
			if (!valid) {
				return c.json({ error: { code: "invalid_value", message: `${key} must be an ISO date or null` } }, 400);
			}
			await run(db, "INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)", key, JSON.stringify(value));
		} else {
			await run(db, "INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)", key, JSON.stringify(value));
		}
	}

	await audit(c, "update_settings", "settings", "all", body);
	return c.json({ ok: true });
});

export default staffApp;
