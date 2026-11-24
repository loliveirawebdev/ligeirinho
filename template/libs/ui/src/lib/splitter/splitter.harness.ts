import { ComponentHarness, TestKey } from '@angular/cdk/testing';

/** Drives a `ui-splitter` in tests, from the keyboard, as a keyboard user sizes it. */
export class SplitterHarness extends ComponentHarness {
  static readonly hostSelector = 'ui-splitter';

  private readonly handle = this.locatorFor('[role="separator"]');

  /** The start pane's share, in percent. */
  async getSize(): Promise<number> {
    return Number(await (await this.handle()).getAttribute('aria-valuenow'));
  }

  async getHandleLabel(): Promise<string | null> {
    return (await this.handle()).getAttribute('aria-label');
  }

  /** Moves the divider one step towards the end (right, or down) or the start. */
  async move(direction: 'start' | 'end'): Promise<void> {
    const handle = await this.handle();
    const row = (await (await this.host()).getAttribute('data-direction')) !== 'column';
    const key =
      direction === 'end' ? (row ? TestKey.RIGHT_ARROW : TestKey.DOWN_ARROW) : row ? TestKey.LEFT_ARROW : TestKey.UP_ARROW;
    await handle.sendKeys(key);
  }

  /** Takes the divider to its limit, as Home and End do. */
  async moveToLimit(limit: 'min' | 'max'): Promise<void> {
    await (await this.handle()).sendKeys(limit === 'min' ? TestKey.HOME : TestKey.END);
  }
}
