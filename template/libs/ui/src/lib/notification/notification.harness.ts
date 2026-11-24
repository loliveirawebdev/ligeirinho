import { type BaseHarnessFilters, ComponentHarness, HarnessPredicate } from '@angular/cdk/testing';

/**
 * Reads and closes a `ui-notification`. Those `Notifications.show` opens live in an overlay: find them from the
 * document root, `TestbedHarnessEnvironment.documentRootLoader(fixture).getAllHarnesses(NotificationHarness)`.
 */
export class NotificationHarness extends ComponentHarness {
  static readonly hostSelector = 'ui-notification';

  private readonly titleText = this.locatorFor('.ui-notification-title');
  private readonly messageText = this.locatorForOptional('.ui-notification-message');
  private readonly actionButton = this.locatorForOptional('.ui-notification-action');
  private readonly closeButton = this.locatorFor('.ui-notification-close');

  /** Finds a notification by its title. */
  static with(options: BaseHarnessFilters & { readonly title?: string } = {}): HarnessPredicate<NotificationHarness> {
    return new HarnessPredicate(NotificationHarness, options).addOption('title', options.title, async (notification, title) => (await notification.getTitle()) === title);
  }

  async getTitle(): Promise<string> {
    return (await this.titleText()).text();
  }

  async getMessage(): Promise<string> {
    return (await (await this.messageText())?.text()) ?? '';
  }

  /** `assertive` for errors, `polite` for the rest. */
  async getPoliteness(): Promise<string | null> {
    return (await this.host()).getAttribute('aria-live');
  }

  async hover(): Promise<void> {
    await (await this.host()).hover();
  }

  async leave(): Promise<void> {
    await (await this.host()).mouseAway();
  }

  async runAction(): Promise<void> {
    await (await this.actionButton())?.click();
  }

  async close(): Promise<void> {
    await (await this.closeButton()).click();
  }
}
