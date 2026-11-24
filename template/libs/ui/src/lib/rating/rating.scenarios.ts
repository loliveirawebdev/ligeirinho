import { ChangeDetectionStrategy, Component, effect, input, signal } from '@angular/core';
import { defineScenarios } from '@ligeirinho/previewer';
import { Rating } from './rating';

interface RatingPreviewModel {
  readonly label: string;
  readonly one: string;
  readonly other: string;
  readonly value: number;
  readonly readonly?: boolean;
  readonly disabled?: boolean;
}

@Component({
  selector: 'ui-rating-preview',
  imports: [Rating],
  template: `
    <div class="mx-auto max-w-md p-4 sm:p-8">
      <ui-rating
        [label]="model().label"
        [starLabel]="starLabel"
        [readonly]="model().readonly ?? false"
        [disabled]="model().disabled ?? false"
        [(value)]="value"
      />
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class RatingPreview {
  readonly model = input.required<RatingPreviewModel>();
  protected readonly value = signal(0);
  protected readonly starLabel = (stars: number): string => (stars === 1 ? this.model().one : this.model().other).replace('{count}', String(stars));

  constructor() {
    effect(() => {
      this.value.set(this.model().value);
    });
  }
}

const review: RatingPreviewModel = { label: 'Rating', one: '{count} star', other: '{count} stars', value: 0 };

export const ratingScenarios = defineScenarios({
  flow: 'Catalog',
  title: 'Rating',
  component: RatingPreview,
  scenarios: {
    /** No score yet: hover previews it, the arrows pick it. */
    empty: review,
    filled: { ...review, value: 4 },
    /** A score shown on a detail page, not changeable. */
    readonly: { ...review, label: 'Customer rating', value: 3, readonly: true },
    disabled: { ...review, value: 2, disabled: true },
  },
});
