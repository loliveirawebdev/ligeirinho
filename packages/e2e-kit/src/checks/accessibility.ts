import { AxeBuilder } from '@axe-core/playwright';
import { type Page, expect } from '@playwright/test';

export const WCAG_21_AA_TAGS: readonly string[] = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'];

export interface AccessibilityViolation {
  /** axe rule id, e.g. `color-contrast`. */
  readonly ruleId: string;
  readonly impact: string;
  readonly help: string;
  /** CSS selectors of the offending elements. */
  readonly targets: readonly string[];
}

/** axe-core violations of WCAG 2.1 A and AA. */
export async function findAccessibilityViolations(page: Page): Promise<AccessibilityViolation[]> {
  const results = await new AxeBuilder({ page }).withTags([...WCAG_21_AA_TAGS]).analyze();
  return results.violations.map((violation) => ({
    ruleId: violation.id,
    impact: violation.impact ?? 'unknown',
    help: violation.help,
    targets: violation.nodes.map((node) => node.target.join(' ')),
  }));
}

/** Soft assertion: zero axe violations of WCAG 2.1 A/AA. */
export async function checkAccessibility(page: Page, label: string = page.url()): Promise<void> {
  const violations = await findAccessibilityViolations(page);
  const details = violations
    .map((violation) => `\n  ${violation.ruleId} (${violation.impact}): ${violation.help}\n    ${violation.targets.join('\n    ')}`)
    .join('');
  expect.soft(violations, `[${label}] ${violations.length} axe violation(s):${details}`).toEqual([]);
}
