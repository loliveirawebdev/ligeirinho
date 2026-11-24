import { ComponentHarness } from '@angular/cdk/testing';

/** Reads the navigation of a `ui-app-shell` in tests. */
export class AppShellHarness extends ComponentHarness {
  static readonly hostSelector = 'ui-app-shell';

  private readonly links = this.locatorForAll('nav a [matListItemTitle]');
  private readonly currentLink = this.locatorForOptional('nav a[aria-current="page"] [matListItemTitle]');
  private readonly menuButton = this.locatorForOptional('mat-toolbar [data-menu]');
  private readonly sectionTitles = this.locatorForAll('nav .ui-shell-section-title');
  private readonly actionButtons = this.locatorForAll('mat-toolbar button[matIconButton]:not([data-menu], [data-rail], [data-aside])');
  private readonly railButton = this.locatorForOptional('mat-toolbar [data-rail]');
  private readonly asideButton = this.locatorForOptional('mat-toolbar [data-aside]');
  private readonly asidePanel = this.locatorForOptional('aside');
  private readonly secondaryLinks = this.locatorForAll('nav.ui-shell-secondary a [matListItemTitle]');
  private readonly userButton = this.locatorForOptional('mat-toolbar .ui-shell-user');
  // The account card opens in an overlay, outside the shell's element.
  private readonly accountItems = this.documentRootLocatorFactory().locatorForAll('.ui-account-card [data-item]');

  async getNavigationLabels(): Promise<string[]> {
    return Promise.all((await this.links()).map((link) => link.text()));
  }

  /** The label of the link to the current page, or an empty string. */
  async getCurrentLabel(): Promise<string> {
    return (await (await this.currentLink())?.text()) ?? '';
  }

  /** The titles of the drawer's sections, in order (untitled sections are left out). */
  async getSectionTitles(): Promise<string[]> {
    return Promise.all((await this.sectionTitles()).map((title) => title.text()));
  }

  /** Opens the drawer on phones; does nothing on wide screens, where it is always open. */
  async openNavigation(): Promise<void> {
    await (await this.menuButton())?.click();
  }

  /** The names of the top bar's icon actions, in order. */
  async getActionLabels(): Promise<string[]> {
    return Promise.all((await this.actionButtons()).map((button) => button.getAttribute('aria-label').then((label) => label ?? '')));
  }

  async clickAction(label: string): Promise<void> {
    for (const button of await this.actionButtons()) {
      if ((await button.getAttribute('aria-label')) === label) {
        await button.click();
        return;
      }
    }
  }

  /** The signed-in person's button name, or an empty string when nobody is signed in. */
  async getUserLabel(): Promise<string> {
    return (await (await this.userButton())?.getAttribute('aria-label')) ?? '';
  }

  /** Opens the signed-in person's account card and returns its entries. */
  async getUserMenuLabels(): Promise<string[]> {
    await this.openAccountCard();
    return Promise.all((await this.accountItems()).map((item) => item.text({ exclude: 'mat-icon' })));
  }

  /** Opens the signed-in person's account card and picks the entry with this label. */
  async selectUserMenuItem(label: string): Promise<void> {
    await this.openAccountCard();
    for (const item of await this.accountItems()) {
      if ((await item.text({ exclude: 'mat-icon' })) === label) {
        await item.click();
        return;
      }
    }
  }

  /** Folds the drawer to its rail, or opens it again (wide screens with `railCollapsible`). */
  async toggleRail(): Promise<void> {
    await (await this.railButton())?.click();
  }

  /** Whether the drawer is folded to a rail of icons. */
  async isRail(): Promise<boolean> {
    return (await this.host()).hasClass('ui-shell-rail');
  }

  /** The labels of the links at the drawer's foot. */
  async getSecondaryLabels(): Promise<string[]> {
    return Promise.all((await this.secondaryLinks()).map((link) => link.text()));
  }

  /** The right-hand panel's name, or an empty string without one. */
  async getAsideLabel(): Promise<string> {
    return (await (await this.asidePanel())?.getAttribute('aria-label')) ?? '';
  }

  /** Opens the right-hand panel under 1200 px; does nothing wider, where it is always open. */
  async openAside(): Promise<void> {
    await (await this.asideButton())?.click();
  }

  private async openAccountCard(): Promise<void> {
    const button = await this.userButton();
    if (button !== null && (await button.getAttribute('aria-expanded')) !== 'true') {
      await button.click();
    }
  }
}
