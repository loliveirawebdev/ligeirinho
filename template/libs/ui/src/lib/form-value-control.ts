import { computed, Directive, input, signal } from '@angular/core';
import type { ControlValueAccessor } from '@angular/forms';

/**
 * What every form control of the catalog shares with Angular forms: the `disabled` input or the form's disabled
 * state (`isDisabled`), and the callbacks it reports changes and touches through. Each control reads its own value
 * in `writeValue`.
 */
@Directive()
export abstract class FormValueControl<TValue> implements ControlValueAccessor {
  readonly disabled = input(false);

  private readonly formDisabled = signal(false);
  protected readonly isDisabled = computed(() => this.disabled() || this.formDisabled());

  protected onChange: (value: TValue) => void = () => undefined;
  protected onTouched: () => void = () => undefined;

  abstract writeValue(value: unknown): void;

  registerOnChange(onChange: (value: TValue) => void): void {
    this.onChange = onChange;
  }

  registerOnTouched(onTouched: () => void): void {
    this.onTouched = onTouched;
  }

  setDisabledState(disabled: boolean): void {
    this.formDisabled.set(disabled);
  }
}
