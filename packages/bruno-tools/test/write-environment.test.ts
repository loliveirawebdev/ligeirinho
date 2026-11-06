import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import {
  InvalidEnvironmentValues,
  NonLocalEnvironmentRefused,
  ensureGeneratedValuesAllowed,
  findBlock,
  parseBruFile,
  readEnvironmentValues,
  validateEnvironmentValues,
  writeEnvironment,
} from '../src/index.js';
import { createTemporaryDirectory, removeTemporaryDirectories } from './fixture-collections.js';

afterEach(removeTemporaryDirectories);

describe('writeEnvironment', () => {
  it('writes environments/<name>.bru with keys sorted, creating the folder', async () => {
    const collection = await createTemporaryDirectory();

    const written = await writeEnvironment(collection, 'local', {
      token: 'test-token',
      baseUrl: 'http://localhost:3000',
      adminToken: 'admin-test-token',
    });

    expect(written).toEqual({ filePath: path.join(collection, 'environments', 'local.bru'), variableCount: 3 });
    expect(await readFile(written.filePath, 'utf8')).toBe(
      'vars {\n  adminToken: admin-test-token\n  baseUrl: http://localhost:3000\n  token: test-token\n}\n',
    );
  });

  it('writes a file the Bruno parser reads back', async () => {
    const collection = await createTemporaryDirectory();

    const written = await writeEnvironment(collection, 'local', { baseUrl: 'http://localhost:3000/api?x=1' });

    const vars = findBlock(parseBruFile(await readFile(written.filePath, 'utf8')), 'vars');
    expect(vars).toMatchObject({ entries: [{ key: 'baseUrl', value: 'http://localhost:3000/api?x=1' }] });
  });

  it('overwrites an existing environment file', async () => {
    const collection = await createTemporaryDirectory();
    await writeEnvironment(collection, 'local', { token: 'old', stale: 'yes' });

    const written = await writeEnvironment(collection, 'local', { token: 'new' });

    expect(await readFile(written.filePath, 'utf8')).toBe('vars {\n  token: new\n}\n');
  });

  it('refuses an environment name that would escape the folder', async () => {
    const collection = await createTemporaryDirectory();

    await expect(writeEnvironment(collection, '../local', {})).rejects.toThrow(InvalidEnvironmentValues);
  });
});

describe('ensureGeneratedValuesAllowed', () => {
  it('allows local', () => {
    expect(() => {
      ensureGeneratedValuesAllowed('local');
    }).not.toThrow();
  });

  it.each(['dev', 'prod'])('refuses %s', (environmentName) => {
    expect(() => {
      ensureGeneratedValuesAllowed(environmentName);
    }).toThrow(NonLocalEnvironmentRefused);
  });
});

describe('environment values', () => {
  it('reads a flat JSON object of strings', async () => {
    const valuesFile = path.join(await createTemporaryDirectory(), 'values.json');
    await writeFile(valuesFile, JSON.stringify({ baseUrl: 'http://localhost:3000', token: 't' }), 'utf8');

    expect(await readEnvironmentValues(valuesFile)).toEqual({ baseUrl: 'http://localhost:3000', token: 't' });
  });

  it('fails on a file that is not JSON', async () => {
    const valuesFile = path.join(await createTemporaryDirectory(), 'values.json');
    await writeFile(valuesFile, 'baseUrl=x', 'utf8');

    await expect(readEnvironmentValues(valuesFile)).rejects.toThrow(InvalidEnvironmentValues);
  });

  it.each([
    ['an array', ['x']],
    ['a nested object', { nested: { token: 'x' } }],
    ['a number value', { port: 3000 }],
    ['a multiline value', { token: 'a\nb' }],
    ['an invalid key', { 'bad key': 'x' }],
  ])('refuses %s', (_description, candidate) => {
    expect(() => validateEnvironmentValues(candidate)).toThrow(InvalidEnvironmentValues);
  });
});
