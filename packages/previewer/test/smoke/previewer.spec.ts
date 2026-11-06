import { expect, test } from '@playwright/test';

test.describe('grid page', () => {
  test('groups entries by flow and shows every scenario at each width and theme', async ({ page }) => {
    await page.goto('/__preview');

    await expect(page.getByRole('heading', { level: 2, name: 'Tasks' })).toBeVisible();
    await expect(page.getByRole('heading', { level: 2, name: 'Account' })).toBeVisible();
    await expect(page.getByRole('heading', { level: 3, name: /Task list/ })).toBeVisible();
    const fullScenario = page.getByRole('region', { name: 'Task list, full' });
    await expect(fullScenario.locator('iframe')).toHaveCount(6);
    await expect(page.locator('iframe[title="Task list, full, 390 px, dark"]')).toHaveAttribute(
      'src',
      '/__preview/render/task-list/full?theme=dark',
    );
    await expect(page.locator('iframe[title="Task list, full, 1280 px, light"]')).toHaveCSS('width', '1280px');
  });

  test('publishes a serializable manifest for e2e-kit', async ({ page }) => {
    await page.goto('/__preview');

    const manifest = await page.evaluate(() => window.__ligeirinhoPreview);

    expect(manifest).toEqual({
      basePath: '/__preview',
      entries: [
        { id: 'profile-card', flow: 'Account', title: 'Profile card', scenarios: ['complete', 'minimal'] },
        { id: 'task-list', flow: 'Tasks', title: 'Task list', scenarios: ['empty', 'full', 'error'] },
      ],
    });
  });

  test('filters by flow', async ({ page }) => {
    await page.goto('/__preview?flow=Account');

    await expect(page.getByRole('heading', { level: 2, name: 'Account' })).toBeVisible();
    await expect(page.getByRole('heading', { level: 2, name: 'Tasks' })).toHaveCount(0);
  });

  test('changes the frame height', async ({ page }) => {
    await page.goto('/__preview?flow=Account');

    await page.getByLabel('Height').fill('400');

    await expect(page.locator('iframe').first()).toHaveCSS('height', '400px');
  });

  test('resizable mode shows one frame per scenario with a draggable width', async ({ page }) => {
    await page.goto('/__preview?flow=Account');

    await page.getByLabel('Resizable').check();

    await expect(page.locator('iframe')).toHaveCount(2);
    await expect(page.getByText('768 px').first()).toBeVisible();
    const handle = page.getByRole('separator', { name: 'Frame width' }).first();
    const handleBox = await handle.boundingBox();
    expect(handleBox).not.toBeNull();
    const startX = (handleBox?.x ?? 0) + 8;
    const startY = (handleBox?.y ?? 0) + 20;
    await page.mouse.move(startX, startY);
    await page.mouse.down();
    await page.mouse.move(startX - 100, startY, { steps: 5 });
    await page.mouse.up();
    await expect(page.getByText('668 px')).toBeVisible();
    await handle.press('ArrowRight');
    await expect(page.getByText('678 px')).toBeVisible();
  });
});

test.describe('render page', () => {
  test('renders one scenario full page without previewer chrome', async ({ page }) => {
    await page.goto('/__preview/render/task-list/full?theme=light');

    await expect(page.getByRole('heading', { level: 1, name: 'Tasks' })).toBeVisible();
    await expect(page.getByRole('listitem')).toHaveCount(3);
    await expect(page.getByRole('heading', { name: 'Preview' })).toHaveCount(0);
    await expect(page.locator('html')).not.toHaveClass(/dark/);
    await expect(page.locator('html')).toHaveAttribute('data-ligeirinho-preview', 'rendered');
  });

  test('applies the dark theme to the document element', async ({ page }) => {
    await page.goto('/__preview/render/task-list/empty?theme=dark');

    await expect(page.getByText('No tasks yet. Add your first one.')).toBeVisible();
    await expect(page.locator('html')).toHaveClass(/dark/);
  });

  test('logs the outputs the view emits', async ({ page }) => {
    const logged: string[] = [];
    page.on('console', (message) => logged.push(message.text()));
    await page.goto('/__preview/render/task-list/full?theme=light');

    await page.getByRole('button', { name: 'Done: Write the scenarios next to the view' }).click();
    await page.goto('/__preview/render/task-list/error?theme=light');
    await page.getByRole('button', { name: 'Try again' }).click();

    await expect.poll(() => logged).toEqual(expect.arrayContaining(['[preview] toggleTask task-2', expect.stringMatching(/^\[preview\] retry/)]));
  });

  test('explains an unknown entry instead of crashing', async ({ page }) => {
    await page.goto('/__preview/render/nothing-here/full');

    await expect(page.getByRole('alert')).toHaveText('No preview entry with id "nothing-here".');
    await expect(page.locator('html')).toHaveAttribute('data-ligeirinho-preview', 'not-found');
  });

  test('explains an unknown scenario and lists the available ones', async ({ page }) => {
    await page.goto('/__preview/render/task-list/loading');

    await expect(page.getByRole('alert')).toHaveText(
      'Entry "task-list" has no scenario "loading". Available: empty, full, error.',
    );
  });
});
