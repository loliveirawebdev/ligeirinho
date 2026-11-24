import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { render, screen } from '@testing-library/angular';
import { Notice } from './notice';
import { NoticeHarness } from './notice.harness';

describe('notice', () => {
  it('announces an error with what happened and what to do', async () => {
    const { fixture } = await render(Notice, {
      inputs: { tone: 'error', title: 'The members could not be loaded', message: 'Check the connection and try again.' },
    });
    const notice = await TestbedHarnessEnvironment.harnessForFixture(fixture, NoticeHarness);
    expect(await notice.getTone()).toBe('error');
    expect(await notice.getTitle()).toBe('The members could not be loaded');
    expect(await notice.getMessage()).toBe('Check the connection and try again.');
    expect(screen.getByRole('alert')).toBeTruthy();
  });

  it('is polite when it is not an error', async () => {
    await render(Notice, { inputs: { title: 'Changes saved', tone: 'success' } });
    expect(screen.getByRole('status')).toBeTruthy();
  });
});
