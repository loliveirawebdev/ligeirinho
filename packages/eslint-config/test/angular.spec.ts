import { describe, expect, test } from 'vitest';
import { lintFixture, ruleIdsOf } from './fixture-linter.js';

const viewFile = 'apps/web/src/tasks/task-list.view.ts';

const goodView = `
import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

export interface TaskListViewModel {
  readonly titles: readonly string[];
}

@Component({
  selector: 'app-task-list',
  templateUrl: './task-list.view.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaskListView {
  readonly viewModel = input.required<TaskListViewModel>();
  readonly taskOpened = output<string>();
}
`;

describe('angular: rules/mvvm.md pure view', () => {
  test('a view with input() and output() passes', async () => {
    expect(await lintFixture(viewFile, goodView)).toEqual([]);
  });

  test('a view calling inject() fails', async () => {
    const code = `${goodView}\nimport { inject } from '@angular/core';\nclass TaskStore {}\nexport const taskStore = inject(TaskStore);\n`;
    expect(ruleIdsOf(await lintFixture(viewFile, code))).toContain('@ligeirinho/no-inject-in-view');
  });

  test('a view with constructor dependencies fails', async () => {
    const code = `
import { Component } from '@angular/core';
class TaskStore {}
@Component({ selector: 'app-task-list', template: '' })
export class TaskListView {
  constructor(readonly taskStore: TaskStore) {}
}
`;
    expect(ruleIdsOf(await lintFixture(viewFile, code))).toContain('@ligeirinho/no-constructor-dependencies-in-view');
  });

  test('inject() is allowed in a page', async () => {
    const code = `
import { inject } from '@angular/core';
class TaskStore {}
export const taskStore = inject(TaskStore);
`;
    const pageFile = 'apps/web/src/tasks/task-list.page.ts';
    expect(ruleIdsOf(await lintFixture(pageFile, code))).not.toContain('@ligeirinho/no-inject-in-view');
  });
});

describe('angular: rules/mvvm.md view-model without Angular', () => {
  const viewModelFile = 'apps/web/src/tasks/task-list.view-model.ts';

  test('a view-model importing @angular/core fails', async () => {
    const code = "import { input } from '@angular/core';\nexport const titleInput = input<string>();\n";
    expect(ruleIdsOf(await lintFixture(viewModelFile, code))).toContain('no-restricted-imports');
  });

  test('a pure view-model builder passes', async () => {
    const code = `
export interface TaskListViewModel {
  readonly titles: readonly string[];
  readonly isEmpty: boolean;
}

export function buildTaskListViewModel(titles: readonly string[]): TaskListViewModel {
  return { titles, isEmpty: titles.length === 0 };
}
`;
    expect(await lintFixture(viewModelFile, code)).toEqual([]);
  });
});

describe('angular: rules/mvvm.md signals', () => {
  test('an @Input() decorator fails', async () => {
    const code = `
import { Component, Input } from '@angular/core';
@Component({ selector: 'app-task-title', template: '' })
export class TaskTitleView {
  @Input() title = '';
}
`;
    const ruleIds = ruleIdsOf(await lintFixture('apps/web/src/tasks/task-title.view.ts', code));
    expect(ruleIds).toContain('@angular-eslint/prefer-signals');
  });
});

describe('angular: rules/mvvm.md raw elements only in the design system', () => {
  test('a raw <button> in an app template fails', async () => {
    const template = '<section><button type="button">Open</button></section>';
    const messages = await lintFixture('apps/web/src/tasks/task-list.view.html', template);
    expect(ruleIdsOf(messages)).toEqual(['@ligeirinho/no-raw-elements']);
  });

  test.each(['<input />', '<select></select>', '<textarea></textarea>', '<table></table>', '<dialog></dialog>'])(
    'a raw %s fails',
    async (element) => {
      const messages = await lintFixture('apps/web/src/tasks/task-list.view.html', `<div>${element}</div>`);
      expect(ruleIdsOf(messages)).toEqual(['@ligeirinho/no-raw-elements']);
    },
  );

  test('a raw <button> inside the design system passes', async () => {
    const template = '<button type="button"><ng-content /></button>';
    expect(await lintFixture('libs/ui/src/button/button.html', template)).toEqual([]);
  });

  test('a raw <button> in an inline template fails', async () => {
    const code = `
import { ChangeDetectionStrategy, Component } from '@angular/core';
@Component({
  selector: 'app-task-actions',
  template: '<button type="button">Open</button>',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaskActionsView {}
`;
    const ruleIds = ruleIdsOf(await lintFixture('apps/web/src/tasks/task-actions.view.ts', code));
    expect(ruleIds).toContain('@ligeirinho/no-raw-elements');
  });

  test('design system components pass', async () => {
    const template = '<ui-button (clicked)="open()">Open</ui-button>';
    expect(await lintFixture('apps/web/src/tasks/task-list.view.html', template)).toEqual([]);
  });
});
