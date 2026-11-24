import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

export type NoticeTone = 'neutral' | 'success' | 'error';

/** Each tone's color and the color of text on it: the border, the icon and the action buttons take them. */
const TONES: Readonly<Record<NoticeTone, { readonly icon: string; readonly color: string; readonly onColor: string }>> = {
  neutral: { icon: 'info', color: 'var(--mat-sys-primary)', onColor: 'var(--mat-sys-on-primary)' },
  success: { icon: 'check_circle', color: 'var(--app-success)', onColor: 'var(--app-on-success)' },
  error: { icon: 'error', color: 'var(--mat-sys-error)', onColor: 'var(--mat-sys-on-error)' },
};

/**
 * A message about the page or a part of it: what happened and, in `message`, what to do. Its actions (`uiNoticeAction`,
 * e.g. *Try again*) sit in a footer under a divider, at the end. An error is announced (`role="alert"`); the rest are polite (`role="status"`).
 * The icon lines up with the title, the first line, however long the message gets. The tone colors only the border,
 * the icon and the action buttons; the text stays in the page's colors.
 */
@Component({
  selector: 'ui-notice',
  imports: [MatIconModule],
  templateUrl: './notice.html',
  styleUrl: './notice.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'block',
    '[style.--ui-notice-color]': 'look().color',
    '[style.--ui-notice-on-color]': 'look().onColor',
  },
})
export class Notice {
  readonly tone = input<NoticeTone>('neutral');
  readonly title = input.required<string>();
  readonly message = input('');

  protected readonly look = computed(() => TONES[this.tone()]);
  protected readonly role = computed(() => (this.tone() === 'error' ? 'alert' : 'status'));
}
