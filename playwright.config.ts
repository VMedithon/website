import { defineConfig, devices } from "playwright/test";

const executablePath = process.env.PLAYWRIGHT_EXECUTABLE_PATH ?? "/opt/brave-origin-bin/brave";

export default defineConfig({
	testDir: "./e2e",
	fullyParallel: true,
	forbidOnly: !!process.env.CI,
	retries: process.env.CI ? 2 : 0,
	workers: process.env.CI ? 1 : undefined,
	reporter: "list",
	use: {
		baseURL: "http://localhost:8787",
		trace: "on-first-retry",
	},
	projects: [
		{
			name: "brave",
			use: {
				...devices["Desktop Chrome"],
				launchOptions: {
					executablePath,
					args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-gpu", "--disable-dev-shm-usage"],
				},
			},
		},
	],
	webServer: {
		command: "bunx wrangler d1 execute vmedithon --local --yes --file ./e2e/seed.sql && bun run build && bunx wrangler dev --local --port 8787",
		url: "http://localhost:8787/api/health",
		timeout: 180_000,
		reuseExistingServer: !process.env.CI,
	},
});
