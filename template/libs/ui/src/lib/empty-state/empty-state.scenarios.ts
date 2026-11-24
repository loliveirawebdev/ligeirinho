import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { defineScenarios } from '@ligeirinho/previewer';
import { EmptyState } from './empty-state';

interface EmptyStatePreviewModel {
  readonly icon: string;
  readonly title: string;
  readonly message: string;
  readonly action: string;
}

@Component({
  selector: 'ui-empty-state-preview',
  imports: [EmptyState, MatButtonModule],
  template: `
    <div class="mx-auto max-w-2xl p-4">
      <ui-empty-state [icon]="model().icon" [title]="model().title" [message]="model().message">
        @if (model().action) {
          <button uiEmptyAction matButton="tonal" type="button">{{ model().action }}</button>
        }
      </ui-empty-state>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class EmptyStatePreview {
  readonly model = input.required<EmptyStatePreviewModel>();
}

export const emptyStateScenarios = defineScenarios({
  flow: 'Catalog',
  title: 'Empty state',
  component: EmptyStatePreview,
  scenarios: {
    firstUse: {
      icon: 'group',
      title: 'No members yet',
      message: 'Members you invite appear here.',
      action: 'Invite member',
    },
    noResults: { icon: 'search_off', title: 'No members match “carla”', message: 'Check the spelling or clear the search.', action: 'Clear search' },
    allDone: { icon: 'task_alt', title: 'All done', message: '', action: '' },
  },
});
