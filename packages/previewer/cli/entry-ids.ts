import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { parseArgs } from 'node:util';
import { type CommandOutcome, InvalidRegistryArguments } from './registry-command.js';
import { findScenarioFiles } from './registry-file.js';

export const ENTRIES_USAGE = 'Usage: ligeirinho-preview-registry --entries-in <dir> [--entries-in <dir>…]';

const DEFINE_SCENARIOS_CALL = /defineScenarios\s*[<(]/g;
const TITLE_PROPERTY = /\btitle\s*:\s*(['"`])((?:(?!\1)[^\\$]|\\.)*)\1/;

/**
 * 'Task list' → 'task-list', 'TaskList' → 'task-list'. The same as the library's `toEntryId` (the CLI is built on
 * its own, so it keeps a copy; registry-cli.spec.ts checks the two agree).
 */
export function toEntryId(title: string): string {
  return title
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** The title of each `defineScenarios` call in a file, in order; null when it isn't a plain string literal. */
export function findEntryTitles(sourceText: string): (string | null)[] {
  const callStarts = [...sourceText.matchAll(DEFINE_SCENARIOS_CALL)].map((match) => match.index);
  return callStarts.map((start, index) => {
    const end = callStarts[index + 1] ?? sourceText.length;
    const title = TITLE_PROPERTY.exec(sourceText.slice(start, end));
    return title?.[2] ?? null;
  });
}

/** The entry ids of every scenarios file under the given folders, sorted; folders that don't exist are skipped. */
export async function listEntryIds(
  directories: readonly string[],
): Promise<{ readonly ids: string[]; readonly unreadable: string[] }> {
  const ids = new Set<string>();
  const unreadable: string[] = [];
  for (const directory of directories) {
    for (const scenariosFile of await findScenarioFilesIfPresent(directory)) {
      for (const title of findEntryTitles(await readFile(scenariosFile, 'utf8'))) {
        if (title === null) {
          unreadable.push(scenariosFile);
        } else {
          ids.add(toEntryId(title));
        }
      }
    }
  }
  return { ids: [...ids].sort(), unreadable };
}

async function findScenarioFilesIfPresent(directory: string): Promise<string[]> {
  try {
    return await findScenarioFiles(directory);
  } catch (readError: unknown) {
    if (readError instanceof Error && 'code' in readError && readError.code === 'ENOENT') {
      return [];
    }
    throw readError;
  }
}

/** Whether the command line asks for entry ids rather than a registry. */
export function asksForEntryIds(commandLineArguments: readonly string[]): boolean {
  return commandLineArguments.includes('--entries-in');
}

/**
 * Prints the entry ids under the folders, comma separated (empty when there are none), for a gate that checks only
 * the screens a change touched. Exits 1 when a title isn't a plain string, so the gate checks every screen instead.
 */
export async function printEntryIds(commandLineArguments: readonly string[], workingDirectory: string): Promise<CommandOutcome> {
  const directories = parseEntriesArguments(commandLineArguments).map((directory) => path.resolve(workingDirectory, directory));
  const { ids, unreadable } = await listEntryIds(directories);
  if (unreadable.length > 0) {
    return {
      exitCode: 1,
      message: `Can't read the title of a defineScenarios call (not a plain string) in: ${unreadable.join(', ')}.`,
    };
  }
  return { exitCode: 0, message: ids.join(',') };
}

/** @throws InvalidRegistryArguments */
function parseEntriesArguments(commandLineArguments: readonly string[]): string[] {
  try {
    const { values } = parseArgs({
      args: [...commandLineArguments],
      options: { 'entries-in': { type: 'string', multiple: true } },
      strict: true,
      allowPositionals: false,
    });
    return values['entries-in'] ?? [];
  } catch (parseError: unknown) {
    throw new InvalidRegistryArguments(parseError instanceof Error ? parseError.message : String(parseError));
  }
}
