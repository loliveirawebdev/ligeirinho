import { CdkTrapFocus } from '@angular/cdk/a11y';
import { BreakpointObserver } from '@angular/cdk/layout';
import { CdkConnectedOverlay, CdkOverlayOrigin, type ConnectedPosition } from '@angular/cdk/overlay';
import { ChangeDetectionStrategy, Component, computed, inject, input, linkedSignal, output, signal, ViewEncapsulation } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatBadgeModule } from '@angular/material/badge';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { map } from 'rxjs';

/** A page in the navigation. */
export interface ShellLink {
  readonly label: string;
  /** A Material Symbols name. */
  readonly icon: string;
  readonly path: string;
}

/** The right-hand panel (details, activity) beside the page from 1200 px, behind a top bar button under it. */
export interface ShellAside {
  /** The panel's title and its landmark's name (*Activity*). */
  readonly label: string;
  /** The top bar button that opens it on narrower screens (*Show activity*). */
  readonly openLabel: string;
  /** The button that closes it there (*Close activity*). */
  readonly closeLabel: string;
  /** The top bar button's Material Symbol; `right_panel_open` by default. */
  readonly icon?: string;
}

/** Entries about one subject, under an optional title (*People*, *Billing*); sections are spaced apart. */
export interface ShellNavSection {
  readonly title?: string;
  readonly items: readonly ShellLink[];
}

interface NavSectionView {
  readonly title: string | undefined;
  readonly titleId: string;
  readonly items: readonly ShellLink[];
}

/** An app-wide action in the top bar: an icon button (notifications, help, settings). */
export interface ShellAction {
  readonly id: string;
  /** A Material Symbols name. */
  readonly icon: string;
  /** The button's name (*Notifications*); include the count when there is one (*Notifications, 3 unread*). */
  readonly label: string;
  /** A count shown as a badge on the icon; none or 0 shows no badge. */
  readonly badge?: number;
}

/** An entry of the signed-in person's account card (*Profile*, *Settings*, *Sign out*). */
export interface ShellMenuItem {
  readonly id: string;
  /** A Material Symbols name. */
  readonly icon: string;
  readonly label: string;
}

/** The person signed in, shown at the end of the top bar; clicking opens their account card. */
export interface ShellUser {
  readonly name: string;
  /** A second line on wide screens: an email, a role, an organization. */
  readonly detail?: string;
  /** A photo; without it the avatar shows the name's initials. */
  readonly avatarUrl?: string;
  /** The button's name (*Account: Ana Souza*). */
  readonly label: string;
  /** The account card's close button name (*Close*). */
  readonly closeLabel: string;
  readonly menu: readonly ShellMenuItem[];
}

/** The account card opens under the user's button, aligned to its end. */
const ACCOUNT_CARD_POSITIONS: ConnectedPosition[] = [
  { originX: 'end', originY: 'bottom', overlayX: 'end', overlayY: 'top', offsetY: 8 },
  { originX: 'end', originY: 'top', overlayX: 'end', overlayY: 'bottom', offsetY: -8 },
];

/** Wide enough to keep the navigation open beside the content. */
const SIDE_NAVIGATION_MEDIA_QUERY = '(min-width: 840px)';
/** Wide enough to keep the right-hand panel open beside the page too. */
const SIDE_ASIDE_MEDIA_QUERY = '(min-width: 1200px)';

/**
 * The frame of an app with several sections (a back office, a dashboard): the product name and the navigation in a
 * drawer that stays open beside the content on wide screens and slides over it on phones, behind a menu button.
 * The top bar is only for app-wide icons (`actions`: notifications, help) and the person signed in (`user`), never
 * page content or links. The page goes inside (`<ui-app-shell>…</ui-app-shell>`), at the full width.
 *
 * Variants, from the inputs: `railCollapsible` lets the drawer fold to a rail of icons (labels in tooltips) from a
 * button in the top bar, the state kept by the page (`collapsed`, `collapsedChange`); `secondaryNavigation` adds a
 * group of links at the drawer's foot (help, feedback); `aside` adds a right-hand panel with the content marked
 * `uiShellAside`.
 */
