import { readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { EXIT_FAILED, EXIT_OK, EXIT_USAGE, runCli, type CliOutput } from '../src/cli/run-cli.js';
import {
  CLEAN_COLLECTION,
  TASKS_OPENAPI,
  copyCleanCollection,
  createTemporaryDirectory,
  removeTemporaryDirectories,
} from './fixture-collections.js';

afterEach(removeTemporaryDirectories);

class InMemoryOutput implements CliOutput {
  readonly infoLines: string[] = [];
  readonly errorLines: string[] = [];

  info(line: string): void {
    this.infoLines.push(line);
  }

  error(line: string): void {
    this.errorLines.push(line);
  }
}

async function run(...argv: string[]): Promise<{ exitCode: number; output: InMemoryOutput }> {
  const output = new InMemoryOutput();
  const exitCode = await runCli(argv, output);
  return { exitCode, output };
}

async function writeValues(values: unknown): Promise<string> {
  const valuesFile = path.join(await createTemporaryDirectory(), 'values.json');
  await writeFile(valuesFile, JSON.stringify(values), 'utf8');
  return valuesFile;
}

describe('ligeirinho-bruno', () => {
  it('prints the usage with --help or without a command', async () => {
    for (const argv of [['--help'], []]) {
      const { exitCode, output } = await run(...argv);
      expect(exitCode).toBe(EXIT_OK);
      expect(output.infoLines.join('\n')).toContain('Usage: ligeirinho-bruno <command>');
    }
  });

  it('exits 2 on an unknown command or a missing option', async () => {
    expect((await run('sync')).exitCode).toBe(EXIT_USAGE);
    expect((await run('drift', '--openapi', TASKS_OPENAPI)).output.errorLines[0]).toBe(
      'ligeirinho-bruno: missing --collection',
    );
    expect((await run('drift', '--unknown')).exitCode).toBe(EXIT_USAGE);
  });

  it('drift: exits 0 with a one-line summary when clean', async () => {
    const { exitCode, output } = await run('drift', '--openapi', TASKS_OPENAPI, '--collection', CLEAN_COLLECTION);

    expect(exitCode).toBe(EXIT_OK);
    expect(output.errorLines).toEqual([]);
    expect(output.infoLines).toEqual(['bruno drift: clean — 6 operations, 7 requests (1 in flows/)']);
  });

  it('drift: exits 1 and lists every problem', async () => {
    const collection = await copyCleanCollection();
    await rm(path.join(collection, 'tasks', 'create-task.bru'));

    const { exitCode, output } = await run('drift', '--openapi', TASKS_OPENAPI, '--collection', collection);

    expect(exitCode).toBe(EXIT_FAILED);
    expect(output.errorLines).toEqual(['missing request: POST /tasks']);
  });

  it('drift: exits 1 when the OpenAPI document cannot be read', async () => {
    const { exitCode, output } = await run('drift', '--openapi', '/nowhere.yaml', '--collection', CLEAN_COLLECTION);

    expect(exitCode).toBe(EXIT_FAILED);
    expect(output.errorLines[0]).toMatch(/^ligeirinho-bruno: cannot read OpenAPI document \/nowhere\.yaml/);
  });

  it('env: writes the local environment', async () => {
    const collection = await createTemporaryDirectory();
    const valuesFile = await writeValues({ token: 't', baseUrl: 'http://localhost:3000' });

    const { exitCode } = await run('env', '--collection', collection, '--env', 'local', '--values', valuesFile);

    expect(exitCode).toBe(EXIT_OK);
    expect(await readFile(path.join(collection, 'environments', 'local.bru'), 'utf8')).toBe(
      'vars {\n  baseUrl: http://localhost:3000\n  token: t\n}\n',
    );
  });

  it('env: refuses other environments unless --force', async () => {
    const collection = await createTemporaryDirectory();
    const valuesFile = await writeValues({ token: 't' });

    const refused = await run('env', '--collection', collection, '--env', 'prod', '--values', valuesFile);
    const forced = await run('env', '--collection', collection, '--env', 'prod', '--values', valuesFile, '--force');

    expect(refused.exitCode).toBe(EXIT_FAILED);
    expect(refused.output.errorLines[0]).toContain('refusing to write generated values to the "prod" environment');
    expect(forced.exitCode).toBe(EXIT_OK);
  });

  it('scaffold: prints what it created', async () => {
    const collection = await copyCleanCollection();
    await rm(path.join(collection, 'health', 'get-health.bru'));

    const { exitCode, output } = await run('scaffold', '--openapi', TASKS_OPENAPI, '--collection', collection);

    expect(exitCode).toBe(EXIT_OK);
    expect(output.infoLines).toEqual([
      `created ${path.join(collection, 'health', 'get-health.bru')} (GET /health)`,
      'bruno scaffold: 1 created, 0 skipped',
    ]);
  });
});
