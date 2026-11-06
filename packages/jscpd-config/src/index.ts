export { findDuplicates, type Clone } from './duplicates.js';
export {
  checkedSourceFiles,
  findIgnoresWithoutReason,
  linesWithIgnoreWithoutReason,
  type IgnoreWithoutReason,
} from './ignore-reasons.js';
export {
  loadJscpdOptions,
  mergeOptions,
  projectConfigFileName,
  sharedConfigPath,
  type JscpdOptions,
} from './jscpd-options.js';
export { exitCodes, runLigeirinhoJscpd, type JscpdRun } from './run-ligeirinho-jscpd.js';
