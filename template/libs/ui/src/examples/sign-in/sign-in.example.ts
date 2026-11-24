import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { OtpInput } from '../../lib/otp-input/otp-input';

export interface SignInExampleModel {
  /** The email first, then the 6-digit code sent to it. */
  readonly step: 'email' | 'code';
  readonly productName: string;
  readonly email: string;
  readonly code: string;
  /** Why the code didn't work, under the boxes. */
  readonly codeError: string;
  readonly text: {
    readonly emailTitle: string;
    readonly emailSummary: string;
    readonly emailLabel: string;
    readonly continueAction: string;
    readonly terms: string;
    readonly codeTitle: string;
    /** Says where the code went: *We sent a 6-digit code to ana@northwind.example.* */
    readonly codeSummary: string;
    readonly codeLabel: string;
    readonly boxLabel: (position: number, length: number) => string;
    readonly verifyAction: string;
    readonly resendAction: string;
    readonly changeEmailAction: string;
  };
}

/**
 * Screen pattern: signing in with a one-time code, no password. Step one asks for the email; step two for the
 * 6-digit code sent to it (`ui-otp-input`, which verifies on its own once complete), with a way to resend it or
 * change the email, in a centered card. Copy the composition, not the markup.
 */
@Component({
  selector: 'ui-sign-in-example',
  imports: [MatButtonModule, MatCardModule, MatFormFieldModule, MatInputModule, OtpInput],
  templateUrl: './sign-in.example.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SignInExample {
  readonly model = input.required<SignInExampleModel>();
}
