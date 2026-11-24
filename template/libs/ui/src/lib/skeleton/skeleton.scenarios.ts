import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { defineScenarios } from '@ligeirinho/previewer';
import { Skeleton } from './skeleton';

interface SkeletonPreviewModel {
  readonly label: string;
  readonly rows: number;
  readonly lines: number;
  readonly avatar: boolean;
  /** Inside an outlined card, as a card's body loads. */
  readonly inCard?: boolean;
}

@Component({
  selector: 'ui-skeleton-preview',
  imports: [Skeleton],
  template: `
    <div class="max-w-xl p-4 sm:p-8">
      <div [class]="model().inCard ? 'rounded-md border border-outline-variant p-4' : ''">
        <ui-skeleton [label]="model().label" [rows]="model().rows" [lines]="model().lines" [avatar]="model().avatar" />
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class SkeletonPreview {
  readonly model = input.required<SkeletonPreviewModel>();
}

export const skeletonScenarios = defineScenarios({
  flow: 'Catalog',
  title: 'Skeleton',
  component: SkeletonPreview,
  scenarios: {
    /** Rows of people: a circle, a name, a line. */
    list: { label: 'Loading members…', rows: 4, lines: 2, avatar: true },
    /** A paragraph about to load. */
    text: { label: 'Loading the description…', rows: 1, lines: 4, avatar: false },
    /** A card's body. */
    card: { label: 'Loading the summary…', rows: 1, lines: 3, avatar: false, inCard: true },
  },
});
