import { ChangeDetectionStrategy, Component, effect, input, signal } from '@angular/core';
import { defineScenarios } from '@ligeirinho/previewer';
import { NumberInput } from './number-input';

interface NumberInputPreviewModel {
  readonly label: string;
  readonly decreaseLabel: string;
  readonly increaseLabel: string;
  readonly value: number | null;
  readonly min?: number;
  readonly max?: number;
  readonly step?: number;
  readonly hint?: string;
  readonly disabled?: boolean;
}

@Component({
  selector: 'ui-number-input-preview',
  imports: [NumberInput],
  template: `
    <div class="mx-auto max-w-xs p-4 sm:p-8">
      <ui-number-input
        [label]="model().label"
        [decreaseLabel]="model().decreaseLabel"
        [increaseLabel]="model().increaseLabel"
        [min]="model().min"
        [max]="model().max"
        [step]="model().step ?? 1"
        [hint]="model().hint ?? ''"
        [disabled]="model().disabled ?? false"
        [(value)]="value"
      />
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class NumberInputPreview {
  readonly model = input.required<NumberInputPreviewModel>();
  protected readonly value = signal<number | null>(null);

  constructor() {
    effect(() => {
      this.value.set(this.model().value);
    });
  }
}

const guests: NumberInputPreviewModel = {
  label: 'Guests',
  decreaseLabel: 'Remove one guest',
  increaseLabel: 'Add one guest',
  value: 2,
  min: 1,
  max: 8,
  hint: 'Up to 8 guests',
};

export const numberInputScenarios = defineScenarios({
  flow: 'Catalog',
  title: 'Number input',
  component: NumberInputPreview,
  scenarios: {
    filled: guests,
    /** At the lower limit, − is disabled. */
    atMinimum: { ...guests, value: 1 },
    /** Empty, decimal steps: a weight in kilograms. */
    empty: { label: 'Weight (kg)', decreaseLabel: 'Decrease weight', increaseLabel: 'Increase weight', value: null, min: 0, step: 0.5 },
    disabled: { ...guests, disabled: true },
  },
});
