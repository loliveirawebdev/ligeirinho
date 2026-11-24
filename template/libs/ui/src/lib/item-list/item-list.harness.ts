import { ComponentHarness } from '@angular/cdk/testing';
import { MatActionListHarness } from '@angular/material/list/testing';

/** Reads and opens the rows of a `ui-item-list` in tests. */
export class ItemListHarness extends ComponentHarness {
  static readonly hostSelector = 'ui-item-list';

  private readonly list = this.locatorFor(MatActionListHarness);
  private readonly titles = this.locatorForAll('.ui-item-title');
  private readonly metas = this.locatorForAll('.ui-item-meta');

  async getTitles(): Promise<string[]> {
    return Promise.all((await this.titles()).map((title) => title.text()));
  }

  /** The trailing meta of each row that has one (*Mar 3*, *3 files*). */
  async getMetas(): Promise<string[]> {
    return Promise.all((await this.metas()).map((meta) => meta.text()));
  }

  async open(title: string): Promise<void> {
    const items = await (await this.list()).getItems();
    const titles = await this.getTitles();
    await items[titles.indexOf(title)]?.click();
  }
}
