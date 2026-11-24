import { ComponentHarness, type TestElement } from '@angular/cdk/testing';
import { MatChipGridHarness } from '@angular/material/chips/testing';
import { expand, isExpanded } from '../harness-helpers';

/** Drives a `ui-tree-select` in tests: reads the field and its chips, opens the panel, searches and picks nodes by label. */
export class TreeSelectHarness extends ComponentHarness {
  static readonly hostSelector = 'ui-tree-select';

  private readonly trigger = this.locatorFor('.ui-tree-select-trigger');
  private readonly grid = this.locatorFor(MatChipGridHarness);

  /** The field's text: the chosen label, or the count (*4 selected*) once chips would not fit. */
  async getText(): Promise<string> {
    return (await this.trigger()).getProperty<string>('value');
  }

  async getChips(): Promise<string[]> {
    const rows = await (await this.grid()).getRows();
    return Promise.all(rows.map((row) => row.getText()));
  }

  async removeChip(label: string): Promise<void> {
    const [row] = await (await this.grid()).getRows({ text: label });
    await row?.remove();
  }

  async isOpen(): Promise<boolean> {
    return isExpanded(await this.trigger());
  }

  async open(): Promise<void> {
    await expand(await this.trigger());
  }

  async search(text: string): Promise<void> {
    await this.open();
    const box = await this.inPanel('input[type="search"]');
    await box?.clear();
    await box?.sendKeys(text);
  }

  /** The labels of the nodes shown (expanded branches show their children), in reading order. */
  async getNodeLabels(): Promise<string[]> {
    await this.open();
    const nodes = await this.documentRootLocatorFactory().locatorForAll(`${await this.panelSelector()} .ui-tree-select-node`)();
    return Promise.all(nodes.map(async (node) => (await node.getAttribute('data-label')) ?? ''));
  }

  /** The labels of the nodes chosen and shown, in reading order. */
  async getSelectedNodeLabels(): Promise<string[]> {
    await this.open();
    const nodes = await this.documentRootLocatorFactory().locatorForAll(`${await this.panelSelector()} .ui-tree-select-node[aria-selected="true"]`)();
    return Promise.all(nodes.map(async (node) => (await node.getAttribute('data-label')) ?? ''));
  }

  /** Opens or closes a branch with its toggle. */
  async toggleBranch(label: string): Promise<void> {
    await this.open();
    await (await this.inPanel(`${nodeSelector(label)} .ui-tree-select-toggle`))?.click();
  }

  /** Chooses a node (or, with `multiple`, checks or unchecks it) by clicking its row. */
  async choose(label: string): Promise<void> {
    await this.open();
    await (await this.inPanel(`${nodeSelector(label)} .ui-tree-select-label`))?.click();
  }

  private async inPanel(selector: string): Promise<TestElement | null> {
    return this.documentRootLocatorFactory().locatorForOptional(`${await this.panelSelector()} ${selector}`)();
  }

  private async panelSelector(): Promise<string> {
    return `#${(await (await this.trigger()).getAttribute('aria-controls')) ?? 'ui-tree-select-closed'}`;
  }
}

function nodeSelector(label: string): string {
  return `.ui-tree-select-node[data-label=${JSON.stringify(label)}]`;
}
