import { ComponentHarness, type BaseHarnessFilters, HarnessPredicate } from '@angular/cdk/testing';

export interface MaskHarnessFilters extends BaseHarnessFilters {
  /** The field's accessible name, from its `aria-label`. */
  readonly label?: string;
}

/** Types into an `input[uiMask]` in tests, the way the user does, and reads it back as shown. */
export class MaskHarness extends ComponentHarness {
  static readonly hostSelector = 'input[data-ui-mask]';

  static with(filters: MaskHarnessFilters = {}): HarnessPredicate<MaskHarness> {
    return new HarnessPredicate(MaskHarness, filters).addOption('label', filters.label, async (harness, label) =>
      HarnessPredicate.stringMatches(await (await harness.host()).getAttribute('aria-label'), label),
    );
  }

  /** The text as shown, in its mask: `123.456.789-00`. */
  async getValue(): Promise<string> {
    return (await this.host()).getProperty<string>('value');
  }

  /** Clears the field and types `text` key by key, as a person would (the mask's characters may be left out). */
  async type(text: string): Promise<void> {
    const host = await this.host();
    await host.clear();
    await host.sendKeys(text);
  }

  /** The keyboard phones open: `numeric` for masks of digits only. */
  async getInputMode(): Promise<string | null> {
    return (await this.host()).getAttribute('inputmode');
  }
}
