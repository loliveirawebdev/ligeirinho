import { execFile } from 'node:child_process';
import path from 'node:path';
import { promisify } from 'node:util';
import { describe, expect, test } from 'vitest';
import { exitCodes, loadJscpdOptions, runLigeirinhoJscpd } from '../src/index.js';
import { createTemporaryProject, registrationTotal } from './temporary-project.js';

async function runIn(projectDir: string, targetPaths: string[] = []): Promise<{ exitCode: number; problems: string[] }> {
  const problems: string[] = [];
  const exitCode = await runLigeirinhoJscpd({
    targetPaths,
    projectDir,
    reportProblem: (problem) => problems.push(problem),
  });
  return { exitCode, problems };
}

const quietProject = { '.jscpd.json': JSON.stringify({ reporters: [], silent: true }) };

describe('ligeirinho-jscpd', () => {
  test('passes when nothing is duplicated', async () => {
    const projectDir = await createTemporaryProject({
      ...quietProject,
      'src/registration-total.ts': registrationTotal('registrationTotal'),
      'src/seat-count.ts': 'export function seatCount(seats: readonly unknown[]): number { return seats.length; }\n',
    });
    expect(await runIn(projectDir)).toEqual({ exitCode: exitCodes.clean, problems: [] });
  });

  test('fails on a copy-paste between two files, test files included', async () => {
    const projectDir = await createTemporaryProject({
      ...quietProject,
      'src/registration-total.ts': registrationTotal('registrationTotal'),
      'src/registration-total.spec.ts': registrationTotal('expectedRegistrationTotal'),
    });
    const { exitCode, problems } = await runIn(projectDir);
    expect(exitCode).toBe(exitCodes.problemsFound);
    expect(problems).toEqual(['1 copy-paste clone(s): extract each into one owner (rules/architecture.md).']);
  });

  test('skips generated files and the project .jscpd.json ignores', async () => {
    const projectDir = await createTemporaryProject({
      '.jscpd.json': JSON.stringify({ reporters: [], silent: true, ignore: ['**/vendored/**'] }),
      'src/registration-total.ts': registrationTotal('registrationTotal'),
      'src/api-client.generated.ts': registrationTotal('generatedTotal'),
      'vendored/total.ts': registrationTotal('vendoredTotal'),
    });
    expect(await runIn(projectDir)).toEqual({ exitCode: exitCodes.clean, problems: [] });
  });

  test('fails on an ignore without a reason, even with no clone', async () => {
    const projectDir = await createTemporaryProject({
      ...quietProject,
      'src/fixtures.ts': '// jscpd:ignore-start\nexport const answer = 42;\n// jscpd:ignore-end\n',
    });
    const { exitCode, problems } = await runIn(projectDir, ['src']);
    expect(exitCode).toBe(exitCodes.problemsFound);
    expect(problems).toEqual([
      'src/fixtures.ts:1: jscpd:ignore-start needs a reason on the same line (// jscpd:ignore-start — <reason>)',
    ]);
  });

  test('the project .jscpd.json adds to the shared ignores instead of replacing them', async () => {
    const projectDir = await createTemporaryProject({ '.jscpd.json': JSON.stringify({ ignore: ['**/vendored/**'] }) });
    const options = await loadJscpdOptions(projectDir);
    expect(options.minTokens).toBe(50);
    expect(options.ignore).toEqual(expect.arrayContaining(['**/node_modules/**', '**/*.generated.ts', '**/vendored/**']));
  });
});

describe('the built bin', () => {
  test('exits 1 on a duplicate and prints the clone', async () => {
    const projectDir = await createTemporaryProject({
      'src/registration-total.ts': registrationTotal('registrationTotal'),
      'src/invoice-total.ts': registrationTotal('invoiceTotal'),
    });
    const cliPath = path.join(import.meta.dirname, '..', 'dist', 'cli.js');
    const failure: unknown = await promisify(execFile)('node', [cliPath, 'src'], { cwd: projectDir }).then(
      () => undefined,
      (execError: unknown) => execError,
    );
    expect(failure).toMatchObject({ code: 1 });
    expect(failure).toHaveProperty('stdout', expect.stringContaining('invoice-total.ts'));
  });
});
