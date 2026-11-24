import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { defineScenarios } from '@ligeirinho/previewer';
import { Timeline, type TimelineEvent } from './timeline';

interface TimelinePreviewModel {
  readonly label: string;
  readonly events: readonly TimelineEvent[];
}

@Component({
  selector: 'ui-timeline-preview',
  imports: [Timeline],
  template: `
    <div class="max-w-xl p-4 sm:p-8">
      <ui-timeline [label]="model().label" [events]="model().events" />
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class TimelinePreview {
  readonly model = input.required<TimelinePreviewModel>();
}

export const timelineScenarios = defineScenarios({
  flow: 'Catalog',
  title: 'Timeline',
  component: TimelinePreview,
  scenarios: {
    /** An order's history, newest first: icons where the step matters, dots for the rest. */
    orderHistory: {
      label: 'Order history',
      events: [
        { id: 'e-5', title: 'Delivered', time: 'Today, 14:32', icon: 'check', description: 'Signed by Ana Souza at the front desk.' },
        { id: 'e-4', title: 'Delivery attempt failed', time: 'Yesterday, 17:05', icon: 'priority_high', description: 'No one at the address; a new attempt was scheduled.' },
        { id: 'e-3', title: 'Shipped', time: '12 Mar', icon: 'local_shipping' },
        { id: 'e-2', title: 'Paid', time: '11 Mar', description: 'Card ending in 4242.' },
        { id: 'e-1', title: 'Order placed', time: '11 Mar' },
      ],
    },
  },
});
