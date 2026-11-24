import { ComponentHarness, TestKey } from '@angular/cdk/testing';

/** Searches and runs commands in the palette `CommandPalette.open` shows; find it from the document root (`documentRootLoader`). */
export class CommandPaletteHarness extends ComponentHarness {
  static readonly hostSelector = 'ui-command-palette';

  private readonly search = this.locatorFor('.ui-command-palette-search');
  private readonly groups = this.locatorForAll('[role="group"] > [role="presentation"]');
  private readonly labels = this.locatorForAll('.ui-command-palette-label');
  private readonly activeLabel = this.locatorForOptional('.ui-command-palette-active .ui-command-palette-label');
  private readonly empty = this.locatorForOptional('.ui-command-palette-empty');

  async type(query: string): Promise<void> {
    const search = await this.search();
    await search.clear();
    await search.sendKeys(query);
  }

  /** The group headings shown, in order. */
  async getGroups(): Promise<string[]> {
    return Promise.all((await this.groups()).map(async (group) => (await group.text()).trim()));
  }

  /** The commands shown, in order. */
  async getLabels(): Promise<string[]> {
    return Promise.all((await this.labels()).map((label) => label.text()));
  }

  /** The command the arrow keys are on, or null. */
  async getActiveLabel(): Promise<string | null> {
    return (await (await this.activeLabel())?.text()) ?? null;
  }

  /** The id of the option the search field points screen readers at. */
  async getActiveDescendant(): Promise<string | null> {
    return (await this.search()).getAttribute('aria-activedescendant');
  }

  async getEmptyText(): Promise<string | null> {
    return (await (await this.empty())?.text()) ?? null;
  }

  async pressDown(): Promise<void> {
    await (await this.search()).sendKeys(TestKey.DOWN_ARROW);
  }

  async pressUp(): Promise<void> {
    await (await this.search()).sendKeys(TestKey.UP_ARROW);
  }

  async pressEnter(): Promise<void> {
    await (await this.search()).sendKeys(TestKey.ENTER);
  }
}
