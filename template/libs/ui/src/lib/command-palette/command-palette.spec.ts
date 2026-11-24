import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { render } from '@testing-library/angular';
import { CommandPalette, CommandPaletteShortcut, type PaletteCommand } from './command-palette';
import { CommandPaletteHarness } from './command-palette.harness';

@Component({
  imports: [CommandPaletteShortcut],
  template: `<div (uiCommandPaletteShortcut)="presses.update((count) => count + 1)"></div>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class Page {
  readonly presses = signal(0);
}

const commands: PaletteCommand[] = [
  { id: 'new-task', label: 'New task', group: 'Tasks', icon: 'add', keys: ['N'], keywords: ['create'] },
  { id: 'clients', label: 'Go to Clients', group: 'Navigation', icon: 'group' },
  { id: 'reports', label: 'Go to Relatórios', group: 'Navigation' },
  { id: 'archive', label: 'Archive done tasks', group: 'Tasks' },
];
const text = { searchLabel: 'Search commands', placeholder: 'Type a command…', empty: 'No commands match.' };

async function open(): Promise<{ chosen: (string | undefined)[]; palette: CommandPaletteHarness; page: Page }> {
  const { fixture } = await render(Page);
  const chosen: (string | undefined)[] = [];
  TestBed.inject(CommandPalette)
    .open(commands, text)
    .subscribe((id) => chosen.push(id));
  const palette = await TestbedHarnessEnvironment.documentRootLoader(fixture).getHarness(CommandPaletteHarness);
  return { chosen, palette, page: fixture.componentInstance };
}

describe('command palette', () => {
  beforeEach(() => {
    Element.prototype.scrollIntoView = vi.fn();
  });

  it('lists every command under its group, in the order the groups first appear', async () => {
    const { palette } = await open();
    expect(await palette.getGroups()).toEqual(['Tasks', 'Navigation']);
    expect(await palette.getLabels()).toEqual(['New task', 'Archive done tasks', 'Go to Clients', 'Go to Relatórios']);
    expect(await palette.getActiveLabel()).toBe('New task');
  });

  it('filters by label and keywords, ignoring case and accents, and says when nothing matches', async () => {
    const { palette } = await open();
    await palette.type('CREATE');
    expect(await palette.getLabels()).toEqual(['New task']);
    await palette.type('relatorios');
    expect(await palette.getLabels()).toEqual(['Go to Relatórios']);
    await palette.type('invoice');
    expect(await palette.getLabels()).toEqual([]);
    expect(await palette.getEmptyText()).toBe('No commands match.');
  });

  it('moves with the arrow keys, points screen readers at the active option, and runs it on Enter', async () => {
    const { chosen, palette } = await open();
    await palette.pressDown();
    await palette.pressDown();
    expect(await palette.getActiveLabel()).toBe('Go to Clients');
    expect(await palette.getActiveDescendant()).toMatch(/-clients$/);
    await palette.pressUp();
    await palette.pressUp();
    await palette.pressUp();
    expect(await palette.getActiveLabel()).toBe('Go to Relatórios');
    await palette.pressEnter();
    await vi.waitFor(() => {
      expect(chosen).toEqual(['reports']);
    });
  });

  it('the shortcut directive answers ⌘K and Ctrl+K, not K alone', async () => {
    const { page } = await open();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }));
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'K', ctrlKey: true }));
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k' }));
    expect(page.presses()).toBe(2);
  });
});
