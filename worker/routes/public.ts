import { Hono } from "hono";
import type { AppEnv } from "../types";
import { first, getDb } from "../lib/db";
import { parseJson } from "../lib/utils";

const publicApp = new Hono<AppEnv>();

publicApp.get("/health", (c) => {
	return c.json({ ok: true });
});

async function signPayload(secret: string, payload: string): Promise<string> {
	const encoder = new TextEncoder();
	const key = await crypto.subtle.importKey(
		"raw",
		encoder.encode(secret),
		{ name: "HMAC", hash: "SHA-256" },
		false,
		["sign"],
	);
	const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(payload));
	return Array.from(new Uint8Array(signature))
		.map((b) => b.toString(16).padStart(2, "0"))
		.join("");
}

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

	const payload = {
		certificate_id: cert.certificate_id,
		recipient_name: cert.recipient_name,
		track: cert.track,
		event_name: eventMeta.name,
		issued_at: cert.issued_at,
	};

	const payloadString = JSON.stringify(payload);
	const secret = c.env.CERTIFICATE_SIGNING_SECRET;
	const signature = secret ? await signPayload(secret, payloadString) : null;

	return c.json({
		status: cert.status,
		recipient_name: cert.recipient_name,
		track: cert.track,
		event_name: eventMeta.name,
		issued_at: cert.issued_at,
		signature,
	});
});

export default publicApp;
