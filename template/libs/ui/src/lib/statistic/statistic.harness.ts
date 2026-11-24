import { ComponentHarness } from '@angular/cdk/testing';

/** Reads a `ui-statistic` in tests. */
export class StatisticHarness extends ComponentHarness {
  static readonly hostSelector = 'ui-statistic';

  private readonly paragraphs = this.locatorForAll('p');
  private readonly valueText = this.locatorFor('.ui-statistic-value');
  private readonly changeText = this.locatorForOptional('.ui-statistic-change');

  async getLabel(): Promise<string> {
    const [label] = await this.paragraphs();
    return (await label?.text()) ?? '';
  }

  async getValue(): Promise<string> {
    return (await this.valueText()).text();
  }

  /** *+12%*, or null without a change. */
  async getChange(): Promise<string | null> {
    const change = await this.changeText();
    return change ? change.text({ exclude: 'mat-icon' }) : null;
  }
}
