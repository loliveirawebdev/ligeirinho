import type { InputSignal } from '@angular/core';

export interface CounterViewModel {
  readonly count: number;
}

/**
 * Stands in for a view component in Node tests: same instance shape as
 * `readonly model = input.required<CounterViewModel>()`, without the Angular compiler.
 */
export class CounterView {
  declare readonly model: InputSignal<CounterViewModel>;
}
