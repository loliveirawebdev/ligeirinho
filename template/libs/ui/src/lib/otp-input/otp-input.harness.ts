import { ComponentHarness } from '@angular/cdk/testing';

/** Types, pastes and reads a `ui-otp-input` in tests: `await otp.type('123456')`. */
export class OtpInputHarness extends ComponentHarness {
  static readonly hostSelector = 'ui-otp-input';

  private readonly boxes = this.locatorForAll('.ui-otp-input-box');
  private readonly error = this.locatorFor('[aria-live]');

  /** Types one character at a time, from the first empty box, as a person would. */
  async type(code: string): Promise<void> {
    for (const character of code) {
      const boxes = await this.boxes();
      const values = await Promise.all(boxes.map((box) => box.getProperty<string>('value')));
      const empty = values.indexOf('');
      const box = boxes[empty === -1 ? boxes.length - 1 : empty];
      if (box) {
        await box.focus();
        await box.sendKeys(character);
      }
    }
  }

  /** Pastes into the first box, the way a code copied from an email arrives. */
  async paste(code: string): Promise<void> {
    const box = (await this.boxes())[0];
    if (box) {
      await box.focus();
      await box.dispatchEvent('paste', { clipboardData: { getData: () => code } });
    }
  }

  /** Presses Backspace in the box at `index` (0-based). */
  async backspace(index: number): Promise<void> {
    const box = (await this.boxes())[index];
    if (box) {
      await box.focus();
      await box.dispatchEvent('keydown', { key: 'Backspace' });
    }
  }

  async getValue(): Promise<string> {
    const boxes = await this.boxes();
    return (await Promise.all(boxes.map((box) => box.getProperty<string>('value')))).join('');
  }

  async getBoxCount(): Promise<number> {
    return (await this.boxes()).length;
  }

  async getError(): Promise<string> {
    return (await (await this.error()).text()).trim();
  }

  async isDisabled(): Promise<boolean> {
    const box = (await this.boxes())[0];
    return box ? box.getProperty<boolean>('disabled') : false;
  }
}
