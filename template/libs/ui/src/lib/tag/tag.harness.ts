import { ComponentHarness } from '@angular/cdk/testing';
import type { TagTone } from './tag';

/** Reads a `ui-tag` in tests. */
export class TagHarness extends ComponentHarness {
  static readonly hostSelector = 'ui-tag';

  private readonly text = this.locatorFor('span');

  async getLabel(): Promise<string> {
    return (await this.text()).text();
  }

  async getTone(): Promise<TagTone | null> {
    const tone = await (await this.host()).getAttribute('data-tone');
    return tone === 'neutral' || tone === 'primary' || tone === 'success' || tone === 'warning' || tone === 'error' ? tone : null;
  }
}
