import { ComponentHarness } from '@angular/cdk/testing';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatCheckboxHarness } from '@angular/material/checkbox/testing';
import { MatSelectionListHarness } from '@angular/material/list/testing';
import type { TransferSide } from './transfer';

/** Drives a `ui-transfer` in tests: each list (`source`, `target`) by its item titles, and the move buttons. */
export class TransferHarness extends ComponentHarness {
  static readonly hostSelector = 'ui-transfer';

  private readonly moveRightButton = this.locatorFor(MatButtonHarness.with({ selector: '.ui-transfer-move-right' }));
  private readonly moveLeftButton = this.locatorFor(MatButtonHarness.with({ selector: '.ui-transfer-move-left' }));

  /** The titles of the items a list shows. */
  async getItems(side: TransferSide): Promise<string[]> {
    const items = await (await this.list(side)).getItems();
    return Promise.all(items.map((item) => item.getTitle()));
  }

  async getCount(side: TransferSide): Promise<string> {
    return (await this.locatorFor(`.ui-transfer-${side} .ui-transfer-count`)()).text();
  }

  /** Checks (or unchecks) items of a list by their titles. */
  async check(side: TransferSide, ...titles: string[]): Promise<void> {
    const list = await this.list(side);
    for (const title of titles) {
      const [item] = await list.getItems({ title });
      await item?.toggle();
    }
  }

  async search(side: TransferSide, text: string): Promise<void> {
    const box = await this.locatorFor(`.ui-transfer-${side} input[type="search"]`)();
    await box.clear();
    if (text) {
      await box.sendKeys(text);
    }
  }

  async toggleAll(side: TransferSide): Promise<void> {
    await (await this.locatorFor(MatCheckboxHarness.with({ ancestor: `.ui-transfer-${side}` }))()).toggle();
  }

  /** Moves the items checked in the source list to the target list. */
  async moveRight(): Promise<void> {
    await (await this.moveRightButton()).click();
  }

  /** Moves the items checked in the target list back to the source list. */
  async moveLeft(): Promise<void> {
    await (await this.moveLeftButton()).click();
  }

  async canMoveRight(): Promise<boolean> {
    return !(await (await this.moveRightButton()).isDisabled());
  }

  private list(side: TransferSide): Promise<MatSelectionListHarness> {
    return this.locatorFor(MatSelectionListHarness.with({ ancestor: `.ui-transfer-${side}` }))();
  }
}
