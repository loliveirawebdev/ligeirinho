import { describe, expect, test } from 'vitest';
import { lintFixture, ruleIdsOf } from './fixture-linter.js';

describe('nest: rules/architecture.md layers', () => {
  test('a controller importing infrastructure fails', async () => {
    const code = "export { PrismaTaskRepository } from '../infrastructure/prisma-task-repository';\n";
    const controllerFile = 'apps/api/src/tasks/presentation/tasks.controller.ts';
    const ruleIds = ruleIdsOf(await lintFixture(controllerFile, `import '../infrastructure/prisma-task-repository';\n${code}`));
    expect(ruleIds).toContain('no-restricted-imports');
  });

  test('a controller importing a use case passes the import rule', async () => {
    const code = "import '../application/create-task';\n";
    const controllerFile = 'apps/api/src/tasks/presentation/tasks.controller.ts';
    expect(ruleIdsOf(await lintFixture(controllerFile, code))).not.toContain('no-restricted-imports');
  });

  test('domain code importing Nest fails', async () => {
    const code = "import '@nestjs/common';\n";
    const ruleIds = ruleIdsOf(await lintFixture('apps/api/src/tasks/domain/task.ts', code));
    expect(ruleIds).toContain('no-restricted-imports');
  });

  test('domain code reading the system clock fails', async () => {
    const code = 'export function isOverdue(dueAt: number): boolean { return dueAt < Date.now(); }\n';
    const ruleIds = ruleIdsOf(await lintFixture('apps/api/src/tasks/domain/task-deadline.ts', code));
    expect(ruleIds).toContain('@ligeirinho/no-system-clock');
  });

  test('infrastructure may read the system clock', async () => {
    const code = 'export function currentTime(): number { return Date.now(); }\n';
    expect(await lintFixture('apps/api/src/tasks/infrastructure/system-clock.ts', code)).toEqual([]);
  });
});
