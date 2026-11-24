import { ComponentHarness } from '@angular/cdk/testing';

/** Picks and reads a `ui-color-picker` in tests: `await picker.choose('Blue')`. */
export class ColorPickerHarness extends ComponentHarness {
  static readonly hostSelector = 'ui-color-picker';

  private readonly radios = this.locatorForAll('input[type="radio"]');
  private readonly native = this.locatorForOptional('input[type="color"]');
  private readonly shownValue = this.locatorForOptional('.ui-color-picker-value');

  /** The presets' names, in order. */
  async getSwatchLabels(): Promise<string[]> {
    return Promise.all((await this.radios()).map(async (radio) => (await radio.getAttribute('aria-label')) ?? ''));
  }

  /** The name of the chosen preset, '' when none (or a custom color). */
  async getChosenLabel(): Promise<string> {
    for (const radio of await this.radios()) {
      if (await radio.getProperty<boolean>('checked')) {
        return (await radio.getAttribute('aria-label')) ?? '';
      }
    }
    return '';
  }

  /** Clicks the preset with that name. */
  async choose(label: string): Promise<void> {
    for (const radio of await this.radios()) {
      if ((await radio.getAttribute('aria-label')) === label) {
        await radio.click();
        return;
      }
    }
  }

  /** Picks a color in the browser's picker, behind the custom button. */
  async pickCustom(hex: string): Promise<void> {
    const native = await this.native();
    if (native) {
      await native.setInputValue(hex);
      await native.dispatchEvent('input');
    }
  }

  async hasCustom(): Promise<boolean> {
    return (await this.native()) !== null;
  }

  /** The hex value shown beside the swatches. */
  async getValue(): Promise<string> {
    const shown = await this.shownValue();
    return shown ? (await shown.text()).trim() : '';
  }

  async isDisabled(): Promise<boolean> {
    const radio = (await this.radios())[0];
    return radio ? radio.getProperty<boolean>('disabled') : false;
  }
}
