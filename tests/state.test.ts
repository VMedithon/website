import { describe, expect, it } from "vitest";
import { isValidFinanceTransition } from "../worker/lib/state";

describe("finance state machine", () => {
	it("allows pending to approved", () => {
		expect(isValidFinanceTransition("pending", "approved")).toBe(true);
	});

	it("rejects self-approval path from paid to pending", () => {
		expect(isValidFinanceTransition("paid", "pending")).toBe(false);
	});
});
