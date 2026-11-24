import { type Page, type TestType, expect, test as playwrightTest } from '@playwright/test';
import { checkAccessibility } from './checks/accessibility.js';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { checkClickablesInView } from './checks/clickables-in-view.js';
import { checkIconsRendered } from './checks/icons-rendered.js';
import { checkNoHorizontalScroll } from './checks/no-horizontal-scroll.js';
import { checkTouchTargetSize } from './checks/touch-target-size.js';
import { type PreviewManifest, type PreviewTheme, buildRenderUrl, readPreviewManifest } from './preview-manifest.js';

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
  /**
   * Saves a full-page screenshot of every scenario here, as `<entry>/<scenario>-<viewport>-<theme>.png`, for the
   * visual review (rules/design.md "The review"). Default: none.
   */
  readonly screenshotsDir?: string;
  /**
   * Only these entries (ids, `task-list`); the rest are skipped. The `LIGEIRINHO_PREVIEW_ENTRIES` environment
   * variable, comma separated, wins over it, so a gate can check only the screens a change touched (empty: none).
   * Default: every entry.
   */
  readonly entries?: readonly string[];
  /**
   * Splits each (viewport, theme) run into this many tests by entry, so workers share the work, a failure points
   * at a smaller group and a retry reruns only it. Named `responsive 390px light (1 of 4)`. Default 4.
   */
  readonly groups?: number;
  /**
   * Where axe runs: at the first viewport only (default; its rules hardly change with the width, the contrast
   * changes with the theme, and both themes are checked) or at every viewport.
   */
  readonly accessibility?: 'first-viewport' | 'every-viewport';
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

/** One test's share: a viewport, a theme and every `count`-th entry from `index`. */
interface CheckedRun {
  readonly viewport: CheckedViewport;
  readonly theme: PreviewTheme;
  readonly group: { readonly index: number; readonly count: number };
  readonly withAccessibility: boolean;
}

interface ScenarioToCheck {
  readonly url: string;
  readonly label: string;
  /** Where its screenshot goes, relative to `screenshotsDir`. */
  readonly screenshotPath: string;
}

const DEFAULT_HEIGHT = 900;
const DEFAULT_GROUPS = 4;
const ENTRIES_VARIABLE = 'LIGEIRINHO_PREVIEW_ENTRIES';

/** The scenario list, read once per worker for each spec (every group of a run asks for it). */
const manifests = new Map<string, Promise<PreviewManifest>>();

function readManifestOnce(page: Page, previewPath: string): Promise<PreviewManifest> {
  // The tests are declared in this module, so `info().file` is ours; the first title names the calling spec.
  const key = `${playwrightTest.info().titlePath[0] ?? ''}|${previewPath}`;
  const known = manifests.get(key);
  if (known !== undefined) {
    return known;
  }
  const reading = readPreviewManifest(page, previewPath);
  manifests.set(key, reading);
  // A failed read is retried by the next test instead of failing every one of them.
  reading.catch(() => manifests.delete(key));
  return reading;
}
const BASE_TIMEOUT_MS = 30_000;
const TIMEOUT_PER_SCENARIO_MS = 10_000;
const RENDER_STATE_ATTRIBUTE = 'data-ligeirinho-preview';
const RENDER_ERROR_ATTRIBUTE = 'data-ligeirinho-preview-error';
const RENDER_MARKER = `html[${RENDER_STATE_ATTRIBUTE}]`;

