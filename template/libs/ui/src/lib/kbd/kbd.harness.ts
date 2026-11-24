import { ComponentHarness } from '@angular/cdk/testing';

/** Reads a `ui-kbd` in tests. */
export class KbdHarness extends ComponentHarness {
  static readonly hostSelector = 'ui-kbd';

  private readonly keys = this.locatorForAll('kbd kbd');

  /** The keys, in order: `['⌘', 'K']`. */
  async getKeys(): Promise<string[]> {
    return Promise.all((await this.keys()).map((key) => key.text()));
  }
}
