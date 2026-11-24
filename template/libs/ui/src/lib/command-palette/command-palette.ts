import {
  afterRenderEffect,
  ChangeDetectionStrategy,
  Component,
  computed,
  Directive,
  inject,
  Injectable,
  InjectionToken,
  Injector,
  output,
  signal,
  ViewEncapsulation,
} from '@angular/core';
import { MatDialog, MatDialogRef, MatDialogState } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { type Observable } from 'rxjs';
import { Kbd } from '../kbd/kbd';

/** One thing the palette can do: *New task*, *Go to Clients*, *Switch theme*. */
export interface PaletteCommand {
  readonly id: string;
  readonly label: string;
  /** The heading it is listed under (*Navigation*, *Tasks*); groups keep the order they first appear in. */
  readonly group: string;
  /** A Material Symbol before the label. */
  readonly icon?: string;
  /** Its shortcut, shown at the end with `ui-kbd`: `['N']`, `['⌘', '⇧', 'P']`. */
  readonly keys?: readonly string[];
  /** Other words it is found by (*create*, *add* for *New task*). */
  readonly keywords?: readonly string[];
}

/** The palette's words, from the screen's copy. */
export interface CommandPaletteText {
  /** The search field's name for screen readers, also the dialog's: *Search commands*. */
  readonly searchLabel: string;
  /** Inside the empty field: *Type a command or search…* */
  readonly placeholder?: string;
  /** When nothing matches: *No commands match.* */
  readonly empty: string;
}

interface PaletteSetup {
  readonly commands: readonly PaletteCommand[];
  readonly text: CommandPaletteText;
}

interface CommandGroup {
  readonly name: string;
  readonly commands: readonly PaletteCommand[];
}

const PALETTE_SETUP = new InjectionToken<PaletteSetup>('CommandPaletteSetup');

let nextPalette = 0;

/** Lowercase, without accents: *Ação* and *acao* match. */
function fold(text: string): string {
  return text.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();
}

function matches(command: PaletteCommand, words: readonly string[]): boolean {
  const haystack = fold([command.label, ...(command.keywords ?? [])].join(' '));
  return words.every((word) => haystack.includes(word));
}

function groupCommands(commands: readonly PaletteCommand[]): CommandGroup[] {
  const groups = new Map<string, PaletteCommand[]>();
  for (const command of commands) {
    groups.set(command.group, [...(groups.get(command.group) ?? []), command]);
  }
  return [...groups].map(([name, grouped]) => ({ name, commands: grouped }));
}

/** The palette `CommandPalette.open` shows; not used in templates. */
@Component({
  selector: 'ui-command-palette',
  imports: [Kbd, MatIconModule],
  templateUrl: './command-palette.html',
  styleUrl: './command-palette.css',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
})
export class CommandPaletteDialog {
  protected readonly text = inject(PALETTE_SETUP).text;
  private readonly commands = inject(PALETTE_SETUP).commands;
  private readonly ref = inject<MatDialogRef<CommandPaletteDialog, string>>(MatDialogRef);

  protected readonly listId = `ui-command-palette-${String(nextPalette++)}`;
  protected readonly query = signal('');
  private readonly activeIndex = signal(0);

  /** Commands in group order, so the arrow keys walk them as they are shown. */
  private readonly visible = computed(() => {
    const words = fold(this.query()).split(/\s+/).filter(Boolean);
    return groupCommands(this.commands.filter((command) => matches(command, words))).flatMap((group) => group.commands);
  });
  protected readonly groups = computed(() => groupCommands(this.visible()));
  protected readonly active = computed(() => this.visible().at(this.activeIndex()));
  protected readonly activeId = computed(() => {
    const active = this.active();
    return active ? this.optionId(active) : null;
  });

  constructor() {
    afterRenderEffect(() => {
      const activeId = this.activeId();
      if (activeId) {
        document.getElementById(activeId)?.scrollIntoView({ block: 'nearest' });
      }
    });
  }

  protected optionId(command: PaletteCommand): string {
    return `${this.listId}-${command.id}`;
  }

  protected type(event: Event): void {
    if (event.target instanceof HTMLInputElement) {
      this.query.set(event.target.value);
      this.activeIndex.set(0);
    }
  }

  protected key(event: KeyboardEvent): void {
    const count = this.visible().length;
    const moves: Partial<Record<string, number>> = { ArrowDown: 1, ArrowUp: -1 };
    const move = moves[event.key];
    if (move !== undefined && count > 0) {
      event.preventDefault();
      this.activeIndex.update((index) => (index + move + count) % count);
    } else if (event.key === 'Enter') {
      event.preventDefault();
      this.run(this.active());
    }
  }

  protected point(command: PaletteCommand): void {
    this.activeIndex.set(this.visible().indexOf(command));
  }

  protected run(command: PaletteCommand | undefined): void {
    if (command) {
      this.ref.close(command.id);
    }
  }
}

/**
 * A palette of commands for people who know what they want (⌘K): a search field at the top third of the screen and
 * every command under its group, filtered as they type (label and keywords, ignoring case and accents). The arrow
 * keys move, Enter runs, Escape closes. `open` answers the chosen command's id, or undefined when closed without one;
 * the page runs it. Bind ⌘K / Ctrl+K once, at the app's root, with `uiCommandPaletteShortcut`.
 */
@Injectable({ providedIn: 'root' })
export class CommandPalette {
  private readonly dialog = inject(MatDialog);
  private readonly injector = inject(Injector);
  private current?: MatDialogRef<CommandPaletteDialog, string>;

  open(commands: readonly PaletteCommand[], text: CommandPaletteText): Observable<string | undefined> {
    if (this.current?.getState() === MatDialogState.OPEN) {
      return this.current.afterClosed();
    }
    this.current = this.dialog.open<CommandPaletteDialog, unknown, string>(CommandPaletteDialog, {
      injector: Injector.create({ providers: [{ provide: PALETTE_SETUP, useValue: { commands, text } }], parent: this.injector }),
      ariaLabel: text.searchLabel,
      width: '640px',
      maxWidth: 'calc(100vw - 32px)',
      position: { top: '12vh' },
      panelClass: 'ui-command-palette-panel',
      autoFocus: 'input',
    });
    return this.current.afterClosed();
  }
}

/**
 * Emits on ⌘K (Mac) or Ctrl+K anywhere in the page, so the app opens its palette:
 * `<ui-app-shell (uiCommandPaletteShortcut)="openPalette()">`. Put it once, at the app's root.
 */
@Directive({
  selector: '[uiCommandPaletteShortcut]',
  host: { '(document:keydown)': 'press($event)' },
})
export class CommandPaletteShortcut {
  readonly uiCommandPaletteShortcut = output();

  protected press(event: KeyboardEvent): void {
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k' && !event.altKey && !event.shiftKey) {
      event.preventDefault();
      this.uiCommandPaletteShortcut.emit();
    }
  }
}
