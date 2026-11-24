import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { render } from '@testing-library/angular';
import { type NotificationConfig, Notifications } from './notification';
import { NotificationHarness } from './notification.harness';

@Component({ template: '', changeDetection: ChangeDetectionStrategy.OnPush })
class Page {}

const exported: NotificationConfig = {
  title: 'Export ready',
  message: 'Clients.csv is in your downloads.',
  tone: 'success',
  action: 'Open',
  closeLabel: 'Close',
  duration: 0,
};

async function setup(): Promise<{ notifications: Notifications; loader: ReturnType<typeof TestbedHarnessEnvironment.documentRootLoader> }> {
  const { fixture } = await render(Page);
  return { notifications: TestBed.inject(Notifications), loader: TestbedHarnessEnvironment.documentRootLoader(fixture) };
}

describe('notification', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('shows the title and message, runs the action, and is gone after it', async () => {
    const { notifications, loader } = await setup();
    const ref = notifications.show(exported);
    const events: string[] = [];
    ref.onAction().subscribe(() => events.push('action'));
    ref.afterDismissed().subscribe(() => events.push('dismissed'));
    const notification = await loader.getHarness(NotificationHarness);
    expect(await notification.getTitle()).toBe('Export ready');
    expect(await notification.getMessage()).toBe('Clients.csv is in your downloads.');
    expect(await notification.getPoliteness()).toBe('polite');
    await notification.runAction();
    expect(events).toEqual(['action', 'dismissed']);
    expect(await loader.getAllHarnesses(NotificationHarness)).toHaveLength(0);
  });

  it('announces errors assertively and keeps at most three, newest on top, the next waiting its turn', async () => {
    const { notifications, loader } = await setup();
    for (const title of ['One', 'Two', 'Three']) {
      notifications.show({ ...exported, title, tone: 'neutral' });
    }
    notifications.show({ ...exported, title: 'Sync failed', tone: 'error' });
    const shown = await loader.getAllHarnesses(NotificationHarness);
    expect(await Promise.all(shown.map((notification) => notification.getTitle()))).toEqual(['Three', 'Two', 'One']);
    await (await loader.getHarness(NotificationHarness.with({ title: 'One' }))).close();
    const failed = await loader.getHarness(NotificationHarness.with({ title: 'Sync failed' }));
    expect(await failed.getPoliteness()).toBe('assertive');
  });

  it('dismisses itself after its duration, but not while hovered', async () => {
    vi.useFakeTimers();
    const { notifications, loader } = await setup();
    let dismissed = false;
    notifications
      .show({ ...exported, duration: 3000 })
      .afterDismissed()
      .subscribe(() => (dismissed = true));
    const notification = await loader.getHarness(NotificationHarness);
    await notification.hover();
    vi.advanceTimersByTime(5000);
    expect(dismissed).toBe(false);
    await notification.leave();
    vi.advanceTimersByTime(3000);
    expect(dismissed).toBe(true);
  });
});
