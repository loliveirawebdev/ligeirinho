import { ChangeDetectionStrategy, Component, effect, input, signal } from '@angular/core';
import { defineScenarios } from '@ligeirinho/previewer';
import { type ColorSwatch, ColorPicker } from './color-picker';

interface ColorPickerPreviewModel {
  readonly label: string;
  readonly swatches: readonly ColorSwatch[];
  readonly value: string;
  readonly customLabel?: string;
  readonly disabled?: boolean;
}

@Component({
  selector: 'ui-color-picker-preview',
  imports: [ColorPicker],
  template: `
    <div class="mx-auto max-w-md p-4 sm:p-8">
      <ui-color-picker
        [label]="model().label"
        [swatches]="model().swatches"
        [customLabel]="model().customLabel ?? ''"
        [disabled]="model().disabled ?? false"
        [(value)]="value"
      />
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class ColorPickerPreview {
  readonly model = input.required<ColorPickerPreviewModel>();
  protected readonly value = signal('');

  constructor() {
    effect(() => {
      this.value.set(this.model().value);
    });
  }
}

const labelColor: ColorPickerPreviewModel = {
  label: 'Label color',
  customLabel: 'Custom color',
  value: '',
  swatches: [
    { value: '#e53935', label: 'Red' },
    { value: '#fb8c00', label: 'Orange' },
    { value: '#fdd835', label: 'Yellow' },
    { value: '#43a047', label: 'Green' },
    { value: '#1e88e5', label: 'Blue' },
    { value: '#8e24aa', label: 'Purple' },
    { value: '#757575', label: 'Gray' },
  ],
};

export const colorPickerScenarios = defineScenarios({
  flow: 'Catalog',
  title: 'Color picker',
  component: ColorPickerPreview,
  scenarios: {
    empty: labelColor,
    /** A preset chosen. */
    preset: { ...labelColor, value: '#1e88e5' },
    /** A color from the browser's picker, none of the presets. */
    custom: { ...labelColor, value: '#00897b' },
    disabled: { ...labelColor, value: '#43a047', disabled: true },
  },
});
