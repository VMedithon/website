import { verifyWebhook } from "@clerk/backend/webhooks";
import { Hono } from "hono";
import type { AppEnv } from "../types";
import { first, getDb, run } from "../lib/db";
import { getSecret } from "../lib/auth";
import { newId, now } from "../lib/utils";

const webhookApp = new Hono<AppEnv>();

type ClerkEmail = { id?: string; email_address?: string };

type ClerkUserData = Record<string, unknown> & {
	id?: string;
	email_addresses?: ClerkEmail[];
	primary_email_address_id?: string;
	first_name?: string;
	last_name?: string;
	full_name?: string;
	public_user_data?: { user_id?: string };
};

function extractPrimaryEmail(data: ClerkUserData): string | undefined {
	if (!Array.isArray(data.email_addresses)) return undefined;
	const primary = data.email_addresses.find((e) => e.id === data.primary_email_address_id) ?? data.email_addresses[0];
	return primary?.email_address;
}

function extractFullName(data: ClerkUserData): string | null {
	if (typeof data.full_name === "string" && data.full_name) return data.full_name;
	const first = typeof data.first_name === "string" ? data.first_name : "";
	const last = typeof data.last_name === "string" ? data.last_name : "";
	return first || last ? `${first} ${last}`.trim() : null;
}

webhookApp.post("/clerk", async (c) => {
	const db = getDb(c);
	const svixId = c.req.header("svix-id") ?? c.req.header("webhook-id");
	if (!svixId) {
		return c.json({ error: { code: "missing_id", message: "Missing webhook id header" } }, 400);
	}

	const existing = await first<{ svix_id: string }>(db, "SELECT svix_id FROM webhook_events WHERE svix_id = ?", svixId);
	if (existing) {
		return c.json({ ok: true });
	}

	const signingSecret = getSecret(c.env, "CLERK_WEBHOOK_SIGNING_SECRET");
	if (!signingSecret) {
		return c.json({ error: { code: "missing_secret", message: "Webhook signing secret not configured" } }, 500);
	}

	let event: { type: string; data: ClerkUserData };
	try {
		event = (await verifyWebhook(c.req.raw, { signingSecret })) as unknown as {
			type: string;
			data: ClerkUserData;
		};
	} catch (error) {
		const message = error instanceof Error ? error.message : "verification failed";
		return c.json({ error: { code: "invalid_signature", message } }, 400);
	}

	const receivedAt = now();
	await run(db, "INSERT INTO webhook_events (svix_id, type, received_at) VALUES (?, ?, ?)", svixId, event.type, receivedAt);

	const { type, data } = event;
	const userId = data.id;

	if ((type === "user.created" || type === "user.updated") && userId) {
		const email = extractPrimaryEmail(data);
		const fullName = extractFullName(data);
		if (email) {
			const existingUser = await first<{ id: string }>(db, "SELECT id FROM users WHERE id = ?", userId);
			const updatedAt = now();
			if (existingUser) {
				await run(
					db,
					"UPDATE users SET email = ?, full_name = ?, updated_at = ? WHERE id = ?",
					email,
					fullName,
					updatedAt,
					userId,
				);
			} else {
				await run(
					db,
					"INSERT INTO users (id, email, full_name, created_at, updated_at) VALUES (?, ?, ?, ?, ?)",
					userId,
					email,
					fullName,
					updatedAt,
					updatedAt,
				);
			}
		}
	} else if (type === "user.deleted" && userId) {
		await run(db, "UPDATE users SET email = 'deleted:' || id, full_name = NULL, updated_at = ? WHERE id = ?", now(), userId);
		await run(db, "UPDATE staff_members SET status = 'deactivated' WHERE user_id = ?", userId);
	} else if (type === "organizationInvitation.accepted" && typeof data.id === "string") {
		const invite = await first<{
			id: string;
			role: string;
			permissions: string;
			email: string;
		}>(
			db,
			"SELECT id, role, permissions, email FROM staff_invitations WHERE clerk_invitation_id = ? AND status = 'pending'",
			data.id,
		);
		if (invite) {
			let acceptedUserId = data.public_user_data?.user_id;
			if (!acceptedUserId) {
				const user = await first<{ id: string }>(db, "SELECT id FROM users WHERE email = ?", invite.email);
				acceptedUserId = user?.id;
			}
			const createdAt = now();
			if (acceptedUserId) {
				const invitedBy = await first<{ created_by: string }>(db, "SELECT created_by FROM staff_invitations WHERE id = ?", invite.id);
				await run(
					db,
					"INSERT OR REPLACE INTO staff_members (id, user_id, role, permissions, status, invited_by, created_at, activated_at) VALUES (?, ?, ?, ?, 'active', ?, ?, ?)",
					newId(),
					acceptedUserId,
					invite.role,
					invite.permissions,
					invitedBy?.created_by,
					createdAt,
					createdAt,
				);
			}
			await run(db, "UPDATE staff_invitations SET status = 'accepted' WHERE id = ?", invite.id);
		}
	} else if (type === "organizationInvitation.revoked" && typeof data.id === "string") {
		await run(db, "UPDATE staff_invitations SET status = 'revoked' WHERE clerk_invitation_id = ?", data.id);
	} else if (type === "organizationMembership.deleted" && userId) {
		await run(db, "UPDATE staff_members SET status = 'deactivated' WHERE user_id = ?", userId);
	}

	await run(db, "UPDATE webhook_events SET processed_at = ? WHERE svix_id = ?", now(), svixId);

	return c.json({ ok: true });
});

export default webhookApp;
