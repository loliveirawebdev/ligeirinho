import { type Page, type TestType, expect, test as playwrightTest } from '@playwright/test';
import { checkAccessibility } from './checks/accessibility.js';
import { checkClickablesInView } from './checks/clickables-in-view.js';
import { checkNoHorizontalScroll } from './checks/no-horizontal-scroll.js';
import { checkTouchTargetSize } from './checks/touch-target-size.js';
import { type PreviewTheme, buildRenderUrl, readPreviewManifest } from './preview-manifest.js';

export interface ResponsiveChecksOptions<
  TestArgs extends { page: Page } = { page: Page },
  WorkerArgs extends object = object,
> {
  /** Path of the previewer grid, relative to `baseURL`. */
  readonly previewPath: string;
  readonly widths: readonly number[];
  readonly themes: readonly PreviewTheme[];
  /** Viewport height while checking. Default 900. */
  readonly height?: number;
  /** Your own extended `test` (fixtures, auth). Default: Playwright's `test`. */
  readonly test?: TestType<TestArgs, WorkerArgs>;
}

type ResponsiveSettings = Omit<ResponsiveChecksOptions<{ page: Page }, object>, 'test'>;

interface ScenarioToCheck {
  readonly url: string;
  readonly label: string;
}

const DEFAULT_HEIGHT = 900;
const BASE_TIMEOUT_MS = 30_000;
const TIMEOUT_PER_SCENARIO_MS = 10_000;
const RENDER_MARKER = 'html[data-ligeirinho-preview]';

/**
 * Declares one test per (width, theme). Each test reads the previewer's scenario list and checks every scenario,
 * with soft assertions so a single run reports every problem: no horizontal scroll, clickables in view, touch
 * targets of at least 44 × 44 px and no WCAG 2.1 A/AA axe violations.
 */
export function responsiveChecks<TestArgs extends { page: Page }, WorkerArgs extends object>(
  options: ResponsiveChecksOptions<TestArgs, WorkerArgs>,
): void {
  if (options.test === undefined) {
    declareResponsiveTests(playwrightTest, options);
    return;
  }
  declareResponsiveTests(options.test, options);
}

function declareResponsiveTests<TestArgs extends { page: Page }, WorkerArgs extends object>(
  test: TestType<TestArgs, WorkerArgs>,
  settings: ResponsiveSettings,
): void {
  for (const width of settings.widths) {
    for (const theme of settings.themes) {
      test(`responsive ${width}px ${theme}`, async ({ page }) => {
        await checkEveryScenario(page, settings, width, theme);
      });
    }
  }
}

async function checkEveryScenario(
  page: Page,
  options: ResponsiveSettings,
  width: number,
  theme: PreviewTheme,
): Promise<void> {
  const scenarios = await listScenarios(page, options.previewPath, width, theme);
  if (scenarios.length === 0) {
    playwrightTest.info().annotations.push({ type: 'no-scenarios', description: `${options.previewPath} lists no scenarios` });
    return;
  }
  playwrightTest.setTimeout(BASE_TIMEOUT_MS + scenarios.length * TIMEOUT_PER_SCENARIO_MS);
  await page.setViewportSize({ width, height: options.height ?? DEFAULT_HEIGHT });
  await page.emulateMedia({ colorScheme: theme });
  for (const scenario of scenarios) {
    await playwrightTest.step(scenario.label, () => checkScenario(page, scenario));
  }
}

async function listScenarios(
  page: Page,
  previewPath: string,
  width: number,
  theme: PreviewTheme,
): Promise<ScenarioToCheck[]> {
  const manifest = await readPreviewManifest(page, previewPath);
  return manifest.entries.flatMap((entry) =>
    entry.scenarios.map((scenarioName) => ({
      url: buildRenderUrl(manifest.basePath, entry.id, scenarioName, theme),
      label: `${entry.id}/${scenarioName} ${width}px ${theme}`,
    })),
  );
}

async function checkScenario(page: Page, scenario: ScenarioToCheck): Promise<void> {
  await page.goto(scenario.url);
  await page.locator(RENDER_MARKER).waitFor({ state: 'attached' });
  const renderState = await page.locator('html').getAttribute('data-ligeirinho-preview');
  expect.soft(renderState, `[${scenario.label}] the previewer could not render this scenario`).toBe('rendered');
  if (renderState !== 'rendered') {
    return;
  }
  await page.evaluate(() => document.fonts.ready.then(() => undefined));
  await checkNoHorizontalScroll(page, scenario.label);
  await checkClickablesInView(page, scenario.label);
  await checkTouchTargetSize(page, scenario.label);
  await checkAccessibility(page, scenario.label);
}
