import path from 'node:path';
import { findDuplicates } from './duplicates.js';
import { findIgnoresWithoutReason, type IgnoreWithoutReason } from './ignore-reasons.js';
import { loadJscpdOptions } from './jscpd-options.js';

export interface JscpdRun {
  /** Paths to check, relative to `projectDir`. Defaults to the whole project. */
  readonly targetPaths: readonly string[];
  readonly projectDir: string;
  readonly reportProblem: (problem: string) => void;
}

export const exitCodes = { clean: 0, problemsFound: 1 } as const;

function describeIgnore(projectDir: string, ignore: IgnoreWithoutReason): string {
  const location = `${path.relative(projectDir, ignore.filePath)}:${String(ignore.line)}`;
  return `${location}: jscpd:ignore-start needs a reason on the same line (// jscpd:ignore-start — <reason>)`;
}

/** rules/architecture.md "One owner per pattern": no literal copies, and every ignore says why. */
export async function runLigeirinhoJscpd(run: JscpdRun): Promise<number> {
  const options = await loadJscpdOptions(run.projectDir);
  const relativeTargets = run.targetPaths.length === 0 ? ['.'] : run.targetPaths;
  const targetPaths = relativeTargets.map((targetPath) => path.resolve(run.projectDir, targetPath));
  const ignoresWithoutReason = await findIgnoresWithoutReason(targetPaths, options.ignore ?? []);
  ignoresWithoutReason.forEach((ignore) => {
    run.reportProblem(describeIgnore(run.projectDir, ignore));
  });
  const clones = await findDuplicates(options, targetPaths);
  if (clones.length > 0) {
    run.reportProblem(`${String(clones.length)} copy-paste clone(s): extract each into one owner (rules/architecture.md).`);
  }
  const hasProblems = clones.length > 0 || ignoresWithoutReason.length > 0;
  return hasProblems ? exitCodes.problemsFound : exitCodes.clean;
}
