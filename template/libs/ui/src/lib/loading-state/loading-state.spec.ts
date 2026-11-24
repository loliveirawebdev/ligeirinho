import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { render } from '@testing-library/angular';
import { LoadingState } from './loading-state';
import { LoadingStateHarness } from './loading-state.harness';

describe('loading state', () => {
  it('says what is loading', async () => {
    const { fixture } = await render(LoadingState, { inputs: { label: 'Loading members…' } });
    const loading = await TestbedHarnessEnvironment.harnessForFixture(fixture, LoadingStateHarness);
    expect(await loading.getLabel()).toBe('Loading members…');
  });
});
