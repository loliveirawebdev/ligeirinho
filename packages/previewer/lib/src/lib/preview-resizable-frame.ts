import { ChangeDetectionStrategy, Component, input, linkedSignal, signal } from '@angular/core';
import type { SafeResourceUrl } from '@angular/platform-browser';

const MINIMUM_WIDTH = 280;
const KEYBOARD_STEP = 10;

/** One iframe with a drag handle on its right edge; shows the current width. */
@Component({
  selector: 'ligeirinho-preview-resizable-frame',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <p class="width-label">{{ width() }} px</p>
    <div class="frame-and-handle">
      <iframe
        [src]="source()"
        [title]="frameTitle()"
        [style.width.px]="width()"
        [style.height.px]="height()"
        [style.pointer-events]="dragging() ? 'none' : 'auto'"
      ></iframe>
      <div
        class="handle"
        role="separator"
        tabindex="0"
        aria-orientation="vertical"
        aria-label="Frame width"
        [attr.aria-valuenow]="width()"
        [attr.aria-valuemin]="minimumWidth"
        (pointerdown)="startDrag($event)"
        (pointermove)="drag($event)"
        (pointerup)="stopDrag()"
        (pointercancel)="stopDrag()"
        (keydown.arrowleft)="changeWidthBy(-keyboardStep)"
        (keydown.arrowright)="changeWidthBy(keyboardStep)"
      ></div>
    </div>
  `,
  styles: `
    :host { display: block; }
    .width-label { margin: 0 0 0.25rem; font-variant-numeric: tabular-nums; }
    .frame-and-handle { display: flex; align-items: stretch; max-width: 100%; overflow-x: auto; }
    iframe { border: 1px solid #c4c4c4; background: #fff; flex: none; }
    .handle {
      flex: none; width: 16px; cursor: ew-resize; touch-action: none;
      background: repeating-linear-gradient(90deg, #d0d0d0 0 2px, transparent 2px 5px);
    }
    .handle:focus-visible { outline: 2px solid #1a56db; outline-offset: 2px; }
  `,
})
export class PreviewResizableFrame {
  readonly source = input.required<SafeResourceUrl>();
  readonly frameTitle = input.required<string>();
  readonly height = input.required<number>();
  readonly initialWidth = input(768);

  protected readonly minimumWidth = MINIMUM_WIDTH;
  protected readonly keyboardStep = KEYBOARD_STEP;
  protected readonly width = linkedSignal(() => this.initialWidth());
  protected readonly dragging = signal(false);
  private dragStartX = 0;
  private dragStartWidth = 0;

  protected startDrag(event: PointerEvent): void {
    if (!(event.currentTarget instanceof HTMLElement)) {
      return;
    }
    event.currentTarget.setPointerCapture(event.pointerId);
    this.dragStartX = event.clientX;
    this.dragStartWidth = this.width();
    this.dragging.set(true);
  }

  protected drag(event: PointerEvent): void {
    if (!this.dragging()) {
      return;
    }
    this.setWidth(this.dragStartWidth + event.clientX - this.dragStartX);
  }

  protected stopDrag(): void {
    this.dragging.set(false);
  }

  protected changeWidthBy(delta: number): void {
    this.setWidth(this.width() + delta);
  }

  private setWidth(requestedWidth: number): void {
    this.width.set(Math.max(MINIMUM_WIDTH, Math.round(requestedWidth)));
  }
}
