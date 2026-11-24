import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { render } from '@testing-library/angular';
import { Panel } from './panel';
import { PanelHarness } from './panel.harness';

@Component({
  imports: [Panel],
  template: `
    <ui-panel [title]="overview" split="row">
      <ui-panel [title]="revenue" />
      <ui-panel [title]="costs" />
    </ui-panel>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class Dashboard {
  protected readonly overview = 'Overview';
  protected readonly revenue = 'Revenue';
  protected readonly costs = 'Costs';
}

describe('panel', () => {
  it('splits into the panels inside it, side by side', async () => {
    const { fixture } = await render(Dashboard);
    const loader = TestbedHarnessEnvironment.loader(fixture);
    const overview = await loader.getHarness(PanelHarness.with({ title: 'Overview' }));
    expect(await overview.getSplit()).toBe('row');
    expect(await overview.getPanelTitles()).toEqual(['Revenue', 'Costs']);
  });
});
