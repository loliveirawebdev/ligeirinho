import type { ESLint } from 'eslint';
import { noGenericNames } from './rules/no-generic-names.js';
import { noRawElements } from './rules/no-raw-elements.js';
import {
  noConstructorDependenciesInView,
  noCssClassLocator,
  noInjectInView,
  noNewError,
  noSystemClock,
  noViMock,
} from './rules/restricted-syntax-rules.js';

/** Registered under the `@ligeirinho` prefix: `@ligeirinho/no-raw-elements`, `@ligeirinho/no-new-error`… */
export const ligeirinhoPlugin = {
  meta: { name: '@ligeirinho/eslint-plugin', version: '0.1.0' },
  rules: {
    'no-raw-elements': noRawElements,
    'no-generic-names': noGenericNames,
    'no-new-error': noNewError,
    'no-vi-mock': noViMock,
    'no-inject-in-view': noInjectInView,
    'no-constructor-dependencies-in-view': noConstructorDependenciesInView,
    'no-css-class-locator': noCssClassLocator,
    'no-system-clock': noSystemClock,
  },
} satisfies ESLint.Plugin;

export const ligeirinhoPluginPrefix = '@ligeirinho';
