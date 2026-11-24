#!/usr/bin/env node
import { asksForEntryIds, printEntryIds } from './entry-ids.js';
import { InvalidRegistryArguments, checkRegistry, parseRegistryArguments, writeRegistry } from './registry-command.js';
import { DuplicateScenarioExportName } from './registry-file.js';

async function main(): Promise<void> {
  const commandLineArguments = process.argv.slice(2);
  const outcome = asksForEntryIds(commandLineArguments)
    ? await printEntryIds(commandLineArguments, process.cwd())
    : await runRegistry(commandLineArguments);
  const stream = outcome.exitCode === 0 ? process.stdout : process.stderr;
  stream.write(`${outcome.message}\n`);
  process.exitCode = outcome.exitCode;
}

async function runRegistry(commandLineArguments: readonly string[]) {
  const registryArguments = parseRegistryArguments(commandLineArguments, process.cwd());
  return registryArguments.check ? checkRegistry(registryArguments) : writeRegistry(registryArguments);
}

main().catch((commandError: unknown) => {
  if (commandError instanceof InvalidRegistryArguments || commandError instanceof DuplicateScenarioExportName) {
    process.stderr.write(`${commandError.message}\n`);
    process.exitCode = 2;
    return;
  }
  throw commandError;
});
