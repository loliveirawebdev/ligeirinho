import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
type JscpdModule = typeof import('jscpd');

export type JscpdOptions = Parameters<JscpdModule['detectClones']>[0];

/** The file a project uses to add to (never replace) the shared ignores, e.g. a vendored folder. */
export const projectConfigFileName = '.jscpd.json';

export const sharedConfigPath = new URL('../jscpd.json', import.meta.url);

function isJscpdOptions(parsedJson: unknown): parsedJson is JscpdOptions {
  return typeof parsedJson === 'object' && parsedJson !== null && !Array.isArray(parsedJson);
}

async function readOptionsFile(filePath: string | URL): Promise<JscpdOptions> {
  const parsedJson: unknown = JSON.parse(await readFile(filePath, 'utf8'));
  return isJscpdOptions(parsedJson) ? parsedJson : {};
}

export function mergeOptions(sharedOptions: JscpdOptions, projectOptions: JscpdOptions): JscpdOptions {
  return {
    ...sharedOptions,
    ...projectOptions,
    ignore: [...(sharedOptions.ignore ?? []), ...(projectOptions.ignore ?? [])],
  };
}

/** The shared config merged with the project's `.jscpd.json`, when `projectDir` has one. */
export async function loadJscpdOptions(projectDir: string): Promise<JscpdOptions> {
  const sharedOptions = await readOptionsFile(sharedConfigPath);
  const projectConfigPath = path.join(projectDir, projectConfigFileName);
  if (!existsSync(projectConfigPath)) {
    return sharedOptions;
  }
  return mergeOptions(sharedOptions, await readOptionsFile(projectConfigPath));
}
