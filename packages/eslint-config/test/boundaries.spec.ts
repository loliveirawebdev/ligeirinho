import { describe, expect, test } from 'vitest';
import { boundaries } from '../src/index.js';

function depConstraintsOf(adoption: boolean): { severity: unknown; constraints: unknown } {
  const [boundariesConfig] = boundaries({ areas: ['tasks', 'registrations'], adoption });
  const ruleEntry = boundariesConfig?.rules?.['@nx/enforce-module-boundaries'];
  if (!Array.isArray(ruleEntry)) {
    return { severity: ruleEntry, constraints: undefined };
  }
  const [severity, ruleOptions] = ruleEntry;
  const constraints: unknown =
    typeof ruleOptions === 'object' && ruleOptions !== null && 'depConstraints' in ruleOptions
      ? ruleOptions.depConstraints
      : undefined;
  return { severity, constraints };
}

describe('boundaries: rules/architecture.md', () => {
  test('layers point inward and areas only see themselves and shared', () => {
    const { severity, constraints } = depConstraintsOf(false);
    expect(severity).toBe('error');
    expect(constraints).toEqual([
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
      { sourceTag: 'area:tasks', onlyDependOnLibsWithTags: ['area:tasks', 'area:shared'] },
      { sourceTag: 'area:registrations', onlyDependOnLibsWithTags: ['area:registrations', 'area:shared'] },
      { sourceTag: 'area:shared', onlyDependOnLibsWithTags: ['area:shared'] },
    ]);
  });

  test('adoption keeps the constraints and warns', () => {
    const { severity, constraints } = depConstraintsOf(true);
    expect(severity).toBe('warn');
    expect(constraints).toEqual(depConstraintsOf(false).constraints);
  });
});
