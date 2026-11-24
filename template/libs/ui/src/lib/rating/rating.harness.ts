import { ComponentHarness } from '@angular/cdk/testing';

/** Scores and reads a `ui-rating` in tests: `await rating.rate(4)`. */
export class RatingHarness extends ComponentHarness {
  static readonly hostSelector = 'ui-rating';

  private readonly radios = this.locatorForAll('input[type="radio"]');
  private readonly filledStars = this.locatorForAll('.ui-rating-star-on');
  private readonly readonlyValue = this.locatorForOptional('[role="img"]');

  /** Clicks the star with that score (1 is the first). */
  async rate(stars: number): Promise<void> {
    await (await this.radios())[stars - 1]?.click();
  }

  /** The score as drawn: how many stars are filled. */
  async getValue(): Promise<number> {
    return (await this.filledStars()).length;
  }

  /** The names screen readers read for each star. */
  async getStarLabels(): Promise<string[]> {
    return Promise.all((await this.radios()).map(async (radio) => (await radio.getAttribute('aria-label')) ?? ''));
  }

  async isReadonly(): Promise<boolean> {
    return (await this.readonlyValue()) !== null;
  }

  async isDisabled(): Promise<boolean> {
    const radio = (await this.radios())[0];
    return radio ? radio.getProperty<boolean>('disabled') : false;
  }
}
