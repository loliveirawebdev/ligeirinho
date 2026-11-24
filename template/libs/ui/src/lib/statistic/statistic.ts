import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

/** How the number moved, already formatted (*+12%*), and whether that is good news. */
export interface StatisticChange {
  readonly value: string;
  readonly trend: 'up' | 'down';
  /** Up is not always good (costs, churn): green when good, red when not. */
  readonly good: boolean;
  /** Against what: *vs last month*. */
  readonly label?: string;
}

/**
 * One number that matters (revenue, open tickets, conversion): its name, the value already formatted by the
 * view-model (*R$ 48.200*, *12,4%*), how it moved, and a line under it. Several sit side by side in a grid.
 */
@Component({
  selector: 'ui-statistic',
  imports: [MatIconModule],
  templateUrl: './statistic.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block min-w-0' },
})
export class Statistic {
  readonly label = input.required<string>();
  readonly value = input.required<string>();
  readonly change = input<StatisticChange>();
  /** A line under it: the period, what is counted. */
  readonly supportingText = input('');
}
