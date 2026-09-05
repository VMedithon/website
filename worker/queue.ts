import { first, run } from "./lib/db";
import { isTrack } from "./lib/state";
import { arrayBufferToBase64, newId, normalizeHeader, now, parseCsv, parseJson } from "./lib/utils";

function getEnvBinding<T>(env: Env, name: keyof Env): T | undefined {
	return (env as unknown as Record<string, T | undefined>)[name as string];
}

async function generateCertificate(env: Env, certificateId: string): Promise<void> {
	const db = getEnvBinding<D1Database>(env, "DB");
	const artifacts = getEnvBinding<R2Bucket>(env, "ARTIFACTS");
	if (!db || !artifacts) return;

	const cert = await first<{
		id: string;
		certificate_id: string;
		recipient_name: string;
		template_id: string;
		track: string | null;
	}>(
		db,
		"SELECT id, certificate_id, recipient_name, template_id, track FROM certificates WHERE id = ? AND status = 'pending'",
		certificateId,
	);
	if (!cert) return;

	const template = await first<{ name_field: string; kind: string; background_key: string | null }>(
		db,
		"SELECT name_field, kind, background_key FROM certificate_templates WHERE id = ?",
		cert.template_id,
	);

	const settingsRow = await first<{ value: string }>(db, "SELECT value FROM settings WHERE key = 'event_meta'");
	let eventName = "VMEDITHON 2026";
	if (settingsRow?.value) {
		eventName = parseJson<{ name?: string }>(settingsRow.value)?.name ?? "VMEDITHON 2026";
	}

	const name = cert.recipient_name;
	const track = cert.track ?? "";
	let backgroundImage = "";
	if (template?.background_key) {
		const object = await artifacts.get(template.background_key);
		if (object) {
			const buffer = await object.arrayBuffer();
			const mime = object.httpMetadata?.contentType ?? "image/png";
			backgroundImage = `<image href="data:${mime};base64,${arrayBufferToBase64(buffer)}" x="0" y="0" width="800" height="600" preserveAspectRatio="xMidYMid slice" />`;
		}
	}

	const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600">
  ${backgroundImage}
  <rect width="800" height="600" fill="${backgroundImage ? "none" : "#f8f9fa"}" />
  <rect x="20" y="20" width="760" height="560" fill="none" stroke="#1a3a5c" stroke-width="4" />
  <text x="400" y="120" text-anchor="middle" font-size="32" fill="#1a3a5c" font-family="serif">Certificate of ${template?.kind ?? "Participation"}</text>
  <text x="400" y="220" text-anchor="middle" font-size="24" fill="#333">This certifies that</text>
  <text x="400" y="300" text-anchor="middle" font-size="40" fill="#000" font-weight="bold">${name}</text>
  <text x="400" y="380" text-anchor="middle" font-size="22" fill="#333">participated in ${eventName}</text>
  <text x="400" y="440" text-anchor="middle" font-size="20" fill="#555">Track: ${track}</text>
  <text x="400" y="520" text-anchor="middle" font-size="16" fill="#777">ID: ${cert.certificate_id}</text>
</svg>`;

	const key = `certificates/${cert.certificate_id}.svg`;
	await artifacts.put(key, new TextEncoder().encode(svg), { httpMetadata: { contentType: "image/svg+xml" } });
	await run(db, "UPDATE certificates SET status = 'issued', file_key = ?, issued_at = ? WHERE id = ?", key, now(), cert.id);
}

const TEAM_NAME_SYNONYMS = ["team name", "team", "group", "teamname"];
const TITLE_SYNONYMS = ["title", "idea", "project title", "pitch title", "idea title"];
const TRACK_SYNONYMS = ["track", "category", "domain"];
const MEMBERS_SYNONYMS = ["members", "emails", "teammates", "team members"];
const NAMES_SYNONYMS = ["names", "member names", "team names"];

function findColumn(headers: string[], synonyms: string[]): number {
	for (const syn of synonyms) {
		const idx = headers.findIndex((h) => normalizeHeader(h) === normalizeHeader(syn));
		if (idx >= 0) return idx;
	}
	return -1;
}

function findMemberColumns(headers: string[]): number[] {
	const indices: number[] = [];
	for (let i = 0; i < headers.length; i++) {
		const h = normalizeHeader(headers[i] as string);
		if (/^(member|email|teammate)\s*\d+$/.test(h) || /^(member|email)\d+$/.test(h)) {
			indices.push(i);
		}
	}
	return indices.sort((a, b) => a - b);
}

function splitMembers(value: string): string[] {
	return value.split(/[,;]/).map((s) => s.trim()).filter((s) => s.length > 0);
}

async function processImport(env: Env, importId: string): Promise<void> {
	const db = getEnvBinding<D1Database>(env, "DB");
	const uploads = getEnvBinding<R2Bucket>(env, "UPLOADS");
	if (!db || !uploads) return;

	const importRow = await first<{ file_key: string; created_by: string }>(
		db,
		"SELECT file_key, created_by FROM imports WHERE id = ?",
		importId,
	);
	if (!importRow) return;

	await run(db, "UPDATE imports SET status = 'processing' WHERE id = ?", importId);

	const object = await uploads.get(importRow.file_key);
	if (!object) {
		await run(db, "UPDATE imports SET status = 'failed', stats = ? WHERE id = ?", JSON.stringify({ error: "file not found" }), importId);
		return;
	}

	const text = await object.text();
	const { headers, rows } = parseCsv(text);
	const teamNameIdx = findColumn(headers, TEAM_NAME_SYNONYMS);
	const titleIdx = findColumn(headers, TITLE_SYNONYMS);
	const trackIdx = findColumn(headers, TRACK_SYNONYMS);
	const membersIdx = findColumn(headers, MEMBERS_SYNONYMS);
	const namesIdx = findColumn(headers, NAMES_SYNONYMS);
	const memberCols = findMemberColumns(headers);

	if (teamNameIdx < 0 || (membersIdx < 0 && memberCols.length === 0)) {
		await run(
			db,
			"UPDATE imports SET status = 'failed', stats = ? WHERE id = ?",
			JSON.stringify({ error: "missing team name or member columns" }),
			importId,
		);
		return;
	}

	let teamsCreated = 0;
	let submissionsCreated = 0;
	let usersCreated = 0;
	const errors: string[] = [];

	for (let i = 0; i < rows.length; i++) {
		const row = rows[i] as string[];
		const teamName = row[teamNameIdx]?.trim();
		if (!teamName) continue;

		const title = titleIdx >= 0 ? (row[titleIdx] as string).trim() : teamName;
		const rawTrack = trackIdx >= 0 ? (row[trackIdx] as string).trim().toUpperCase() : "";
		const track = isTrack(rawTrack) ? rawTrack : "RESEARCH";

		let emails: string[] = [];
		if (membersIdx >= 0) {
			emails = splitMembers(row[membersIdx] as string);
		} else {
			emails = memberCols.map((idx) => (row[idx] as string).trim()).filter(Boolean);
		}
		if (emails.length === 0) {
			errors.push(`row ${i + 1}: no members`);
			continue;
		}

		const names: string[] = namesIdx >= 0 ? splitMembers(row[namesIdx] as string) : [];

		const teamId = newId();
		const createdAt = now();
		const userIds: string[] = [];
		for (let j = 0; j < emails.length; j++) {
			const email = emails[j] as string;
			const existing = await first<{ id: string }>(db, "SELECT id FROM users WHERE email = ?", email);
			if (existing) {
				userIds.push(existing.id);
			} else {
				const userId = newId();
				const fullName = names[j]?.trim() || null;
				await run(db, "INSERT INTO users (id, email, full_name, created_at, updated_at) VALUES (?, ?, ?, ?, ?)", userId, email, fullName, createdAt, createdAt);
				userIds.push(userId);
				usersCreated++;
			}
		}

		const leadId = userIds[0] as string;
		await run(
			db,
			"INSERT INTO teams (id, name, lead_user_id, state, proposed_track, created_at, updated_at) VALUES (?, ?, ?, 'registered', ?, ?, ?)",
			teamId,
			teamName,
			leadId,
			track,
			createdAt,
			createdAt,
		);
		teamsCreated++;

		for (let j = 0; j < userIds.length; j++) {
			const userId = userIds[j] as string;
			const email = emails[j] as string;
			const displayName = names[j]?.trim() || null;
			await run(
				db,
				"INSERT INTO team_members (id, team_id, user_id, email, display_name) VALUES (?, ?, ?, ?, ?)",
				newId(),
				teamId,
				userId,
				email,
				displayName,
			);
		}

		await run(
			db,
			"INSERT INTO submissions (id, team_id, round, kind, title, proposed_track, status, import_id, created_at) VALUES (?, ?, ?, 'pitch', ?, ?, 'received', ?, ?)",
			newId(),
			teamId,
			1,
			title,
			track,
			importId,
			createdAt,
		);
		submissionsCreated++;
	}

	const stats = { teams: teamsCreated, submissions: submissionsCreated, users: usersCreated, errors };
	await run(db, "UPDATE imports SET status = 'done', stats = ? WHERE id = ?", JSON.stringify(stats), importId);
}

export async function queueHandler(batch: MessageBatch, env: Env): Promise<void> {
	for (const msg of batch.messages) {
		const body = msg.body as Record<string, unknown>;
		if (body.type === "cert.generate" && Array.isArray(body.certificateIds)) {
			for (const id of body.certificateIds) {
				if (typeof id === "string") {
					await generateCertificate(env, id);
				}
			}
		} else if (body.type === "import.process" && typeof body.importId === "string") {
			await processImport(env, body.importId);
		}
	}
}
