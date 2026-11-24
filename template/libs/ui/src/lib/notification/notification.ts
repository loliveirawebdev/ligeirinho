import { createGlobalPositionStrategy, createOverlayRef, type OverlayRef } from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  effect,
  inject,
  Injectable,
  Injector,
  input,
  output,
  signal,
  ViewEncapsulation,
  type ComponentRef,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { type Observable, Subject } from 'rxjs';

export type NotificationTone = 'neutral' | 'success' | 'warning' | 'error';

/** Each tone's icon and its color; the card itself stays in the page's colors. */
const TONES: Readonly<Record<NotificationTone, { readonly icon: string; readonly color: string }>> = {
  neutral: { icon: 'info', color: 'var(--mat-sys-primary)' },
  success: { icon: 'check_circle', color: 'var(--app-success)' },
  warning: { icon: 'warning', color: 'var(--app-warning)' },
  error: { icon: 'error', color: 'var(--mat-sys-error)' },
};

/** Shown for this long unless `duration` says otherwise. */
const DEFAULT_DURATION_MS = 4500;
const MAX_VISIBLE = 3;

/** What `Notifications.show` shows, in the screen's words. */
export interface NotificationConfig {
  /** What happened: *Export ready*. */
  readonly title: string;
  /** What it means or what to do: *Clients.csv is in your downloads.* */
  readonly message?: string;
  readonly tone?: NotificationTone;
  /** One action, a verb: *Open*, *Undo*, *View invoice*. Running it also dismisses the notification. */
  readonly action?: string;
  /** The close button's name for screen readers: *Close*. */
  readonly closeLabel: string;
  /** In milliseconds; 0 keeps it until closed. Default 4.5 s. Paused while hovered or focused. */
  readonly duration?: number;
}

/**
 * One notification card: the tone's icon on the title's line, the title, the message, an action and a close button.
 * Dismisses itself after `duration` (paused while the pointer or the focus is on it). Errors are announced at once
 * (`role="alert"`), the rest politely. Shown by `Notifications.show`; use it directly only to lay one out in place.
 */
@Component({
  selector: 'ui-notification',
  imports: [MatButtonModule, MatIconModule],
  templateUrl: './notification.html',
  styleUrl: './notification.css',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'ui-notification',
    '[attr.role]': "tone() === 'error' ? 'alert' : 'status'",
    '[attr.aria-live]': "tone() === 'error' ? 'assertive' : 'polite'",
    '[style.--ui-notification-color]': 'look().color',
    '(mouseenter)': 'pause()',
    '(mouseleave)': 'resume()',
    '(focusin)': 'pause()',
    '(focusout)': 'resume()',
  },
})
export class Notification {
  readonly title = input.required<string>();
  readonly message = input('');
  readonly tone = input<NotificationTone>('neutral');
  readonly action = input<string>();
  readonly closeLabel = input.required<string>();
  /** In milliseconds; 0 keeps it until closed. */
  readonly duration = input(0);

  /** Closed from its button, or its time ran out. */
  readonly dismissed = output();
  readonly actionClicked = output();

  protected readonly look = computed(() => TONES[this.tone()]);
  private timer: ReturnType<typeof setTimeout> | undefined;
  private remaining = 0;
  private startedAt = 0;

  constructor() {
    effect(() => {
      this.remaining = this.duration();
      this.resume();
    });
    inject(DestroyRef).onDestroy(() => {
      clearTimeout(this.timer);
    });
  }

  protected pause(): void {
    if (this.timer !== undefined) {
      clearTimeout(this.timer);
      this.timer = undefined;
      this.remaining -= Date.now() - this.startedAt;
    }
  }

  protected resume(): void {
    if (this.remaining > 0 && this.timer === undefined) {
      this.startedAt = Date.now();
      this.timer = setTimeout(() => {
        this.dismissed.emit();
      }, this.remaining);
    }
  }

  protected act(): void {
    this.actionClicked.emit();
    this.dismissed.emit();
  }
}

interface StackEntry {
  readonly id: number;
  readonly config: NotificationConfig;
  readonly dismissed: Subject<void>;
  readonly actions: Subject<void>;
}

/** The corner stack `Notifications` keeps in an overlay; not used in templates. */
@Component({
  selector: 'ui-notification-stack',
  imports: [Notification],
  template: `
    @for (entry of visible(); track entry.id) {
      <ui-notification
        [title]="entry.config.title"
        [message]="entry.config.message ?? ''"
        [tone]="entry.config.tone ?? 'neutral'"
        [action]="entry.config.action"
        [closeLabel]="entry.config.closeLabel"
        [duration]="entry.config.duration ?? defaultDuration"
        (actionClicked)="entry.actions.next()"
        (dismissed)="dismiss(entry.id)"
      />
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'ui-notification-stack' },
})
export class NotificationStack {
  protected readonly defaultDuration = DEFAULT_DURATION_MS;
  private readonly entries = signal<readonly StackEntry[]>([]);
  /** The newest on top; past three, the rest wait their turn. */
  protected readonly visible = computed(() => this.entries().slice(0, MAX_VISIBLE).toReversed());

  add(entry: StackEntry): void {
    this.entries.update((entries) => [...entries, entry]);
  }

  dismiss(id: number): void {
    const entry = this.entries().find((candidate) => candidate.id === id);
    if (entry) {
      this.entries.update((entries) => entries.filter((candidate) => candidate !== entry));
      entry.dismissed.next();
      entry.dismissed.complete();
      entry.actions.complete();
    }
  }
}

/** A notification `Notifications.show` opened. */
export class NotificationRef {
  private readonly dismissedEvents: Observable<void>;
  private readonly actionEvents: Observable<void>;
  private readonly close: () => void;

  constructor(dismissed: Observable<void>, actions: Observable<void>, close: () => void) {
    this.dismissedEvents = dismissed;
    this.actionEvents = actions;
    this.close = close;
  }

  /** Emits once it is gone: closed, timed out, its action run, or `dismiss()`. */
  afterDismissed(): Observable<void> {
    return this.dismissedEvents;
  }

  /** Emits when its action is run. */
  onAction(): Observable<void> {
    return this.actionEvents;
  }

  dismiss(): void {
    this.close();
  }
}

/**
 * Tells the user about something that happened away from what they are looking at (an export finished, a sync
 * failed, someone mentioned them): a card at the top-right corner (the bottom, full width, on phones), stacked with
 * up to two others, gone after a few seconds. For the result of what they just did on this screen, the snack bar;
 * for something about the page, `ui-notice`.
 */
@Injectable({ providedIn: 'root' })
export class Notifications {
  private readonly injector = inject(Injector);
  private overlay?: OverlayRef;
  private stack?: ComponentRef<NotificationStack>;
  private nextId = 0;

  show(config: NotificationConfig): NotificationRef {
    const stack = this.attach();
    const entry: StackEntry = { id: this.nextId++, config, dismissed: new Subject(), actions: new Subject() };
    stack.add(entry);
    return new NotificationRef(entry.dismissed, entry.actions, () => {
      stack.dismiss(entry.id);
    });
  }

  private attach(): NotificationStack {
    if (!this.stack) {
      this.overlay = createOverlayRef(this.injector, {
        positionStrategy: createGlobalPositionStrategy(this.injector).top('0').end('0'),
        panelClass: 'ui-notification-pane',
      });
      this.stack = this.overlay.attach(new ComponentPortal(NotificationStack, null, this.injector));
    }
    return this.stack.instance;
  }
}
