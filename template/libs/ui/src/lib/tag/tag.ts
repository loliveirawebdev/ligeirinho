import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

export type TagTone = 'neutral' | 'primary' | 'success' | 'warning' | 'error';

/** Each tone's container and the text on it: Material's containers, plus the app's success and warning. */
const TONES: Readonly<Record<TagTone, { readonly background: string; readonly color: string }>> = {
  neutral: { background: 'var(--mat-sys-surface-container-highest)', color: 'var(--mat-sys-on-surface-variant)' },
  primary: { background: 'var(--mat-sys-primary-container)', color: 'var(--mat-sys-on-primary-container)' },
  success: { background: 'var(--app-success-container)', color: 'var(--app-on-success-container)' },
  warning: { background: 'var(--app-warning-container)', color: 'var(--app-on-warning-container)' },
  error: { background: 'var(--mat-sys-error-container)', color: 'var(--mat-sys-on-error-container)' },
};

/**
 * A short label on a record: its status (*Active*, *Overdue*), a kind (*Web*), a plan. Not clickable: to filter by
 * it, chips. The tone carries meaning, the same on every screen: success done or healthy, warning needs attention
 * soon, error failed or blocked, primary new or highlighted, neutral everything else.
 */
@Component({
  selector: 'ui-tag',
  imports: [MatIconModule],
  templateUrl: './tag.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'inline-flex h-6 max-w-full items-center gap-1 rounded-sm px-2 align-middle text-label-medium',
    '[class.ps-1.5]': 'icon()',
    '[attr.data-tone]': 'tone()',
    '[style.background]': 'look().background',
    '[style.color]': 'look().color',
  },
})
export class Tag {
  readonly label = input.required<string>();
  readonly tone = input<TagTone>('neutral');
  /** A Material Symbol before the label, when it helps tell tags apart at a glance. */
  readonly icon = input<string>();

  protected readonly look = computed(() => TONES[this.tone()]);
}
