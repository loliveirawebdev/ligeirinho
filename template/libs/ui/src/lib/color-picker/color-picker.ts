import { ChangeDetectionStrategy, Component, ViewEncapsulation, computed, forwardRef, input, model, signal } from '@angular/core';
import { type ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';

export interface ColorSwatch {
  /** A hex color: `#1e88e5`. */
  readonly value: string;
  /** Its name for screen readers and the tooltip: *Blue*. */
  readonly label: string;
}

let nextPicker = 0;

/**
 * A color picked from a few presets (a label's, a calendar's, a project's color): a swatch per preset, radio buttons
 * underneath, so it is one Tab stop and the arrows move between colors. With `customLabel`, a last button opens the
 * browser's own color picker for any other color, and shows it once chosen. The value is a lowercase hex string
 * (`#1e88e5`), '' when none. Works with signals (`[(value)]`) and with Angular forms (`formControl`, `ngModel`).
 */
@Component({
  selector: 'ui-color-picker',
  imports: [MatIconModule],
  templateUrl: './color-picker.html',
  styleUrl: './color-picker.css',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => ColorPicker), multi: true }],
  host: { class: 'block', '(focusout)': 'touched()' },
})
export class ColorPicker implements ControlValueAccessor {
  /** What the color is for, read as the group's name: *Label color*. */
  readonly label = input.required<string>();
  readonly swatches = input.required<readonly ColorSwatch[]>();
  /** Shows the label above the swatches; when false it is only read by screen readers. */
  readonly showLabel = input(true);
  /** The name of the button for any other color (*Custom color*); without it, only the presets. */
  readonly customLabel = input('');
  readonly disabled = input(false);
  readonly value = model('');

  protected readonly id = `ui-color-picker-${String(nextPicker++)}`;
  protected readonly isDisabled = computed(() => this.disabled() || this.formDisabled());
  protected readonly normalized = computed(() => this.value().toLowerCase());
  /** A value that is none of the presets: a custom color. */
  protected readonly isCustom = computed(() => this.normalized() !== '' && !this.swatches().some((swatch) => swatch.value.toLowerCase() === this.normalized()));
  /** The native picker opens on the value when it is a full hex color. */
  protected readonly pickerValue = computed(() => (/^#[0-9a-f]{6}$/.test(this.normalized()) ? this.normalized() : '#000000'));

  private readonly formDisabled = signal(false);
  private onChange: (value: string) => void = () => undefined;
  private onTouched: () => void = () => undefined;

  writeValue(value: unknown): void {
    this.value.set(typeof value === 'string' ? value.toLowerCase() : '');
  }

  registerOnChange(onChange: (value: string) => void): void {
    this.onChange = onChange;
  }

  registerOnTouched(onTouched: () => void): void {
    this.onTouched = onTouched;
  }

  setDisabledState(disabled: boolean): void {
    this.formDisabled.set(disabled);
  }

  protected isChosen(swatch: ColorSwatch): boolean {
    return swatch.value.toLowerCase() === this.normalized();
  }

  protected choose(color: string): void {
    const next = color.toLowerCase();
    if (next !== this.value()) {
      this.value.set(next);
      this.onChange(next);
    }
  }

  protected picked(inputEvent: Event): void {
    if (inputEvent.target instanceof HTMLInputElement) {
      this.choose(inputEvent.target.value);
    }
  }

  protected touched(): void {
    this.onTouched();
  }
}
