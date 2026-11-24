import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { defineScenarios } from '@ligeirinho/previewer';
import { DetailList, type DetailItem } from '../detail-list/detail-list';
import { Statistic, type StatisticChange } from '../statistic/statistic';
import { Panel } from './panel';

interface PanelPreviewModel {
  readonly title: string;
  readonly subtitle?: string;
  readonly moreLabel?: string;
  /** Statistic cards: one panel per number, in a row split. */
  readonly statistics?: readonly { readonly label: string; readonly value: string; readonly change?: StatisticChange }[];
  /** A side split: a list on one side, the chosen record's facts on the other. */
  readonly sides?: {
    readonly listTitle: string;
    readonly items: readonly string[];
    readonly detailTitle: string;
    readonly facts: readonly DetailItem[];
  };
  /** A column split: sections one under the other. */
  readonly sections?: readonly { readonly title: string; readonly body: string }[];
}

@Component({
  selector: 'ui-panel-preview',
  imports: [DetailList, MatButtonModule, MatIconModule, Panel, Statistic],
  template: `
    @let m = model();
    <div class="mx-auto max-w-5xl p-4 sm:p-8">
      @if (m.statistics; as statistics) {
        <ui-panel [title]="m.title" [subtitle]="m.subtitle ?? ''" split="row">
          @if (m.moreLabel) {
            <button uiPanelActions matIconButton type="button" [attr.aria-label]="m.moreLabel">
              <mat-icon aria-hidden="true">more_vert</mat-icon>
            </button>
          }
          @for (statistic of statistics; track statistic.label) {
            <ui-panel>
              <ui-statistic [label]="statistic.label" [value]="statistic.value" [change]="statistic.change" />
            </ui-panel>
          }
        </ui-panel>
      } @else if (m.sides; as sides) {
        <ui-panel [title]="m.title" split="row">
          <ui-panel [title]="sides.listTitle" size="35%">
            <ul class="text-body-medium flex flex-col gap-2">
              @for (item of sides.items; track item) {
                <li>{{ item }}</li>
              }
            </ul>
          </ui-panel>
          <ui-panel [title]="sides.detailTitle">
            <ui-detail-list [items]="sides.facts" />
          </ui-panel>
        </ui-panel>
      } @else if (m.sections; as sections) {
        <ui-panel [title]="m.title" split="column">
          @for (section of sections; track section.title) {
            <ui-panel [title]="section.title">
              <p class="text-body-medium text-on-surface-variant">{{ section.body }}</p>
            </ui-panel>
          }
        </ui-panel>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class PanelPreview {
  readonly model = input.required<PanelPreviewModel>();
}

export const panelScenarios = defineScenarios({
  flow: 'Catalog',
  title: 'Panel',
  component: PanelPreview,
  scenarios: {
    /** Statistic cards: a panel per number in one outline, divided by lines; stacked on phones. */
    statisticCards: {
      title: 'This month',
      subtitle: 'Compared with October',
      moreLabel: 'More options',
      statistics: [
        { label: 'Revenue', value: 'R$ 48.200', change: { value: '+12%', trend: 'up', good: true, label: 'vs October' } },
        { label: 'Costs', value: 'R$ 19.750', change: { value: '+8%', trend: 'up', good: false, label: 'vs October' } },
        { label: 'New clients', value: '14', change: { value: '+3', trend: 'up', good: true, label: 'vs October' } },
        { label: 'Churn', value: '2,1%', change: { value: '−0,4 pp', trend: 'down', good: true, label: 'vs October' } },
      ],
    },
    /** A list beside the chosen record, the list a fixed share. */
    sideBySide: {
      title: 'Clients',
      sides: {
        listTitle: 'Recent',
        items: ['Northwind Traders', 'Contoso', 'Fabrikam', 'Tailspin Toys'],
        detailTitle: 'Northwind Traders',
        facts: [
          { label: 'Plan', value: 'Business' },
          { label: 'Since', value: 'March 2024' },
          { label: 'Owner', value: 'Ana Souza' },
        ],
      },
    },
    /** Sections one under the other, inside one outline. */
    column: {
      title: 'Contract 2026',
      sections: [
        { title: 'Scope', body: 'Support and maintenance of the client portal, with two releases a month.' },
        { title: 'Terms', body: 'Twelve months from March 1st, renewed unless cancelled 60 days before.' },
      ],
    },
  },
});
