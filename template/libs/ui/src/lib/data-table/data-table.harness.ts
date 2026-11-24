import { ComponentHarness, type TestElement, TestKey } from '@angular/cdk/testing';
import { MatCheckboxHarness } from '@angular/material/checkbox/testing';
import { MatPaginatorHarness } from '@angular/material/paginator/testing';
import { MatSortHeaderHarness } from '@angular/material/sort/testing';

/**
 * Reads and opens the rows of a `ui-data-table` in tests, whichever layout it is in (table on wide screens, list
 * on phones): every row is one button named by its `openLabel`.
 */
export class DataTableHarness extends ComponentHarness {
  static readonly hostSelector = 'ui-data-table';

  private readonly rowActions = this.locatorForAll('button.ui-row-action, .ui-data-list button[mat-list-item]');
  private readonly checkboxes = this.locatorForAll(MatCheckboxHarness);
  private readonly handles = this.locatorForAll('.ui-data-handle');
  private readonly bulkCount = this.locatorForOptional('.ui-data-bulk-count');
  private readonly clearButton = this.locatorForOptional('.ui-data-bulk button');
  private readonly headers = this.locatorForAll('th');
  private readonly sortHeaders = this.locatorForAll(MatSortHeaderHarness);
  private readonly paginator = this.locatorForOptional(MatPaginatorHarness);
  private readonly showMoreBar = this.locatorForOptional('button.ui-data-more');
  private readonly showMoreParts = this.locatorForAll('.ui-data-more-text');
  private readonly loadingMore = this.locatorForOptional('.ui-data-loading');
  private readonly listTitles = this.locatorForAll('.ui-data-list .ui-data-title');
  private readonly listOpenLabels = this.locatorForAll('.ui-data-list .ui-data-open');
  private readonly lineLabels = this.locatorForAll('.ui-data-list .ui-data-line-label');
  private readonly lineValues = this.locatorForAll('.ui-data-list .ui-data-line-value');

  async isTable(): Promise<boolean> {
    return (await this.headers()).length > 0;
  }

  async getColumnLabels(): Promise<string[]> {
    return Promise.all((await this.headers()).map((header) => header.text()));
  }

  /** Each row's accessible action, in order: `['Open Ana Souza', …]`. */
  async getRowLabels(): Promise<string[]> {
    const actions = await this.rowActions();
    const openLabels = await this.listOpenLabels();
    return Promise.all(actions.map((action, index) => this.labelOf(action, openLabels[index])));
  }

  /** On phones, each row's title, in order. */
  async getListTitles(): Promise<string[]> {
    return Promise.all((await this.listTitles()).map((title) => title.text()));
  }

  /** On phones, the lines under the titles, all rows in order (`Role Administrator` when labels show). */
  async getListLines(): Promise<string[]> {
    const values = await Promise.all((await this.lineValues()).map((value) => value.text()));
    const labels = await Promise.all((await this.lineLabels()).map((label) => label.text()));
    return labels.length === values.length ? values.map((value, index) => `${labels[index] ?? ''} ${value}`) : values;
  }

  /** The paginator's range (*1–10 of 48*), or null without pages. */
  async getRangeLabel(): Promise<string | null> {
    const paginator = await this.paginator();
    return paginator ? paginator.getRangeLabel() : null;
  }

  async goToNextPage(): Promise<void> {
    await (await this.paginator())?.goToNextPage();
  }

  /** The words under the rows while more load (infinite scroll), or null. */
  async getLoadingMoreText(): Promise<string | null> {
    const loading = await this.loadingMore();
    return loading ? loading.text() : null;
  }

  /** The *Show more* bar's words (*Show more*, or the loading line), or null without it. */
  async getShowMoreText(): Promise<string | null> {
    const parts = await Promise.all((await this.showMoreParts()).map((part) => part.text()));
    return parts.length > 0 ? parts.join(' ') : null;
  }

  async showMore(): Promise<void> {
    await (await this.showMoreBar())?.click();
  }

  /** The column the rows are sorted by and which way (*Name asc*), or null when in the page's own order. */
  async getSort(): Promise<string | null> {
    for (const header of await this.sortHeaders()) {
      if (await header.isActive()) {
        return `${await header.getLabel()} ${await header.getSortDirection()}`;
      }
    }
    return null;
  }

  /** Sorts by the column with this header (wide screens), as a click on it does. */
  async sortBy(columnLabel: string): Promise<void> {
    for (const header of await this.sortHeaders()) {
      if ((await header.getLabel()) === columnLabel) {
        await header.click();
        return;
      }
    }
  }

  /** Ticks or unticks a checkbox by its label: a row's (*Select Ana Souza*) or the header's (*Select all*). */
  async toggleSelection(checkboxLabel: string): Promise<void> {
    for (const checkbox of await this.checkboxes()) {
      if ((await checkbox.getAriaLabel()) === checkboxLabel) {
        await checkbox.toggle();
        return;
      }
    }
  }

  /** The bulk bar's count (*2 selected*), or null while nothing is picked. */
  async getSelectedText(): Promise<string | null> {
    const count = await this.bulkCount();
    return count ? count.text() : null;
  }

  async clearSelection(): Promise<void> {
    await (await this.clearButton())?.click();
  }

  /** Moves a row one place with its handle (*Move Ana Souza*) and an arrow key, as a keyboard user does. */
  async moveRow(handleLabel: string, direction: 'up' | 'down'): Promise<void> {
    for (const handle of await this.handles()) {
      if ((await handle.getAttribute('aria-label')) === handleLabel) {
        await handle.sendKeys(direction === 'up' ? TestKey.UP_ARROW : TestKey.DOWN_ARROW);
        return;
      }
    }
  }

  async openRow(openLabel: string): Promise<void> {
    const openLabels = await this.listOpenLabels();
    for (const [index, action] of (await this.rowActions()).entries()) {
      if ((await this.labelOf(action, openLabels[index])) === openLabel) {
        await action.click();
        return;
      }
    }
  }

  /** The table's row buttons carry an aria-label; the list's say their action in hidden text (`.ui-data-open`). */
  private async labelOf(action: TestElement, openLabel: TestElement | undefined): Promise<string> {
    return (await action.getAttribute('aria-label')) ?? (await openLabel?.text()) ?? '';
  }
}
