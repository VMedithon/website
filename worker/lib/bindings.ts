import { HTTPException } from "hono/http-exception";
import type { Context } from "hono";
import type { AppEnv } from "../types";

export function getUploads(c: Context<AppEnv>): R2Bucket {
	const bucket = c.env.UPLOADS;
	if (!bucket) {
		throw new HTTPException(500, { message: "uploads bucket not bound" });
	}
	return bucket;
}

export function getArtifacts(c: Context<AppEnv>): R2Bucket {
	const bucket = c.env.ARTIFACTS;
	if (!bucket) {
		throw new HTTPException(500, { message: "artifacts bucket not bound" });
	}
	return bucket;
}

export function getQueue(c: Context<AppEnv>): Queue {
	const queue = c.env.JOBS;
	if (!queue) {
		throw new HTTPException(500, { message: "jobs queue not bound" });
	}
	return queue;
}
