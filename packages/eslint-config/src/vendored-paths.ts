import type { FlatConfig } from './flat-config.js';

export interface VendoredPathsOption {
  /**
   * Generated or copied-in code the project doesn't own (Spartan's helm components): style, naming and design
   * system rules don't apply there. Defaults to `['libs/ui/spartan/**']`.
   */
  readonly vendoredPaths?: string[];
}

export const defaultVendoredPaths: readonly string[] = ['libs/ui/spartan/**'];

export function ignoreVendoredPaths(configs: FlatConfig[], vendoredPaths: readonly string[] | undefined): FlatConfig[] {
  const ignoredPaths = vendoredPaths ?? defaultVendoredPaths;
  if (ignoredPaths.length === 0) {
    return configs;
  }
  return configs.map((config) => ({ ...config, ignores: [...(config.ignores ?? []), ...ignoredPaths] }));
}
