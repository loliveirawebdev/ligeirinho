import { ComponentHarness } from '@angular/cdk/testing';
import type { NoticeTone } from './notice';

/** Reads a `ui-notice` in tests. */
export class NoticeHarness extends ComponentHarness {
  static readonly hostSelector = 'ui-notice';

  private readonly box = this.locatorFor('[data-tone]');
  private readonly paragraphs = this.locatorForAll('p');

  async getTone(): Promise<NoticeTone> {
    const tone = await (await this.box()).getAttribute('data-tone');
    return tone === 'error' || tone === 'success' ? tone : 'neutral';
  }

  async getTitle(): Promise<string> {
    const [title] = await this.paragraphs();
    return (await title?.text()) ?? '';
  }

  async getMessage(): Promise<string> {
    const [, message] = await this.paragraphs();
    return (await message?.text()) ?? '';
  }
}
