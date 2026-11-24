import { TitleAndMessageHarness } from '../harness-helpers';
import type { NoticeTone } from './notice';

/** Reads a `ui-notice` in tests. */
export class NoticeHarness extends TitleAndMessageHarness {
  static readonly hostSelector = 'ui-notice';

  private readonly box = this.locatorFor('[data-tone]');

  async getTone(): Promise<NoticeTone> {
    const tone = await (await this.box()).getAttribute('data-tone');
    return tone === 'error' || tone === 'success' ? tone : 'neutral';
  }
}
