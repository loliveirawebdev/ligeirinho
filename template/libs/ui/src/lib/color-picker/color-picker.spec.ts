import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { Component, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { render } from '@testing-library/angular';
import { ColorPicker } from './color-picker';
import { ColorPickerHarness } from './color-picker.harness';

const swatches = [
  { value: '#E53935', label: 'Red' },
  { value: '#1e88e5', label: 'Blue' },
  { value: '#43a047', label: 'Green' },
];

@Component({
  imports: [ColorPicker, ReactiveFormsModule],
  template: `<ui-color-picker [label]="label()" [swatches]="swatches" [formControl]="color" />`,
})
class FormHost {
  readonly label = signal('Label color');
  readonly swatches = swatches;
  readonly color = new FormControl('#43a047', { nonNullable: true });
}

describe('color picker', () => {
  it('picks a preset by its name and gives its lowercase hex', async () => {
    const { fixture } = await render(ColorPicker, { inputs: { label: 'Label color', swatches } });
    const picker = await TestbedHarnessEnvironment.harnessForFixture(fixture, ColorPickerHarness);
    expect(await picker.getSwatchLabels()).toEqual(['Red', 'Blue', 'Green']);
    expect(await picker.hasCustom()).toBe(false);
    await picker.choose('Red');
    expect(await picker.getChosenLabel()).toBe('Red');
    expect(fixture.componentInstance.value()).toBe('#e53935');
  });

  it('takes any other color from the custom button and shows it', async () => {
    const { fixture } = await render(ColorPicker, { inputs: { label: 'Label color', swatches, customLabel: 'Custom color', value: '#1e88e5' } });
    const picker = await TestbedHarnessEnvironment.harnessForFixture(fixture, ColorPickerHarness);
    await picker.pickCustom('#00897b');
    expect(await picker.getChosenLabel()).toBe('');
    expect(await picker.getValue()).toBe('#00897b');
  });

  it('works with a form control, written, chosen and disabled', async () => {
    const { fixture } = await render(FormHost);
    const picker = await TestbedHarnessEnvironment.harnessForFixture(fixture, ColorPickerHarness);
    expect(await picker.getChosenLabel()).toBe('Green');
    await picker.choose('Blue');
    expect(fixture.componentInstance.color.value).toBe('#1e88e5');
    fixture.componentInstance.color.disable();
    expect(await picker.isDisabled()).toBe(true);
  });
});
