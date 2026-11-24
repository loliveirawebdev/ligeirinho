import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { render } from '@testing-library/angular';
import { EmptyState } from './empty-state';
import { EmptyStateHarness } from './empty-state.harness';

describe('empty state', () => {
  it('says what will be here', async () => {
    const { fixture } = await render(EmptyState, {
      inputs: { title: 'No members yet', message: 'Members you invite appear here.' },
    });
    const emptyState = await TestbedHarnessEnvironment.harnessForFixture(fixture, EmptyStateHarness);
    expect(await emptyState.getTitle()).toBe('No members yet');
    expect(await emptyState.getMessage()).toBe('Members you invite appear here.');
  });
});
