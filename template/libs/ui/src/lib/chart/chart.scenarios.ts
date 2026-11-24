import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { defineScenarios } from '@ligeirinho/previewer';
import { Chart, type ChartSeries, type ChartType } from './chart';

interface ChartPreviewModel {
  readonly type: ChartType;
  readonly label: string;
  readonly labels: readonly string[];
  readonly series: readonly ChartSeries[];
  readonly valueFormat?: (value: number) => string;
  /** A sparkline sits beside a number, in a narrow box. */
  readonly beside?: { readonly name: string; readonly value: string };
}

@Component({
  selector: 'ui-chart-preview',
  imports: [Chart],
  template: `
    @let m = model();
    <div class="mx-auto max-w-4xl p-4 sm:p-8">
      @if (m.beside; as beside) {
        <div class="flex max-w-xs items-end gap-4">
          <div class="min-w-0">
            <p class="text-body-medium text-on-surface-variant">{{ beside.name }}</p>
            <p class="text-headline-medium tabular-nums">{{ beside.value }}</p>
          </div>
          <ui-chart class="flex-1" [type]="m.type" [label]="m.label" [labels]="m.labels" [series]="m.series" />
        </div>
      } @else {
        <ui-chart
          [type]="m.type"
          [label]="m.label"
          [labels]="m.labels"
          [series]="m.series"
          [valueFormat]="m.valueFormat ?? plain"
        />
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class ChartPreview {
  readonly model = input.required<ChartPreviewModel>();
  protected readonly plain = (value: number): string => value.toLocaleString('en-US');
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const thousands = (value: number): string => `R$ ${String(Math.round(value / 100) / 10)}k`;

const revenue: ChartSeries = { name: 'Revenue', values: [31800, 33400, 32100, 36900, 38200, 37400, 41200, 43800, 42100, 45600, 46900, 48200] };
const costs: ChartSeries = { name: 'Costs', values: [17200, 17900, 18400, 18100, 18800, 19300, 19100, 19900, 19400, 19750, 20300, 20100] };

export const chartScenarios = defineScenarios({
  flow: 'Catalog',
  title: 'Chart',
  component: ChartPreview,
  scenarios: {
    /** One series filled to the axis: the dashboard's trend. Hover, or focus and use the arrows. */
    area: { type: 'area', label: 'Revenue by month', labels: MONTHS, series: [revenue], valueFormat: thousands },
    /** Two series: a legend under the plot, both values in the tooltip. */
    lines: { type: 'line', label: 'Revenue and costs by month', labels: MONTHS, series: [revenue, costs], valueFormat: thousands },
    /** Bars side by side per label. */
    bars: {
      type: 'bar',
      label: 'Tickets by weekday',
      labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      series: [
        { name: 'Opened', values: [42, 38, 51, 47, 39, 12, 9] },
        { name: 'Closed', values: [40, 41, 45, 49, 44, 10, 7], tone: 'success' },
      ],
    },
    /** The shares of one series, the total in the middle, each slice's value and share in the legend. */
    donut: {
      type: 'donut',
      label: 'Clients by plan',
      labels: ['Starter', 'Business', 'Enterprise', 'Trial'],
      series: [{ name: 'Clients', values: [124, 68, 14, 31] }],
    },
    /** A tiny trend beside its number: no axes, no tooltip, still a table for screen readers. */
    sparkline: {
      type: 'sparkline',
      label: 'Revenue over the last 12 months',
      labels: MONTHS,
      series: [revenue],
      beside: { name: 'Revenue', value: 'R$ 48.200' },
    },
  },
});
