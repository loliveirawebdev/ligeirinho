import { ComponentHarness, TestKey } from '@angular/cdk/testing';

/** Reads a `ui-chart` in tests: its name, legend, the table screen readers get, and the tooltip from the keyboard. */
export class ChartHarness extends ComponentHarness {
  static readonly hostSelector = 'ui-chart';

  private readonly plot = this.locatorFor('.ui-chart-plot');
  private readonly legendEntries = this.locatorForAll('.ui-chart-legend li > span:nth-child(2)');
  private readonly tableRows = this.locatorForAll('table tbody tr');
  private readonly tableHeaders = this.locatorForAll('table thead th');
  private readonly tooltipBox = this.locatorForOptional('.ui-chart-tooltip');
  private readonly marks = this.locatorForAll('.ui-chart-line, .ui-chart-bar, .ui-chart-slice');

  async getLabel(): Promise<string> {
    return (await (await this.plot()).getAttribute('aria-label')) ?? '';
  }

  async getType(): Promise<string> {
    return (await (await this.host()).getAttribute('data-type')) ?? '';
  }

  /** The legend's names (series, or a donut's slices); empty when there is none. */
  async getLegend(): Promise<string[]> {
    return Promise.all((await this.legendEntries()).map((entry) => entry.text()));
  }

  /** The series' names, the table's column headers. */
  async getSeriesNames(): Promise<string[]> {
    return Promise.all((await this.tableHeaders()).map((header) => header.text()));
  }

  /** The table screen readers get: per label, the label then each series' formatted value. */
  async getTable(): Promise<string[][]> {
    return Promise.all(
      (await this.tableRows()).map(async (row) => {
        const cells = await row.getProperty<HTMLTableRowElement['cells']>('cells');
        return Array.from(cells, (cell) => cell.textContent.trim());
      }),
    );
  }

  /** How many lines, bars or slices are drawn. */
  async countMarks(): Promise<number> {
    return (await this.marks()).length;
  }

  /** Focuses the chart, which shows the first label's tooltip. */
  async focus(): Promise<void> {
    await (await this.plot()).focus();
  }

  /** Moves the tooltip to the next label, as the right arrow does. */
  async next(): Promise<void> {
    await (await this.plot()).sendKeys(TestKey.RIGHT_ARROW);
  }

  /** The tooltip's words, or an empty string when it is hidden. */
  async getTooltip(): Promise<string> {
    return (await (await this.tooltipBox())?.text()) ?? '';
  }
}
