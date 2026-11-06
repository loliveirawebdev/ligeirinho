import { defineConfig, devices } from '@playwright/test';

const demoPort = 4310;

export default defineConfig({
  testDir: './test/smoke',
  fullyParallel: true,
  forbidOnly: Boolean(process.env['CI']),
  reporter: 'list',
  use: {
    baseURL: `http://localhost:${demoPort}`,
    trace: 'retain-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: `node demo/serve-static.ts ${demoPort}`,
    url: `http://localhost:${demoPort}/__preview`,
    reuseExistingServer: !process.env['CI'],
  },
});
