import { expect, test } from "playwright/test";

test("landing page loads with event title", async ({ page }) => {
	await page.goto("/");
	await expect(page).toHaveTitle(/VMEDITHON 2026/);
	await expect(page.getByText("VMEDITHON").first()).toBeVisible();
});

test("public health endpoint returns ok", async ({ request }) => {
	const res = await request.get("/api/health");
	expect(res.ok()).toBe(true);
	await expect(res.json()).resolves.toEqual({ ok: true });
});

test("verify page shows certificate details", async ({ page }) => {
	await page.goto("/");
	await page.getByText("Verify certificate").first().click();
	await page.getByLabel("Certificate ID").fill("VMT26-R-0001");
	await page.getByRole("button", { name: "Verify certificate" }).click();
	await expect(page.getByText("Verified")).toBeVisible({ timeout: 10000 });
	await expect(page.getByText("Alice")).toBeVisible();
});
