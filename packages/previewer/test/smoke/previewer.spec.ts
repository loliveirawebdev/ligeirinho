import { type Page, expect, test } from '@playwright/test';

function previewFrame(page: Page) {
  return page.locator('ligeirinho-preview-canvas iframe');
}

test.describe('workbench', () => {
  test('opens the first scenario in an iPhone-sized frame', async ({ page }) => {
    await page.goto('/__preview');

    await expect(previewFrame(page)).toHaveCount(1);
    await expect(previewFrame(page)).toHaveAttribute('title', 'Profile card, complete');
    await expect(previewFrame(page)).toHaveAttribute('src', /^\/__preview\/render\/profile-card\/complete\?theme=light&run=0$/);
    await expect(previewFrame(page)).toHaveCSS('width', '390px');
    await expect(previewFrame(page)).toHaveCSS('height', '844px');
    await expect(page.getByLabel('Device')).toHaveValue('1');
    await expect(
      previewFrame(page).contentFrame().getByRole('heading', { level: 1, name: 'Ada Lovelace' }),
    ).toBeVisible();
  });

  test('lists every scenario by flow and entry in the sidebar', async ({ page }) => {
    await page.goto('/__preview');

    const sidebar = page.getByRole('complementary', { name: 'Scenarios' });
    await expect(sidebar.getByRole('heading', { level: 2, name: 'Account' })).toBeVisible();
    await expect(sidebar.getByRole('heading', { level: 2, name: 'Tasks' })).toBeVisible();
    await expect(sidebar.getByRole('heading', { level: 3, name: 'Task list' })).toBeVisible();
    await expect(sidebar.getByRole('link')).toHaveText(['complete', 'minimal', 'empty', 'full', 'error', /confirmDelete/]);
  });

  test('picking a scenario keeps the size and theme in the URL', async ({ page }) => {
    await page.goto('/__preview?w=500&h=700&theme=dark');

    await page.getByRole('link', { name: 'full' }).click();

    await expect(page).toHaveURL(/entry=task-list&scenario=full&w=500&h=700&theme=dark/);
    await expect(page.getByRole('link', { name: 'full' })).toHaveAttribute('aria-current', 'page');
    await expect(previewFrame(page)).toHaveAttribute('src', /\/__preview\/render\/task-list\/full\?theme=dark/);
    await expect(previewFrame(page)).toHaveCSS('width', '500px');
  });

  test('arrow keys move through the scenarios', async ({ page }) => {
    await page.goto('/__preview');

    await page.getByRole('link', { name: 'complete' }).focus();
    await page.keyboard.press('ArrowDown');

    await expect(page).toHaveURL(/scenario=minimal/);
    await expect(page.getByRole('link', { name: 'minimal' })).toBeFocused();
  });

  test('search narrows the list', async ({ page }) => {
    await page.goto('/__preview');

    await page.getByLabel('Find a screen or scenario').fill('err');

    await expect(page.getByRole('complementary', { name: 'Scenarios' }).getByRole('link')).toHaveText(['error']);
  });

  test('sets the size from the inputs, a preset and rotate', async ({ page }) => {
    await page.goto('/__preview');

    await page.getByRole('spinbutton', { name: 'Width' }).fill('700');
    await page.getByRole('spinbutton', { name: 'Width' }).press('Enter');
    await expect(previewFrame(page)).toHaveCSS('width', '700px');
    await expect(page.getByLabel('Device')).toHaveValue('-1');

    await page.getByLabel('Device').selectOption({ label: 'iPad mini · 768×1024' });
    await expect(previewFrame(page)).toHaveCSS('width', '768px');
    await expect(previewFrame(page)).toHaveCSS('height', '1024px');

    await page.getByRole('button', { name: 'Rotate' }).click();
    await expect(previewFrame(page)).toHaveCSS('width', '1024px');
    await expect(previewFrame(page)).toHaveCSS('height', '768px');
    await expect(page).toHaveURL(/entry=profile-card&scenario=complete&w=1024&h=768/);
  });

  test('drags and nudges the frame width', async ({ page }) => {
    await page.goto('/__preview?w=600&h=500&zoom=1');

    const handle = page.getByRole('separator', { name: 'Frame width' });
    const box = await handle.boundingBox();
    expect(box).not.toBeNull();
    const startX = (box?.x ?? 0) + (box?.width ?? 0) / 2;
    const startY = (box?.y ?? 0) + (box?.height ?? 0) / 2;
    await page.mouse.move(startX, startY);
    await page.mouse.down();
    await page.mouse.move(startX - 100, startY, { steps: 5 });
    await page.mouse.up();

    await expect(page.getByRole('spinbutton', { name: 'Width' })).toHaveValue('500');
    await expect(page).toHaveURL(/w=500/);
    await handle.press('ArrowRight');
    await expect(page.getByRole('spinbutton', { name: 'Width' })).toHaveValue('510');
    await handle.press('Shift+ArrowLeft');
    await expect(previewFrame(page)).toHaveCSS('width', '460px');
  });

  test('a breakpoint on the ruler sets the width', async ({ page }) => {
    await page.goto('/__preview?zoom=0.5');

    await page.getByRole('button', { name: 'Set width to md, 768 px' }).click();

    await expect(previewFrame(page)).toHaveCSS('width', '768px');
  });

  test('the theme toggle switches the frame to dark', async ({ page }) => {
    await page.goto('/__preview');

    await page.getByRole('button', { name: 'Dark' }).click();

    await expect(page.getByRole('button', { name: 'Dark' })).toHaveAttribute('aria-pressed', 'true');
    await expect(previewFrame(page)).toHaveAttribute('src', /theme=dark/);
    await expect(previewFrame(page).contentFrame().locator('html')).toHaveClass(/dark/);
  });

  test('runs the play steps and shows the outputs the view emits', async ({ page }) => {
    await page.goto('/__preview?entry=task-list&scenario=confirmDelete');

    const panel = page.getByRole('region', { name: 'Steps and events' });
    await expect(panel.getByRole('listitem').first()).toHaveText(/Click “Delete…” on the second task.*done/);
    const frame = previewFrame(page).contentFrame();
    await expect(frame.getByRole('alertdialog', { name: 'Delete this task?' })).toBeVisible();

    await frame.getByRole('button', { name: 'Delete task' }).click();

    await expect(panel.getByText('deleteTask("task-2")')).toBeVisible();
  });

  test('with steps off the scenario shows its first render', async ({ page }) => {
    await page.goto('/__preview?entry=task-list&scenario=confirmDelete');

    await page.getByLabel('Run steps').uncheck();

    await expect(previewFrame(page)).toHaveAttribute('src', /play=0/);
    await expect(page.getByText('Steps are off')).toBeVisible();
    await expect(previewFrame(page).contentFrame().getByRole('heading', { name: 'Tasks' })).toBeVisible();
    await expect(previewFrame(page).contentFrame().getByRole('alertdialog')).toHaveCount(0);
  });

  test('publishes a serializable manifest for e2e-kit', async ({ page }) => {
    await page.goto('/__preview');

    const manifest = await page.evaluate(() => window.__ligeirinhoPreview);

    expect(manifest).toEqual({
      basePath: '/__preview',
      entries: [
        { id: 'profile-card', flow: 'Account', title: 'Profile card', scenarios: ['complete', 'minimal'] },
        {
          id: 'task-list',
          flow: 'Tasks',
          title: 'Task list',
          scenarios: ['empty', 'full', 'error', 'confirmDelete'],
        },
      ],
    });
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

  test('runs the play function before marking the page rendered', async ({ page }) => {
    await page.goto('/__preview/render/task-list/confirmDelete?theme=light');

    await expect(page.locator('html')).toHaveAttribute('data-ligeirinho-preview', 'rendered');
    await expect(page.getByRole('alertdialog', { name: 'Delete this task?' })).toBeVisible();
  });

  test('skips the play function with play=0', async ({ page }) => {
    await page.goto('/__preview/render/task-list/confirmDelete?theme=light&play=0');

    await expect(page.locator('html')).toHaveAttribute('data-ligeirinho-preview', 'rendered');
    await expect(page.getByRole('alertdialog')).toHaveCount(0);
  });

  test('logs the outputs the view emits', async ({ page }) => {
    const logged: string[] = [];
    page.on('console', (message) => logged.push(message.text()));
    await page.goto('/__preview/render/task-list/full?theme=light');

    await page.getByRole('button', { name: 'Done: Write the scenarios next to the view' }).click();
    await page.goto('/__preview/render/task-list/error?theme=light');
    await page.getByRole('button', { name: 'Try again' }).click();

    await expect
      .poll(() => logged)
      .toEqual(expect.arrayContaining(['[preview] toggleTask task-2', expect.stringMatching(/^\[preview\] retry/)]));
  });

  test('explains an unknown entry instead of crashing', async ({ page }) => {
    await page.goto('/__preview/render/nothing-here/full');

    await expect(page.getByRole('alert')).toHaveText('No preview entry with id "nothing-here".');
    await expect(page.locator('html')).toHaveAttribute('data-ligeirinho-preview', 'not-found');
  });

  test('explains an unknown scenario and lists the available ones', async ({ page }) => {
    await page.goto('/__preview/render/task-list/loading');

    await expect(page.getByRole('alert')).toHaveText(
      'Entry "task-list" has no scenario "loading". Available: empty, full, error, confirmDelete.',
    );
  });
});
