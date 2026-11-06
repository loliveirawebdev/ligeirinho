import type { TSESLint } from '@typescript-eslint/utils';

/**
 * typescript-eslint's flat config type. The typescript-eslint and angular-eslint presets are typed with it, and
 * ESLint accepts it as is; ESLint's own `Linter.Config` type rejects those presets under
 * `exactOptionalPropertyTypes`.
 */
export type FlatConfig = TSESLint.FlatConfig.Config;
export type RuleEntry = TSESLint.FlatConfig.RuleEntry;
export type RuleLevel = TSESLint.FlatConfig.RuleLevel;
export type RulesRecord = TSESLint.FlatConfig.Rules;
