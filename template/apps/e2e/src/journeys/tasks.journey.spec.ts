import { expect, test } from '@playwright/test';
import { signInAsNewUser } from '../support/signed-in-page';

test.describe('tasks journey', () => {
  test('a user creates a task, sees it in the list and completes it', async ({ page }) => {
    await signInAsNewUser(page, ['tasks:read', 'tasks:write']);
    await page.goto('/');
    await expect(page.getByText('No tasks yet')).toBeVisible();

    await page.getByLabel('New task').fill('Ship the template');
    await page.getByRole('button', { name: 'Add task' }).click();
    await expect(page.getByRole('listitem').filter({ hasText: 'Ship the template' })).toBeVisible();
    await expect(page.getByText('1 open task')).toBeVisible();

    await page.getByRole('checkbox', { name: 'Complete “Ship the template”' }).check();
    await expect(page.getByText('All done')).toBeVisible();

    await page.reload();
    await expect(page.getByRole('listitem').filter({ hasText: 'Ship the template' })).toContainText('Done');
  });

  test('a user without permission sees the failure, not someone else data', async ({ page }) => {
    await signInAsNewUser(page, []);
    await page.goto('/');
    await expect(page.getByRole('alert')).toContainText('Couldn’t load your tasks');
  });
});
