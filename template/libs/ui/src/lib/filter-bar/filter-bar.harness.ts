import { ComponentHarness } from '@angular/cdk/testing';
import { MatChipListboxHarness } from '@angular/material/chips/testing';
import { MatInputHarness } from '@angular/material/input/testing';
import { MatMenuHarness } from '@angular/material/menu/testing';

/** Drives a `ui-filter-bar` in tests. */
export class FilterBarHarness extends ComponentHarness {
  static readonly hostSelector = 'ui-filter-bar';

  private readonly searchField = this.locatorFor(MatInputHarness);
  private readonly listbox = this.locatorForOptional(MatChipListboxHarness);
  private readonly lightChips = this.locatorForAll('.ui-light-open');
  private readonly lightMenus = this.locatorForAll(MatMenuHarness);
  private readonly clearButtons = this.locatorForAll('.ui-light-clear');

  async search(text: string): Promise<void> {
    await (await this.searchField()).setValue(text);
  }

  async getQuery(): Promise<string> {
    return (await this.searchField()).getValue();
  }

  async getFilterLabels(): Promise<string[]> {
    const chips = (await (await this.listbox())?.getChips()) ?? [];
    return Promise.all(chips.map((chip) => chip.getText()));
  }

  async getSelectedFilter(): Promise<string> {
    const [selected] = (await (await this.listbox())?.getChips({ selected: true })) ?? [];
    return (await selected?.getText()) ?? '';
  }

  async selectFilter(label: string): Promise<void> {
    await (await this.listbox())?.selectChips({ text: label });
  }

  /** Each light filter chip's words, in order: `['Status: Active', 'Role']`. */
  async getLightFilterTexts(): Promise<string[]> {
    return Promise.all((await this.lightChips()).map(async (chip) => (await chip.text({ exclude: 'mat-icon' })).trim()));
  }

  /** Opens the light filter named `label` (*Status*) and picks one of its options (*Active*). */
  async chooseLightOption(label: string, optionLabel: string): Promise<void> {
    for (const menu of await this.lightMenus()) {
      if ((await menu.getTriggerText()).startsWith(label)) {
        await menu.open();
        // The item's text starts with its check icon's name, so it is matched by its end.
        await menu.clickItem({ text: new RegExp(`${optionLabel.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`) });
        return;
      }
    }
  }

  /** Clears a set light filter with its button (*Clear status*). */
  async clearLightFilter(clearLabel: string): Promise<void> {
    for (const button of await this.clearButtons()) {
      if ((await button.getAttribute('aria-label')) === clearLabel) {
        await button.click();
        return;
      }
    }
  }
}
