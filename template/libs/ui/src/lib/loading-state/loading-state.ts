import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MatProgressBarModule } from '@angular/material/progress-bar';

/** While a page or list loads: a progress bar and what is loading, announced politely. */
@Component({
  selector: 'ui-loading-state',
  imports: [MatProgressBarModule],
  templateUrl: './loading-state.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
})
export class LoadingState {
  readonly label = input.required<string>();
}
