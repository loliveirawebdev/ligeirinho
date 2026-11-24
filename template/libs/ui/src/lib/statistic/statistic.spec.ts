import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { render } from '@testing-library/angular';
import { Statistic } from './statistic';
import { StatisticHarness } from './statistic.harness';

describe('statistic', () => {
  it('shows the name, the value and how it moved', async () => {
    const { fixture } = await render(Statistic, {
      inputs: { label: 'Revenue', value: 'R$ 48.200', change: { value: '+12%', trend: 'up', good: true, label: 'vs last month' } },
    });
    const statistic = await TestbedHarnessEnvironment.harnessForFixture(fixture, StatisticHarness);
    expect(await statistic.getLabel()).toBe('Revenue');
    expect(await statistic.getValue()).toBe('R$ 48.200');
    expect(await statistic.getChange()).toBe('+12%');
  });
});
