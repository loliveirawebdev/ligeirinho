import { execFile } from 'node:child_process';
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

async function runFakePreviewer(): Promise<ReportedTest[]> {
  const run = await runFile(process.execPath, [playwrightCli, 'test', '--config', fakePreviewerConfig, '--reporter=json'], {
    env: { ...process.env, CI: '', FORCE_COLOR: '0' },
    maxBuffer: 64 * 1024 * 1024,
  }).catch((failedRun: { stdout?: string }) => ({ stdout: failedRun.stdout ?? '' }));
  const report: { suites: readonly JsonReportSuite[] } = JSON.parse(run.stdout);
  // Tests are declared inside responsiveChecks, so the spec's own file is e2e-kit's; the top suite names the caller.
  return report.suites.flatMap((fileSuite) =>
    flattenSpecs(fileSuite).flatMap((spec) => toReportedTests(spec, fileSuite.file)),
  );
}

let reportedTests: ReportedTest[] = [];

// One child run shared by the assertions below.
test.describe.configure({ mode: 'serial' });

test.beforeAll(async () => {
  test.setTimeout(120_000);
  reportedTests = await runFakePreviewer();
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
  expect(errors).toContain('[toolbar/tiny 390px dark] 1 touch target(s) under 44×44px:');
  expect(errors).toContain('<button> "Close": 24×24px');
  expect(errors).toContain('[signup-form/unlabeled 390px dark]');
  expect(errors).toMatch(/label \(critical\): .*\n\s+input/);
  expect(errors).toContain('color-contrast');
  expect(errors).not.toContain('report-table/fine');
});
