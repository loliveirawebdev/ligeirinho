import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { defineScenarios } from '@ligeirinho/previewer';
import { LoadingState } from './loading-state';

@Component({
  selector: 'ui-loading-state-preview',
  imports: [LoadingState],
  template: `<div class="mx-auto max-w-2xl p-4 sm:p-8"><ui-loading-state [label]="model().label" /></div>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class LoadingStatePreview {
  readonly model = input.required<{ readonly label: string }>();
}

export const loadingStateScenarios = defineScenarios({
  flow: 'Catalog',
  title: 'Loading state',
  component: LoadingStatePreview,
  scenarios: { loading: { label: 'Loading members…' } },
});
