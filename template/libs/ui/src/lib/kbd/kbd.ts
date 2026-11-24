import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * A keyboard shortcut, key by key (`['⌘', 'K']`): beside a menu item, in a tooltip, in a hint. Each key is a `<kbd>`
 * inside one `<kbd>`, which is how HTML says "press these together".
 */
@Component({
  selector: 'ui-kbd',
  templateUrl: './kbd.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'inline-flex align-middle' },
})
export class Kbd {
  /** The keys, as printed on the keyboard: `['Ctrl', 'K']`, `['⌘', '⇧', 'P']`, `['Esc']`. */
  readonly keys = input.required<readonly string[]>();
}
