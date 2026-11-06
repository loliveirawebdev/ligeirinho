import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { InvalidEnvironmentValues, NonLocalEnvironmentRefused } from '../errors.js';
import { isJsonRecord } from '../openapi/json-record.js';

export const LOCAL_ENVIRONMENT = 'local';
const ENVIRONMENTS_FOLDER = 'environments';
const VARIABLE_NAME = /^[A-Za-z_][\w.-]*$/;
const ENVIRONMENT_NAME = /^[\w.-]+$/;

export type EnvironmentValues = Readonly<Record<string, string>>;

export interface WrittenEnvironment {
  readonly filePath: string;
  readonly variableCount: number;
}

/** Writes (overwriting) `<collection>/environments/<name>.bru` with the values, keys sorted. */
export async function writeEnvironment(
  collectionDirectory: string,
  environmentName: string,
  values: EnvironmentValues,
): Promise<WrittenEnvironment> {
  if (!ENVIRONMENT_NAME.test(environmentName)) {
    throw new InvalidEnvironmentValues(`"${environmentName}" is not a valid environment name`);
  }
  const environmentsDirectory = path.join(collectionDirectory, ENVIRONMENTS_FOLDER);
  const filePath = path.join(environmentsDirectory, `${environmentName}.bru`);
  await mkdir(environmentsDirectory, { recursive: true });
  await writeFile(filePath, renderEnvironment(values), 'utf8');
  return { filePath, variableCount: Object.keys(values).length };
}

/** Only `local` holds generated test values; every other environment is written by hand. */
export function ensureGeneratedValuesAllowed(environmentName: string): void {
  if (environmentName !== LOCAL_ENVIRONMENT) {
    throw new NonLocalEnvironmentRefused(environmentName);
  }
}

export function renderEnvironment(values: EnvironmentValues): string {
  const lines = Object.keys(values)
    .sort()
    .map((key) => `  ${key}: ${values[key] ?? ''}`);
  return ['vars {', ...lines, '}', ''].join('\n');
}

/** Reads and validates a flat JSON object of string values. */
export async function readEnvironmentValues(valuesFile: string): Promise<EnvironmentValues> {
  const text = await readFile(valuesFile, 'utf8').catch((cause: unknown) => {
    throw new InvalidEnvironmentValues(`cannot read ${valuesFile} (${String(cause)})`);
  });
  return validateEnvironmentValues(parseJson(text, valuesFile));
}

export function validateEnvironmentValues(candidate: unknown): EnvironmentValues {
  if (!isJsonRecord(candidate)) {
    throw new InvalidEnvironmentValues('expected a flat JSON object');
  }
  const values: Record<string, string> = {};
  for (const [key, value] of Object.entries(candidate)) {
    values[key] = validateEntry(key, value);
  }
  return values;
}

function validateEntry(key: string, value: unknown): string {
  if (!VARIABLE_NAME.test(key)) {
    throw new InvalidEnvironmentValues(`"${key}" is not a valid variable name`);
  }
  if (typeof value !== 'string') {
    throw new InvalidEnvironmentValues(`"${key}" must be a string`);
  }
  if (/[\r\n]/.test(value)) {
    throw new InvalidEnvironmentValues(`"${key}" must be a single line`);
  }
  return value;
}

function parseJson(text: string, valuesFile: string): unknown {
  try {
    return JSON.parse(text);
  } catch (cause) {
    throw new InvalidEnvironmentValues(`${valuesFile} is not valid JSON (${String(cause)})`);
  }
}
