import type { D1Database } from "@cloudflare/workers-types";
import { newId, now } from "./utils";

export async function writeAuditLog(
	db: D1Database,
	actorUserId: string,
	action: string,
	entityType: string,
	entityId: string,
	diff: Record<string, unknown>,
): Promise<void> {
	await db
		.prepare(
			"INSERT INTO audit_log (id, actor_user_id, action, entity_type, entity_id, diff, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
		)
		.bind(newId(), actorUserId, action, entityType, entityId, JSON.stringify(diff), now())
		.run();
}
