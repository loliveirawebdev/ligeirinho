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
];

/** rules/architecture.md "One module per business area": an area only sees itself and the shared area. */
export function areaConstraints(areas: readonly string[]): DependencyConstraint[] {
  const sharedConstraint = { sourceTag: 'area:shared', onlyDependOnLibsWithTags: ['area:shared'] };
  const constraints = areas.map((area) => ({
    sourceTag: `area:${area}`,
    onlyDependOnLibsWithTags: [`area:${area}`, 'area:shared'],
  }));
  return [...constraints, sharedConstraint];
}

const defaultFiles = ['**/*.ts', '**/*.mts', '**/*.cts', '**/*.tsx', '**/*.js', '**/*.mjs', '**/*.cjs'];

export function boundaries(options: BoundariesOptions): FlatConfig[] {
  const depConstraints = [...layerConstraints, ...areaConstraints(options.areas)];
  const configs: FlatConfig[] = [
    {
      files: options.files ?? defaultFiles,
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
