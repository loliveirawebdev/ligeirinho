#!/usr/bin/env node
import { InvalidRegistryArguments, checkRegistry, parseRegistryArguments, writeRegistry } from './registry-command.js';
import { DuplicateScenarioExportName } from './registry-file.js';

async function main(): Promise<void> {
  const registryArguments = parseRegistryArguments(process.argv.slice(2), process.cwd());
  const outcome = registryArguments.check
    ? await checkRegistry(registryArguments)
    : await writeRegistry(registryArguments);
  const stream = outcome.exitCode === 0 ? process.stdout : process.stderr;
  stream.write(`${outcome.message}\n`);
  process.exitCode = outcome.exitCode;
}

main().catch((commandError: unknown) => {
  if (commandError instanceof InvalidRegistryArguments || commandError instanceof DuplicateScenarioExportName) {
    process.stderr.write(`${commandError.message}\n`);
    process.exitCode = 2;
    return;
  }
  throw commandError;
});
