import { describe, expect, it } from "vitest";
import { HTTPException } from "hono/http-exception";
import { requirePositivePaise, requireString, requireTeamName, requireTrack } from "../worker/lib/validation";

describe("validation", () => {
	it("requireString returns non-empty strings", () => {
		expect(requireString("hello", "field")).toBe("hello");
	});

	it("requireString throws for empty or non-strings", () => {
		expect(() => requireString("", "field")).toThrow(HTTPException);
		expect(() => requireString(123, "field")).toThrow(HTTPException);
	});

	it("requireTrack validates tracks", () => {
		expect(requireTrack("INDUSTRY")).toBe("INDUSTRY");
		expect(() => requireTrack("INVALID")).toThrow(HTTPException);
	});

	it("requirePositivePaise accepts positive integers", () => {
		expect(requirePositivePaise(1000)).toBe(1000);
		expect(() => requirePositivePaise(0)).toThrow(HTTPException);
		expect(() => requirePositivePaise(1.5)).toThrow(HTTPException);
	});

	it("requireTeamName enforces length", () => {
		expect(requireTeamName("Alpha")).toBe("Alpha");
		expect(() => requireTeamName("a".repeat(81))).toThrow(HTTPException);
	});
});
