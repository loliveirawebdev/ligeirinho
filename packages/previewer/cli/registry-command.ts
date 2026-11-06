import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { parseArgs } from 'node:util';
import { collectScenarioExports, renderRegistry } from './registry-file.js';

export const USAGE = 'Usage: ligeirinho-preview-registry --root <dir> --out <file> [--check]';

export class InvalidRegistryArguments extends Error {
  override readonly name = 'InvalidRegistryArguments';

  constructor(reason: string) {
    super(`${reason}\n${USAGE}`);
  }
}

export interface RegistryArguments {
  readonly rootDirectory: string;
  readonly registryFilePath: string;
  readonly check: boolean;
}

export interface CommandOutcome {
  readonly exitCode: 0 | 1;
  readonly message: string;
}

/** @throws InvalidRegistryArguments */
export function parseRegistryArguments(commandLineArguments: readonly string[], workingDirectory: string): RegistryArguments {
  const { values } = parseCommandLine(commandLineArguments);
  if (values.root === undefined || values.out === undefined) {
    throw new InvalidRegistryArguments('Both --root and --out are required.');
  }
  return {
    rootDirectory: path.resolve(workingDirectory, values.root),
    registryFilePath: path.resolve(workingDirectory, values.out),
    check: values.check ?? false,
  };
}

function parseCommandLine(commandLineArguments: readonly string[]) {
  try {
    return parseArgs({
      args: [...commandLineArguments],
      options: { root: { type: 'string' }, out: { type: 'string' }, check: { type: 'boolean' } },
      strict: true,
      allowPositionals: false,
    });
  } catch (parseError: unknown) {
    throw new InvalidRegistryArguments(parseError instanceof Error ? parseError.message : String(parseError));
  }
}

export async function writeRegistry(registryArguments: RegistryArguments): Promise<CommandOutcome> {
  const expectedContent = await buildRegistryContent(registryArguments);
  await writeFile(registryArguments.registryFilePath, expectedContent, 'utf8');
  return { exitCode: 0, message: `Wrote ${registryArguments.registryFilePath}` };
}

export async function checkRegistry(registryArguments: RegistryArguments): Promise<CommandOutcome> {
  const expectedContent = await buildRegistryContent(registryArguments);
  const currentContent = await readFileIfPresent(registryArguments.registryFilePath);
  if (currentContent === expectedContent) {
    return { exitCode: 0, message: `${registryArguments.registryFilePath} is up to date.` };
  }
  return {
    exitCode: 1,
    message: `${registryArguments.registryFilePath} is out of date. Run ligeirinho-preview-registry without --check.`,
  };
}

async function buildRegistryContent(registryArguments: RegistryArguments): Promise<string> {
  const scenarioExports = await collectScenarioExports(
    registryArguments.rootDirectory,
    registryArguments.registryFilePath,
  );
  return renderRegistry(scenarioExports);
}

async function readFileIfPresent(filePath: string): Promise<string | null> {
  try {
    return await readFile(filePath, 'utf8');
  } catch (readError: unknown) {
    if (isFileNotFound(readError)) {
      return null;
    }
    throw readError;
  }
}

function isFileNotFound(readError: unknown): boolean {
  return readError instanceof Error && 'code' in readError && readError.code === 'ENOENT';
}
