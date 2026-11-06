import angularEslint from 'angular-eslint';
import { applyAdoption, type AdoptionOption } from './adoption.js';
import { ligeirinhoPlugin, ligeirinhoPluginPrefix } from './ligeirinho-plugin.js';
import { defaultRawElements, type AttributePattern } from './rules/no-raw-elements.js';
import type { FlatConfig, RuleEntry, RulesRecord } from './flat-config.js';
import { ignoreVendoredPaths, type VendoredPathsOption } from './vendored-paths.js';

export interface AngularOptions extends AdoptionOption, VendoredPathsOption {
  /** TypeScript files of the Angular app, e.g. `['apps/web/**\/*.ts']`. */
  readonly files: string[];
  /** Templates of the Angular app, e.g. `['apps/web/**\/*.html']`. Inline templates are linted too. */
  readonly templates: string[];
  /** The component library, the only place raw elements are allowed, e.g. `['libs/ui/**']`. */
  readonly designSystemPaths?: string[];
  /** Elements only the design system may use. Defaults to button, input, select, textarea, table, dialog. */
  readonly rawElements?: readonly string[];
  /**
   * A raw element carrying an attribute (or input binding) that matches one of these is a design system directive
   * and is allowed anywhere. Defaults to `[/^mat/i]` (Angular Material: `<button matButton>`, `<input matInput>`,
   * `<table mat-table>`).
   */
  readonly designSystemAttributes?: readonly RegExp[];
}

const defaultDesignSystemAttributes: readonly RegExp[] = [/^mat/i];

/** Rule options are JSON, so each RegExp travels as its source and flags. */
function toAttributePatterns(attributes: readonly RegExp[]): AttributePattern[] {
  return attributes.map((attribute) => ({ pattern: attribute.source, flags: attribute.flags }));
}

const plugins = { [ligeirinhoPluginPrefix]: ligeirinhoPlugin };

/** Each glob of the app intersected with a file suffix (`*.view.ts`): flat config ANDs the inner array. */
function filesWithSuffix(files: string[], suffixGlob: string): string[][] {
  return files.map((fileGlob) => [fileGlob, suffixGlob]);
}

function componentConfigs(files: string[]): FlatConfig[] {
  const signalRules: RulesRecord = {
    '@angular-eslint/prefer-signals': 'error',
    '@angular-eslint/prefer-output-readonly': 'error',
    '@angular-eslint/prefer-output-emitter-ref': 'error',
  };
  const recommended = angularEslint.configs.tsRecommended.map((preset) => ({ ...preset, files }));
  return [...recommended, { files, rules: signalRules }, inlineTemplatesConfig(files)];
}

/** Lints inline `template:` strings with the template rules, as virtual `.html` files next to the component. */
function inlineTemplatesConfig(files: string[]): FlatConfig {
  const inlineTemplatesProcessor = angularEslint.processInlineTemplates;
  return inlineTemplatesProcessor === undefined ? { files } : { files, processor: inlineTemplatesProcessor };
}

/** rules/mvvm.md: a pure view, a view-model without Angular. */
function mvvmConfigs(files: string[]): FlatConfig[] {
  const viewModelImports: RuleEntry = [
    'error',
    {
      patterns: [
        {
          group: ['@angular/*'],
          message: 'A view-model is a pure function: no Angular, signals or effects. See rules/mvvm.md.',
        },
      ],
    },
  ];
  return [
    {
      files: filesWithSuffix(files, '**/*.view.ts'),
      plugins,
      rules: { '@ligeirinho/no-inject-in-view': 'error', '@ligeirinho/no-constructor-dependencies-in-view': 'error' },
    },
    { files: filesWithSuffix(files, '**/*.view-model.ts'), rules: { 'no-restricted-imports': viewModelImports } },
  ];
}

function templateConfigs(options: AngularOptions): FlatConfig[] {
  const templates = options.templates;
  const presets = [...angularEslint.configs.templateRecommended, ...angularEslint.configs.templateAccessibility];
  const rawElementsOptions = {
    elements: options.rawElements ?? defaultRawElements,
    designSystemAttributes: toAttributePatterns(options.designSystemAttributes ?? defaultDesignSystemAttributes),
  };
  const configs: FlatConfig[] = [
    ...presets.map((preset) => ({ ...preset, files: templates })),
    { files: templates, plugins, rules: { '@ligeirinho/no-raw-elements': ['error', rawElementsOptions] } },
  ];
  const designSystemPaths = options.designSystemPaths ?? [];
  if (designSystemPaths.length === 0) {
    return configs;
  }
  return [...configs, { files: designSystemPaths, plugins, rules: { '@ligeirinho/no-raw-elements': 'off' } }];
}

/** rules/mvvm.md: signals, pure view, view-model without Angular, raw elements only in the design system. */
export function angular(options: AngularOptions): FlatConfig[] {
  const configs = [...componentConfigs(options.files), ...mvvmConfigs(options.files), ...templateConfigs(options)];
  return applyAdoption(ignoreVendoredPaths(configs, options.vendoredPaths), options.adoption);
}
