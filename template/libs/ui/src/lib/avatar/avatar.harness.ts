import { ComponentHarness } from '@angular/cdk/testing';

/** Reads a `ui-avatar` in tests. */
export class AvatarHarness extends ComponentHarness {
  static readonly hostSelector = 'ui-avatar';

  /** The name screen readers read, or null when decorative. */
  async getName(): Promise<string | null> {
    return (await this.host()).getAttribute('aria-label');
  }

  /** The initials shown (empty with a photo). */
  async getInitials(): Promise<string> {
    return (await this.host()).text();
  }
}

/** Reads a `ui-avatar-group` in tests. */
export class AvatarGroupHarness extends ComponentHarness {
  static readonly hostSelector = 'ui-avatar-group';

  private readonly avatars = this.locatorForAll(AvatarHarness);
  private readonly more = this.locatorForOptional('.ui-avatar-more');

  async getLabel(): Promise<string | null> {
    return (await this.host()).getAttribute('aria-label');
  }

  async getShownInitials(): Promise<string[]> {
    return Promise.all((await this.avatars()).map((avatar) => avatar.getInitials()));
  }

  /** *+3*, or null when everyone shows. */
  async getMoreText(): Promise<string | null> {
    const more = await this.more();
    return more ? more.text() : null;
  }
}
