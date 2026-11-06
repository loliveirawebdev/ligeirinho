import javascript from '@eslint/js';
import checkFile from 'eslint-plugin-check-file';
import typescriptEslint from 'typescript-eslint';
import { applyAdoption, type AdoptionOption } from './adoption.js';
import { infrastructureFiles, testFiles, typescriptFiles } from './file-globs.js';
import { ligeirinhoPlugin, ligeirinhoPluginPrefix } from './ligeirinho-plugin.js';
import { ignoreVendoredPaths, type VendoredPathsOption } from './vendored-paths.js';
import type { FlatConfig, RuleEntry, RulesRecord } from './flat-config.js';

export interface BaseOptions extends AdoptionOption, VendoredPathsOption {
  /** Folder of the root tsconfig, usually `import.meta.dirname` in `eslint.config.mjs`. */
  readonly tsconfigRootDir: string;
}

/** rules/code.md "Meaningful, explicit names". `i`, `j` and `id` stay allowed. */
export const deniedIdentifiers: readonly string[] = [
  'x', 'data', 'tmp', 'temp', 'res', 'resp', 'item2', 'aux', 'obj', 'val', 'info', 'usr', 'qty', 'cfg', 'cb', 'e', 'err',
];

const namingConvention: RuleEntry = [
  'error',
  { selector: 'default', format: ['camelCase'] },
  // PascalCase variables and functions are decorator factories (`RequirePermission`, `CurrentUser`).
  { selector: 'variable', format: ['camelCase', 'UPPER_CASE', 'PascalCase'], leadingUnderscore: 'allow' },
  { selector: 'function', format: ['camelCase', 'PascalCase'] },
  { selector: 'parameter', format: ['camelCase'], leadingUnderscore: 'allow' },
  { selector: 'import', format: ['camelCase', 'PascalCase'] },
  { selector: 'typeLike', format: ['PascalCase'] },
  {
    selector: 'class',
    format: ['PascalCase'],
    custom: { regex: '(Utils|Helpers?|Manager|Common|Misc)$', match: false },
  },
  { selector: 'enumMember', format: ['PascalCase', 'UPPER_CASE'] },
  // AST visitors (`Program`, `Element`) and external shapes (`Authorization`) are PascalCase keys.
  // UPPER_CASE keys are environment variables (`{ DATABASE_URL: ... }`).
  { selector: ['objectLiteralProperty', 'objectLiteralMethod'], format: ['camelCase', 'PascalCase', 'UPPER_CASE'] },
  { selector: 'classProperty', modifiers: ['static', 'readonly'], format: ['camelCase', 'UPPER_CASE'] },
  { selector: ['objectLiteralProperty', 'typeProperty'], modifiers: ['requiresQuotes'], format: null },
];

const codeRules: RulesRecord = {
  '@typescript-eslint/no-explicit-any': 'error',
  '@typescript-eslint/no-non-null-assertion': 'error',
  '@typescript-eslint/consistent-type-assertions': ['error', { assertionStyle: 'never' }],
  '@typescript-eslint/only-throw-error': 'error',
  '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
  '@typescript-eslint/no-extraneous-class': ['error', { allowWithDecorator: true }],
  '@typescript-eslint/restrict-template-expressions': ['error', { allowNumber: true }],
  '@typescript-eslint/naming-convention': namingConvention,
  'no-empty': 'error',
  'no-warning-comments': ['error', { terms: ['todo', 'fixme', 'xxx'], location: 'anywhere' }],
  'id-denylist': ['error', ...deniedIdentifiers],
  'max-lines-per-function': ['error', { max: 40, skipBlankLines: true, skipComments: true }],
  'max-depth': ['error', 2],
  complexity: ['error', 8],
  'max-params': 'off',
  '@typescript-eslint/max-params': ['error', { max: 3 }],
};

function typescriptPresets(tsconfigRootDir: string): FlatConfig[] {
  const presets: FlatConfig[] = [
    javascript.configs.recommended,
    ...typescriptEslint.configs.strictTypeChecked,
  ];
  const typedParserOptions: FlatConfig = {
    languageOptions: { parserOptions: { projectService: true, tsconfigRootDir } },
  };
  return [...presets, typedParserOptions].map((config) => ({ ...config, files: typescriptFiles }));
}

function fileNamingConfig(): FlatConfig {
  return {
    files: typescriptFiles,
    plugins: { 'check-file': checkFile, [ligeirinhoPluginPrefix]: ligeirinhoPlugin },
    rules: {
      'check-file/filename-naming-convention': [
        'error',
        { '**/*': 'KEBAB_CASE' },
        { ignoreMiddleExtensions: true },
      ],
      'check-file/folder-naming-convention': ['error', { '**/': 'KEBAB_CASE' }],
      '@ligeirinho/no-generic-names': 'error',
    },
  };
}

function errorAndTestConfigs(): FlatConfig[] {
  const plugins = { [ligeirinhoPluginPrefix]: ligeirinhoPlugin };
  return [
    { files: typescriptFiles, ignores: infrastructureFiles, plugins, rules: { '@ligeirinho/no-new-error': 'error' } },
    { files: testFiles, ignores: infrastructureFiles, plugins, rules: { '@ligeirinho/no-vi-mock': 'error' } },
    { files: testFiles, rules: { 'max-lines-per-function': 'off' } },
  ];
}

/**
 * rules/code.md, rules/architecture.md (names), rules/testing.md (fakes). Vendored paths keep only the correctness
 * presets (recommended + strict-type-checked).
 */
export function base(options: BaseOptions): FlatConfig[] {
  const stylisticPresets = typescriptEslint.configs.stylisticTypeChecked.map((preset) => ({
    ...preset,
    files: typescriptFiles,
  }));
  const ownedCodeConfigs = ignoreVendoredPaths(
    [...stylisticPresets, { files: typescriptFiles, rules: codeRules }, fileNamingConfig(), ...errorAndTestConfigs()],
    options.vendoredPaths,
  );
  return applyAdoption([...typescriptPresets(options.tsconfigRootDir), ...ownedCodeConfigs], options.adoption);
}
