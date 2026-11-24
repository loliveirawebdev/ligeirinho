import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { render } from '@testing-library/angular';
import { Skeleton } from './skeleton';
import { SkeletonHarness } from './skeleton.harness';

describe('skeleton', () => {
  it('draws the rows asked for and is heard once, by its label', async () => {
    const { fixture } = await render(Skeleton, { inputs: { label: 'Loading members…', rows: 4, avatar: true } });
    const skeleton = await TestbedHarnessEnvironment.harnessForFixture(fixture, SkeletonHarness);
    expect(await skeleton.getLabel()).toBe('Loading members…');
    expect(await skeleton.getRowCount()).toBe(4);
    expect(await skeleton.getRole()).toBe('status');
  });
});
