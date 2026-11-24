import { ComponentHarness } from '@angular/cdk/testing';

/** Reads a `ui-empty-state` in tests. */
export class EmptyStateHarness extends ComponentHarness {
  static readonly hostSelector = 'ui-empty-state';

  private readonly paragraphs = this.locatorForAll('p');

  async getTitle(): Promise<string> {
    const [title] = await this.paragraphs();
    return (await title?.text()) ?? '';
  }

  async getMessage(): Promise<string> {
    const [, message] = await this.paragraphs();
    return (await message?.text()) ?? '';
  }
}
