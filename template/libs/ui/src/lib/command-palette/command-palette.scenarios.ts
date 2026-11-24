import { ChangeDetectionStrategy, Component, DestroyRef, effect, inject, input, untracked } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { defineScenarios } from '@ligeirinho/previewer';
import { Kbd } from '../kbd/kbd';
import { CommandPalette, type CommandPaletteText, CommandPaletteShortcut, type PaletteCommand } from './command-palette';

interface CommandPalettePreviewModel {
  readonly open: string;
  readonly shortcut: readonly string[];
  readonly commands: readonly PaletteCommand[];
  readonly text: CommandPaletteText;
}

/** Opens as the scenario loads, like a page would on ⌘K; the button and ⌘K / Ctrl+K open it again. */
@Component({
  selector: 'ui-command-palette-preview',
  imports: [Kbd, MatButtonModule, CommandPaletteShortcut],
  template: `
    <div class="flex items-center gap-3 p-4 sm:p-8" (uiCommandPaletteShortcut)="open()">
      <button matButton="outlined" type="button" (click)="open()">{{ model().open }}</button>
      <ui-kbd [keys]="model().shortcut" />
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class CommandPalettePreview {
  readonly model = input.required<CommandPalettePreviewModel>();

  private readonly palette = inject(CommandPalette);
  private readonly dialog = inject(MatDialog);

  constructor() {
    effect(() => {
      this.model();
      untracked(() => {
        this.dialog.closeAll();
        this.open();
      });
    });
    inject(DestroyRef).onDestroy(() => {
      this.dialog.closeAll();
    });
  }

  protected open(): void {
    this.palette.open(this.model().commands, this.model().text).subscribe();
  }
}

const commands: readonly PaletteCommand[] = [
  { id: 'new-task', label: 'New task', group: 'Tasks', icon: 'add_task', keys: ['N'], keywords: ['create', 'add'] },
  { id: 'assign', label: 'Assign to me', group: 'Tasks', icon: 'person_check', keys: ['I'] },
  { id: 'archive', label: 'Archive done tasks', group: 'Tasks', icon: 'archive' },
  { id: 'inbox', label: 'Go to Inbox', group: 'Navigation', icon: 'inbox', keys: ['G', 'I'] },
  { id: 'clients', label: 'Go to Clients', group: 'Navigation', icon: 'groups', keys: ['G', 'C'], keywords: ['customers', 'accounts'] },
  { id: 'reports', label: 'Go to Reports', group: 'Navigation', icon: 'bar_chart', keys: ['G', 'R'] },
  { id: 'theme', label: 'Switch to dark theme', group: 'Preferences', icon: 'dark_mode', keywords: ['appearance', 'night'] },
  { id: 'shortcuts', label: 'Keyboard shortcuts', group: 'Preferences', icon: 'keyboard', keys: ['?'] },
];

const base: CommandPalettePreviewModel = {
  open: 'Search commands…',
  shortcut: ['⌘', 'K'],
  commands,
  text: { searchLabel: 'Search commands', placeholder: 'Type a command or search…', empty: 'No commands match. Try another word.' },
};

export const commandPaletteScenarios = defineScenarios({
  flow: 'Catalog',
  title: 'Command palette',
  component: CommandPalettePreview,
  scenarios: {
    /** Every command under its group; type *customers* to find *Go to Clients* by a keyword. */
    grouped: base,
    /** A short list, no icons or shortcuts. */
    plain: {
      ...base,
      commands: [
        { id: 'rename', label: 'Rename project', group: 'Project' },
        { id: 'duplicate', label: 'Duplicate project', group: 'Project' },
        { id: 'leave', label: 'Leave project', group: 'Project' },
      ],
    },
    /** Nothing to run yet: the empty line. */
    empty: { ...base, commands: [] },
  },
});
