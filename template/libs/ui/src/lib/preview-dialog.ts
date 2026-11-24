import type { ComponentType } from '@angular/cdk/portal';
import { DestroyRef, effect, inject, Injector, type InjectionToken, untracked } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';

/**
 * For a scenario that shows a dialog: opens it again each time the previewer switches scenario, and closes it with
 * the preview. Call it in the preview component's constructor.
 */
export function reopenOnEveryScenario(model: () => unknown, open: () => void): void {
  const dialog = inject(MatDialog);
  effect(() => {
    model();
    untracked(() => {
      dialog.closeAll();
      open();
    });
  });
  inject(DestroyRef).onDestroy(() => {
    dialog.closeAll();
  });
}

/**
 * For a scenario that is a dialog: returns what opens it with the scenario's model under `token`, and opens it on
 * every scenario (`reopenOnEveryScenario`). Assign it to a field of the preview component.
 */
export function previewDialog<TModel>(
  model: () => TModel,
  content: ComponentType<unknown>,
  token: InjectionToken<TModel>,
): () => void {
  const dialog = inject(MatDialog);
  const injector = inject(Injector);
  const open = (): void => {
    dialog.open(content, {
      injector: Injector.create({ providers: [{ provide: token, useValue: model() }], parent: injector }),
      width: '480px',
    });
  };
  reopenOnEveryScenario(model, open);
  return open;
}
