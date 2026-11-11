import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  type ElementRef,
  afterNextRender,
  computed,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import type { SafeResourceUrl } from '@angular/platform-browser';
import type { PreviewBreakpoint } from './preview-options';
import { type WorkbenchZoom, clampSize, resolveScale, rulerTicks } from './preview-workbench.state';

export interface FrameSize {
  readonly width: number;
  readonly height: number;
}

type DragAxis = 'width' | 'height' | 'both';

interface DragStart {
  readonly axis: DragAxis;
  readonly pointerX: number;
  readonly pointerY: number;
  readonly size: FrameSize;
}

/** Space around the frame inside the canvas, and the thickness of the resize handles. */
const STAGE_PADDING = 24;
const HANDLE_SIZE = 14;
const KEYBOARD_STEP = 10;
const KEYBOARD_BIG_STEP = 50;
/** Half a breakpoint button plus a tick label, in px on screen. */
const BREAKPOINT_CLEARANCE = 40;

/**
 * The frame of the workbench, like the device mode of a browser's dev tools: rulers on top and left, the
 * scenario's iframe drawn at the chosen size and scale, and handles on its right edge, bottom edge and corner.
 */
@Component({
  selector: 'ligeirinho-preview-canvas',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './preview-canvas.html',
  styleUrl: './preview-canvas.css',
  host: { '[class.dragging]': 'dragStart() !== null' },
})
export class PreviewCanvas {
  readonly source = input.required<SafeResourceUrl>();
  readonly frameTitle = input.required<string>();
  readonly width = input.required<number>();
  readonly height = input.required<number>();
  readonly zoom = input.required<WorkbenchZoom>();
  readonly breakpoints = input.required<readonly PreviewBreakpoint[]>();

  /** The size while dragging or typing, before it is committed. */
  readonly resized = output<FrameSize>();
  /** The size the user settled on (end of a drag, a key press, a breakpoint click). */
  readonly committed = output<FrameSize>();

  private readonly viewport = viewChild.required<ElementRef<HTMLElement>>('viewport');
  private readonly available = signal<FrameSize>({ width: 0, height: 0 });
  private readonly scroll = signal({ left: 0, top: 0 });
  protected readonly dragStart = signal<DragStart | null>(null);

  protected readonly stagePadding = STAGE_PADDING;
  protected readonly handleSize = HANDLE_SIZE;
  protected readonly scale = computed(() =>
    resolveScale(this.zoom(), { width: this.width(), height: this.height() }, this.available()),
  );
  protected readonly scaledWidth = computed(() => Math.round(this.width() * this.scale()));
  protected readonly scaledHeight = computed(() => Math.round(this.height() * this.scale()));
  protected readonly zoomLabel = computed(() => `${Math.round(this.scale() * 100)}%`);
  /** Labels that would sit under a breakpoint button are left out. */
  protected readonly topTicks = computed(() => {
    const marks = this.breakpointMarks().map((breakpoint) => breakpoint.offset);
    return rulerTicks(this.rulerLength('width'), this.scale()).map((tick) => ({
      ...tick,
      labeled: tick.labeled && marks.every((offset) => Math.abs(offset - tick.offset) > BREAKPOINT_CLEARANCE),
    }));
  });
  protected readonly leftTicks = computed(() => rulerTicks(this.rulerLength('height'), this.scale()));
  protected readonly breakpointMarks = computed(() =>
    this.breakpoints().map((breakpoint) => ({
      ...breakpoint,
      offset: breakpoint.width * this.scale(),
      reached: this.width() >= breakpoint.width,
    })),
  );
  protected readonly rulerShiftX = computed(() => STAGE_PADDING - this.scroll().left);
  protected readonly rulerShiftY = computed(() => STAGE_PADDING - this.scroll().top);

  constructor() {
    const destroyRef = inject(DestroyRef);
    afterNextRender(() => {
      const element = this.viewport().nativeElement;
      const observer = new ResizeObserver(() => {
        this.measure(element);
      });
      observer.observe(element);
      this.measure(element);
      destroyRef.onDestroy(() => observer.disconnect());
    });
  }

  protected onScroll(event: Event): void {
    if (event.target instanceof HTMLElement) {
      this.scroll.set({ left: event.target.scrollLeft, top: event.target.scrollTop });
    }
  }

  protected startDrag(event: PointerEvent, axis: DragAxis): void {
    if (!(event.currentTarget instanceof HTMLElement)) {
      return;
    }
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    this.dragStart.set({
      axis,
      pointerX: event.clientX,
      pointerY: event.clientY,
      size: { width: this.width(), height: this.height() },
    });
  }

  protected drag(event: PointerEvent): void {
    const start = this.dragStart();
    if (start === null) {
      return;
    }
    const scale = this.scale();
    const changesWidth = start.axis !== 'height';
    const changesHeight = start.axis !== 'width';
    this.resized.emit({
      width: changesWidth ? clampSize(start.size.width + (event.clientX - start.pointerX) / scale) : start.size.width,
      height: changesHeight
        ? clampSize(start.size.height + (event.clientY - start.pointerY) / scale)
        : start.size.height,
    });
  }

  protected stopDrag(): void {
    if (this.dragStart() === null) {
      return;
    }
    this.dragStart.set(null);
    this.committed.emit({ width: this.width(), height: this.height() });
  }

  protected resizeWithKeyboard(event: KeyboardEvent, axis: DragAxis): void {
    const step = event.shiftKey ? KEYBOARD_BIG_STEP : KEYBOARD_STEP;
    const delta = keyDelta(event.key, step);
    if (delta === null) {
      return;
    }
    event.preventDefault();
    const size = {
      width: axis === 'height' ? this.width() : clampSize(this.width() + delta.x),
      height: axis === 'width' ? this.height() : clampSize(this.height() + delta.y),
    };
    this.resized.emit(size);
    this.committed.emit(size);
  }

  protected useBreakpoint(breakpoint: PreviewBreakpoint): void {
    const size = { width: breakpoint.width, height: this.height() };
    this.resized.emit(size);
    this.committed.emit(size);
  }

  private measure(element: HTMLElement): void {
    const reserved = STAGE_PADDING * 2 + HANDLE_SIZE;
    this.available.set({
      width: Math.max(0, element.clientWidth - reserved),
      height: Math.max(0, element.clientHeight - reserved),
    });
  }

  /** How far the ruler reaches, in CSS px: the visible canvas, and at least past the frame. */
  private rulerLength(axis: 'width' | 'height'): number {
    const visible = (axis === 'width' ? this.available().width : this.available().height) + STAGE_PADDING * 2;
    const frameSize = axis === 'width' ? this.width() : this.height();
    const scroll = axis === 'width' ? this.scroll().left : this.scroll().top;
    return Math.max(frameSize, (visible + scroll) / this.scale());
  }
}

function keyDelta(key: string, step: number): { readonly x: number; readonly y: number } | null {
  switch (key) {
    case 'ArrowRight':
      return { x: step, y: 0 };
    case 'ArrowLeft':
      return { x: -step, y: 0 };
    case 'ArrowDown':
      return { x: 0, y: step };
    case 'ArrowUp':
      return { x: 0, y: -step };
    default:
      return null;
  }
}
