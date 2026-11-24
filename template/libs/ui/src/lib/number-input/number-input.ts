import { ChangeDetectionStrategy, Component, ViewEncapsulation, computed, forwardRef, input, linkedSignal, model, signal } from '@angular/core';
import { type ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';

/**
 * A number with − and + attached (quantities, seats, guests, days): an outlined Material field, so it lines up with
 * the form's other fields. ArrowUp and ArrowDown (and PageUp/PageDown, ten steps) change it by `step`; the buttons
 * stop at `min` and `max`, and a typed number is clamped when the field is left. Empty is `null`. Works with signals
 * (`[(value)]`) and with Angular forms (`formControl`, `ngModel`).
 */
@Component({
  selector: 'ui-number-input',
  imports: [MatButtonModule, MatFormFieldModule, MatIconModule, MatInputModule],
  templateUrl: './number-input.html',
  styleUrl: './number-input.css',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => NumberInput), multi: true }],
  host: { class: 'block' },
})
export class NumberInput implements ControlValueAccessor {
  readonly label = input.required<string>();
  /** The − button's name for screen readers: *Remove one guest*. */
  readonly decreaseLabel = input.required<string>();
  /** The + button's name for screen readers: *Add one guest*. */
  readonly increaseLabel = input.required<string>();
  readonly min = input<number>();
  readonly max = input<number>();
  readonly step = input(1);
  /** A line under the field: *Up to 8 guests*. */
  readonly hint = input('');
  readonly disabled = input(false);
  readonly value = model<number | null>(null);

  protected readonly isDisabled = computed(() => this.disabled() || this.formDisabled());
  protected readonly atMin = computed(() => this.isAt(this.min()));
  protected readonly atMax = computed(() => this.isAt(this.max()));
  /** What the field shows: the value, or what is being typed until the field is left. */
  protected readonly draft = linkedSignal(() => {
    const value = this.value();
    return value === null ? '' : String(value);
  });

  private readonly formDisabled = signal(false);
  private onChange: (value: number | null) => void = () => undefined;
  private onTouched: () => void = () => undefined;

  writeValue(value: unknown): void {
    this.value.set(typeof value === 'number' && Number.isFinite(value) ? value : null);
  }

  registerOnChange(onChange: (value: number | null) => void): void {
    this.onChange = onChange;
  }

  registerOnTouched(onTouched: () => void): void {
    this.onTouched = onTouched;
  }

  setDisabledState(disabled: boolean): void {
    this.formDisabled.set(disabled);
  }

  /** Moves by `steps` steps from the value (or from `min`, or 0, when empty), within the limits. */
  protected stepBy(steps: number): void {
    const start = this.value() ?? this.min() ?? 0;
    this.update(this.clamp(this.round(start + steps * this.step())));
  }

  protected typed(inputEvent: Event): void {
    if (!(inputEvent.target instanceof HTMLInputElement)) {
      return;
    }
    const text = inputEvent.target.value;
    this.update(this.parse(text));
    this.draft.set(text);
  }

  protected keydown(keyboardEvent: KeyboardEvent): void {
    const steps: Readonly<Record<string, number>> = { ArrowUp: 1, ArrowDown: -1, PageUp: 10, PageDown: -10 };
    const move = steps[keyboardEvent.key];
    if (move !== undefined) {
      keyboardEvent.preventDefault();
      this.stepBy(move);
    }
  }

  protected blurred(): void {
    const value = this.value();
    this.update(value === null ? null : this.clamp(value));
    this.draft.set(this.value() === null ? '' : String(this.value()));
    this.onTouched();
  }

  private update(value: number | null): void {
    if (value !== this.value()) {
      this.value.set(value);
      this.onChange(value);
    }
  }

  private isAt(limit: number | undefined): boolean {
    const value = this.value();
    return limit !== undefined && value !== null && value === this.clamp(limit);
  }

  private parse(text: string): number | null {
    const normalized = text.trim().replace(',', '.');
    const value = normalized === '' ? Number.NaN : Number(normalized);
    return Number.isFinite(value) ? value : null;
  }

  private clamp(value: number): number {
    const min = this.min() ?? Number.NEGATIVE_INFINITY;
    const max = this.max() ?? Number.POSITIVE_INFINITY;
    return Math.min(max, Math.max(min, value));
  }

  /** Keeps 0.1 + 0.2 at 0.3: as many decimals as the step has. */
  private round(value: number): number {
    const decimals = (String(this.step()).split('.')[1] ?? '').length;
    return Number(value.toFixed(decimals));
  }
}
