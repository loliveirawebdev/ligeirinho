import { ChangeDetectionStrategy, Component, input, signal, viewChild } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule, MatMenuTrigger } from '@angular/material/menu';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatStepperModule } from '@angular/material/stepper';
import { MatTabsModule } from '@angular/material/tabs';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { DetailList, type DetailItem } from '../../lib/detail-list/detail-list';
import type { CatalogNote, IconLabel } from '../catalog-note';
import { ExampleNote } from '../example-note';

export interface NavigationExampleModel {
  readonly title: string;
  readonly sections: {
    readonly tabs: string;
    readonly menu: string;
    readonly contextMenu: string;
    readonly stepper: string;
    readonly toolbar: string;
    readonly sideSheet: string;
  };
  readonly notes: {
    readonly tabs: CatalogNote;
    readonly tabsIcons: CatalogNote;
    readonly menu: CatalogNote;
    readonly contextMenu: CatalogNote;
    readonly stepper: CatalogNote;
    readonly stepperVertical: CatalogNote;
    readonly toolbar: CatalogNote;
    readonly sideSheet: CatalogNote;
  };
  readonly tabs: readonly (IconLabel & { readonly content: string })[];
  readonly menu: {
    readonly open: string;
    readonly items: readonly IconLabel[];
    readonly moveTo: IconLabel;
    readonly destinations: readonly string[];
    readonly disabled: IconLabel;
    readonly remove: IconLabel;
  };
  readonly contextMenu: { readonly target: string; readonly items: readonly IconLabel[]; readonly remove: IconLabel };
  readonly steps: readonly { readonly label: string; readonly content: string }[];
  readonly stepActions: { readonly next: string; readonly back: string; readonly done: string };
  readonly toolbar: { readonly title: string; readonly actions: readonly IconLabel[] };
  readonly sideSheet: {
    readonly page: string;
    readonly open: string;
    readonly title: string;
    readonly close: string;
    readonly facts: readonly DetailItem[];
  };
}

/**
 * Navigation and wayfinding from Angular Material at the compact scale: tabs, menus, steppers, a toolbar and a side
 * sheet. A reference to pick from, not a component: screens use Material directly (the app's own frame is
 * `ui-app-shell`).
 */
@Component({
  selector: 'ui-navigation-example',
  imports: [
    ExampleNote,
    DetailList,
    MatButtonModule,
    MatDividerModule,
    MatIconModule,
    MatMenuModule,
    MatSidenavModule,
    MatStepperModule,
    MatTabsModule,
    MatToolbarModule,
    MatTooltipModule,
  ],
  templateUrl: './navigation.example.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NavigationExample {
  readonly model = input.required<NavigationExampleModel>();
  protected readonly stepperOrientations = ['horizontal', 'vertical'] as const;

  /** Where the context menu opens: under the pointer, or at the target's corner from the keyboard. */
  protected readonly contextPoint = signal({ left: 0, top: 0 });
  private readonly contextTrigger = viewChild.required<MatMenuTrigger>('contextTrigger');

  protected openContextMenu(event: MouseEvent): void {
    event.preventDefault();
    const fromKeyboard = event.clientX === 0 && event.clientY === 0;
    const target = event.currentTarget instanceof HTMLElement ? event.currentTarget.getBoundingClientRect() : null;
    this.contextPoint.set(
      fromKeyboard && target ? { left: target.left + 16, top: target.top + 16 } : { left: event.clientX, top: event.clientY },
    );
    this.contextTrigger().openMenu();
  }
}
