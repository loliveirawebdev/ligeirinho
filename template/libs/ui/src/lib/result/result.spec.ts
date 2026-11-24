import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { render } from '@testing-library/angular';
import { Result } from './result';
import { ResultHarness } from './result.harness';

describe('result', () => {
  it('heads the page with the outcome and says what it means', async () => {
    const { fixture } = await render(Result, {
      inputs: { status: 'success', title: 'Payment received', message: 'We emailed the receipt to ana@northwind.example.' },
    });
    const result = await TestbedHarnessEnvironment.harnessForFixture(fixture, ResultHarness);
    expect(await result.getStatus()).toBe('success');
    expect(await result.getTitle()).toBe('Payment received');
    expect(await result.getMessage()).toBe('We emailed the receipt to ana@northwind.example.');
  });
});
