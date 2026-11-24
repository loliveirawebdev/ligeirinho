import { ChangeDetectionStrategy, Component, DestroyRef, effect, inject, input, untracked } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { defineScenarios } from '@ligeirinho/previewer';
import { type NotificationConfig, type NotificationRef, Notifications } from './notification';

interface NotificationPreviewModel {
  readonly show: string;
  /** Shown one after another as the scenario loads; the button shows them again. */
  readonly notifications: readonly NotificationConfig[];
}

@Component({
  selector: 'ui-notification-preview',
  imports: [MatButtonModule],
  template: `
    <div class="p-4 sm:p-8">
      <button matButton="outlined" type="button" (click)="showAll()">{{ model().show }}</button>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class NotificationPreview {
  readonly model = input.required<NotificationPreviewModel>();

  private readonly notifications = inject(Notifications);
  private refs: NotificationRef[] = [];

  constructor() {
    effect(() => {
      this.model();
      untracked(() => {
        this.dismissAll();
        this.showAll();
      });
    });
    inject(DestroyRef).onDestroy(() => {
      this.dismissAll();
    });
  }

  protected showAll(): void {
    this.refs.push(...this.model().notifications.map((config) => this.notifications.show(config)));
  }

  private dismissAll(): void {
    for (const ref of this.refs) {
      ref.dismiss();
    }
    this.refs = [];
  }
}

export const notificationScenarios = defineScenarios({
  flow: 'Catalog',
  title: 'Notification',
  component: NotificationPreview,
  scenarios: {
    /** Something finished in the background, with an action; it stays while hovered. */
    success: {
      show: 'Show notification',
      notifications: [
        { title: 'Export ready', message: 'Clients.csv (1,204 rows) is in your downloads.', tone: 'success', action: 'Open file', closeLabel: 'Close', duration: 0 },
      ],
    },
    /** Every tone stacked; the error is announced at once. */
    stack: {
      show: 'Show notifications',
      notifications: [
        { title: 'Ana Souza mentioned you', message: 'In “Northwind renewal”: can you check the new prices?', tone: 'neutral', action: 'Reply', closeLabel: 'Close', duration: 0 },
        { title: 'Storage almost full', message: '92% of 10 GB used. Old attachments can go.', tone: 'warning', closeLabel: 'Close', duration: 0 },
        { title: 'Sync with the bank failed', message: 'Statements since Monday are missing. Connect the account again.', tone: 'error', action: 'Reconnect', closeLabel: 'Close', duration: 0 },
      ],
    },
    /** The usual: gone after a few seconds (hover or focus it to keep it). */
    timed: {
      show: 'Show notification',
      notifications: [{ title: 'Invoice 0425 sent', message: 'Northwind gets it by email in a few minutes.', tone: 'success', closeLabel: 'Close' }],
    },
  },
});
