import { HTTPException } from "hono/http-exception";
import { isStaffRole, isTrack } from "./state";

export function requireString(value: unknown, field: string): string {
	if (typeof value !== "string" || value.length === 0) {
		throw new HTTPException(400, { message: `${field} is required` });
	}
	return value;
}

export function requireStringOptional(value: unknown, field: string): string | null {
	if (value === undefined || value === null) return null;
	if (typeof value !== "string") {
		throw new HTTPException(400, { message: `${field} must be a string` });
	}
	return value.length > 0 ? value : null;
}

export function requireEmail(value: unknown, field = "email"): string {
	const str = requireString(value, field);
	if (!str.includes("@")) {
		throw new HTTPException(400, { message: `${field} is invalid` });
	}
	return str;
}

export function requireTrack(value: unknown, field = "track"): "RESEARCH" | "INDUSTRY" | "PROJECT" {
	if (!isTrack(value)) {
		throw new HTTPException(400, { message: `${field} must be one of RESEARCH, INDUSTRY, PROJECT` });
	}
	return value;
}

export function requireStaffRole(value: unknown, field = "role"): string {
	if (!isStaffRole(value)) {
		throw new HTTPException(400, { message: `${field} must be a staff role` });
	}
	return value;
}

export function requirePositivePaise(value: unknown, field = "amount_paise"): number {
	if (typeof value !== "number" || !Number.isInteger(value) || value <= 0) {
		throw new HTTPException(400, { message: `${field} must be a positive integer in paise` });
	}
	return value;
}

export function requireArrayOfStrings(value: unknown, field = "permissions"): string[] {
	if (!Array.isArray(value)) {
		throw new HTTPException(400, { message: `${field} must be an array` });
	}
	for (const item of value) {
		if (typeof item !== "string") {
			throw new HTTPException(400, { message: `${field} must contain only strings` });
		}
	}
	return value;
}

export function requireInteger(value: unknown, field: string): number {
	if (typeof value !== "number" || !Number.isInteger(value)) {
		throw new HTTPException(400, { message: `${field} must be an integer` });
	}
	return value;
}

export function requireTeamName(value: unknown): string {
	const str = requireString(value, "name");
	if (str.length > 80) {
		throw new HTTPException(400, { message: "name must be 80 characters or less" });
	}
	return str;
}

export function requireTeamSize(members: unknown): void {
	if (!Array.isArray(members)) {
		throw new HTTPException(400, { message: "members must be an array" });
	}
	if (members.length < 1 || members.length > 5) {
		throw new HTTPException(400, { message: "team size must be between 1 and 5" });
	}
}
