import { ComponentHarness, type TestKey } from '@angular/cdk/testing';

/** Drives a `ui-mention-input` in tests: types, reads the suggestions and picks one by name. */
export class MentionInputHarness extends ComponentHarness {
  static readonly hostSelector = 'ui-mention-input';

  private readonly textArea = this.locatorFor('textarea');

  async getValue(): Promise<string> {
    return (await this.textArea()).getProperty<string>('value');
  }

  /** Types at the end of the text, character by character, as a user would. */
  async type(text: string): Promise<void> {
    await (await this.textArea()).sendKeys(text);
  }

  async press(...keys: TestKey[]): Promise<void> {
    await (await this.textArea()).sendKeys(...keys);
  }

  async isOpen(): Promise<boolean> {
    return (await (await this.textArea()).getAttribute('aria-expanded')) === 'true';
  }

  /** The names suggested, in order. */
  async getSuggestions(): Promise<string[]> {
    const names = await this.documentRootLocatorFactory().locatorForAll(`${await this.listboxSelector()} .ui-mention-name`)();
    return Promise.all(names.map(async (name) => (await name.text()).trim()));
  }

  /** The name the arrow keys point at. */
  async getActiveSuggestion(): Promise<string> {
    const active = await this.documentRootLocatorFactory().locatorForOptional(`${await this.listboxSelector()} .ui-mention-active .ui-mention-name`)();
    return ((await active?.text()) ?? '').trim();
  }

  async choose(name: string): Promise<void> {
    const options = await this.documentRootLocatorFactory().locatorForAll(`${await this.listboxSelector()} .ui-mention-name`)();
    for (const option of options) {
      if ((await option.text()).trim() === name) {
        await option.click();
        return;
      }
    }
  }

  private async listboxSelector(): Promise<string> {
    return `#${(await (await this.textArea()).getAttribute('aria-controls')) ?? 'ui-mention-closed'}`;
  }
}
