import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

/**
 * Where a list or page has nothing to show: what will be here and how to start (`uiEmptyAction`). The copy differs
 * by case: first use, no results for a filter, all done (rules/copy.md).
 */
@Component({
  selector: 'ui-empty-state',
  imports: [MatIconModule],
  templateUrl: './empty-state.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
})
export class EmptyState {
  readonly icon = input('inbox');
  readonly title = input.required<string>();
  readonly message = input('');
}
