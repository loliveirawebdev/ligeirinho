import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { defineScenarios } from '@ligeirinho/previewer';
import { Statistic, type StatisticChange } from './statistic';

interface StatisticPreviewModel {
  readonly statistics: readonly {
    readonly label: string;
    readonly value: string;
    readonly change?: StatisticChange;
    readonly supportingText?: string;
  }[];
}

@Component({
  selector: 'ui-statistic-preview',
  imports: [Statistic],
  template: `
    <div class="grid grid-cols-2 gap-6 p-4 sm:p-8 md:grid-cols-4">
      @for (statistic of model().statistics; track statistic.label) {
        <ui-statistic
          [label]="statistic.label"
          [value]="statistic.value"
          [change]="statistic.change"
          [supportingText]="statistic.supportingText ?? ''"
        />
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class StatisticPreview {
  readonly model = input.required<StatisticPreviewModel>();
}

export const statisticScenarios = defineScenarios({
  flow: 'Catalog',
  title: 'Statistic',
  component: StatisticPreview,
  scenarios: {
    /** Up and good, up and bad (costs), down and good (churn), and one with only a line under it. */
    kpis: {
      statistics: [
        { label: 'Revenue', value: 'R$ 48.200', change: { value: '+12%', trend: 'up', good: true, label: 'vs last month' } },
        { label: 'Costs', value: 'R$ 19.750', change: { value: '+8%', trend: 'up', good: false, label: 'vs last month' } },
        { label: 'Churn', value: '2,1%', change: { value: '−0,4 pp', trend: 'down', good: true, label: 'vs last month' } },
        { label: 'Open tickets', value: '37', supportingText: '9 waiting for a reply' },
      ],
    },
  },
});
