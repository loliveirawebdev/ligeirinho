import { ComponentHarness, type TestElement } from '@angular/cdk/testing';

/** An element's text, or an empty string when there is no element. */
export async function textOf(element: TestElement | null | undefined): Promise<string> {
  return (await element?.text()) ?? '';
}

/** Clicks the first element whose text is `label`, as a user picks a link or an item by what it says. */
export async function clickByText(elements: readonly TestElement[], label: string): Promise<void> {
  for (const element of elements) {
    if ((await element.text()) === label) {
      await element.click();
      return;
    }
  }
}

/** Whether a trigger's panel is open, from its `aria-expanded`. */
export async function isExpanded(trigger: TestElement): Promise<boolean> {
  return (await trigger.getAttribute('aria-expanded')) === 'true';
}

/** Opens a trigger's panel unless it is already open (a second click would close it). */
export async function expand(trigger: TestElement): Promise<void> {
  if (!(await isExpanded(trigger))) {
    await trigger.click();
  }
}

/** A component that says something in two paragraphs, a title and a message (`ui-empty-state`, `ui-notice`). */
export abstract class TitleAndMessageHarness extends ComponentHarness {
  private readonly paragraphs = this.locatorForAll('p');

  async getTitle(): Promise<string> {
    return textOf((await this.paragraphs())[0]);
  }

  async getMessage(): Promise<string> {
    return textOf((await this.paragraphs())[1]);
  }
}
