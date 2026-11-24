import { defineLigeirinhoConfig } from '@ligeirinho/e2e-kit';

// Runs inside the toolbox against the whole stack: real web, real API, real (clean) test database.
const webPort = 4300;
const apiPort = 3300;

export default defineLigeirinhoConfig({
  testDir: './src',
  // Each responsive test loads every scenario from the dev server; more browsers than this starve the toolbox.
  workers: 2,
  baseURL: process.env['E2E_BASE_URL'] ?? `http://localhost:${webPort}`,
  webServer: [
    {
      command: `node dist/apps/api/main.js`,
      cwd: '../..',
      url: `http://localhost:${apiPort}/health`,
      reuseExistingServer: false,
      env: {
        PORT: String(apiPort),
        DATABASE_URL: process.env['TEST_DATABASE_URL'] ?? '',
        WEB_ORIGIN: `http://localhost:${webPort}`,
        TOKEN_SECRET: process.env['TOKEN_SECRET'] ?? '',
        TOKEN_ISSUER: process.env['TOKEN_ISSUER'] ?? '',
        TOKEN_AUDIENCE: process.env['TOKEN_AUDIENCE'] ?? '',
      },
    },
    {
      // The development build (the previewer only exists in dev mode), from the Nx cache when the app didn't change,
      // served with /api proxied to the e2e API: no dev server compiling the app on every run.
      command: [
        'pnpm exec nx run web:build:development',
        `pnpm exec tsx tools/serve-e2e-web.ts dist/apps/web-development/browser ${webPort} http://localhost:${apiPort}`,
      ].join(' && '),
      cwd: '../..',
      url: `http://localhost:${webPort}`,
      reuseExistingServer: false,
      timeout: 180_000,
    },
  ],
});
