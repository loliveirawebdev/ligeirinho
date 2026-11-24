import { ComponentHarness } from '@angular/cdk/testing';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatInputHarness } from '@angular/material/input/testing';

/** Drives a `ui-input-group` in tests: `await group.submit('Ship it')`. */
export class InputGroupHarness extends ComponentHarness {
  static readonly hostSelector = 'ui-input-group';

  private readonly field = this.locatorFor(MatInputHarness);
  private readonly button = this.locatorFor(MatButtonHarness);
  private readonly buttonLabel = this.locatorFor('button[type="submit"] [data-label]');

  /** Types the text and presses the action. */
  async submit(text: string): Promise<void> {
    const field = await this.field();
    await field.setValue(text);
    await (await this.button()).click();
  }

  async getValue(): Promise<string> {
    return (await this.field()).getValue();
  }

  async getActionLabel(): Promise<string> {
    return (await this.buttonLabel()).text();
  }

  async isBusy(): Promise<boolean> {
    return (await this.button()).isDisabled();
  }
}
