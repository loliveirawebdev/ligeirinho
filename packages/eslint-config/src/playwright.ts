import playwrightPlugin from 'eslint-plugin-playwright';
import { applyAdoption, type AdoptionOption } from './adoption.js';
import { ligeirinhoPlugin, ligeirinhoPluginPrefix } from './ligeirinho-plugin.js';
import type { FlatConfig } from './flat-config.js';

export interface PlaywrightOptions extends AdoptionOption {
  /** The e2e test files, e.g. `['apps/e2e/**\/*.ts']`. */
  readonly files: string[];
}

/** rules/e2e.md: by role and accessible text, never by CSS class; no sleep. */
export function playwright(options: PlaywrightOptions): FlatConfig[] {
  const files = options.files;
  const configs: FlatConfig[] = [
    { ...playwrightPlugin.configs['flat/recommended'], files },
    {
      files,
      plugins: { [ligeirinhoPluginPrefix]: ligeirinhoPlugin },
      rules: {
        'playwright/no-wait-for-timeout': 'error',
        'playwright/prefer-native-locators': 'error',
        '@ligeirinho/no-css-class-locator': 'error',
      },
    },
  ];
  return applyAdoption(configs, options.adoption);
}
