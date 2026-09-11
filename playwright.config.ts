import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  testMatch: '*.spec.ts',
  fullyParallel: true,
  workers: 2,
  reporter: 'list',
  use: { baseURL: 'http://localhost:4174', trace: 'retain-on-failure', screenshot: 'on' },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'bun run dev --config vite.test.config.ts --host 127.0.0.1 --port 4174 --strictPort',
    url: 'http://localhost:4174',
    reuseExistingServer: false,
  },
});
