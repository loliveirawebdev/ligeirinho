import { type PlaywrightTestConfig, defineConfig, devices } from '@playwright/test';

export interface LigeirinhoConfigOptions extends PlaywrightTestConfig {
  /** Shorthand for `use.baseURL`. */
  readonly baseURL?: string;
}

/**
 * The ligeirinho Playwright defaults: fully parallel, trace kept on failure, no `.only` and one retry on CI,
 * list reporter (plus html on CI), Chromium. Every option given here overrides the default; `use` is merged.
 */
export function defineLigeirinhoConfig(options: LigeirinhoConfigOptions): PlaywrightTestConfig {
  const isCi = Boolean(process.env['CI']);
  const { baseURL, use, ...overrides } = options;
  return defineConfig({
    fullyParallel: true,
    forbidOnly: isCi,
    retries: isCi ? 1 : 0,
    reporter: isCi ? [['list'], ['html', { open: 'never' }]] : 'list',
    projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
    ...overrides,
    use: {
      trace: 'retain-on-failure',
      testIdAttribute: 'data-testid',
      ...(baseURL === undefined ? {} : { baseURL }),
      ...use,
    },
  });
}
