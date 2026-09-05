import { describe, expect, it } from "vitest";
import { arrayBufferToBase64, formatRupees, normalizeHeader, parseCsv, parseJson, safeParseInt } from "../worker/lib/utils";

describe("utils", () => {
	it("parseJson returns parsed object or null", () => {
		expect(parseJson('{"a":1}')).toEqual({ a: 1 });
		expect(parseJson(null)).toBeNull();
		expect(parseJson("invalid")).toBeNull();
	});

	it("safeParseInt handles numbers and strings", () => {
		expect(safeParseInt(42.9)).toBe(42);
		expect(safeParseInt("17")).toBe(17);
		expect(safeParseInt("not a number")).toBeNull();
	});

	it("formatRupees converts paise to rupees", () => {
		expect(formatRupees(12500)).toBe("₹125.00");
	});

	it("arrayBufferToBase64 encodes bytes", () => {
		const buffer = new TextEncoder().encode("hi").buffer;
		expect(arrayBufferToBase64(buffer)).toBe("aGk=");
	});

	it("parseCsv splits comma-separated values and quotes", () => {
		const { headers, rows } = parseCsv('Team,Title,Track\n"Team A","Hello, world",RESEARCH');
		expect(headers).toEqual(["team", "title", "track"]);
		expect(rows).toEqual([["Team A", "Hello, world", "RESEARCH"]]);
	});

	it("normalizeHeader lowers and strips punctuation", () => {
		expect(normalizeHeader("Team Name")).toBe("team name");
		expect(normalizeHeader("Member-1")).toBe("member 1");
	});
});
