import * as fs from 'node:fs';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { Document, Spectral } from '@stoplight/spectral-core';
import * as Parsers from '@stoplight/spectral-parsers';
import { bundleAndLoadRuleset } from '@stoplight/spectral-ruleset-bundler/with-loader';
import { describe, expect, test } from 'vitest';

const fixturesDir = path.join(import.meta.dirname, 'fixtures');

/** Loads the built package through a `.spectral.yaml`, the way `spectral lint` does. */
async function lintWithSpectralYaml(openApiFileName: string): Promise<string[]> {
  const ruleset = await bundleAndLoadRuleset(path.join(fixturesDir, '.spectral.yaml'), { fs, fetch });
  const spectral = new Spectral();
  spectral.setRuleset(ruleset);
  const openApiPath = path.join(fixturesDir, openApiFileName);
  const document = new Document(await readFile(openApiPath, 'utf8'), Parsers.Json, openApiPath);
  const diagnostics = await spectral.run(document);
  return diagnostics.map((diagnostic) => String(diagnostic.code));
}

describe('the ruleset loaded from a .spectral.yaml', () => {
  test('reports every broken rule of a bad contract, and skips /health', async () => {
    const codes = await lintWithSpectralYaml('bad-openapi.json');
    expect(new Set(codes)).toEqual(
      new Set([
        'ligeirinho-kebab-case-paths',
        'ligeirinho-no-verbs-in-paths',
        'ligeirinho-no-caller-names-in-paths',
        'ligeirinho-no-secrets-in-urls',
        'ligeirinho-created-location',
        'ligeirinho-create-responds-201',
        'ligeirinho-paginated-collections',
        'ligeirinho-problem-details-errors',
      ]),
    );
  });
});
