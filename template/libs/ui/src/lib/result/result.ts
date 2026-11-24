import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

export type ResultStatus = 'success' | 'error' | 'warning' | 'neutral' | 'locked' | 'not-found';

const STATUSES: Readonly<Record<ResultStatus, { readonly icon: string; readonly background: string; readonly color: string }>> = {
  success: { icon: 'check_circle', background: 'var(--app-success-container)', color: 'var(--app-on-success-container)' },
  error: { icon: 'error', background: 'var(--mat-sys-error-container)', color: 'var(--mat-sys-on-error-container)' },
  warning: { icon: 'warning', background: 'var(--app-warning-container)', color: 'var(--app-on-warning-container)' },
  neutral: { icon: 'info', background: 'var(--mat-sys-primary-container)', color: 'var(--mat-sys-on-primary-container)' },
  locked: { icon: 'lock', background: 'var(--mat-sys-surface-container-highest)', color: 'var(--mat-sys-on-surface-variant)' },
  'not-found': { icon: 'explore_off', background: 'var(--mat-sys-surface-container-highest)', color: 'var(--mat-sys-on-surface-variant)' },
};

/**
 * How a flow ended, as the whole page or panel: the payment went through, the link expired, no access, the page
 * doesn't exist. A status mark, the outcome as the page's heading, what it means, what to do next
 * (`uiResultActions`), and room for details under it (a receipt, an ID). Not for lists with nothing in them
 * (`ui-empty-state`) or a message inside a page (`ui-notice`).
 */
@Component({
  selector: 'ui-result',
  imports: [MatIconModule],
  templateUrl: './result.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block', '[attr.data-status]': 'status()' },
})
export class Result {
  readonly status = input.required<ResultStatus>();
  readonly title = input.required<string>();
  readonly message = input('');

  protected readonly look = computed(() => STATUSES[this.status()]);
}
