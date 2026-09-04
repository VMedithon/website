import { Hono } from "hono";
import type { AppEnv } from "../types";
import { first, getDb } from "../lib/db";
import { parseJson } from "../lib/utils";

const publicApp = new Hono<AppEnv>();

publicApp.get("/health", (c) => {
	return c.json({ ok: true });
});

publicApp.get("/public/certificates/:certificate_id", async (c) => {
	const certificateId = c.req.param("certificate_id");
	const db = getDb(c);
	const cert = await first<{
		certificate_id: string;
		recipient_name: string;
		track: string | null;
		status: "pending" | "issued" | "revoked";
		issued_at: string | null;
	}>(
		db,
		"SELECT certificate_id, recipient_name, track, status, issued_at FROM certificates WHERE certificate_id = ?",
		certificateId,
	);
	if (!cert) {
		return c.json({ error: { code: "not_found", message: "Certificate not found" } }, 404);
	}

	const settingsRow = await first<{ value: string }>(db, "SELECT value FROM settings WHERE key = 'event_meta'");
	const eventMeta = parseJson<{ name?: string }>(settingsRow?.value) ?? { name: "VMEDITHON 2026" };

	return c.json({
		status: cert.status,
		recipient_name: cert.recipient_name,
		track: cert.track,
		event_name: eventMeta.name,
		issued_at: cert.issued_at,
	});
});

export default publicApp;
