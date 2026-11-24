import { BreakpointObserver } from '@angular/cdk/layout';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { provideRouter } from '@angular/router';
import { render } from '@testing-library/angular';
import { of } from 'rxjs';
import { AppShell, type ShellNavSection } from './app-shell';
import { AppShellHarness } from './app-shell.harness';

/** A screen as wide as `width`: the shell's media queries answer from it. */
function screenOf(width: number): { provide: typeof BreakpointObserver; useValue: Pick<BreakpointObserver, 'observe'> } {
  return {
    provide: BreakpointObserver,
    useValue: {
      observe: (query: string | readonly string[]) => {
        const minimum = Number(/min-width: (\d+)px/.exec(String(query))?.[1] ?? 0);
        return of({ matches: width >= minimum, breakpoints: {} });
      },
    },
  };
}

const base = { productName: 'Northwind', navigationLabel: 'Main', menuLabel: 'Open navigation' };

const tree: readonly ShellNavSection[] = [
  {
    items: [
      { label: 'Overview', icon: 'dashboard', path: '/' },
      { label: 'Projects', icon: 'folder', path: '/projects' },
    ],
  },
];

describe('app shell', () => {
  it('lists the navigation and marks the current page', async () => {
    const { fixture } = await render(AppShell, {
      inputs: {
        productName: 'Northwind',
        navigationLabel: 'Main',
        menuLabel: 'Open navigation',
        navigation: [
          {
            items: [
              { label: 'Members', icon: 'group', path: '/' },
              { label: 'Invoices', icon: 'receipt_long', path: '/invoices' },
            ],
          },
        ],
      },
      providers: [provideRouter([])],
    });
    const shell = await TestbedHarnessEnvironment.harnessForFixture(fixture, AppShellHarness);
    await shell.openNavigation();
    expect(await shell.getNavigationLabels()).toEqual(['Members', 'Invoices']);
    expect(await shell.getCurrentLabel()).toBe('Members');
  });

  it('shows the top bar actions and the person signed in, and reports clicks', async () => {
    const actionSelected = vi.fn();
    const userMenuSelected = vi.fn();
    const { fixture, container } = await render(AppShell, {
      inputs: {
        productName: 'Northwind',
        navigationLabel: 'Main',
        menuLabel: 'Open navigation',
        navigation: [{ items: [{ label: 'Members', icon: 'group', path: '/' }] }],
        actions: [{ id: 'notifications', icon: 'notifications', label: 'Notifications, 3 unread', badge: 3 }],
        user: {
          name: 'Marta Ruiz',
          label: 'Account: Marta Ruiz',
          closeLabel: 'Close',
          menu: [
            { id: 'profile', icon: 'person', label: 'Profile' },
            { id: 'sign-out', icon: 'logout', label: 'Sign out' },
          ],
        },
      },
      on: { actionSelected, userMenuSelected },
      providers: [provideRouter([])],
    });
    const shell = await TestbedHarnessEnvironment.harnessForFixture(fixture, AppShellHarness);
    expect(await shell.getActionLabels()).toEqual(['Notifications, 3 unread']);
    expect(await shell.getUserLabel()).toBe('Account: Marta Ruiz');
    expect(container.querySelector('.ui-shell-avatar')?.textContent.trim()).toBe('MR');

    await shell.clickAction('Notifications, 3 unread');
    expect(actionSelected).toHaveBeenCalledWith('notifications');

    expect(await shell.getUserMenuLabels()).toEqual(['Profile', 'Sign out']);
    await shell.selectUserMenuItem('Sign out');
    expect(userMenuSelected).toHaveBeenCalledWith('sign-out');
  });

  it('leaves the user out when nobody is signed in', async () => {
    const { fixture } = await render(AppShell, {
      inputs: { productName: 'Northwind', navigationLabel: 'Main', menuLabel: 'Open navigation', navigation: [] },
      providers: [provideRouter([])],
    });
    const shell = await TestbedHarnessEnvironment.harnessForFixture(fixture, AppShellHarness);
    expect(await shell.getUserLabel()).toBe('');
    expect(await shell.getActionLabels()).toEqual([]);
  });

  it('titles the sections', async () => {
    const { fixture } = await render(AppShell, {
      inputs: {
        productName: 'Northwind',
        navigationLabel: 'Main',
        menuLabel: 'Open navigation',
        navigation: [
          { items: [{ label: 'Overview', icon: 'dashboard', path: '/overview' }] },
          {
            title: 'Workspace',
            items: [
              { label: 'General', icon: 'tune', path: '/settings/general' },
              { label: 'Security', icon: 'shield', path: '/settings/security' },
            ],
          },
        ],
      },
      providers: [provideRouter([])],
    });
    const shell = await TestbedHarnessEnvironment.harnessForFixture(fixture, AppShellHarness);
    await shell.openNavigation();
    expect(await shell.getSectionTitles()).toEqual(['Workspace']);
    expect(await shell.getNavigationLabels()).toEqual(['Overview', 'General', 'Security']);
  });

  it('folds the drawer to a rail of icons and reports it, keeping the labels for screen readers', async () => {
    const collapsedChange = vi.fn();
    const { fixture } = await render(AppShell, {
      inputs: { ...base, navigation: tree, railCollapsible: true, railToggleLabel: 'Toggle navigation' },
      on: { collapsedChange },
      providers: [provideRouter([]), screenOf(1024)],
    });
    const shell = await TestbedHarnessEnvironment.harnessForFixture(fixture, AppShellHarness);
    expect(await shell.isRail()).toBe(false);
    await shell.toggleRail();
    expect(await shell.isRail()).toBe(true);
    expect(collapsedChange).toHaveBeenCalledWith(true);
    expect(await shell.getNavigationLabels()).toEqual(['Overview', 'Projects']);
    expect(await shell.getActionLabels()).toEqual([]);

    await shell.toggleRail();
    expect(await shell.isRail()).toBe(false);
    expect(collapsedChange).toHaveBeenLastCalledWith(false);
  });

  it('starts folded when the page says so', async () => {
    const wide = await render(AppShell, {
      inputs: { ...base, navigation: tree, railCollapsible: true, collapsed: true, railToggleLabel: 'Toggle navigation' },
      providers: [provideRouter([]), screenOf(1024)],
    });
    expect(await (await TestbedHarnessEnvironment.harnessForFixture(wide.fixture, AppShellHarness)).isRail()).toBe(true);
  });

  it('never folds to a rail on phones', async () => {
    const phone = await render(AppShell, {
      inputs: { ...base, navigation: tree, railCollapsible: true, collapsed: true, railToggleLabel: 'Toggle navigation' },
      providers: [provideRouter([]), screenOf(400)],
    });
    expect(await (await TestbedHarnessEnvironment.harnessForFixture(phone.fixture, AppShellHarness)).isRail()).toBe(false);
  });

  it('lists the secondary links at the drawer foot', async () => {
    const { fixture } = await render(AppShell, {
      inputs: {
        ...base,
        navigation: tree,
        secondaryNavigationLabel: 'Support',
        secondaryNavigation: [{ label: 'Help', icon: 'help', path: '/help' }],
      },
      providers: [provideRouter([]), screenOf(1024)],
    });
    const shell = await TestbedHarnessEnvironment.harnessForFixture(fixture, AppShellHarness);
    expect(await shell.getSecondaryLabels()).toEqual(['Help']);
  });

  it('puts the right-hand panel behind a top bar button under 1200 px', async () => {
    const aside = { label: 'Activity', openLabel: 'Show activity', closeLabel: 'Close activity' };
    const narrow = await render(AppShell, {
      inputs: { ...base, navigation: tree, aside, actions: [{ id: 'help', icon: 'help', label: 'Help' }] },
      providers: [provideRouter([]), screenOf(1024)],
    });
    const shell = await TestbedHarnessEnvironment.harnessForFixture(narrow.fixture, AppShellHarness);
    expect(await shell.getAsideLabel()).toBe('Activity');
    expect(await shell.getActionLabels()).toEqual(['Help']);
    expect(narrow.container.querySelector('[data-aside]')?.getAttribute('aria-label')).toBe('Show activity');
    await shell.openAside();
    expect(narrow.container.querySelector('[data-aside]')?.getAttribute('aria-expanded')).toBe('true');
  });

  it('keeps the right-hand panel open beside the page from 1200 px', async () => {
    const aside = { label: 'Activity', openLabel: 'Show activity', closeLabel: 'Close activity' };
    const wide = await render(AppShell, { inputs: { ...base, navigation: tree, aside }, providers: [provideRouter([]), screenOf(1440)] });
    expect(wide.container.querySelector('[data-aside]')).toBeNull();
    expect(await (await TestbedHarnessEnvironment.harnessForFixture(wide.fixture, AppShellHarness)).getAsideLabel()).toBe('Activity');
  });
});
