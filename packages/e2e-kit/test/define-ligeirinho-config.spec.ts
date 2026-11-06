import { expect, test } from '@playwright/test';
import { defineLigeirinhoConfig } from '../src/index.js';

function withCi<T>(ciValue: string, build: () => T): T {
  const previousCi = process.env['CI'];
  process.env['CI'] = ciValue;
  try {
    return build();
  } finally {
    if (previousCi === undefined) {
      delete process.env['CI'];
    } else {
      process.env['CI'] = previousCi;
    }
  }
}

test('local defaults: parallel, trace on failure, no retries, list reporter, chromium', () => {
  const config = withCi('', () => defineLigeirinhoConfig({ testDir: './src', baseURL: 'http://localhost:4200' }));

  expect(config).toMatchObject({
    testDir: './src',
    fullyParallel: true,
    forbidOnly: false,
    retries: 0,
    reporter: 'list',
    use: { baseURL: 'http://localhost:4200', trace: 'retain-on-failure', testIdAttribute: 'data-testid' },
  });
  expect(config.projects?.map((project) => project.name)).toEqual(['chromium']);
});

test('CI defaults: forbid only, one retry, list and html reporters', () => {
  const config = withCi('true', () => defineLigeirinhoConfig({ testDir: './src' }));

  expect(config).toMatchObject({
    forbidOnly: true,
    retries: 1,
    reporter: [['list'], ['html', { open: 'never' }]],
  });
});

test('user options override the defaults and use is merged', () => {
  const config = withCi('', () =>
    defineLigeirinhoConfig({
      testDir: './e2e',
      baseURL: 'http://localhost:4200',
      retries: 3,
      use: { trace: 'on', locale: 'pt-BR' },
    }),
  );

  expect(config).toMatchObject({
    retries: 3,
    use: { baseURL: 'http://localhost:4200', trace: 'on', locale: 'pt-BR', testIdAttribute: 'data-testid' },
  });
});
