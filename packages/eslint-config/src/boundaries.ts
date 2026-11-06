import nxPlugin from '@nx/eslint-plugin';
import { applyAdoption, type AdoptionOption } from './adoption.js';
import type { FlatConfig } from './flat-config.js';

export interface BoundariesOptions extends AdoptionOption {
  /** Business areas, each one tagged `area:<name>` in Nx, e.g. `['tasks', 'registrations']`. */
  readonly areas: readonly string[];
  /** Files the boundaries are checked on. Defaults to every TypeScript and JavaScript file. */
  readonly files?: string[];
}

export interface DependencyConstraint {
  readonly sourceTag: string;
  readonly onlyDependOnLibsWithTags: string[];
}

/** rules/architecture.md "Fixed layers, dependencies point inward only". */
export const layerConstraints: readonly DependencyConstraint[] = [
  { sourceTag: 'layer:domain', onlyDependOnLibsWithTags: ['layer:domain'] },
  { sourceTag: 'layer:application', onlyDependOnLibsWithTags: ['layer:domain', 'layer:application'] },
  {
    sourceTag: 'layer:infrastructure',
    onlyDependOnLibsWithTags: ['layer:domain', 'layer:application', 'layer:infrastructure'],
  },
  {
    sourceTag: 'layer:presentation',
    onlyDependOnLibsWithTags: ['layer:domain', 'layer:application', 'layer:presentation', 'type:ui'],
  },
  { sourceTag: 'type:app', onlyDependOnLibsWithTags: ['*'] },
  { sourceTag: 'type:e2e', onlyDependOnLibsWithTags: ['*'] },
  // Design-system components (Spartan) only build on each other.
  { sourceTag: 'type:ui', onlyDependOnLibsWithTags: ['type:ui'] },
];

/** rules/architecture.md "One module per business area": an area only sees itself and the shared area. */
export function areaConstraints(areas: readonly string[]): DependencyConstraint[] {
  // `type:ui` (the design system) belongs to no area, so every area can use it.
  const sharedConstraint = { sourceTag: 'area:shared', onlyDependOnLibsWithTags: ['area:shared', 'type:ui'] };
  const constraints = areas.map((area) => ({
    sourceTag: `area:${area}`,
    onlyDependOnLibsWithTags: [`area:${area}`, 'area:shared', 'type:ui'],
  }));
  return [...constraints, sharedConstraint];
}

const defaultFiles = ['**/*.ts', '**/*.mts', '**/*.cts', '**/*.tsx', '**/*.js', '**/*.mjs', '**/*.cjs'];

export function boundaries(options: BoundariesOptions): FlatConfig[] {
  const depConstraints = [...layerConstraints, ...areaConstraints(options.areas)];
  const configs: FlatConfig[] = [
    {
      files: options.files ?? defaultFiles,
      // Tool configs (vitest.config.mts, playwright.config.mts) import shared presets by relative path.
      ignores: ['**/*.config.*'],
      plugins: { '@nx': nxPlugin },
      rules: {
        '@nx/enforce-module-boundaries': [
          'error',
          { enforceBuildableLibDependency: true, allow: [], depConstraints },
        ],
      },
    },
  ];
  return applyAdoption(configs, options.adoption);
}
