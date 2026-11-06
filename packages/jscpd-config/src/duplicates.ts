import { createRequire } from 'node:module';
import type { JscpdOptions } from './jscpd-options.js';

type JscpdModule = typeof import('jscpd');

export type Clone = Awaited<ReturnType<JscpdModule['detectClones']>>[number];

function isJscpdModule(loadedModule: unknown): loadedModule is JscpdModule {
  return (
    typeof loadedModule === 'object' &&
    loadedModule !== null &&
    'detectClones' in loadedModule &&
    typeof loadedModule.detectClones === 'function'
  );
}

/**
 * jscpd 4.3.0's ESM build imports `colors/safe` without an extension and fails to load in Node, so the CommonJS
 * build is required instead.
 */
function loadJscpd(): JscpdModule {
  const loadedModule: unknown = createRequire(import.meta.url)('jscpd');
  if (!isJscpdModule(loadedModule)) {
    throw new TypeError('jscpd does not export detectClones');
  }
  return loadedModule;
}

/**
 * Runs jscpd on `targetPaths`. The `threshold` reporter is left out on purpose: it exits the process, and the CLI
 * decides the exit code itself (any clone fails).
 */
export async function findDuplicates(options: JscpdOptions, targetPaths: readonly string[]): Promise<Clone[]> {
  const { threshold: _threshold, ...optionsWithoutThreshold } = options;
  return loadJscpd().detectClones({ ...optionsWithoutThreshold, path: [...targetPaths] });
}