@Component({
  selector: 'ui-app-shell',
  imports: [
    CdkConnectedOverlay,
    CdkOverlayOrigin,
    CdkTrapFocus,
    MatBadgeModule,
    MatButtonModule,
    MatIconModule,
    MatListModule,
    MatSidenavModule,
    MatToolbarModule,
    MatTooltipModule,
    RouterLink,
    RouterLinkActive,
  ],
  templateUrl: './app-shell.html',
  styleUrls: ['./app-shell.css', './app-shell-account.css', './app-shell-variants.css'],
  // The styles reach into Material's badge and list; every selector starts with ui-app-shell, so nothing leaks.
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'block h-dvh',
    '[class.ui-shell-rail]': 'rail()',
  },
})
export class AppShell {
  readonly productName = input.required<string>();
  /** The drawer's entries, in sections; a section without a title comes first, untitled. */
  readonly navigation = input.required<readonly ShellNavSection[]>();
  /** The navigation landmark's name (*Main*). */
  readonly navigationLabel = input.required<string>();
  /** The menu button's name on phones (*Open navigation*). */
  readonly menuLabel = input.required<string>();
  readonly actions = input<readonly ShellAction[]>([]);
  readonly user = input<ShellUser>();
  /** The drawer can fold to a rail of icons, from a button at the start of the top bar (wide screens only). */
  readonly railCollapsible = input(false);
  /** Whether the drawer is folded to the rail; keep it per user from `collapsedChange`. */
  readonly collapsed = input(false);
  /** The rail button's name (*Toggle navigation*); it says open or folded with `aria-expanded`. */
  readonly railToggleLabel = input('');
  /** A smaller group of links at the drawer's foot: help, feedback, what's new. */
  readonly secondaryNavigation = input<readonly ShellLink[]>([]);
  /** The secondary group's landmark name (*Support*). */
  readonly secondaryNavigationLabel = input('');
  /** A right-hand panel with the content marked `uiShellAside`. */
  readonly aside = input<ShellAside>();

  /** The id of the top bar action the user clicked. */
  readonly actionSelected = output<string>();
  /** The id of the entry the user picked in their account card. */
  readonly userMenuSelected = output<string>();
  /** The user folded (true) or opened (false) the drawer's rail. */
  readonly collapsedChange = output<boolean>();

  protected readonly accountCardPositions = ACCOUNT_CARD_POSITIONS;
  protected readonly accountOpen = signal(false);

  protected readonly initials = computed(() =>
    (this.user()?.name ?? '')
      .split(/\s+/)
      .filter((part) => part.length > 0)
      .slice(0, 2)
      .map((part) => part[0]?.toLocaleUpperCase())
      .join(''),
  );

  protected readonly isWide = toSignal(
    inject(BreakpointObserver).observe(SIDE_NAVIGATION_MEDIA_QUERY).pipe(map((state) => state.matches)),
    { initialValue: false },
  );
  protected readonly isAsideWide = toSignal(
    inject(BreakpointObserver).observe(SIDE_ASIDE_MEDIA_QUERY).pipe(map((state) => state.matches)),
    { initialValue: false },
  );
  protected readonly drawerOpen = signal(false);
  protected readonly asideOpen = signal(false);

  private readonly railCollapsed = linkedSignal(() => this.collapsed());
  /** The drawer is a rail of icons right now: folded, and on a wide screen. */
  protected readonly railExpanded = computed(() => !this.railCollapsed());
  protected readonly rail = computed(() => this.railCollapsible() && this.railCollapsed() && this.isWide());

  protected readonly sections = computed<readonly NavSectionView[]>(() =>
    this.navigation().map((section, index) => ({
      title: section.title,
      titleId: `ui-shell-section-${String(index)}`,
      items: section.items,
    })),
  );

  protected toggleRail(): void {
    const collapsed = !this.railCollapsed();
    this.railCollapsed.set(collapsed);
    this.collapsedChange.emit(collapsed);
  }

  protected selectAccountItem(id: string): void {
    this.accountOpen.set(false);
    this.userMenuSelected.emit(id);
  }

  protected closeAccountOnEscape(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      this.accountOpen.set(false);
    }
  }

  protected closeOnPhone(): void {
    if (!this.isWide()) {
      this.drawerOpen.set(false);
    }
  }

}
