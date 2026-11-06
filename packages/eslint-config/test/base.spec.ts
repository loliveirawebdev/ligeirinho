import { describe, expect, test } from 'vitest';
import { lintFixture, projectConfig, ruleIdsOf } from './fixture-linter.js';

const domainFile = 'libs/tasks/domain/src/task-title.ts';

const goodDomainCode = `
export class TaskTitleTooLong {
  readonly maximumLength = 120;
}

export interface TaskTitle {
  readonly value: string;
}

export function createTaskTitle(rawTitle: string): TaskTitle | TaskTitleTooLong {
  const trimmedTitle = rawTitle.trim();
  if (trimmedTitle.length > 120) {
    return new TaskTitleTooLong();
  }
  return { value: trimmedTitle };
}

export const taskStatuses = ['open', 'done'] as const;
`;

describe('base: rules/code.md', () => {
  test('good code passes with no messages', async () => {
    expect(await lintFixture(domainFile, goodDomainCode)).toEqual([]);
  });

  test.each([
    ['any', 'export function parse(input: any): string { return String(input); }', '@typescript-eslint/no-explicit-any'],
    [
      'non-null assertion',
      'export function first(titles: string[]): string { return titles[0]!; }',
      '@typescript-eslint/no-non-null-assertion',
    ],
    [
      '"trust me" as',
      'export function toTitle(input: unknown): string { return input as string; }',
      '@typescript-eslint/consistent-type-assertions',
    ],
    ['empty block', 'export function ignore(): void { if (Math.random() > 1) {} }', 'no-empty'],
    ['TODO comment', '// TODO: remove\nexport const answer = 42;', 'no-warning-comments'],
    ['denied name', 'export function title(data: string): string { return data; }', 'id-denylist'],
    ['four parameters', 'export function sum(a: number, b: number, c: number, d: number): number { return a + b + c + d; }', '@typescript-eslint/max-params'],
    ['unused variable', 'const unusedTitle = 1;\nexport const answer = 42;', '@typescript-eslint/no-unused-vars'],
    ['throwing a string', "export function fail(): never { throw 'failed'; }", '@typescript-eslint/only-throw-error'],
    ['generic class name', 'export class TaskManager { readonly name = 1; }', '@typescript-eslint/naming-convention'],
  ])('%s fails', async (_case, code, expectedRuleId) => {
    expect(ruleIdsOf(await lintFixture(domainFile, code))).toContain(expectedRuleId);
  });

  test('`as const` is allowed', async () => {
    const messages = await lintFixture(domainFile, "export const taskStatuses = ['open', 'done'] as const;");
    expect(messages).toEqual([]);
  });

  test('`i` and `id` are allowed names', async () => {
    const code = `
export function countEvenIds(ids: readonly string[], id: string): number {
  let matches = 0;
  for (let i = 0; i < ids.length; i += 2) {
    matches += ids[i] === id ? 1 : 0;
  }
  return matches;
}
`;
    expect(await lintFixture(domainFile, code)).toEqual([]);
  });

  test('nesting deeper than 2 fails', async () => {
    const code = `
export function deep(flags: readonly boolean[]): number {
  for (const first of flags) {
    if (first) {
      if (flags.length > 1) {
        return 1;
      }
    }
  }
  return 0;
}
`;
    expect(ruleIdsOf(await lintFixture(domainFile, code))).toContain('max-depth');
  });

  test('a function over 40 lines fails, but not in a test file', async () => {
    const statements = Array.from({ length: 41 }, (_unused, index) => `  total += ${String(index)};`).join('\n');
    const code = `export function long(): number {\n  let total = 0;\n${statements}\n  return total;\n}\n`;
    expect(ruleIdsOf(await lintFixture(domainFile, code))).toContain('max-lines-per-function');
    const testFile = 'libs/tasks/domain/src/task-title.spec.ts';
    expect(ruleIdsOf(await lintFixture(testFile, code))).not.toContain('max-lines-per-function');
  });
});

describe('base: typed errors only outside infrastructure', () => {
  const code = "export function fail(): never { throw new Error('closed'); }";

  test('`new Error(` fails in domain code', async () => {
    expect(ruleIdsOf(await lintFixture(domainFile, code))).toContain('@ligeirinho/no-new-error');
  });

  test('`new Error(` is allowed in infrastructure', async () => {
    const infrastructureFile = 'libs/tasks/infrastructure/src/prisma-task-repository.ts';
    expect(await lintFixture(infrastructureFile, code)).toEqual([]);
  });
});

describe('base: rules/testing.md fakes instead of mocks', () => {
  const code = "import { vi } from 'vitest';\nvi.mock('./task-repository');\n";

  test('`vi.mock` fails in an application test', async () => {
    const testFile = 'libs/tasks/application/src/create-task.spec.ts';
    expect(ruleIdsOf(await lintFixture(testFile, code))).toContain('@ligeirinho/no-vi-mock');
  });

  test('`vi.mock` is allowed in an infrastructure test', async () => {
    const testFile = 'libs/tasks/infrastructure/src/system-clock.spec.ts';
    expect(ruleIdsOf(await lintFixture(testFile, code))).not.toContain('@ligeirinho/no-vi-mock');
  });
});

describe('base: rules/architecture.md file names', () => {
  const code = 'export const answer = 42;\n';

  test.each([
    ['a PascalCase file', 'libs/tasks/domain/src/TaskTitle.ts', 'check-file/filename-naming-convention'],
    ['a camelCase folder', 'libs/tasks/domain/taskTitles/task-title.ts', 'check-file/folder-naming-convention'],
    ['a utils file', 'libs/tasks/domain/src/utils.ts', '@ligeirinho/no-generic-names'],
    ['a *.helpers file', 'libs/tasks/domain/src/string.helpers.ts', '@ligeirinho/no-generic-names'],
    ['a common folder', 'libs/common/src/strip-accents.ts', '@ligeirinho/no-generic-names'],
  ])('%s fails', async (_case, filePath, expectedRuleId) => {
    expect(ruleIdsOf(await lintFixture(filePath, code))).toContain(expectedRuleId);
  });

  test('kebab-case names with suffixes pass', async () => {
    expect(await lintFixture('libs/text/src/strip-accents.view-model.ts', code)).toEqual([]);
  });
});

describe('adoption', () => {
  test('turns errors into warnings', async () => {
    const code = 'export function parse(input: any): string { return String(input); }';
    const messages = await lintFixture(domainFile, code, projectConfig(true));
    const anyMessage = messages.find((lintedMessage) => lintedMessage.ruleId === '@typescript-eslint/no-explicit-any');
    expect(anyMessage?.severity).toBe(1);
    expect(messages.every((lintedMessage) => lintedMessage.severity === 1)).toBe(true);
  });
});
