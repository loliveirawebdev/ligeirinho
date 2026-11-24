import { ComponentHarness } from '@angular/cdk/testing';
import type { DetailItem } from './detail-list';

/** Reads a `ui-detail-list` in tests: `[{ label: 'Email', value: 'ana@example.com' }, …]`. */
export class DetailListHarness extends ComponentHarness {
  static readonly hostSelector = 'ui-detail-list';

  private readonly labels = this.locatorForAll('dt');
  private readonly values = this.locatorForAll('dd');

  async getItems(): Promise<DetailItem[]> {
    const [labels, values] = await Promise.all([this.labels(), this.values()]);
    return Promise.all(
      labels.map(async (label, index) => ({ label: await label.text(), value: (await values[index]?.text()) ?? '' })),
    );
  }
}
