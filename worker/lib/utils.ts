export function now(): string {
	return new Date().toISOString();
}

export function newId(): string {
	return crypto.randomUUID();
}

export function errorResponse(code: string, message: string, status: number): Response {
	return Response.json({ error: { code, message } }, { status });
}

export function jsonResponse<T>(data: T, status = 200): Response {
	return Response.json(data, { status });
}

export function parseJson<T = unknown>(text: string | null | undefined): T | null {
	if (!text) return null;
	try {
		return JSON.parse(text) as T;
	} catch {
		return null;
	}
}

export function safeParseInt(value: unknown): number | null {
	if (typeof value === "number" && Number.isFinite(value)) return Math.floor(value);
	if (typeof value === "string") {
		const parsed = Number.parseInt(value, 10);
		if (!Number.isNaN(parsed)) return parsed;
	}
	return null;
}

export function formatRupees(paise: number): string {
	return `₹${(paise / 100).toFixed(2)}`;
}

export function arrayBufferToBase64(buffer: ArrayBuffer): string {
	const bytes = new Uint8Array(buffer);
	let binary = "";
	for (let i = 0; i < bytes.length; i++) {
		binary += String.fromCharCode(bytes[i] as number);
	}
	return btoa(binary);
}
