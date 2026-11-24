import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { render } from '@testing-library/angular';
import { Timeline } from './timeline';
import { TimelineHarness } from './timeline.harness';

describe('timeline', () => {
  it('lists the events in the order given, as one labelled list', async () => {
    const { fixture } = await render(Timeline, {
      inputs: {
        label: 'Order history',
        events: [
          { id: 'e-2', title: 'Paid', time: 'Today, 14:32', icon: 'check' },
          { id: 'e-1', title: 'Order placed', time: 'Yesterday' },
        ],
      },
    });
    const timeline = await TestbedHarnessEnvironment.harnessForFixture(fixture, TimelineHarness);
    expect(await timeline.getTitles()).toEqual(['Paid', 'Order placed']);
    expect(await timeline.getLabel()).toBe('Order history');
  });
});
