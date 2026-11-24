import { ChangeDetectionStrategy, Component, input, output, ViewEncapsulation } from '@angular/core';
import { MatPseudoCheckboxModule } from '@angular/material/core';
import { MatChipsModule, type MatChipListbox, type MatChipListboxChange } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';

export interface FilterOption {
  readonly value: string;
  readonly label: string;
}

/**
 * One filter of several, as a chip that opens its options (*Status*, *Role*, *Team*): once set, the chip shows what
 * was chosen (*Status: Active*) and a button that clears it.
 */
export interface LightFilter {
  readonly key: string;
  /** The chip's name, and what it starts with once set: *Status*. */
  readonly label: string;
  readonly options: readonly FilterOption[];
  /** The values chosen; empty is no filter. */
  readonly selected: readonly string[];
  /** Several options at once (checkboxes, the menu stays open); one at a time by default (the menu closes). */
  readonly multiple?: boolean;
  /** The clear button, read by screen readers: *Clear status*. */
  readonly clearLabel: string;
}

export interface LightFilterChange {
  readonly key: string;
  readonly selected: readonly string[];
}

/**
 * Above a list or table: a search field and the filters, beside the field on wide screens or under it
 * (`filtersPosition`): one row of chips with one chosen at a time (`filters`: *All*, *Active*, *Invited*), and/or a
 * chip per filter that opens its options (`lightFilters`: *Status*, *Role*). The page owns the query and the filters;
 * this only reports changes.
 */
@Component({
  selector: 'ui-filter-bar',
  imports: [MatChipsModule, MatFormFieldModule, MatIconModule, MatInputModule, MatMenuModule, MatPseudoCheckboxModule],
  templateUrl: './filter-bar.html',
  styleUrl: './filter-bar.css',
  // The menu of a light filter opens in an overlay, outside this element; every selector starts with .ui-light.
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
})
export class FilterBar {
  readonly searchLabel = input.required<string>();
  readonly query = input('');
  readonly filtersLabel = input('');
  readonly filters = input<readonly FilterOption[]>([]);
  readonly selectedFilter = input('');
  /** Where the chips go on wide screens: beside the field, or under it (many filters, long labels). Always under on phones. */
  readonly filtersPosition = input<'beside' | 'below'>('beside');
  /** A chip per filter, each opening its options. */
  readonly lightFilters = input<readonly LightFilter[]>([]);

  readonly queryChange = output<string>();
  readonly filterChange = output<string>();
  /** A light filter's new values: pass them back in its `selected`. */
  readonly lightFilterChange = output<LightFilterChange>();

  /** What a set chip shows after its name: the chosen options' labels, in the options' order. */
  protected chosenLabels(filter: LightFilter): string {
    return filter.options
      .filter((option) => filter.selected.includes(option.value))
      .map((option) => option.label)
      .join(', ');
  }

  protected choose(filter: LightFilter, value: string): void {
    const chosen = filter.selected.includes(value);
    const selected = filter.multiple
      ? chosen
        ? filter.selected.filter((item) => item !== value)
        : filter.options.map((option) => option.value).filter((item) => item === value || filter.selected.includes(item))
      : chosen
        ? []
        : [value];
    this.lightFilterChange.emit({ key: filter.key, selected });
  }

  protected clear(filter: LightFilter): void {
    this.lightFilterChange.emit({ key: filter.key, selected: [] });
  }

  protected updateQuery(inputEvent: Event): void {
    if (inputEvent.target instanceof HTMLInputElement) {
      this.queryChange.emit(inputEvent.target.value);
    }
  }

  /** One filter is always chosen: clicking the chosen chip again keeps it instead of choosing none. */
  protected chooseFilter(change: MatChipListboxChange, listbox: MatChipListbox): void {
    if (typeof change.value === 'string') {
      this.filterChange.emit(change.value);
    } else {
      listbox.value = this.selectedFilter();
    }
  }
}
