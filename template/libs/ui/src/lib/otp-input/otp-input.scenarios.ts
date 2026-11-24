import { ChangeDetectionStrategy, Component, effect, input, signal } from '@angular/core';
import { defineScenarios } from '@ligeirinho/previewer';
import { OtpInput } from './otp-input';

interface OtpInputPreviewModel {
  readonly label: string;
  readonly value: string;
  readonly length?: number;
  readonly error?: string;
  readonly disabled?: boolean;
}

@Component({
  selector: 'ui-otp-input-preview',
  imports: [OtpInput],
  template: `
    <div class="mx-auto max-w-md p-4 sm:p-8">
      <ui-otp-input
        [label]="model().label"
        [length]="model().length ?? 6"
        [error]="model().error ?? ''"
        [disabled]="model().disabled ?? false"
        [(value)]="value"
      />
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class OtpInputPreview {
  readonly model = input.required<OtpInputPreviewModel>();
  protected readonly value = signal('');

  constructor() {
    effect(() => {
      this.value.set(this.model().value);
    });
  }
}

const signIn: OtpInputPreviewModel = { label: 'Verification code', value: '' };

export const otpInputScenarios = defineScenarios({
  flow: 'Catalog',
  title: 'OTP input',
  component: OtpInputPreview,
  scenarios: {
    /** Waiting for the code from the email or SMS. */
    empty: signIn,
    /** Halfway through typing it. */
    typing: { ...signIn, value: '482' },
    /** The code was wrong or expired: the boxes turn red and the message says what to do. */
    error: { ...signIn, value: '482913', error: 'That code didn’t work. Check the latest message or send a new code.' },
    /** While the code is being verified. */
    disabled: { ...signIn, value: '482913', disabled: true },
  },
});
