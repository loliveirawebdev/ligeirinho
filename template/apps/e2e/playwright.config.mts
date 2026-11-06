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
      // Its own configuration, so Nx runs it next to a `make preview` already serving web:serve:development.
      command: `pnpm exec nx run web:serve:e2e --port=${webPort}`,
      cwd: '../..',
      url: `http://localhost:${webPort}`,
      reuseExistingServer: false,
      timeout: 180_000,
    },
  ],
});
