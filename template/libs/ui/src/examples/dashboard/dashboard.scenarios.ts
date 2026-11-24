import { defineScenarios } from '@ligeirinho/previewer';
import type { DataTableRow } from '../../lib/data-table/data-table';
import type { ExampleShell } from '../members/member-list.example';
import { SAMPLE_NAVIGATION, SAMPLE_SHELL } from '../members/sample-members';
import { DashboardExample, type DashboardExampleModel } from './dashboard.example';

/** *Overview* is the current page here. */
const shell: ExampleShell = {
  ...SAMPLE_SHELL,
  navigation: [{ items: [{ label: 'Overview', icon: 'dashboard', path: '/__preview' }] }, ...SAMPLE_NAVIGATION.slice(1)],
};

const DAYS = Array.from({ length: 30 }, (_, index) => `Nov ${String(index + 1)}`);
/** Daily revenue with a weekly rhythm and a slow climb. */
const REVENUE = DAYS.map((_, index) => Math.round(1400 + index * 22 + Math.sin(index / 1.1) * 260 + (index % 7 === 5 ? -380 : 0)));

/** An order's cells, in the columns' order: client, plan, status, amount, date. */
function order(id: string, cells: readonly [string, string, string, string, string]): DataTableRow {
  const [client, plan, status, amount, date] = cells;
  return { id, cells: { client, plan, status, amount, date }, openLabel: `Open order ${id} from ${client}` };
}

const dashboard: DashboardExampleModel = {
  shell,
  status: 'ready',
  text: {
    title: 'Overview',
    summary: 'November 2026',
    periodLabel: 'Period',
    kpisLabel: 'Key numbers',
    trendTitle: 'Revenue',
    trendSubtitle: 'Per day, last 30 days',
    recentTitle: 'Recent orders',
    loading: 'Loading the overview…',
  },
  periods: [
    { value: '7d', label: '7 days' },
    { value: '30d', label: '30 days' },
    { value: '90d', label: '3 months' },
  ],
  period: '30d',
  kpis: [
    { label: 'Revenue', value: 'R$ 48.200', change: { value: '+12%', trend: 'up', good: true, label: 'vs October' } },
    { label: 'New clients', value: '14', change: { value: '+3', trend: 'up', good: true, label: 'vs October' } },
    { label: 'Active accounts', value: '1.284', change: { value: '−2%', trend: 'down', good: false, label: 'vs October' } },
    { label: 'Churn', value: '2,1%', change: { value: '−0,4 pp', trend: 'down', good: true, label: 'vs October' } },
  ],
  trend: {
    labels: DAYS,
    series: [{ name: 'Revenue', values: REVENUE }],
    format: (value) => `R$ ${(value / 1000).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}k`,
  },
  columns: [
    { key: 'client', label: 'Client' },
    { key: 'plan', label: 'Plan' },
    { key: 'status', label: 'Status' },
    { key: 'amount', label: 'Amount', align: 'end' },
    { key: 'date', label: 'Date', align: 'end' },
  ],
  rows: [
    order('1042', ['Contoso', 'Business', 'Paid', 'R$ 1.490', 'Nov 30']),
    order('1041', ['Fabrikam', 'Starter', 'Paid', 'R$ 290', 'Nov 29']),
    order('1040', ['Tailspin Toys', 'Enterprise', 'Pending', 'R$ 6.800', 'Nov 29']),
    order('1039', ['Northwind Traders', 'Business', 'Refunded', 'R$ 1.490', 'Nov 28']),
    order('1038', ['Wide World Importers', 'Business', 'Paid', 'R$ 1.490', 'Nov 27']),
  ],
};

export const dashboardScenarios = defineScenarios({
  flow: 'Screen patterns',
  title: 'Dashboard pattern',
  component: DashboardExample,
  scenarios: {
    ready: dashboard,
    /** Every block keeps its place while the numbers load. */
    loading: { ...dashboard, status: 'loading' },
  },
});
