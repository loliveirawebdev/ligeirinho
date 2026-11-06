import { devices } from '@playwright/test';
import { defineLigeirinhoConfig } from './src/index.js';

const demoPort = 4320;

export default defineLigeirinhoConfig({
  testDir: './test',
  testIgnore: ['**/fake-previewer/**'],
  projects: [
    {
      name: 'kit',
      testIgnore: ['**/previewer-demo.spec.ts', '**/fake-previewer/**'],
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'previewer-demo',
      testMatch: ['**/previewer-demo.spec.ts'],
      use: { ...devices['Desktop Chrome'], baseURL: `http://localhost:${demoPort}` },
    },
  ],
  webServer: {
    // Builds @ligeirinho/previewer and its demo app, then serves the demo.
    command: [
      'pnpm --filter @ligeirinho/previewer run build',
      'pnpm --filter @ligeirinho/previewer run demo:build',
      `node ../previewer/demo/serve-static.ts ${demoPort}`,
    ].join(' && '),
    url: `http://localhost:${demoPort}/__preview`,
    reuseExistingServer: !process.env['CI'],
    timeout: 240_000,
  },
});
