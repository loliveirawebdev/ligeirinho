import path from 'node:path';
import { ESLint } from 'eslint';
import { describe, expect, test } from 'vitest';
import { angular, base, boundaries, nest, playwright } from '../src/index.js';
import { fixturesDir, toLinterConfigs } from './fixture-linter.js';

/** The exact `eslint.config.mjs` of the ligeirinho template. */
function templateConfig(): ReturnType<typeof base> {
  return [
    ...base({ tsconfigRootDir: fixturesDir, adoption: false }),
    ...angular({ files: ['apps/web/**/*.ts'], templates: ['apps/web/**/*.html'], designSystemPaths: ['libs/ui/**'] }),
    ...nest({ files: ['apps/api/**/*.ts', 'libs/**/api/**/*.ts'] }),
    ...playwright({ files: ['apps/e2e/**/*.ts'] }),
    ...boundaries({ areas: ['tasks'] }),
  ];
}

async function ruleNamesFor(relativeFilePath: string): Promise<string[]> {
  const eslint = new ESLint({ cwd: fixturesDir, overrideConfigFile: true, overrideConfig: toLinterConfigs(templateConfig()) });
  const fileConfig: unknown = await eslint.calculateConfigForFile(path.join(fixturesDir, relativeFilePath));
  const hasRules = typeof fileConfig === 'object' && fileConfig !== null && 'rules' in fileConfig;
  return hasRules && typeof fileConfig.rules === 'object' && fileConfig.rules !== null ? Object.keys(fileConfig.rules) : [];
}

describe('public API: the template config composes without conflicts', () => {
  test('a view gets base, Angular, MVVM and boundary rules', async () => {
    const ruleNames = await ruleNamesFor('apps/web/src/tasks/task-list.view.ts');
    expect(ruleNames).toEqual(
      expect.arrayContaining([
        '@typescript-eslint/no-explicit-any',
        '@angular-eslint/prefer-signals',
        '@ligeirinho/no-inject-in-view',
        '@ligeirinho/no-new-error',
        '@nx/enforce-module-boundaries',
      ]),
    );
  });

  test('a template gets the template rules only', async () => {
    const ruleNames = await ruleNamesFor('apps/web/src/tasks/task-list.view.html');
    expect(ruleNames).toContain('@ligeirinho/no-raw-elements');
    expect(ruleNames).not.toContain('@typescript-eslint/no-explicit-any');
  });

  test('an API lib under libs/**/api gets the Nest rules', async () => {
    const ruleNames = await ruleNamesFor('libs/tasks/api/domain/task.ts');
    expect(ruleNames).toContain('@ligeirinho/no-system-clock');
  });
});
