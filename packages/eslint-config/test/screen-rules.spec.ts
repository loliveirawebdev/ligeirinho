import { mkdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { afterAll, beforeAll, describe, expect, test } from 'vitest';
import { angular, readCopyConfig } from '../src/index.js';
import { fixturesDir, lintFixture, projectConfig, ruleIdsOf, toLinterConfigs } from './fixture-linter.js';

const viewTemplate = 'apps/web/src/screens/screen-rules.view.html';

async function ruleIdsFor(template: string, file = viewTemplate): Promise<(string | null)[]> {
  return ruleIdsOf(await lintFixture(file, template));
}

describe('no-literal-text: every string comes from the copy', () => {
  test.each([
    '<p>No tasks yet</p>',
    '<p>{{ count }} open tasks</p>',
    "<span>{{ busy ? 'Adding…' : 'Add task' }}</span>",
    "<span>{{ 'Hi ' + name }}</span>",
    '<mat-form-field><input matInput placeholder="What needs doing?" /></mat-form-field>',
    '<a href="/" aria-label="Home">{{ home }}</a>',
    '<a href="/" [attr.aria-label]="\'Home\'">{{ home }}</a>',
    '<p>Não há tarefas</p>',
  ])('%s fails', async (template) => {
    expect(await ruleIdsFor(template)).toContain('@ligeirinho/no-literal-text');
  });

  test.each([
    '<p>{{ copy.empty }}</p>',
    "<p>{{ createdAt | date: 'short' }}</p>",
    "<p>{{ status === 'done' ? labels.done : labels.open }}</p>",
    '<mat-icon aria-hidden="true">add</mat-icon>',
    '<p>{{ count }} · {{ total }}</p>',
    '<code>pnpm install</code>',
  ])('%s passes', async (template) => {
    expect(await ruleIdsFor(template)).not.toContain('@ligeirinho/no-literal-text');
  });

  test('applies in the design system too', async () => {
    expect(await ruleIdsFor('<p>Try again</p>', 'libs/ui/src/notice/notice.html')).toContain('@ligeirinho/no-literal-text');
  });
});

describe('structure rules from real screens', () => {
  test('mat-nav-list outside a nav fails, inside passes', async () => {
    expect(await ruleIdsFor('<mat-nav-list><a mat-list-item href="/">{{ home }}</a></mat-nav-list>')).toContain(
      '@ligeirinho/nav-list-in-nav',
    );
    const inNav = '<nav><mat-nav-list><a mat-list-item href="/">{{ home }}</a></mat-nav-list></nav>';
    expect(await ruleIdsFor(inNav)).not.toContain('@ligeirinho/nav-list-in-nav');
  });

  test('an icon centered on a block of text fails; items-start and buttons pass', async () => {
    const centered = '<div class="flex items-center gap-3"><mat-icon>info</mat-icon><div>{{ body }}</div></div>';
    expect(await ruleIdsFor(centered)).toContain('@ligeirinho/icon-aligns-with-text');
    const firstLine = '<div class="flex items-start gap-3"><mat-icon>info</mat-icon><p>{{ body }}</p></div>';
    expect(await ruleIdsFor(firstLine)).not.toContain('@ligeirinho/icon-aligns-with-text');
    const column = '<div class="flex flex-col items-center"><mat-icon>task_alt</mat-icon><p>{{ title }}</p></div>';
    expect(await ruleIdsFor(column)).not.toContain('@ligeirinho/icon-aligns-with-text');
    const button = '<button matButton class="items-center"><mat-icon>add</mat-icon><div>{{ add }}</div></button>';
    expect(await ruleIdsFor(button)).not.toContain('@ligeirinho/icon-aligns-with-text');
  });

  test('a text button as a field suffix fails; an icon button passes', async () => {
    const textSuffix =
      '<mat-form-field><input matInput /><button matButton matSuffix type="button">{{ go }}</button></mat-form-field>';
    expect(await ruleIdsFor(textSuffix)).toContain('@ligeirinho/no-suffix-button');
    const iconSuffix =
      '<mat-form-field><input matInput /><button matIconButton matSuffix type="button" [attr.aria-label]="clear"><mat-icon>close</mat-icon></button></mat-form-field>';
    expect(await ruleIdsFor(iconSuffix)).not.toContain('@ligeirinho/no-suffix-button');
  });
});

describe('known-icons', () => {
  const iconNamesFile = 'node_modules/material-symbols/index.d.ts';

  beforeAll(async () => {
    await mkdir(path.join(fixturesDir, 'node_modules/material-symbols'), { recursive: true });
    await writeFile(path.join(fixturesDir, iconNamesFile), 'export type MaterialSymbols = "add" | "arrow_back";\n');
  });

  afterAll(async () => {
    await rm(path.join(fixturesDir, 'node_modules'), { recursive: true });
  });

  test('a name Material Symbols has passes; an invented one fails', async () => {
    expect(await ruleIdsFor('<mat-icon>arrow_back</mat-icon>')).not.toContain('@ligeirinho/known-icons');
    expect(await ruleIdsFor('<mat-icon>arrow_bak</mat-icon>')).toContain('@ligeirinho/known-icons');
    expect(await ruleIdsFor('<mat-icon fontIcon="sparkles" />')).toContain('@ligeirinho/known-icons');
    expect(await ruleIdsFor('<mat-icon>{{ icon }}</mat-icon>')).not.toContain('@ligeirinho/known-icons');
  });

  test('run from a project folder, as Nx does, it finds the names in the workspace root', async () => {
    const projectFolder = path.join(fixturesDir, 'libs/ui');
    await mkdir(projectFolder, { recursive: true });
    // The config file sits in the workspace root, so its globs stay relative to it.
    const rootConfig = projectConfig().map((config) => ({ basePath: fixturesDir, ...config }));
    const messages = await lintFixture('libs/ui/src/known-icons.html', '<mat-icon>arrow_bak</mat-icon>', rootConfig, projectFolder);
    expect(ruleIdsOf(messages)).toContain('@ligeirinho/known-icons');
  });
});

describe('use-catalog', () => {
  const catalogConfig = toLinterConfigs([
    ...projectConfig(),
    ...angular({
      files: ['apps/web/**/*.ts'],
      templates: ['apps/web/**/*.html', 'libs/ui/**/*.html'],
      designSystemPaths: ['libs/ui/**'],
      catalog: [
        { element: 'mat-sidenav-container', use: 'ui-app-shell' },
        { attribute: 'mat-table', use: 'ui-data-table' },
        { className: 'bg-error-container', use: 'ui-notice' },
      ],
    }),
  ]);

  test.each([
    '<mat-sidenav-container></mat-sidenav-container>',
    '<table mat-table [dataSource]="rows"></table>',
    '<section class="bg-error-container p-4">{{ message }}</section>',
  ])('%s in a screen fails', async (template) => {
    const messages = await lintFixture(viewTemplate, template, catalogConfig);
    expect(ruleIdsOf(messages)).toContain('@ligeirinho/use-catalog');
  });

  test('the catalog itself may build them', async () => {
    const messages = await lintFixture('libs/ui/src/app-shell/app-shell.html', '<mat-sidenav-container />', catalogConfig);
    expect(ruleIdsOf(messages)).not.toContain('@ligeirinho/use-catalog');
  });
});

describe('copy-text', () => {
  const copyFile = 'apps/web/src/screens/screens.copy.ts';
  const copyConfig = toLinterConfigs([
    ...projectConfig(),
    ...angular({ files: ['apps/web/**/*.ts'], templates: ['apps/web/**/*.html'], copy: { locales: ['en', 'pt-BR'], source: 'en' } }),
  ]);

  async function copyRuleMessages(locales: string): Promise<string[]> {
    const code = `declare function defineCopy<T>(copy: T): T;\nexport const tasksCopy = defineCopy({\n${locales}\n});\n`;
    const messages = await lintFixture(copyFile, code, copyConfig);
    return messages.filter((message) => message.ruleId === '@ligeirinho/copy-text').map((message) => message.message);
  }

  test('complete locales with the same keys and placeholders pass', async () => {
    const messages = await copyRuleMessages(`
  en: { title: 'Tasks', addAction: 'Add task', open: { one: '{count} open task', other: '{count} open tasks' } },
  'pt-BR': { title: 'Tarefas', addAction: 'Adicionar tarefa', open: { one: '{count} tarefa aberta', other: '{count} tarefas abertas' } },`);
    expect(messages).toEqual([]);
  });

  test('a missing locale, key or placeholder fails', async () => {
    const messages = await copyRuleMessages(`
  en: { title: 'Tasks', open: { one: '{count} open task', other: '{count} open tasks' } },
  es: { title: 'Tareas', open: { one: 'Una tarea', other: 'Varias tareas' }, extra: 'Más' },`);
    expect(messages).toEqual([
      expect.stringContaining('no "pt-BR" locale'),
      expect.stringContaining('"open" in "es" uses no placeholders but "en" uses count'),
      expect.stringContaining('"extra" is in "es" but not in "en"'),
    ]);
  });

  test.each([
    ["'Task added!'", 'exclamation'],
    ["'Done ✅'", 'emoji'],
    ["'DELETE ALL TASKS'", 'capitals'],
    ["'Loading...'", 'ellipsis'],
    ["\"Couldn't load\"", 'typographic quotes'],
  ])('%s fails (%s)', async (text, expected) => {
    const messages = await copyRuleMessages(`en: { title: ${text} }, 'pt-BR': { title: 'Tarefas' },`);
    expect(messages.join('\n')).toContain(expected);
  });

  test('a long button label fails', async () => {
    const messages = await copyRuleMessages(
      "en: { saveAction: 'Click here to save all of your changes' }, 'pt-BR': { saveAction: 'Salvar' },",
    );
    expect(messages.join('\n')).toContain('button label');
  });
});

describe('readCopyConfig', () => {
  const configDir = path.join(fixturesDir, 'copy-config');

  afterAll(async () => {
    await rm(configDir, { recursive: true, force: true });
  });

  test('reads copy.source and copy.locales, English without the section', async () => {
    await mkdir(configDir, { recursive: true });
    await writeFile(
      path.join(configDir, '.ligeirinho.yml'),
      'version: 1\n\npreview:\n  widths: 390\n\ncopy:\n  source: pt-BR   # written first\n  locales: pt-BR, en\n  register: formal\n',
    );
    expect(readCopyConfig(configDir)).toEqual({ source: 'pt-BR', locales: ['pt-BR', 'en'] });
    expect(readCopyConfig(fixturesDir)).toEqual({ source: 'en', locales: ['en'] });
  });
});
