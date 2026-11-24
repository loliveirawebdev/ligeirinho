import { execFile } from 'node:child_process';
import { existsSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { promisify } from 'node:util';
import { expect, test } from '@playwright/test';

const runFile = promisify(execFile);
const playwrightCli = createRequire(import.meta.url).resolve('@playwright/test/cli');
const fakePreviewerConfig = path.join(import.meta.dirname, 'fake-previewer', 'playwright.config.ts');

interface ReportedTest {
  readonly file: string;
  readonly title: string;
  readonly status: string;
  readonly errors: readonly string[];
  readonly annotations: readonly { readonly type: string; readonly description?: string }[];
}

interface JsonReportSpec {
  readonly title: string;
  readonly tests: readonly {
    readonly annotations: ReportedTest['annotations'];
    readonly results: readonly { readonly status: string; readonly errors: readonly { readonly message?: string }[] }[];
  }[];
}

interface JsonReportSuite {
  readonly file: string;
  readonly specs?: readonly JsonReportSpec[];
  readonly suites?: readonly JsonReportSuite[];
}

function flattenSpecs(suite: JsonReportSuite): JsonReportSpec[] {
  return [...(suite.specs ?? []), ...(suite.suites ?? []).flatMap(flattenSpecs)];
}

function toReportedTests(spec: JsonReportSpec, file: string): ReportedTest[] {
  return spec.tests.map((reportedTest) => ({
    file,
    title: spec.title,
    status: reportedTest.results.at(-1)?.status ?? 'unknown',
    errors: reportedTest.results.flatMap((result) => result.errors.map((error) => error.message ?? '')),
    annotations: reportedTest.annotations,
  }));
}

async function runFakePreviewer(
  extraEnvironment: Readonly<Record<string, string>> = {},
  files: readonly string[] = [],
): Promise<ReportedTest[]> {
  const commandArguments = [playwrightCli, 'test', '--config', fakePreviewerConfig, '--reporter=json', ...files];
  const environment: NodeJS.ProcessEnv = { ...process.env, CI: '', FORCE_COLOR: '0', ...extraEnvironment };
  if (extraEnvironment['LIGEIRINHO_PREVIEW_ENTRIES'] === undefined) {
    delete environment['LIGEIRINHO_PREVIEW_ENTRIES'];
  }
  const run = await runFile(process.execPath, commandArguments, {
    env: environment,
    maxBuffer: 64 * 1024 * 1024,
  }).catch((failedRun: { stdout?: string }) => ({ stdout: failedRun.stdout ?? '' }));
  const report: { suites: readonly JsonReportSuite[] } = JSON.parse(run.stdout);
  // Tests are declared inside responsiveChecks, so the spec's own file is e2e-kit's; the top suite names the caller.
  return report.suites.flatMap((fileSuite) =>
    flattenSpecs(fileSuite).flatMap((spec) => toReportedTests(spec, fileSuite.file)),
  );
}

let reportedTests: ReportedTest[] = [];
let fromEnvironmentTests: ReportedTest[] = [];

// One child run shared by the assertions below.
test.describe.configure({ mode: 'serial' });

test.beforeAll(async () => {
  test.setTimeout(120_000);
  [reportedTests, fromEnvironmentTests] = await Promise.all([
    runFakePreviewer(),
    // The variable wins over `entries: ['card']`: only `report` is checked, and its wide page fails.
    runFakePreviewer({ LIGEIRINHO_PREVIEW_ENTRIES: 'report' }, ['entries.fake.ts']),
  ]);
});

function testsOf(file: string): ReportedTest[] {
  return reportedTests.filter((reportedTest) => reportedTest.file === file);
}

test('declares one test per width and theme, and passes good scenarios', () => {
  expect(testsOf('good.fake.ts').map((reportedTest) => [reportedTest.title, reportedTest.status])).toEqual([
    ['responsive 390px light', 'passed'],
    ['responsive 768px light', 'passed'],
  ]);
});

test('saves a screenshot of every scenario when asked', () => {
  const screens = path.join(import.meta.dirname, '..', 'test-results', 'fake-previewer-screens', 'card');

  expect(existsSync(path.join(screens, 'default-390px-light.png'))).toBe(true);
  expect(existsSync(path.join(screens, 'other-768px-light.png'))).toBe(true);
});

test('names exact viewports by width and height', () => {
  expect(testsOf('viewports.fake.ts').map((reportedTest) => [reportedTest.title, reportedTest.status])).toEqual([
    ['responsive 390x844 dark', 'passed'],
    ['responsive 844x390 dark', 'passed'],
  ]);
});

test('passes with an annotation when the previewer lists no scenarios', () => {
  const [emptyRun] = testsOf('empty.fake.ts');

  expect(emptyRun?.status).toBe('passed');
  expect(emptyRun?.annotations).toContainEqual({ type: 'no-scenarios', description: '/__preview lists no scenarios' });
});

test('reports every problem of every scenario in one run, naming entry, scenario, width and theme', () => {
  const [badRun] = testsOf('bad.fake.ts');
  const errors = badRun?.errors.join('\n') ?? '';

  expect(badRun?.status).toBe('failed');
  expect(errors).toContain('[report-table/wide 390px dark] horizontal scroll: the document is');
  expect(errors).toContain('[delete-dialog/clipped 390px dark] 1 clickable(s) off screen or cut off:');
  expect(errors).toContain('<button> "Delete": cut off by');
  expect(errors).toContain('[toolbar/tiny 390px dark] 1 touch target(s) under 40×40px:');
  expect(errors).toContain('<button> "Close": 24×24px');
  expect(errors).toContain('[signup-form/unlabeled 390px dark]');
  expect(errors).toMatch(/label \(critical\): .*\n\s+input/);
  expect(errors).toContain('color-contrast');
  expect(errors).toContain('[menu/opened 390px dark] play failed: step "Open the menu" failed: no menu button');
  expect(errors).not.toContain('report-table/fine');
});

test('splits each run into groups of entries, dealt in turn', () => {
  const runs = testsOf('groups.fake.ts');

  expect(runs.map((reportedTest) => [reportedTest.title, reportedTest.status])).toEqual([
    ['responsive 390px light (1 of 2)', 'passed'],
    ['responsive 390px light (2 of 2)', 'failed'],
  ]);
  expect(runs[1]?.errors.join('\n')).toContain('[wide/default 390px light] horizontal scroll');
});

test('checks only the chosen entries', () => {
  expect(testsOf('entries.fake.ts').map((reportedTest) => reportedTest.status)).toEqual(['passed']);
});

test('LIGEIRINHO_PREVIEW_ENTRIES wins over the entries option', () => {
  const [run] = fromEnvironmentTests;

  expect(run?.status).toBe('failed');
  expect(run?.errors.join('\n')).toContain('[report/wide 390px light] horizontal scroll');
});

test('runs axe at the first viewport only', () => {
  expect(testsOf('accessibility.fake.ts').map((reportedTest) => [reportedTest.title, reportedTest.status])).toEqual([
    ['responsive 390px light', 'failed'],
    ['responsive 768px light', 'passed'],
  ]);
});
