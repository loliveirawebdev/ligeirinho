import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

// rules/design.md "Reuse first": a pattern is only in the catalog when the next screen can find it, see it and test
// with it. Every component folder ships its docs row, scenarios, harness and tests, and is exported.

const libraryRoot = join(import.meta.dirname, '..');
const componentsRoot = join(import.meta.dirname, 'lib');
const NOT_COMPONENTS = new Set(['copy']);

const components = readdirSync(componentsRoot, { withFileTypes: true })
  .filter((entry) => entry.isDirectory() && !NOT_COMPONENTS.has(entry.name))
  .map((entry) => entry.name);

function read(...path: string[]): string {
  return readFileSync(join(...path), 'utf8');
}

describe('the catalog', () => {
  it('has components', () => {
    expect(components.length).toBeGreaterThan(0);
  });

  it.each(components)('%s ships its component, template, scenarios, harness and tests', (name) => {
    // A directive (`uiMask`) has no template of its own; a component always has one.
    const isDirective = !read(componentsRoot, name, `${name}.ts`).includes('@Component(');
    const suffixes = ['.ts', ...(isDirective ? [] : ['.html']), '.scenarios.ts', '.harness.ts', '.spec.ts'];
    const missing = suffixes.filter((suffix) => !existsSync(join(componentsRoot, name, `${name}${suffix}`)));
    expect(missing).toEqual([]);
  });

  it.each(components)('%s is documented in README.md and exported', (name) => {
    expect(read(libraryRoot, 'README.md')).toContain(`\`ui-${name}\``);
    expect(read(import.meta.dirname, 'index.ts')).toContain(`./lib/${name}/${name}'`);
    expect(read(import.meta.dirname, 'testing', 'index.ts')).toContain(`../lib/${name}/${name}.harness'`);
  });
});
