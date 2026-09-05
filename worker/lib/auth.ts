import { createClerkClient, verifyToken } from "@clerk/backend";
import { HTTPException } from "hono/http-exception";
import type { Context } from "hono";
import type { AppEnv } from "../types";
import { first, getDb, run } from "./db";
import { now } from "./utils";

export interface StaffAuth {
	id: string;
	user_id: string;
	role: string;
	permissions: string[];
	status: string;
}

export function getSecret(env: Env, name: string): string | undefined {
	return (env as unknown as Record<string, string | undefined>)[name];
}

export async function resolveUser(
	db: D1Database,
	secretKey: string | undefined,
	clerkUserId: string,
): Promise<{ id: string; email: string; full_name: string | null } | null> {
	const row = await first<{ id: string; email: string; full_name: string | null }>(
		db,
		"SELECT id, email, full_name FROM users WHERE id = ?",
		clerkUserId,
	);
	if (row) return row;
	if (!secretKey) return null;
	try {
		const clerk = createClerkClient({ secretKey });
		const user = await clerk.users.getUser(clerkUserId);
		const email = user.primaryEmailAddress?.emailAddress ?? user.emailAddresses[0]?.emailAddress ?? "";
		const firstName = user.firstName ?? null;
		const lastName = user.lastName ?? null;
		const fullName =
			user.fullName ?? (firstName && lastName ? `${firstName} ${lastName}` : firstName) ?? null;
		if (!email) return null;
		const created = now();
		await run(
			db,
			"INSERT OR IGNORE INTO users (id, email, full_name, created_at, updated_at) VALUES (?, ?, ?, ?, ?)",
			clerkUserId,
			email,
			fullName,
			created,
			created,
		);
		return { id: clerkUserId, email, full_name: fullName };
	} catch {
		return null;
	}
}

export async function resolveStaff(db: D1Database, userId: string): Promise<StaffAuth | null> {
	const row = await first<{ id: string; user_id: string; role: string; permissions: string; status: string }>(
		db,
		"SELECT id, user_id, role, permissions, status FROM staff_members WHERE user_id = ?",
		userId,
	);
	if (row?.status !== "active") return null;
	let permissions: string[] = [];
	try {
		permissions = JSON.parse(row.permissions) as string[];
	} catch {
		permissions = [];
	}
	return { id: row.id, user_id: row.user_id, role: row.role, permissions, status: row.status };
}

export async function requireUser(c: Context<AppEnv>): Promise<string> {
	const userId = c.get("userId");
	if (!userId) {
		throw new HTTPException(401, { message: "unauthenticated" });
	}
	return userId;
}

export function requireStaff(c: Context<AppEnv>, module?: string): StaffAuth {
	const staff = c.get("staff");
	if (!staff) {
		throw new HTTPException(403, { message: "unauthorized" });
	}
	if (
		module &&
		staff.role !== "master_admin" &&
		staff.role !== "faculty_coordinator" &&
		!staff.permissions.includes(module)
	) {
		throw new HTTPException(403, { message: "forbidden" });
	}
	return staff;
}

export function requireMasterAdmin(c: Context<AppEnv>): StaffAuth {
	const staff = requireStaff(c);
	if (staff.role !== "master_admin") {
		throw new HTTPException(403, { message: "forbidden" });
	}
	return staff;
}

export function authMiddleware() {
	return async (c: Context<AppEnv>, next: () => Promise<void>) => {
		c.set("userId", null);
		c.set("staff", null);
		c.set("userEmail", null);
		c.set("userName", null);

		const db = getDb(c);
		const authHeader = c.req.header("Authorization");
		if (!authHeader?.startsWith("Bearer ")) {
			return await next();
		}

		const token = authHeader.slice(7).trim();
		const secretKey = getSecret(c.env, "CLERK_SECRET_KEY");
		if (!secretKey) {
			return await next();
		}

		let payload: { sub?: string } | undefined;
		try {
			const verified = (await verifyToken(token, { secretKey })) as unknown;
			if (typeof verified === "object" && verified !== null) {
				if ("data" in verified) {
					payload = (verified as { data?: { sub?: string } }).data;
				} else {
					payload = verified as { sub?: string };
				}
			}
		} catch {
			return await next();
		}

		if (!payload?.sub) {
			return await next();
		}

		const userId = payload.sub;
		const user = await resolveUser(db, secretKey, userId);
		if (user) {
			c.set("userId", user.id);
			c.set("userEmail", user.email);
			c.set("userName", user.full_name);
		}

		const staff = await resolveStaff(db, userId);
		if (staff) {
			c.set("staff", staff);
		}

		return await next();
	};
}
