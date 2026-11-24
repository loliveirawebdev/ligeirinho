import { type Page, expect, test } from '@playwright/test';

function previewFrame(page: Page) {
  return page.locator('ligeirinho-preview-canvas iframe');
}

/** The names of the tree items on screen, in order (collapsed groups hide their children). */
function visibleTreeItems(page: Page): Promise<(string | null)[]> {
  return page
    .getByRole('tree', { name: 'Scenarios' })
    .getByRole('treeitem')
    .evaluateAll((items) => items.map((item) => item.getAttribute('aria-label')));
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

  test('the scenario tree starts collapsed, except the path to the open scenario', async ({ page }) => {
    await page.goto('/__preview');

    const tree = page.getByRole('tree', { name: 'Scenarios' });
    await expect.poll(() => visibleTreeItems(page)).toEqual(['Account', 'Profile card', 'complete', 'minimal', 'Tasks']);
    await expect(tree.getByRole('treeitem', { name: 'Account', exact: true })).toHaveAttribute('aria-expanded', 'true');
    await expect(tree.getByRole('treeitem', { name: 'Tasks', exact: true })).toHaveAttribute('aria-expanded', 'false');
    await expect(tree.getByRole('treeitem', { name: 'complete', exact: true })).toHaveAttribute('aria-current', 'page');
  });

  test('a shared link opens the groups around its scenario', async ({ page }) => {
    await page.goto('/__preview?entry=task-list&scenario=confirmDelete');

    const tree = page.getByRole('tree', { name: 'Scenarios' });
    await expect(tree.getByRole('treeitem', { name: 'confirmDelete, has play steps' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    await expect(tree.getByRole('treeitem', { name: 'Account', exact: true })).toHaveAttribute('aria-expanded', 'false');
  });

  test('picking a scenario keeps the size and theme in the URL', async ({ page }) => {
    await page.goto('/__preview?w=500&h=700&theme=dark');
    const tree = page.getByRole('tree', { name: 'Scenarios' });

    await tree.getByRole('treeitem', { name: 'Tasks', exact: true }).click();
    await tree.getByRole('treeitem', { name: 'Task list', exact: true }).click();
    await tree.getByRole('treeitem', { name: 'full', exact: true }).click();

    await expect(page).toHaveURL(/entry=task-list&scenario=full&w=500&h=700&theme=dark/);
    await expect(tree.getByRole('treeitem', { name: 'full', exact: true })).toHaveAttribute('aria-current', 'page');
    await expect(previewFrame(page)).toHaveAttribute('src', /\/__preview\/render\/task-list\/full\?theme=dark/);
    await expect(previewFrame(page)).toHaveCSS('width', '500px');
  });

  test('the keyboard walks the tree: arrows move, → opens, Enter picks', async ({ page }) => {
    await page.goto('/__preview');
    const tree = page.getByRole('tree', { name: 'Scenarios' });
    const item = (name: string) => tree.getByRole('treeitem', { name, exact: true });

    await item('complete').click();
    await page.keyboard.press('ArrowDown');
    await expect(item('minimal')).toBeFocused();
    await page.keyboard.press('ArrowDown');
    await expect(item('Tasks')).toBeFocused();
    await page.keyboard.press('ArrowRight');
    await expect(item('Tasks')).toHaveAttribute('aria-expanded', 'true');
    await page.keyboard.press('ArrowDown');
    await expect(item('Task list')).toBeFocused();
    await page.keyboard.press('ArrowRight');
    await expect(item('Task list')).toHaveAttribute('aria-expanded', 'true');
    await page.keyboard.press('ArrowDown');
    await expect(item('empty')).toBeFocused();
    await page.keyboard.press('Enter');

    await expect(page).toHaveURL(/entry=task-list&scenario=empty/);
    await page.keyboard.press('ArrowLeft');
    await expect(item('Task list')).toBeFocused();
  });

  test('remembers the groups the user opened', async ({ page }) => {
    await page.goto('/__preview');
    const tree = page.getByRole('tree', { name: 'Scenarios' });

    await tree.getByRole('treeitem', { name: 'Tasks', exact: true }).click();
    await expect(tree.getByRole('treeitem', { name: 'Tasks', exact: true })).toHaveAttribute('aria-expanded', 'true');
    await page.reload();

    await expect(tree.getByRole('treeitem', { name: 'Tasks', exact: true })).toHaveAttribute('aria-expanded', 'true');
    await page.getByRole('button', { name: 'Collapse all' }).click();
    await expect.poll(() => visibleTreeItems(page)).toEqual(['Account', 'Tasks']);
    await page.getByRole('button', { name: 'Expand all' }).click();
    await expect.poll(() => visibleTreeItems(page)).toHaveLength(10);
  });

  test('the filter opens every match, highlights it and Enter opens the first one', async ({ page }) => {
    await page.goto('/__preview');
    const filter = page.getByLabel('Filter screens and scenarios');

    await filter.fill('err');

    const tree = page.getByRole('tree', { name: 'Scenarios' });
    await expect.poll(() => visibleTreeItems(page)).toEqual(['Tasks', 'Task list', 'error']);
    await expect(tree.locator('mark')).toHaveText(['err']);
    await filter.press('Enter');
    await expect(page).toHaveURL(/entry=task-list&scenario=error/);
    await filter.press('Escape');
    await expect(filter).toHaveValue('');
  });

  test('Ctrl+K jumps to any scenario', async ({ page }) => {
    await page.goto('/__preview');

    await page.keyboard.press('Control+k');
    const switcher = page.getByRole('combobox', { name: 'Go to scenario' });
    await expect(switcher).toBeFocused();
    await switcher.fill('task conf');
    const dialog = page.getByRole('dialog', { name: 'Go to scenario' });
    await expect(dialog.getByRole('option')).toHaveText([/confirmDelete\s*Task list · Tasks/]);
    await switcher.press('Enter');

    await expect(page).toHaveURL(/entry=task-list&scenario=confirmDelete/);
    await expect(dialog).toBeHidden();
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
