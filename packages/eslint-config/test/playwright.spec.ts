import { describe, expect, test } from 'vitest';
import { lintFixture, ruleIdsOf } from './fixture-linter.js';

const journeyFile = 'apps/e2e/src/create-task.spec.ts';

function journey(body: string): string {
  return `
declare const test: (title: string, body: (fixtures: { page: Page }) => Promise<void>) => void;
declare const expect: (target: unknown) => { toBeVisible(): Promise<void> };
interface Locator { click(): Promise<void> }
interface Page {
  locator(selector: string): Locator;
  getByRole(role: string, options: { name: string }): Locator;
  waitForTimeout(milliseconds: number): Promise<void>;
}

test('creates a task', async ({ page }) => {
${body}
});
`;
}

describe('playwright: rules/e2e.md', () => {
  test('finding elements by role passes', async () => {
    const code = journey(`  await page.getByRole('button', { name: 'Create task' }).click();
  await expect(page.getByRole('heading', { name: 'Task created' })).toBeVisible();`);
    expect(await lintFixture(journeyFile, code)).toEqual([]);
  });

  test.each(["'.create-button'", "'form .create-button'", "'button.primary'", '`.create-button`'])(
    'locator(%s) fails',
    async (selector) => {
      const code = journey(`  await page.locator(${selector}).click();`);
      expect(ruleIdsOf(await lintFixture(journeyFile, code))).toContain('@ligeirinho/no-css-class-locator');
    },
  );

  test('waitForTimeout fails', async () => {
    const code = journey('  await page.waitForTimeout(500);');
    expect(ruleIdsOf(await lintFixture(journeyFile, code))).toContain('playwright/no-wait-for-timeout');
  });

  test('a locator by role selector fails in favor of the native locator', async () => {
    const code = journey("  await page.locator('[role=\"button\"]').click();");
    expect(ruleIdsOf(await lintFixture(journeyFile, code))).toContain('playwright/prefer-native-locators');
  });
});
