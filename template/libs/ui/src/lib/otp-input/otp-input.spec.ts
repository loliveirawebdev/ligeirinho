import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { Component, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { render } from '@testing-library/angular';
import { OtpInput } from './otp-input';
import { OtpInputHarness } from './otp-input.harness';

@Component({
  imports: [OtpInput, ReactiveFormsModule],
  template: `<ui-otp-input [label]="label()" [length]="4" [formControl]="code" />`,
})
class FormHost {
  readonly label = signal('Verification code');
  readonly code = new FormControl('', { nonNullable: true });
}

describe('otp input', () => {
  it('types one digit per box, ignores letters and emits the completed code once', async () => {
    const completed: string[] = [];
    const { fixture } = await render(OtpInput, {
      inputs: { label: 'Verification code' },
      on: { completed: (code: string) => completed.push(code) },
    });
    const otp = await TestbedHarnessEnvironment.harnessForFixture(fixture, OtpInputHarness);
    expect(await otp.getBoxCount()).toBe(6);
    await otp.type('48a29');
    expect(await otp.getValue()).toBe('4829');
    expect(completed).toEqual([]);
    await otp.type('13');
    expect(await otp.getValue()).toBe('482913');
    expect(completed).toEqual(['482913']);
  });

  it('fills every box from a pasted code, spaces and dashes left out', async () => {
    const completed: string[] = [];
    const { fixture } = await render(OtpInput, {
      inputs: { label: 'Verification code' },
      on: { completed: (code: string) => completed.push(code) },
    });
    const otp = await TestbedHarnessEnvironment.harnessForFixture(fixture, OtpInputHarness);
    await otp.paste('482-913');
    expect(await otp.getValue()).toBe('482913');
    expect(completed).toEqual(['482913']);
  });

  it('goes back with Backspace from an empty box', async () => {
    const { fixture } = await render(OtpInput, { inputs: { label: 'Verification code', value: '482' } });
    const otp = await TestbedHarnessEnvironment.harnessForFixture(fixture, OtpInputHarness);
    await otp.backspace(3);
    expect(await otp.getValue()).toBe('48');
  });

  it('works with a form control, written, typed and disabled', async () => {
    const { fixture } = await render(FormHost);
    const otp = await TestbedHarnessEnvironment.harnessForFixture(fixture, OtpInputHarness);
    fixture.componentInstance.code.setValue('12');
    expect(await otp.getValue()).toBe('12');
    await otp.type('34');
    expect(fixture.componentInstance.code.value).toBe('1234');
    fixture.componentInstance.code.disable();
    expect(await otp.isDisabled()).toBe(true);
  });
});
