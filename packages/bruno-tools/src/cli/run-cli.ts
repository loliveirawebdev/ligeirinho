import { parseArgs } from 'node:util';
import { checkDrift, type DriftReport } from '../drift/check-drift.js';
import { formatDriftProblem } from '../drift/drift-problem.js';
import {
  ensureGeneratedValuesAllowed,
  readEnvironmentValues,
  writeEnvironment,
} from '../environment/write-environment.js';
import { BrunoToolsError } from '../errors.js';
import { scaffoldRequests } from '../scaffold/scaffold-requests.js';

export interface CliOutput {
  info(line: string): void;
  error(line: string): void;
}

export const EXIT_OK = 0;
export const EXIT_FAILED = 1;
export const EXIT_USAGE = 2;

export const USAGE = `Usage: ligeirinho-bruno <command> [options]

Commands:
  drift     --openapi <file-or-url> --collection <dir>
            Fails when the collection and the OpenAPI document disagree.
  env       --collection <dir> --env <name> --values <json-file> [--force]
            Writes <dir>/environments/<name>.bru from a flat JSON object of strings.
            Only "local" is allowed unless --force.
  scaffold  --openapi <file-or-url> --collection <dir>
            Creates a request for every operation that has none. Never overwrites.

Options:
  -h, --help  Show this help.`;

class UsageError extends Error {}

const OPTIONS = {
  openapi: { type: 'string' },
  collection: { type: 'string' },
  env: { type: 'string' },
  values: { type: 'string' },
  force: { type: 'boolean', default: false },
  help: { type: 'boolean', short: 'h', default: false },
} as const;

type ParsedOptions = ReturnType<typeof parseOptions>['values'];

export async function runCli(argv: readonly string[], output: CliOutput): Promise<number> {
  try {
    return await dispatch(parseOptions(argv), output);
  } catch (error) {
    return reportError(error, output);
  }
}

function parseOptions(argv: readonly string[]) {
  try {
    return parseArgs({ args: [...argv], options: OPTIONS, allowPositionals: true, strict: true });
  } catch (error) {
    throw new UsageError(error instanceof Error ? error.message : String(error));
  }
}

async function dispatch(parsed: ReturnType<typeof parseOptions>, output: CliOutput): Promise<number> {
  const [command, ...extraPositionals] = parsed.positionals;
  if (parsed.values.help || command === undefined) {
    output.info(USAGE);
    return EXIT_OK;
  }
  if (extraPositionals.length > 0) {
    throw new UsageError(`unexpected argument "${extraPositionals.join(' ')}"`);
  }
  switch (command) {
    case 'drift':
      return runDrift(parsed.values, output);
    case 'env':
      return runEnv(parsed.values, output);
    case 'scaffold':
      return runScaffold(parsed.values, output);
    default:
      throw new UsageError(`unknown command "${command}"`);
  }
}

async function runDrift(options: ParsedOptions, output: CliOutput): Promise<number> {
  const report = await checkDrift({
    openapi: required(options.openapi, '--openapi'),
    collection: required(options.collection, '--collection'),
  });
  report.problems.forEach((problem) => {
    output.error(formatDriftProblem(problem));
  });
  output.info(summarize(report));
  return report.problems.length === 0 ? EXIT_OK : EXIT_FAILED;
}

function summarize(report: DriftReport): string {
  const counts = `${String(report.operationCount)} operations, ${String(report.requestCount)} requests (${String(report.flowRequestCount)} in flows/)`;
  return report.problems.length === 0
    ? `bruno drift: clean — ${counts}`
    : `bruno drift: ${String(report.problems.length)} problem(s) — ${counts}`;
}

async function runEnv(options: ParsedOptions, output: CliOutput): Promise<number> {
  const collection = required(options.collection, '--collection');
  const environmentName = required(options.env, '--env');
  const valuesFile = required(options.values, '--values');
  if (!options.force) {
    ensureGeneratedValuesAllowed(environmentName);
  }
  const written = await writeEnvironment(collection, environmentName, await readEnvironmentValues(valuesFile));
  output.info(`wrote ${written.filePath} (${String(written.variableCount)} variables)`);
  return EXIT_OK;
}

async function runScaffold(options: ParsedOptions, output: CliOutput): Promise<number> {
  const result = await scaffoldRequests({
    openapi: required(options.openapi, '--openapi'),
    collection: required(options.collection, '--collection'),
  });
  result.created.forEach((request) => {
    output.info(`created ${request.filePath} (${request.method.toUpperCase()} ${request.path})`);
  });
  result.skipped.forEach((request) => {
    output.error(`skipped ${request.filePath} (${request.method.toUpperCase()} ${request.path}): file already exists`);
  });
  output.info(`bruno scaffold: ${String(result.created.length)} created, ${String(result.skipped.length)} skipped`);
  return EXIT_OK;
}

function required(value: string | undefined, flag: string): string {
  if (value === undefined || value === '') {
    throw new UsageError(`missing ${flag}`);
  }
  return value;
}

function reportError(error: unknown, output: CliOutput): number {
  if (error instanceof UsageError) {
    output.error(`ligeirinho-bruno: ${error.message}`);
    output.error('Run "ligeirinho-bruno --help" for usage.');
    return EXIT_USAGE;
  }
  if (error instanceof BrunoToolsError) {
    output.error(`ligeirinho-bruno: ${error.message}`);
    return EXIT_FAILED;
  }
  throw error;
}
