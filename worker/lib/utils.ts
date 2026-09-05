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

function parseCsvLine(line: string): string[] {
	const result: string[] = [];
	let current = "";
	let inQuotes = false;
	for (let i = 0; i < line.length; i++) {
		const char = line[i] as string;
		if (inQuotes) {
			if (char === '"') {
				if ((line[i + 1] as string) === '"') {
					current += '"';
					i++;
				} else {
					inQuotes = false;
				}
			} else {
				current += char;
			}
		} else if (char === '"') {
			inQuotes = true;
		} else if (char === ',') {
			result.push(current.trim());
			current = "";
		} else {
			current += char;
		}
	}
	result.push(current.trim());
	return result;
}

export function parseCsv(text: string): { headers: string[]; rows: string[][] } {
	const lines = text.split(/\r?\n/).filter((line) => line.trim() !== "");
	if (lines.length === 0) return { headers: [], rows: [] };
	const headers = parseCsvLine(lines[0] as string);
	const rows = lines.slice(1).map((line) => parseCsvLine(line));
	return { headers: headers.map((h) => h.toLowerCase().trim()), rows };
}

export function normalizeHeader(header: string): string {
	return header.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim().replace(/\s+/g, " ");
}
