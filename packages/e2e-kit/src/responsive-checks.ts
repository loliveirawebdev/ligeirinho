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
  /** Path of the previewer workbench, relative to `baseURL`. */
  readonly previewPath: string;
  /** Widths to check at, each at `height`. Named `responsive 390px light`. */
  readonly widths?: readonly number[];
  /** Exact sizes to check at (a phone in portrait and landscape, say). Named `responsive 390x844 light`. */
  readonly viewports?: readonly ResponsiveViewport[];
  readonly themes: readonly PreviewTheme[];
  /** Viewport height for `widths`. Default 900. */
  readonly height?: number;
  /** Your own extended `test` (fixtures, auth). Default: Playwright's `test`. */
  readonly test?: TestType<TestArgs, WorkerArgs>;
}

export interface ResponsiveViewport {
  readonly width: number;
  readonly height: number;
}

type ResponsiveSettings = Omit<ResponsiveChecksOptions<{ page: Page }, object>, 'test'>;

interface CheckedViewport extends ResponsiveViewport {
  /** `390px` for a width, `390x844` for an exact viewport. */
  readonly name: string;
}

interface ScenarioToCheck {
  readonly url: string;
  readonly label: string;
}

const DEFAULT_HEIGHT = 900;
const BASE_TIMEOUT_MS = 30_000;
const TIMEOUT_PER_SCENARIO_MS = 10_000;
const RENDER_STATE_ATTRIBUTE = 'data-ligeirinho-preview';
const RENDER_ERROR_ATTRIBUTE = 'data-ligeirinho-preview-error';
const RENDER_MARKER = `html[${RENDER_STATE_ATTRIBUTE}]`;

/**
 * Declares one test per (width or viewport, theme). Each test reads the previewer's scenario list and opens every
 * scenario on its own render page, one at a time, after its `play` steps ran. Soft assertions report every problem
 * in a single run: a failed play, horizontal scroll, clickables out of view, touch targets under 44 × 44 px and
 * WCAG 2.1 A/AA axe violations.
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
  for (const viewport of checkedViewports(settings)) {
    for (const theme of settings.themes) {
      test(`responsive ${viewport.name} ${theme}`, async ({ page }) => {
        await checkEveryScenario(page, settings, viewport, theme);
      });
    }
  }
}

function checkedViewports(settings: ResponsiveSettings): CheckedViewport[] {
  const height = settings.height ?? DEFAULT_HEIGHT;
  const fromWidths = (settings.widths ?? []).map((width) => ({ width, height, name: `${width}px` }));
  const exact = (settings.viewports ?? []).map((viewport) => ({
    ...viewport,
    name: `${viewport.width}x${viewport.height}`,
  }));
  const viewports = [...fromWidths, ...exact];
  if (viewports.length === 0) {
    throw new Error('responsiveChecks needs at least one entry in `widths` or `viewports`.');
  }
  return viewports;
}

async function checkEveryScenario(
  page: Page,
  options: ResponsiveSettings,
  viewport: CheckedViewport,
  theme: PreviewTheme,
): Promise<void> {
  const scenarios = await listScenarios(page, options.previewPath, viewport.name, theme);
  if (scenarios.length === 0) {
    playwrightTest.info().annotations.push({ type: 'no-scenarios', description: `${options.previewPath} lists no scenarios` });
    return;
  }
  playwrightTest.setTimeout(BASE_TIMEOUT_MS + scenarios.length * TIMEOUT_PER_SCENARIO_MS);
  await page.setViewportSize({ width: viewport.width, height: viewport.height });
  await page.emulateMedia({ colorScheme: theme });
  for (const scenario of scenarios) {
    await playwrightTest.step(scenario.label, () => checkScenario(page, scenario));
  }
}

async function listScenarios(
  page: Page,
  previewPath: string,
  viewportName: string,
  theme: PreviewTheme,
): Promise<ScenarioToCheck[]> {
  const manifest = await readPreviewManifest(page, previewPath);
  return manifest.entries.flatMap((entry) =>
    entry.scenarios.map((scenarioName) => ({
      url: buildRenderUrl(manifest.basePath, entry.id, scenarioName, theme),
      label: `${entry.id}/${scenarioName} ${viewportName} ${theme}`,
    })),
  );
}

async function checkScenario(page: Page, scenario: ScenarioToCheck): Promise<void> {
  await page.goto(scenario.url);
  await page.locator(RENDER_MARKER).waitFor({ state: 'attached' });
  const renderState = await page.locator('html').getAttribute(RENDER_STATE_ATTRIBUTE);
  if (renderState === 'play-failed') {
    // The view is on screen, so the checks below still run on whatever state the play left it in.
    const playError = await page.locator('html').getAttribute(RENDER_ERROR_ATTRIBUTE);
    expect.soft(renderState, `[${scenario.label}] play failed: ${playError ?? 'no message'}`).toBe('rendered');
  } else {
    expect.soft(renderState, `[${scenario.label}] the previewer could not render this scenario`).toBe('rendered');
    if (renderState !== 'rendered') {
      return;
    }
  }
  await page.evaluate(() => document.fonts.ready.then(() => undefined));
  await checkNoHorizontalScroll(page, scenario.label);
  await checkClickablesInView(page, scenario.label);
  await checkTouchTargetSize(page, scenario.label);
  await checkAccessibility(page, scenario.label);
}
