import { ChangeDetectionStrategy, Component, effect, input, signal } from '@angular/core';
import { defineScenarios } from '@ligeirinho/previewer';
import { SAMPLE_NAVIGATION, SAMPLE_SHELL } from '../../examples/members/sample-members';
import { DetailList, type DetailItem } from '../detail-list/detail-list';
import { PageHeader } from '../page-header/page-header';
import { AppShell, type ShellAction, type ShellAside, type ShellLink, type ShellNavSection, type ShellUser } from './app-shell';

interface AppShellPreviewModel {
  readonly productName: string;
  readonly navigation: readonly ShellNavSection[];
  readonly navigationLabel: string;
  readonly menuLabel: string;
  readonly actions: readonly ShellAction[];
  readonly user?: ShellUser;
  readonly pageTitle: string;
  readonly railCollapsible?: boolean;
  readonly collapsed?: boolean;
  readonly railToggleLabel?: string;
  readonly secondaryNavigation?: readonly ShellLink[];
  readonly secondaryNavigationLabel?: string;
  /** The right-hand panel and the facts it shows. */
  readonly aside?: ShellAside & { readonly facts: readonly DetailItem[] };
}

@Component({
  selector: 'ui-app-shell-preview',
  imports: [AppShell, DetailList, PageHeader],
  template: `
    @let m = model();
    <ui-app-shell
      [productName]="m.productName"
      [navigation]="m.navigation"
      [navigationLabel]="m.navigationLabel"
      [menuLabel]="m.menuLabel"
      [actions]="m.actions"
      [user]="m.user"
      [railCollapsible]="m.railCollapsible ?? false"
      [collapsed]="collapsed()"
      [railToggleLabel]="m.railToggleLabel ?? ''"
      [secondaryNavigation]="m.secondaryNavigation ?? []"
      [secondaryNavigationLabel]="m.secondaryNavigationLabel ?? ''"
      [aside]="m.aside"
      (collapsedChange)="collapsed.set($event)"
    >
      <ui-page-header [title]="m.pageTitle" />
      @if (m.aside; as aside) {
        <ui-detail-list uiShellAside [items]="aside.facts" />
      }
    </ui-app-shell>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class AppShellPreview {
  readonly model = input.required<AppShellPreviewModel>();
  /** The rail's state, kept here as a page would keep it per user. */
  protected readonly collapsed = signal(false);

  constructor() {
    effect(() => {
      this.collapsed.set(this.model().collapsed ?? false);
    });
  }
}

const backOffice: AppShellPreviewModel = { ...SAMPLE_SHELL, pageTitle: 'Members' };

const { user: _signedIn, ...signedOut } = backOffice;

export const appShellScenarios = defineScenarios({
  flow: 'Catalog',
  title: 'App shell',
  component: AppShellPreview,
  scenarios: {
    backOffice,
    flat: { ...backOffice, navigation: [{ items: SAMPLE_NAVIGATION.flatMap((section) => section.items) }] },
    longProductName: { ...backOffice, productName: 'Northwind Partner Operations' },
    noNotifications: { ...backOffice, actions: [{ id: 'notifications', icon: 'notifications', label: 'Notifications' }] },
    signedOut: { ...signedOut, actions: [] },
    /** The drawer folds to a rail of icons from the button at the start of the top bar (wide screens). */
    railCollapsible: { ...backOffice, railCollapsible: true, railToggleLabel: 'Toggle navigation' },
    /** Folded: icons only, each label in a tooltip; the product name moves to the top bar. */
    railCollapsed: { ...backOffice, railCollapsible: true, collapsed: true, railToggleLabel: 'Toggle navigation' },
    /** Help and feedback in a quieter group at the drawer's foot. */
    footerLinks: {
      ...backOffice,
      secondaryNavigationLabel: 'Support',
      secondaryNavigation: [
        { label: 'Help center', icon: 'help', path: '/help' },
        { label: 'Send feedback', icon: 'feedback', path: '/feedback' },
      ],
    },
    /** A right-hand panel with the record's details, beside the page from 1200 px, behind a top bar button under it. */
    aside: {
      ...backOffice,
      pageTitle: 'Ana Souza',
      aside: {
        label: 'Details',
        openLabel: 'Show details',
        closeLabel: 'Close details',
        facts: [
          { label: 'Email', value: 'ana.souza@northwind.example' },
          { label: 'Role', value: 'Administrator' },
          { label: 'Team', value: 'Operations' },
          { label: 'Last active', value: 'Today, 09:42' },
        ],
      },
    },
  },
});
