import { first, run } from "./lib/db";

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

	const template = await first<{ name_field: string; kind: string }>(
		db,
		"SELECT name_field, kind FROM certificate_templates WHERE id = ?",
		cert.template_id,
	);

	const event = first<{ value: string }>(db, "SELECT value FROM settings WHERE key = 'event_meta'");
	const eventName = event.then((r) => {
		try {
			return r?.value ? (JSON.parse(r.value) as { name?: string }).name ?? "VMEDITHON 2026" : "VMEDITHON 2026";
		} catch {
			return "VMEDITHON 2026";
		}
	});

	const name = cert.recipient_name;
	const track = cert.track ?? "";
	const ev = await eventName;
	const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600">
  <rect width="800" height="600" fill="#f8f9fa" />
  <rect x="20" y="20" width="760" height="560" fill="none" stroke="#1a3a5c" stroke-width="4" />
  <text x="400" y="120" text-anchor="middle" font-size="32" fill="#1a3a5c" font-family="serif">Certificate of ${template?.kind ?? "Participation"}</text>
  <text x="400" y="220" text-anchor="middle" font-size="24" fill="#333">This certifies that</text>
  <text x="400" y="300" text-anchor="middle" font-size="40" fill="#000" font-weight="bold">${name}</text>
  <text x="400" y="380" text-anchor="middle" font-size="22" fill="#333">participated in ${ev}</text>
  <text x="400" y="440" text-anchor="middle" font-size="20" fill="#555">Track: ${track}</text>
  <text x="400" y="520" text-anchor="middle" font-size="16" fill="#777">ID: ${cert.certificate_id}</text>
</svg>`;

	const key = `certificates/${cert.certificate_id}.svg`;
	await artifacts.put(key, new TextEncoder().encode(svg), { httpMetadata: { contentType: "image/svg+xml" } });
	await run(db, "UPDATE certificates SET status = 'issued', file_key = ?, issued_at = ? WHERE id = ?", key, new Date().toISOString(), cert.id);
}

async function processImport(env: Env, importId: string): Promise<void> {
	const db = getEnvBinding<D1Database>(env, "DB");
	if (!db) return;
	await run(db, "UPDATE imports SET status = 'processing' WHERE id = ?", importId);
	// Devnovate import logic left as a concrete follow-up once the CSV contract is final.
	await run(db, "UPDATE imports SET status = 'done', stats = ? WHERE id = ?", JSON.stringify({ processed: 0 }), importId);
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
