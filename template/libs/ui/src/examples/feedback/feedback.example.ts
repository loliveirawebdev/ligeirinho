import { ChangeDetectionStrategy, Component, inject, InjectionToken, Injector, input } from '@angular/core';
import { MatBadgeModule } from '@angular/material/badge';
import { MatBottomSheet, MatBottomSheetRef } from '@angular/material/bottom-sheet';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTooltipModule, type TooltipPosition } from '@angular/material/tooltip';
import { ConfirmDialogs, type ConfirmDialogText } from '../../lib/confirm-dialog/confirm-dialog';
import type { CatalogNote, IconLabel } from '../catalog-note';
import { ExampleNote } from '../example-note';

export interface FeedbackExampleModel {
  readonly title: string;
  readonly sections: {
    readonly overlays: string;
    readonly progress: string;
    readonly hints: string;
  };
  readonly notes: {
    readonly dialog: CatalogNote;
    readonly bottomSheet: CatalogNote;
    readonly snackBar: CatalogNote;
    readonly progressBar: CatalogNote;
    readonly progressBuffer: CatalogNote;
    readonly spinner: CatalogNote;
    readonly spinnerButton: CatalogNote;
    readonly tooltip: CatalogNote;
    readonly badge: CatalogNote;
  };
  readonly dialog: ConfirmDialogText & { readonly open: string };
  readonly bottomSheet: { readonly open: string; readonly items: readonly IconLabel[] };
  readonly snackBar: { readonly trigger: string; readonly message: string; readonly undo: string };
  readonly progress: { readonly label: string; readonly value: number; readonly buffer: number; readonly saving: string };
  readonly tooltips: readonly (IconLabel & { readonly position: TooltipPosition })[];
  /** On icons: a count (Material shows up to 3 digits; pass 99+ as text), or a dot when `count` is left out. */
  readonly badges: { readonly items: readonly (IconLabel & { readonly count?: number | string })[] };
}

/** The bottom sheet's actions, handed to it through its injector. */
const SHEET_ITEMS = new InjectionToken<readonly IconLabel[]>('SheetItems');

/** Actions from the bottom of a phone screen, one tap each. */
@Component({
  selector: 'ui-actions-sheet-example',
  imports: [MatIconModule, MatListModule],
  template: `
    <mat-action-list>
      @for (item of items; track item.label) {
        <button mat-list-item type="button" (click)="sheet.dismiss(item.label)">
          <mat-icon matListItemIcon aria-hidden="true">{{ item.icon }}</mat-icon>
          <span matListItemTitle>{{ item.label }}</span>
        </button>
      }
    </mat-action-list>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class ActionsSheetExample {
  protected readonly items = inject(SHEET_ITEMS);
  protected readonly sheet = inject<MatBottomSheetRef<ActionsSheetExample, string>>(MatBottomSheetRef);
}

/**
 * Feedback and overlays from Angular Material at the compact scale: dialog, bottom sheet, snack bar, progress,
 * tooltips and badges. A reference to pick from, not a component: screens use Material directly (a page's own
 * states are `ui-notice`, `ui-loading-state` and `ui-empty-state`).
 */
@Component({
  selector: 'ui-feedback-example',
  imports: [
    ExampleNote,
    MatBadgeModule,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
  ],
  templateUrl: './feedback.example.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FeedbackExample {
  readonly model = input.required<FeedbackExampleModel>();

  private readonly confirmDialogs = inject(ConfirmDialogs);
  private readonly bottomSheet = inject(MatBottomSheet);
  private readonly snackBar = inject(MatSnackBar);
  private readonly injector = inject(Injector);

  protected openDialog(): void {
    const { title, message, cancel, confirm } = this.model().dialog;
    this.confirmDialogs.ask({ title, message, cancel, confirm }).subscribe();
  }

  protected openBottomSheet(): void {
    this.bottomSheet.open(ActionsSheetExample, {
      injector: Injector.create({ providers: [{ provide: SHEET_ITEMS, useValue: this.model().bottomSheet.items }], parent: this.injector }),
    });
  }

  protected openSnackBar(): void {
    const { message, undo } = this.model().snackBar;
    this.snackBar.open(message, undo, { duration: 5000 });
  }
}
