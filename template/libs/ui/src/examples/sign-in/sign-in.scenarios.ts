import { defineScenarios } from '@ligeirinho/previewer';
import { SignInExample, type SignInExampleModel } from './sign-in.example';

const email: SignInExampleModel = {
  step: 'email',
  productName: 'Northwind',
  email: '',
  code: '',
  codeError: '',
  text: {
    emailTitle: 'Sign in',
    emailSummary: 'Enter your email and we’ll send you a code to sign in. No password needed.',
    emailLabel: 'Email',
    continueAction: 'Continue',
    terms: 'By continuing you agree to the Terms of Service and the Privacy Policy.',
    codeTitle: 'Check your email',
    codeSummary: 'We sent a 6-digit code to ana.souza@northwind.example. It expires in 10 minutes.',
    codeLabel: 'Code',
    boxLabel: (position, length) => `Digit ${String(position)} of ${String(length)}`,
    verifyAction: 'Sign in',
    resendAction: 'Send a new code',
    changeEmailAction: 'Use another email',
  },
};

const code: SignInExampleModel = { ...email, step: 'code', email: 'ana.souza@northwind.example' };

export const signInScenarios = defineScenarios({
  flow: 'Screen patterns',
  title: 'Sign-in pattern',
  component: SignInExample,
  scenarios: {
    /** Step one, in a centered card: the email. */
    email,
    /** Step two: the 6-digit code; it signs in once the last digit is in. */
    code,
    /** The code didn't work: the boxes in error, what to do under them. */
    codeError: { ...code, code: '418230', codeError: 'That code didn’t work. Check the latest email or send a new code.' },
  },
});
