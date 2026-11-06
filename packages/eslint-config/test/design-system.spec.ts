import { describe, expect, test } from 'vitest';
import { angular } from '../src/index.js';
import { lintFixture, projectConfig, ruleIdsOf, toLinterConfigs } from './fixture-linter.js';

const appTemplate = 'apps/web/src/tasks/task-list.view.html';

describe('no-raw-elements: design system directives on native elements', () => {
  test.each([
    '<button matButton type="button">Open</button>',
    '<button matButton="filled" type="button">Open</button>',
    '<input matInput />',
    '<input [matDatepicker]="picker" />',
    '<table mat-table [dataSource]="rows"></table>',
  ])('%s passes outside the design system', async (template) => {
    expect(await lintFixture(appTemplate, `<div>${template}</div>`)).toEqual([]);
  });

  test.each(['<button type="button" class="mat-button">Open</button>', '<input type="text" />'])(
    '%s without a directive still fails',
    async (template) => {
      expect(ruleIdsOf(await lintFixture(appTemplate, `<div>${template}</div>`))).toEqual(['@ligeirinho/no-raw-elements']);
    },
  );

  test('designSystemAttributes replaces the default patterns', async () => {
    const customConfig = toLinterConfigs([
      ...projectConfig(),
      ...angular({ files: ['apps/web/**/*.ts'], templates: ['apps/web/**/*.html'], designSystemAttributes: [/^ui[A-Z]/] }),
    ]);
    const template = '<div><button uiButton type="button">Open</button><button matButton type="button">Open</button></div>';
    const messages = await lintFixture(appTemplate, template, customConfig);
    expect(ruleIdsOf(messages)).toEqual(['@ligeirinho/no-raw-elements']);
    expect(messages[0]?.message).toContain('<button>');
  });
});

describe('vendored paths (Spartan under libs/ui/spartan)', () => {
  const vendoredFile = 'libs/ui/spartan/brain/src/lib/utils/hlmButtonVariants.ts';
  const vendoredCode = `
export interface ButtonVariantsInput { readonly size?: string }
export type button_variant = 'default' | 'outline';
export const buttonSizes: Array<string> = [];
export function hlm(...classNames: string[]): string {
  return classNames.join(' ');
}
`;

  test('file and folder names, naming and style rules are skipped', async () => {
    expect(await lintFixture(vendoredFile, vendoredCode)).toEqual([]);
  });

  test('the same file outside the vendored path breaks the rules', async () => {
    const ruleIds = ruleIdsOf(await lintFixture('libs/ui/src/lib/utils/hlmButtonVariants.ts', vendoredCode));
    expect(ruleIds).toEqual(
      expect.arrayContaining([
        'check-file/filename-naming-convention',
        '@ligeirinho/no-generic-names',
        '@typescript-eslint/naming-convention',
        '@typescript-eslint/array-type',
      ]),
    );
  });

  test('correctness rules still apply to vendored code', async () => {
    const code = 'export function parse(input: any): string { return String(input); }\n';
    expect(ruleIdsOf(await lintFixture(vendoredFile, code))).toContain('@typescript-eslint/no-explicit-any');
  });

  test('vendored templates are skipped by the Angular template rules', async () => {
    const template = '<img src="logo.png" />';
    const vendoredRuleIds = ruleIdsOf(await lintFixture('libs/ui/spartan/brain/src/lib/logo.html', template));
    expect(vendoredRuleIds.filter((ruleId) => ruleId !== null)).toEqual([]);
    expect(ruleIdsOf(await lintFixture('libs/ui/src/lib/logo.html', template))).toContain(
      '@angular-eslint/template/alt-text',
    );
  });
});
