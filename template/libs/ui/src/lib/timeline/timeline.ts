import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

export interface TimelineEvent {
  readonly id: string;
  readonly title: string;
  /** Already formatted: *Today, 14:32*, *3 Mar*. */
  readonly time: string;
  readonly description?: string;
  /** A Material Symbol in the marker, for the steps that matter (shipped, delivered, failed); a dot otherwise. */
  readonly icon?: string;
}

/**
 * What happened to a record, in order (an order's history, an audit trail, a ticket's activity): a marker per event
 * on a line, its title, when, and a line about it. The page decides the order (newest first, usually). Every marker
 * has the same quiet color: the words say what happened, not a palette.
 */
@Component({
  selector: 'ui-timeline',
  imports: [MatIconModule],
  templateUrl: './timeline.html',
  styleUrl: './timeline.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
})
export class Timeline {
  readonly events = input.required<readonly TimelineEvent[]>();
  /** What the list is, for screen readers: *Order history*. */
  readonly label = input.required<string>();
}
