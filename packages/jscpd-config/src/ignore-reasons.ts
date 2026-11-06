import { glob, readFile, stat } from 'node:fs/promises';
import path from 'node:path';

export interface IgnoreWithoutReason {
  readonly filePath: string;
  /** 1-based. */
  readonly line: number;
}

const ignoreStartMarker = 'jscpd:ignore-start';

const commentClose = /(?:\*\/|-->)\s*$/;

/** `— reason`, `-- reason` or `: reason`. */
const reasonAfterMarker = /^\s*(?:—|--|:)\s*\S/;

export const checkedSourceFiles = '**/*.{ts,tsx,mts,cts,js,jsx,mjs,cjs,html,css,scss,sql,prisma,sh,yaml,yml}';

function hasReason(lineText: string): boolean {
  const textAfterMarker = lineText.slice(lineText.indexOf(ignoreStartMarker) + ignoreStartMarker.length);
  return reasonAfterMarker.test(textAfterMarker.replace(commentClose, ''));
}

/** 1-based lines of `source` with a `jscpd:ignore-start` that doesn't say why. */
export function linesWithIgnoreWithoutReason(source: string): number[] {
  return source.split('\n').flatMap((lineText, index) => {
    const isUnexplainedIgnore = lineText.includes(ignoreStartMarker) && !hasReason(lineText);
    return isUnexplainedIgnore ? [index + 1] : [];
  });
}

async function sourceFilesUnder(targetPath: string, ignorePatterns: readonly string[]): Promise<string[]> {
  if ((await stat(targetPath)).isFile()) {
    return [targetPath];
  }
  const sourceFiles: string[] = [];
  for await (const relativePath of glob(checkedSourceFiles, { cwd: targetPath, exclude: [...ignorePatterns] })) {
    sourceFiles.push(path.join(targetPath, relativePath));
  }
  return sourceFiles;
}

async function ignoresWithoutReasonIn(filePath: string): Promise<IgnoreWithoutReason[]> {
  const source = await readFile(filePath, 'utf8');
  return linesWithIgnoreWithoutReason(source).map((line) => ({ filePath, line }));
}

/** Every `jscpd:ignore-start` without a reason in the source files under `targetPaths`. */
export async function findIgnoresWithoutReason(
  targetPaths: readonly string[],
  ignorePatterns: readonly string[],
): Promise<IgnoreWithoutReason[]> {
  const filesPerTarget = await Promise.all(targetPaths.map((targetPath) => sourceFilesUnder(targetPath, ignorePatterns)));
  const findingsPerFile = await Promise.all(filesPerTarget.flat().map(ignoresWithoutReasonIn));
  return findingsPerFile.flat();
}
