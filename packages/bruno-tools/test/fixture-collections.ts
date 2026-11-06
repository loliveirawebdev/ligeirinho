import { cp, mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const FIXTURES_DIRECTORY = path.join(path.dirname(fileURLToPath(import.meta.url)), 'fixtures');

export const TASKS_OPENAPI = path.join(FIXTURES_DIRECTORY, 'tasks-api.yaml');
export const CLEAN_COLLECTION = path.join(FIXTURES_DIRECTORY, 'clean-collection');

const temporaryDirectories: string[] = [];

export async function createTemporaryDirectory(): Promise<string> {
  const directory = await mkdtemp(path.join(tmpdir(), 'bruno-tools-'));
  temporaryDirectories.push(directory);
  return directory;
}

export async function removeTemporaryDirectories(): Promise<void> {
  const directories = temporaryDirectories.splice(0);
  await Promise.all(directories.map((directory) => rm(directory, { recursive: true, force: true })));
}

/** A writable copy of the clean collection, to derive each drift scenario from. */
export async function copyCleanCollection(): Promise<string> {
  const collection = path.join(await createTemporaryDirectory(), 'bruno');
  await cp(CLEAN_COLLECTION, collection, { recursive: true });
  return collection;
}

export async function writeCollectionFile(collection: string, relativePath: string, content: string): Promise<void> {
  const filePath = path.join(collection, relativePath);
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, content, 'utf8');
}

export function httpRequestFile(method: string, url: string, bodyJson?: string): string {
  const methodBlock = `${method} {\n  url: ${url}\n  body: ${bodyJson === undefined ? 'none' : 'json'}\n  auth: bearer\n}`;
  const bodyBlock = bodyJson === undefined ? '' : `\n\nbody:json {\n${indent(bodyJson)}\n}`;
  return `meta {\n  name: ${method} ${url}\n  type: http\n  seq: 1\n}\n\n${methodBlock}${bodyBlock}\n`;
}

function indent(text: string): string {
  return text
    .split('\n')
    .map((line) => `  ${line}`)
    .join('\n');
}
