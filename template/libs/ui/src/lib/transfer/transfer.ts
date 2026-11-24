import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, forwardRef, input, model, signal, ViewEncapsulation } from '@angular/core';
import { type ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatListModule, type MatSelectionListChange } from '@angular/material/list';
import { formatText } from '../copy/copy';

export interface TransferItem {
  readonly value: string;
  readonly label: string;
  /** A second line: an email, a code. */
  readonly secondary?: string;
  readonly disabled?: boolean;
}

/** The words of both lists, from the screen's copy. */
export interface TransferLabels {
  /** The list of what can be added: *Available*. */
  readonly source: string;
  /** The list of what was chosen: *Members*. */
  readonly target: string;
  /** Each list's search box: *Search people*. */
  readonly search: string;
  readonly selectAll: string;
  /** Each list's count: *{checked} of {total}*. */
  readonly count: string;
  /** The move buttons, read by screen readers: *Add selected*, *Remove selected*. */
  readonly moveRight: string;
  readonly moveLeft: string;
  /** An empty list, or nothing matching its search: *Nothing here*. */
  readonly empty: string;
}

export type TransferSide = 'source' | 'target';

interface TransferList {
  readonly side: TransferSide;
  readonly title: string;
  readonly items: readonly TransferItem[];
  readonly checked: ReadonlySet<string>;
  readonly count: string;
  readonly allChecked: boolean;
  readonly someChecked: boolean;
}

function isText(value: unknown): value is string {
  return typeof value === 'string';
}

function folded(text: string): string {
  return text.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();
}

/**
 * Chooses several items out of many by moving them between two lists, side by side (stacked on phones): what can
 * be added and what was chosen, each with a title, a count, a search box and *select all*, the move buttons between
 * them. The value is the chosen items' values, in the items' order. Works with `[(value)]`, reactive forms and signal
 * forms.
 */
@Component({
  selector: 'ui-transfer',
  imports: [MatButtonModule, MatCheckboxModule, MatFormFieldModule, MatIconModule, MatInputModule, MatListModule, NgTemplateOutlet],
  templateUrl: './transfer.html',
  styleUrl: './transfer.css',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => Transfer), multi: true }],
  host: { class: 'block' },
})
export class Transfer implements ControlValueAccessor {
  readonly items = input.required<readonly TransferItem[]>();
  readonly labels = input.required<TransferLabels>();
  /** The chosen items' values. */
  readonly value = model<readonly string[]>([]);
  readonly disabled = input(false);

  protected readonly queries = signal<Readonly<Record<TransferSide, string>>>({ source: '', target: '' });
  protected readonly checked = signal<Readonly<Record<TransferSide, ReadonlySet<string>>>>({ source: new Set(), target: new Set() });

  private readonly formDisabled = signal(false);
  protected readonly isDisabled = computed(() => this.disabled() || this.formDisabled());
  private readonly chosen = computed(() => new Set(this.value()));
  protected readonly source = computed(() => this.list('source'));
  protected readonly target = computed(() => this.list('target'));

  private onChange: (value: readonly string[]) => void = () => undefined;
  private onTouched: () => void = () => undefined;

  writeValue(value: unknown): void {
    this.value.set(Array.isArray(value) ? value.filter(isText) : []);
    this.checked.set({ source: new Set(), target: new Set() });
  }

  registerOnChange(onChange: (value: readonly string[]) => void): void {
    this.onChange = onChange;
  }

  registerOnTouched(onTouched: () => void): void {
    this.onTouched = onTouched;
  }

  setDisabledState(disabled: boolean): void {
    this.formDisabled.set(disabled);
  }

  protected search(side: TransferSide, inputEvent: Event): void {
    if (inputEvent.target instanceof HTMLInputElement) {
      const query = inputEvent.target.value;
      this.queries.update((queries) => ({ ...queries, [side]: query }));
    }
  }

  protected onSelection(side: TransferSide, change: MatSelectionListChange): void {
    const checked = new Set(this.checked()[side]);
    for (const option of change.options) {
      if (!isText(option.value)) {
        continue;
      }
      if (option.selected) {
        checked.add(option.value);
      } else {
        checked.delete(option.value);
      }
    }
    this.setChecked(side, checked);
  }

  /** Checks every item shown (enabled), or unchecks them all once they all are. */
  protected toggleAll(list: TransferList): void {
    const shown = list.items.filter((item) => !item.disabled).map((item) => item.value);
    const checked = new Set(list.checked);
    for (const value of shown) {
      if (list.allChecked) {
        checked.delete(value);
      } else {
        checked.add(value);
      }
    }
    this.setChecked(list.side, checked);
  }

  protected move(from: TransferSide): void {
    const moving = this.checked()[from];
    const chosen = this.chosen();
    const keep = (item: TransferItem): boolean => (from === 'source' ? chosen.has(item.value) || moving.has(item.value) : chosen.has(item.value) && !moving.has(item.value));
    const value = this.items()
      .filter(keep)
      .map((item) => item.value);
    this.setChecked(from, new Set());
    this.value.set(value);
    this.onChange(value);
    this.onTouched();
  }

  private setChecked(side: TransferSide, checked: ReadonlySet<string>): void {
    this.checked.update((all) => ({ ...all, [side]: checked }));
  }

  private list(side: TransferSide): TransferList {
    const labels = this.labels();
    const chosen = this.chosen();
    const inSide = this.items().filter((item) => chosen.has(item.value) === (side === 'target'));
    const query = folded(this.queries()[side].trim());
    const items = query ? inSide.filter((item) => folded(`${item.label} ${item.secondary ?? ''}`).includes(query)) : inSide;
    const checked = new Set([...this.checked()[side]].filter((value) => inSide.some((item) => item.value === value)));
    const enabled = items.filter((item) => !item.disabled);
    const checkedShown = enabled.filter((item) => checked.has(item.value)).length;
    return {
      side,
      title: side === 'source' ? labels.source : labels.target,
      items,
      checked,
      count: formatText(labels.count, { checked: checked.size, total: inSide.length }),
      allChecked: enabled.length > 0 && checkedShown === enabled.length,
      someChecked: checkedShown > 0 && checkedShown < enabled.length,
    };
  }
}
