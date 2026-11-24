import { ComponentHarness } from '@angular/cdk/testing';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatInputHarness } from '@angular/material/input/testing';

/** Types, steps and reads a `ui-number-input` in tests: `await quantity.increase()`. */
export class NumberInputHarness extends ComponentHarness {
  static readonly hostSelector = 'ui-number-input';

  private readonly field = this.locatorFor(MatInputHarness);
  private readonly decreaseButton = this.locatorFor(MatButtonHarness.with({ selector: '[data-step="decrease"]' }));
  private readonly increaseButton = this.locatorFor(MatButtonHarness.with({ selector: '[data-step="increase"]' }));

  async getValue(): Promise<string> {
    return (await this.field()).getValue();
  }

  /** Types the text and leaves the field, so it is clamped. */
  async setValue(text: string): Promise<void> {
    const field = await this.field();
    await field.setValue(text);
    await field.blur();
  }

  async increase(): Promise<void> {
    await (await this.increaseButton()).click();
  }

  async decrease(): Promise<void> {
    await (await this.decreaseButton()).click();
  }

  /** Presses ArrowUp (or ArrowDown) in the field. */
  async pressArrow(direction: 'up' | 'down'): Promise<void> {
    const host = await (await this.field()).host();
    await host.focus();
    await host.dispatchEvent('keydown', { key: direction === 'up' ? 'ArrowUp' : 'ArrowDown' });
  }

  async canDecrease(): Promise<boolean> {
    return !(await (await this.decreaseButton()).isDisabled());
  }

  async canIncrease(): Promise<boolean> {
    return !(await (await this.increaseButton()).isDisabled());
  }

  async isDisabled(): Promise<boolean> {
    return (await this.field()).isDisabled();
  }
}
