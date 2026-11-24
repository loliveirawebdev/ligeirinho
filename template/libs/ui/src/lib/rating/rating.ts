import { ChangeDetectionStrategy, Component, ViewEncapsulation, computed, forwardRef, input, model, signal } from '@angular/core';
import { type ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';

let nextRating = 0;

/**
 * A score in whole stars (a review, a support reply, how a call went). Radio buttons underneath, so it is one Tab
 * stop and the arrows change the score, as screen readers expect; hovering previews the score before the click.
 * `readonly` shows a score that cannot be changed (in a list or a detail page), read as one value. 0 is no score yet.
 * Works with signals (`[(value)]`) and with Angular forms (`formControl`, `ngModel`).
 */
@Component({
  selector: 'ui-rating',
  imports: [MatIconModule],
  templateUrl: './rating.html',
  styleUrl: './rating.css',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => Rating), multi: true }],
  host: { class: 'block' },
})
export class Rating implements ControlValueAccessor {
  /** What is being scored, read as the group's name: *Your rating*. */
  readonly label = input.required<string>();
  /** Each score's name: `(n) => n === 1 ? '1 star' : `${n} stars``, from the page's copy (plural rules differ). */
  readonly starLabel = input.required<(stars: number) => string>();
  /** Shows the label above the stars; when false it is only read by screen readers. */
  readonly showLabel = input(true);
  readonly max = input(5);
  readonly readonly = input(false);
  readonly disabled = input(false);
  readonly value = model(0);

  protected readonly id = `ui-rating-${String(nextRating++)}`;
  protected readonly stars = computed(() => Array.from({ length: Math.max(1, this.max()) }, (_, index) => index + 1));
  protected readonly isDisabled = computed(() => this.disabled() || this.formDisabled());
  /** The stars drawn filled: the hovered score while the pointer is over them, else the value. */
  protected readonly shown = computed(() => this.hovered() ?? this.value());

  private readonly hovered = signal<number | null>(null);
  private readonly formDisabled = signal(false);
  private onChange: (value: number) => void = () => undefined;
  private onTouched: () => void = () => undefined;

  writeValue(value: unknown): void {
    this.value.set(typeof value === 'number' ? value : 0);
  }

  registerOnChange(onChange: (value: number) => void): void {
    this.onChange = onChange;
  }

  registerOnTouched(onTouched: () => void): void {
    this.onTouched = onTouched;
  }

  setDisabledState(disabled: boolean): void {
    this.formDisabled.set(disabled);
  }

  protected choose(stars: number): void {
    if (stars !== this.value()) {
      this.value.set(stars);
      this.onChange(stars);
    }
  }

  protected hover(stars: number | null): void {
    this.hovered.set(this.isDisabled() ? null : stars);
  }

  protected touched(): void {
    this.onTouched();
  }
}
