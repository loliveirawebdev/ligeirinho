import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { render } from '@testing-library/angular';
import { Chart, type ChartSeries } from './chart';
import { ChartHarness } from './chart.harness';

const labels = ['Jan', 'Feb', 'Mar'];
const series: readonly ChartSeries[] = [
  { name: 'Revenue', values: [1200, 1800, 1500] },
  { name: 'Costs', values: [800, 900, 1100], tone: 'error' },
];
const valueFormat = (value: number): string => `$${String(value)}`;

describe('chart', () => {
  it('draws a line per series, a legend, and the numbers as a table for screen readers', async () => {
    const { fixture } = await render(Chart, { inputs: { type: 'line', label: 'Revenue and costs', labels, series, valueFormat } });
    const chart = await TestbedHarnessEnvironment.harnessForFixture(fixture, ChartHarness);
    expect(await chart.getLabel()).toBe('Revenue and costs');
    expect(await chart.countMarks()).toBe(2);
    expect(await chart.getLegend()).toEqual(['Revenue', 'Costs']);
    expect(await chart.getSeriesNames()).toEqual(['Revenue', 'Costs']);
    expect(await chart.getTable()).toEqual([
      ['Jan', '$1200', '$800'],
      ['Feb', '$1800', '$900'],
      ['Mar', '$1500', '$1100'],
    ]);
  });

  it('shows the values of the focused label, moved by the arrow keys', async () => {
    const { fixture } = await render(Chart, { inputs: { type: 'bar', label: 'Revenue and costs', labels, series, valueFormat } });
    const chart = await TestbedHarnessEnvironment.harnessForFixture(fixture, ChartHarness);
    expect(await chart.countMarks()).toBe(6);
    expect(await chart.getTooltip()).toBe('');
    await chart.focus();
    expect(await chart.getTooltip()).toContain('Jan');
    expect(await chart.getTooltip()).toContain('$1200');
    await chart.next();
    expect(await chart.getTooltip()).toContain('Feb');
    expect(await chart.getTooltip()).toContain('$900');
  });

  it('leaves the legend out with one series, and draws a donut slice per label', async () => {
    const { fixture } = await render(Chart, {
      inputs: { type: 'donut', label: 'Plans', labels: ['Starter', 'Business'], series: [{ name: 'Clients', values: [30, 10] }] },
    });
    const chart = await TestbedHarnessEnvironment.harnessForFixture(fixture, ChartHarness);
    expect(await chart.getType()).toBe('donut');
    expect(await chart.countMarks()).toBe(2);
    expect(await chart.getLegend()).toEqual(['Starter', 'Business']);
  });
});
