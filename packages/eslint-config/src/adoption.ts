import type { FlatConfig, RuleEntry, RuleLevel, RulesRecord } from './flat-config.js';

export interface AdoptionOption {
  /** Projects in adoption (rules/README.md) get warnings instead of errors. */
  readonly adoption?: boolean;
}

const errorSeverities: readonly RuleLevel[] = [2, 'error'];

function downgradeSeverity(severity: RuleLevel): RuleLevel {
  return errorSeverities.includes(severity) ? 'warn' : severity;
}

function downgradeRuleEntry(ruleEntry: RuleEntry): RuleEntry {
  if (Array.isArray(ruleEntry)) {
    const [severity, ...ruleOptions] = ruleEntry;
    return [downgradeSeverity(severity), ...ruleOptions];
  }
  return downgradeSeverity(ruleEntry);
}

function downgradeRules(rules: RulesRecord): RulesRecord {
  const downgradedEntries = Object.entries(rules).map(
    ([ruleName, ruleEntry]): [string, RuleEntry | undefined] => [
      ruleName,
      ruleEntry === undefined ? ruleEntry : downgradeRuleEntry(ruleEntry),
    ],
  );
  return Object.fromEntries(downgradedEntries);
}

export function applyAdoption(configs: FlatConfig[], adoption: boolean | undefined): FlatConfig[] {
  if (adoption !== true) {
    return configs;
  }
  return configs.map((config) =>
    config.rules === undefined ? config : { ...config, rules: downgradeRules(config.rules) },
  );
}
