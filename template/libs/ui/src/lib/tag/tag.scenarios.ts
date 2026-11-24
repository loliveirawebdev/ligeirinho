import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { defineScenarios } from '@ligeirinho/previewer';
import { Tag, type TagTone } from './tag';

interface TagPreviewModel {
  readonly tags: readonly { readonly label: string; readonly tone: TagTone; readonly icon?: string }[];
}

@Component({
  selector: 'ui-tag-preview',
  imports: [Tag],
  template: `
    <div class="flex flex-wrap gap-2 p-4 sm:p-8">
      @for (tag of model().tags; track tag.label) {
        <ui-tag [label]="tag.label" [tone]="tag.tone" [icon]="tag.icon" />
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class TagPreview {
  readonly model = input.required<TagPreviewModel>();
}

export const tagScenarios = defineScenarios({
  flow: 'Catalog',
  title: 'Tag',
  component: TagPreview,
  scenarios: {
    /** Every tone, by what it means. */
    tones: {
      tags: [
        { label: 'Draft', tone: 'neutral' },
        { label: 'New', tone: 'primary' },
        { label: 'Active', tone: 'success' },
        { label: 'Due soon', tone: 'warning' },
        { label: 'Failed', tone: 'error' },
      ],
    },
    withIcons: {
      tags: [
        { label: 'Paid', tone: 'success', icon: 'check' },
        { label: 'Overdue', tone: 'warning', icon: 'schedule' },
        { label: 'Blocked', tone: 'error', icon: 'block' },
        { label: 'Web', tone: 'neutral', icon: 'language' },
      ],
    },
  },
});
