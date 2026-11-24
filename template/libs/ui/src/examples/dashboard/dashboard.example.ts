import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { AppShell } from '../../lib/app-shell/app-shell';
import { Chart, type ChartSeries } from '../../lib/chart/chart';
import { DataTable, type DataTableColumn, type DataTableRow } from '../../lib/data-table/data-table';
import { PageHeader } from '../../lib/page-header/page-header';
import { Panel } from '../../lib/panel/panel';
import { Skeleton } from '../../lib/skeleton/skeleton';
import { Statistic, type StatisticChange } from '../../lib/statistic/statistic';
import type { ExampleShell } from '../members/member-list.example';

export interface DashboardKpi {
  readonly label: string;
  readonly value: string;
  readonly change?: StatisticChange;
  readonly supportingText?: string;
}

export interface DashboardExampleModel {
  readonly shell: ExampleShell;
  readonly status: 'ready' | 'loading';
  readonly text: {
    readonly title: string;
    readonly summary: string;
    readonly periodLabel: string;
    readonly kpisLabel: string;
    readonly trendTitle: string;
    readonly trendSubtitle: string;
    readonly recentTitle: string;
    readonly loading: string;
  };
  readonly periods: readonly { readonly value: string; readonly label: string }[];
  readonly period: string;
  readonly kpis: readonly DashboardKpi[];
  readonly trend: { readonly labels: readonly string[]; readonly series: readonly ChartSeries[]; readonly format: (value: number) => string };
  readonly columns: readonly DataTableColumn[];
  readonly rows: readonly DataTableRow[];
}

/**
 * Screen pattern: a dashboard (shadcn dashboard-01). Shell, header with the period as a toggle, the KPIs as a row
 * split of statistics, the trend as an area chart in a panel, the recent records in a table under it. While it
 * loads, each block keeps its place with a skeleton. Copy the composition, not the markup.
 */
@Component({
  selector: 'ui-dashboard-example',
  imports: [AppShell, Chart, DataTable, MatButtonToggleModule, PageHeader, Panel, Skeleton, Statistic],
  templateUrl: './dashboard.example.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardExample {
  readonly model = input.required<DashboardExampleModel>();
}
