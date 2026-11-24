import { ChangeDetectionStrategy, Component, computed, input, output, ViewEncapsulation } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

export interface CheckCardOption {
  readonly value: string;
  readonly title: string;
  /** What choosing it means: the plan's price, what the role can do. */
  readonly description?: string;
  /** A Material Symbol at the card's start. */
  readonly icon?: string;
  /** A short note at the card's end (*Popular*, *R$ 49/mo*). */
  readonly note?: string;
  readonly disabled?: boolean;
}

let nextGroup = 0;

/**
 * A choice that deserves more than a radio's label: a card per option, with an icon, a title and what it means
 * (plans, roles, delivery speeds, templates). One at a time (radio buttons underneath) or several (`multiple`,
 * checkboxes underneath), so the keyboard and screen readers work as with any form control. The page owns `selected`.
 */
@Component({
  selector: 'ui-check-cards',
  imports: [MatIconModule],
  templateUrl: './check-cards.html',
  styleUrl: './check-cards.css',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
})
export class CheckCards {
  readonly options = input.required<readonly CheckCardOption[]>();
  /** What is being chosen, for screen readers (and a form's field name): *Plan*. */
  readonly label = input.required<string>();
  readonly selected = input<readonly string[]>([]);
  readonly multiple = input(false);
  /** The narrowest a card gets before the row wraps. */
  readonly minWidth = input('220px');

  readonly selectedChange = output<readonly string[]>();

  protected readonly name = `ui-check-cards-${String(nextGroup++)}`;
  protected readonly chosen = computed(() => new Set(this.selected()));

  protected choose(option: CheckCardOption): void {
    if (!this.multiple()) {
      this.selectedChange.emit([option.value]);
      return;
    }
    const selected = this.selected();
    this.selectedChange.emit(
      selected.includes(option.value)
        ? selected.filter((value) => value !== option.value)
        : this.options()
            .map((item) => item.value)
            .filter((value) => value === option.value || selected.includes(value)),
    );
  }
}
