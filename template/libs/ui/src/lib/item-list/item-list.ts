import { ChangeDetectionStrategy, Component, input, output, ViewEncapsulation } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';

export interface ListItem {
  readonly id: string;
  readonly title: string;
  readonly supportingText?: string;
  /** Short trailing text: a date, a count, a status word. */
  readonly meta?: string;
  /** A Material Symbols name, when the icon helps recognize the item. */
  readonly icon?: string;
}

/**
 * Rows the user opens (records, not navigation): a title, an optional line under it, optional trailing meta. Every
 * row is one button with the state layer; the page decides what opening means.
 */
@Component({
  selector: 'ui-item-list',
  imports: [MatIconModule, MatListModule],
  templateUrl: './item-list.html',
  styleUrl: './item-list.css',
  // The styles reach into Material's list; every selector starts with .ui-item-list, so nothing leaks.
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'ui-item-list block' },
})
export class ItemList {
  readonly label = input.required<string>();
  readonly items = input.required<readonly ListItem[]>();

  readonly itemOpened = output<string>();
}
