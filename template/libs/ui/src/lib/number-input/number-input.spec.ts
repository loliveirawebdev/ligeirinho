import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { Component, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { render } from '@testing-library/angular';
import { NumberInput } from './number-input';
import { NumberInputHarness } from './number-input.harness';

const inputs = { label: 'Guests', decreaseLabel: 'Remove one guest', increaseLabel: 'Add one guest', min: 1, max: 3 };

@Component({
  imports: [NumberInput, ReactiveFormsModule],
  template: `<ui-number-input [label]="copy().label" [decreaseLabel]="copy().decreaseLabel" [increaseLabel]="copy().increaseLabel" [formControl]="guests" />`,
})
class FormHost {
  readonly copy = signal(inputs);
  readonly guests = new FormControl<number | null>(4);
}

describe('number input', () => {
  it('steps with the buttons and stops at the limits', async () => {
    const { fixture } = await render(NumberInput, { inputs: { ...inputs, value: 2 } });
    const guests = await TestbedHarnessEnvironment.harnessForFixture(fixture, NumberInputHarness);
    await guests.increase();
    expect(await guests.getValue()).toBe('3');
    expect(await guests.canIncrease()).toBe(false);
    await guests.decrease();
    await guests.decrease();
    expect(await guests.getValue()).toBe('1');
    expect(await guests.canDecrease()).toBe(false);
  });

  it('steps with the arrow keys and clamps a typed number when the field is left', async () => {
    const { fixture } = await render(NumberInput, { inputs: { ...inputs, value: 1 } });
    const guests = await TestbedHarnessEnvironment.harnessForFixture(fixture, NumberInputHarness);
    await guests.pressArrow('up');
    expect(await guests.getValue()).toBe('2');
    await guests.setValue('12');
    expect(await guests.getValue()).toBe('3');
    expect(fixture.componentInstance.value()).toBe(3);
  });

  it('works with a form control, written, typed and disabled', async () => {
    const { fixture } = await render(FormHost);
    const guests = await TestbedHarnessEnvironment.harnessForFixture(fixture, NumberInputHarness);
    expect(await guests.getValue()).toBe('4');
    await guests.setValue('');
    expect(fixture.componentInstance.guests.value).toBeNull();
    fixture.componentInstance.guests.disable();
    expect(await guests.isDisabled()).toBe(true);
  });
});
