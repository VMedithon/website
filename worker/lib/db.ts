import { HTTPException } from "hono/http-exception";
import type { Context } from "hono";
import type { AppEnv } from "../types";

export function getDb(c: Context<AppEnv>): D1Database {
	const db = c.env.DB;
	if (!db) {
		throw new HTTPException(500, { message: "database not bound" });
	}
	return db;
}

export function prepared(db: D1Database, query: string, ...values: unknown[]): D1PreparedStatement {
	return db.prepare(query).bind(...values);
}

export async function first<T extends Record<string, unknown>>(db: D1Database, query: string, ...values: unknown[]): Promise<T | null> {
	return db.prepare(query).bind(...values).first<T>();
}

export async function all<T extends Record<string, unknown>>(db: D1Database, query: string, ...values: unknown[]): Promise<T[]> {
	const result = await db.prepare(query).bind(...values).all<T>();
	return result.results;
}

export async function run<T extends Record<string, unknown>>(db: D1Database, query: string, ...values: unknown[]): Promise<D1Result<T>> {
	return db.prepare(query).bind(...values).run<T>();
}

export async function tx(db: D1Database, statements: D1PreparedStatement[]): Promise<D1Result<Record<string, unknown>>[]> {
	return db.batch(statements);
}