/**
 * Declares `groups` tests per (width or viewport, theme). Each test reads the previewer's scenario list, takes its
 * share of the entries and opens every scenario on its own render page, one at a time, after its `play` steps ran.
 * Soft assertions report every problem in a single run: a failed play, horizontal scroll, clickables out of view,
 * touch targets under 40 × 40 px, icons drawn as text and WCAG 2.1 A/AA axe violations (at the first viewport, unless
 * `accessibility: 'every-viewport'`). With `screenshotsDir`, it also saves a screenshot of each one.
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
  for (const run of checkedRuns(settings)) {
    const groupName = run.group.count > 1 ? ` (${run.group.index + 1} of ${run.group.count})` : '';
    test(`responsive ${run.viewport.name} ${run.theme}${groupName}`, async ({ page }) => {
      await checkEveryScenario(page, settings, run);
    });
  }
}

function checkedRuns(settings: ResponsiveSettings): CheckedRun[] {
  const count = groupCount(settings.groups);
  const everyViewport = settings.accessibility === 'every-viewport';
  return checkedViewports(settings).flatMap((viewport, viewportIndex) =>
    settings.themes.flatMap((theme) =>
      Array.from({ length: count }, (_, index) => ({
        viewport,
        theme,
        group: { index, count },
        withAccessibility: everyViewport || viewportIndex === 0,
      })),
    ),
  );
}

function groupCount(groups: number | undefined): number {
  if (groups === undefined) {
    return DEFAULT_GROUPS;
  }
  if (!Number.isInteger(groups) || groups < 1) {
    throw new Error(`responsiveChecks: groups must be a whole number from 1, got ${String(groups)}.`);
  }
  return groups;
}

/** The entries to check: the environment variable, then `entries`; undefined for every entry. */
function chosenEntries(settings: ResponsiveSettings): ReadonlySet<string> | undefined {
  const fromEnvironment = process.env[ENTRIES_VARIABLE];
  if (fromEnvironment !== undefined) {
    return new Set(
      fromEnvironment
        .split(',')
        .map((entryId) => entryId.trim())
        .filter((entryId) => entryId.length > 0),
    );
  }
  return settings.entries === undefined ? undefined : new Set(settings.entries);
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

async function checkEveryScenario(page: Page, options: ResponsiveSettings, run: CheckedRun): Promise<void> {
  const { viewport, theme } = run;
  const { scenarios, listed } = await listScenarios(page, options, run);
  if (listed === 0) {
    playwrightTest.info().annotations.push({ type: 'no-scenarios', description: `${options.previewPath} lists no scenarios` });
    return;
  }
  if (scenarios.length === 0) {
    playwrightTest.info().annotations.push({ type: 'no-scenarios', description: 'none of the chosen entries in this group' });
    return;
  }
  playwrightTest.setTimeout(BASE_TIMEOUT_MS + scenarios.length * TIMEOUT_PER_SCENARIO_MS);
  await page.setViewportSize({ width: viewport.width, height: viewport.height });
  await page.emulateMedia({ colorScheme: theme });
  for (const scenario of scenarios) {
    await playwrightTest.step(scenario.label, () =>
      checkScenario(page, scenario, { screenshotsDir: options.screenshotsDir, withAccessibility: run.withAccessibility }),
    );
  }
}

async function listScenarios(
  page: Page,
  options: ResponsiveSettings,
  run: CheckedRun,
): Promise<{ readonly scenarios: ScenarioToCheck[]; readonly listed: number }> {
  const manifest = await readManifestOnce(page, options.previewPath);
  const chosen = chosenEntries(options);
  const viewportName = run.viewport.name;
  const theme = run.theme;
  const scenarios = manifest.entries
    .filter((entry) => chosen === undefined || chosen.has(entry.id))
    .filter((_, entryIndex) => entryIndex % run.group.count === run.group.index)
    .flatMap((entry) =>
      entry.scenarios.map((scenarioName) => ({
        url: buildRenderUrl(manifest.basePath, entry.id, scenarioName, theme),
        label: `${entry.id}/${scenarioName} ${viewportName} ${theme}`,
        screenshotPath: path.join(entry.id, `${scenarioName}-${viewportName}-${theme}.png`),
      })),
    );
  return { scenarios, listed: manifest.entries.length };
}

async function checkScenario(
  page: Page,
  scenario: ScenarioToCheck,
  { screenshotsDir, withAccessibility }: { readonly screenshotsDir: string | undefined; readonly withAccessibility: boolean },
): Promise<void> {
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
  await checkIconsRendered(page, scenario.label);
  if (withAccessibility) {
    await checkAccessibility(page, scenario.label);
  }
  if (screenshotsDir !== undefined) {
    await saveScreenshot(page, path.join(screenshotsDir, scenario.screenshotPath));
  }
}

async function saveScreenshot(page: Page, filePath: string): Promise<void> {
  await mkdir(path.dirname(filePath), { recursive: true });
  await page.screenshot({ path: filePath, fullPage: true, animations: 'disabled' });
}
