import { mkdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { ESLint, type Linter } from 'eslint';
import {
  angular,
  base,
  nest,
  playwright,
  type AngularOptions,
  type BaseOptions,
} from '../src/index.js';

export const fixturesDir = path.join(import.meta.dirname, 'fixtures');

export interface LintedMessage {
  readonly ruleId: string | null;
  readonly severity: Linter.Severity;
  readonly message: string;
}

const angularOptions: AngularOptions = {
  files: ['apps/web/**/*.ts'],
  templates: ['apps/web/**/*.html', 'libs/ui/**/*.html'],
  designSystemPaths: ['libs/ui/**'],
};

function isConfigObject(config: unknown): boolean {
  return typeof config === 'object' && config !== null && !Array.isArray(config);
}

/**
 * The factories return typescript-eslint's config type, which ESLint runs as is but its `Linter.Config` type
 * rejects (an interface without index signature); this guard bridges the two in the tests.
 */
function isLinterConfigArray(configs: unknown): configs is Linter.Config[] {
  return Array.isArray(configs) && configs.every(isConfigObject);
}

export function toLinterConfigs(configs: unknown): Linter.Config[] {
  if (!isLinterConfigArray(configs)) {
    throw new TypeError('Expected an array of flat config objects');
  }
  return configs;
}

/** The project config from the template's `eslint.config.mjs`, minus boundaries (they need an Nx graph). */
export function projectConfig(adoption = false): Linter.Config[] {
  const baseOptions: BaseOptions = { tsconfigRootDir: fixturesDir, adoption };
  return toLinterConfigs([
    ...base(baseOptions),
    ...angular({ ...angularOptions, adoption }),
    ...nest({ files: ['apps/api/**/*.ts'], adoption }),
    ...playwright({ files: ['apps/e2e/**/*.ts'], adoption }),
  ]);
}

/**
 * Lints `code` as the file `relativeFilePath` of the fixtures project. The file is written to disk for the duration
 * of the lint because typescript-eslint's project service only types files that exist.
 */
export async function lintFixture(
  relativeFilePath: string,
  code: string,
  overrideConfig: Linter.Config[] = projectConfig(),
): Promise<LintedMessage[]> {
  const filePath = path.join(fixturesDir, relativeFilePath);
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, code);
  try {
    const eslint = new ESLint({ cwd: fixturesDir, overrideConfigFile: true, overrideConfig });
    const [lintResult] = await eslint.lintFiles([filePath]);
    return (lintResult?.messages ?? []).map(({ ruleId, severity, message }) => ({ ruleId, severity, message }));
  } finally {
    await rm(filePath);
  }
}

export function ruleIdsOf(messages: readonly LintedMessage[]): (string | null)[] {
  return messages.map((lintedMessage) => lintedMessage.ruleId);
}
