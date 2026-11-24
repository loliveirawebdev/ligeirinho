import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  ElementRef,
  inject,
  input,
  signal,
} from '@angular/core';

/** A series' color, by meaning: success, warning and error only for what is good, needs attention or failed. */
export type ChartTone = 'primary' | 'secondary' | 'tertiary' | 'success' | 'warning' | 'error';

/** One line, area or set of bars: its name (in the legend, the tooltip and the table) and a value per label. */
export interface ChartSeries {
  readonly name: string;
  readonly values: readonly number[];
  /** By default the series take primary, secondary, tertiary in turn. */
  readonly tone?: ChartTone;
}

export type ChartType = 'line' | 'area' | 'bar' | 'donut' | 'sparkline';

interface ChartPoint {
  readonly left: number;
  readonly top: number;
}

interface SeriesView {
  readonly name: string;
  readonly color: string;
  readonly line: string;
  readonly area: string;
  readonly points: readonly ChartPoint[];
}

interface BarView {
  readonly key: string;
  readonly index: number;
  readonly left: number;
  readonly top: number;
  readonly width: number;
  readonly height: number;
  readonly color: string;
}

interface SliceView {
  readonly label: string;
  readonly path: string;
  readonly color: string;
  readonly index: number;
  readonly share: string;
}

interface TipRow {
  readonly name: string;
  readonly color: string;
  readonly value: string;
}

interface AxisTick {
  readonly position: number;
  readonly text: string;
}

const TONE_COLORS: Readonly<Record<ChartTone, string>> = {
  primary: 'var(--mat-sys-primary)',
  secondary: 'var(--mat-sys-secondary)',
  tertiary: 'var(--mat-sys-tertiary)',
  success: 'var(--app-success)',
  warning: 'var(--app-warning)',
  error: 'var(--mat-sys-error)',
};

/**
 * Series without a tone, and a donut's slices, take these in turn. Secondary before tertiary: a palette may make
 * tertiary the primary's hue, so neighbors differ in lightness and chroma instead.
 */
const DEFAULT_TONES: readonly ChartTone[] = ['primary', 'secondary', 'tertiary'];
const SLICE_COLORS: readonly string[] = [
  'var(--mat-sys-primary)',
  'var(--mat-sys-primary-fixed-dim)',
  'var(--mat-sys-secondary)',
  'var(--mat-sys-secondary-fixed-dim)',
  'var(--mat-sys-outline)',
  'var(--mat-sys-tertiary)',
];

/** Room for the axes' words around the plot. */
const PLOT_PADDING = { top: 8, right: 8, bottom: 28, left: 56 };
/** About how wide an x label is, to skip some when they would overlap. */
const X_LABEL_WIDTH = 56;
const Y_TICKS = 4;
const DEFAULT_WIDTH = 600;

/** A round step (1, 2 or 5 times a power of ten) that splits the range in about `count` parts. */
function niceStep(range: number, count: number): number {
  if (range <= 0) {
    return 1;
  }
  const raw = range / count;
  const power = 10 ** Math.floor(Math.log10(raw));
  const unit = raw / power;
  const nice = unit <= 1 ? 1 : unit <= 2 ? 2 : unit <= 5 ? 5 : 10;
  return nice * power;
}

function polar(center: ChartPoint, radius: number, angle: number): ChartPoint {
  return { left: center.left + radius * Math.sin(angle), top: center.top - radius * Math.cos(angle) };
}

interface Ring {
  readonly center: ChartPoint;
  readonly outer: number;
  readonly inner: number;
}

function coords(point: ChartPoint): string {
  return `${point.left.toFixed(2)} ${point.top.toFixed(2)}`;
}

/** A ring segment from one angle to another (radians, clockwise from the top). */
function ringPath(ring: Ring, start: number, end: number): string {
  const { center, outer, inner } = ring;
  // A full circle can't be one arc: stop a hair short.
  const stop = end - start >= Math.PI * 2 ? start + Math.PI * 2 - 0.0001 : end;
  const large = stop - start > Math.PI ? 1 : 0;
  return [
    `M ${coords(polar(center, outer, start))}`,
    `A ${String(outer)} ${String(outer)} 0 ${String(large)} 1 ${coords(polar(center, outer, stop))}`,
    `L ${coords(polar(center, inner, stop))}`,
    `A ${String(inner)} ${String(inner)} 0 ${String(large)} 0 ${coords(polar(center, inner, start))}`,
    'Z',
  ].join(' ');
}

/**
 * A chart for a dashboard, drawn in SVG with the theme's colors: `line`, `area` and `bar` over labels (light
 * gridlines, the values' axis formatted by `valueFormat`, a legend when there are several series), `donut` for the
 * shares of one series, `sparkline` for a tiny trend beside a number. It takes the width it is given. Hover a point
 * or bar, or focus the chart and use the arrow keys, for a tooltip with the values; screen readers get the numbers
 * as a table.
 */
@Component({
  selector: 'ui-chart',
  templateUrl: './chart.html',
  styleUrl: './chart.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block min-w-0', '[attr.data-type]': 'type()' },
})
export class Chart {
  readonly type = input<ChartType>('line');
  readonly series = input.required<readonly ChartSeries[]>();
  /** The x axis: one per value (months, days); a donut's slice names. */
  readonly labels = input.required<readonly string[]>();
  /** What the chart shows (*Revenue by month*), read by screen readers and the table's caption. */
  readonly label = input.required<string>();
  /** Turns a value into words for the axis, the tooltip and the table (*R$ 48k*, *12%*). */
  readonly valueFormat = input<(value: number) => string>((value) => value.toLocaleString());
  /** The plot's height in px; 240 by default, 40 for a sparkline. */
  readonly height = input<number>();

  protected readonly width = signal(DEFAULT_WIDTH);
  /** The label index under the pointer or the keyboard, or null. */
  protected readonly active = signal<number | null>(null);

  protected readonly plotHeight = computed(() => this.height() ?? (this.type() === 'sparkline' ? 40 : 240));
  protected readonly isSparkline = computed(() => this.type() === 'sparkline');
  protected readonly isDonut = computed(() => this.type() === 'donut');
  protected readonly viewBox = computed(() => `0 0 ${String(this.width())} ${String(this.plotHeight())}`);
  protected readonly count = computed(() => this.labels().length);

  private readonly colors = computed(() =>
    this.series().map((series, index) => TONE_COLORS[series.tone ?? DEFAULT_TONES[index % DEFAULT_TONES.length] ?? 'primary']),
  );

  /** The plot's box inside the SVG: all of it for a sparkline, inside the axes otherwise. */
  private readonly box = computed(() => {
    const padding = this.isSparkline() ? { top: 2, right: 2, bottom: 2, left: 2 } : PLOT_PADDING;
    return {
      left: padding.left,
      top: padding.top,
      width: Math.max(this.width() - padding.left - padding.right, 1),
      height: Math.max(this.plotHeight() - padding.top - padding.bottom, 1),
    };
  });

  /** The values' range, widened to round steps that include zero. */
  private readonly scale = computed(() => {
    const values = this.series().flatMap((series) => series.values);
    const highest = Math.max(0, ...values);
    const lowest = Math.min(0, ...values);
    if (this.isSparkline()) {
      return { min: Math.min(...values, 0), max: highest === lowest ? lowest + 1 : highest, step: 0 };
    }
    const step = niceStep(highest - lowest, Y_TICKS);
    return { min: Math.floor(lowest / step) * step, max: Math.max(Math.ceil(highest / step) * step, step), step };
  });

  private yAt(value: number): number {
    const { min, max } = this.scale();
    const { top, height } = this.box();
    return top + height - ((value - min) / (max - min)) * height;
  }

  /** The center of the label's place on the x axis. */
  private xAt(index: number): number {
    const { left, width } = this.box();
    const count = this.count();
    if (this.type() === 'bar') {
      return left + (index + 0.5) * (width / Math.max(count, 1));
    }
    return count <= 1 ? left + width / 2 : left + (index * width) / (count - 1);
  }

  protected readonly yTicks = computed<readonly AxisTick[]>(() => {
    const { min, max, step } = this.scale();
    if (step === 0) {
      return [];
    }
    const ticks: AxisTick[] = [];
    for (let value = min; value <= max + step / 2; value += step) {
      ticks.push({ position: this.yAt(value), text: this.valueFormat()(value) });
    }
    return ticks;
  });

  protected readonly xTicks = computed<readonly AxisTick[]>(() => {
    const labels = this.labels();
    const every = Math.max(1, Math.ceil((labels.length * X_LABEL_WIDTH) / this.box().width));
    return labels
      .map((text, index) => ({ position: this.xAt(index), text, index }))
      .filter((tick) => tick.index % every === 0);
  });

  protected readonly gridLeft = computed(() => this.box().left);
  protected readonly gridRight = computed(() => this.box().left + this.box().width);
  protected readonly baseline = computed(() => this.yAt(Math.max(this.scale().min, 0)));

  protected readonly lines = computed<readonly SeriesView[]>(() => {
    if (this.type() === 'bar' || this.isDonut()) {
      return [];
    }
    const baseline = this.baseline();
    return this.series().map((series, index) => {
      const points = series.values.slice(0, this.count()).map((value, at) => ({ left: this.xAt(at), top: this.yAt(value) }));
      const line = points.map((point, at) => `${at === 0 ? 'M' : 'L'} ${coords(point)}`).join(' ');
      const first = points[0];
      const last = points[points.length - 1];
      const area =
        first && last ? `${line} L ${coords({ left: last.left, top: baseline })} L ${coords({ left: first.left, top: baseline })} Z` : '';
      return { name: series.name, color: this.colors()[index] ?? TONE_COLORS.primary, line, area, points };
    });
  });

  /** Each label's place across the plot, where the pointer finds it. */
  protected readonly bands = computed(() => {
    const { left, top, width, height } = this.box();
    const count = this.count();
    const band = this.type() === 'bar' ? width / Math.max(count, 1) : width / Math.max(count - 1, 1);
    return this.labels().map((_, index) => {
      const start = this.type() === 'bar' ? left + index * band : Math.max(left, this.xAt(index) - band / 2);
      const end = this.type() === 'bar' ? start + band : Math.min(left + width, this.xAt(index) + band / 2);
      return { index, left: start, top, width: Math.max(end - start, 0), height };
    });
  });

  protected readonly bars = computed<readonly BarView[]>(() => {
    if (this.type() !== 'bar') {
      return [];
    }
    const seriesList = this.series();
    const band = this.box().width / Math.max(this.count(), 1);
    const group = band * 0.7;
    const barWidth = group / Math.max(seriesList.length, 1);
    const zero = this.yAt(0);
    return seriesList.flatMap((series, at) =>
      series.values.slice(0, this.count()).map((value, index) => {
        const top = this.yAt(Math.max(value, 0));
        return {
          key: `${String(at)}-${String(index)}`,
          index,
          left: this.xAt(index) - group / 2 + at * barWidth,
          top,
          width: Math.max(barWidth - 2, 1),
          height: Math.max(Math.abs(this.yAt(value) - zero), 1),
          color: this.colors()[at] ?? TONE_COLORS.primary,
        };
      }),
    );
  });

  private readonly donutValues = computed(() => (this.series()[0]?.values ?? []).slice(0, this.count()).map((value) => Math.max(value, 0)));
  protected readonly donutTotal = computed(() => this.donutValues().reduce((sum, value) => sum + value, 0));
  protected readonly donutCenter = computed<ChartPoint>(() => ({ left: this.width() / 2, top: this.plotHeight() / 2 }));

  protected readonly slices = computed<readonly SliceView[]>(() => {
    if (!this.isDonut()) {
      return [];
    }
    const total = this.donutTotal();
    const outer = Math.min(this.width(), this.plotHeight()) / 2 - 4;
    const ring: Ring = { center: this.donutCenter(), outer, inner: outer * 0.64 };
    let angle = 0;
    return this.donutValues().map((value, index) => {
      const sweep = total > 0 ? (value / total) * Math.PI * 2 : 0;
      const start = angle;
      angle += sweep;
      return {
        label: this.labels()[index] ?? '',
        path: sweep > 0 ? ringPath(ring, start, angle) : '',
        color: SLICE_COLORS[index % SLICE_COLORS.length] ?? TONE_COLORS.primary,
        index,
        share: total > 0 ? `${String(Math.round((value / total) * 100))}%` : '',
      };
    });
  });

  /** The legend: the series, or a donut's slices with their values. */
  protected readonly legend = computed(() => {
    if (this.isDonut()) {
      return this.slices().map((slice) => ({
        name: slice.label,
        color: slice.color,
        detail: `${this.valueFormat()(this.donutValues()[slice.index] ?? 0)} · ${slice.share}`,
      }));
    }
    if (this.isSparkline() || this.series().length < 2) {
      return [];
    }
    return this.series().map((series, index) => ({ name: series.name, color: this.colors()[index] ?? TONE_COLORS.primary, detail: '' }));
  });

  /** The table screen readers get: a row per label, a column per series. */
  protected readonly table = computed(() => {
    const seriesList = this.isDonut() ? this.series().slice(0, 1) : this.series();
    const format = this.valueFormat();
    return {
      headers: seriesList.map((series) => series.name),
      rows: this.labels().map((label, index) => ({
        label,
        values: seriesList.map((series) => {
          const value = series.values[index];
          return value === undefined ? '' : format(value);
        }),
      })),
    };
  });

  protected readonly tooltip = computed(() => {
    const index = this.active();
    if (index === null || this.isSparkline()) {
      return null;
    }
    return { title: this.labels()[index] ?? '', ...(this.isDonut() ? this.sliceTip(index) : this.columnTip(index)) };
  });

  private sliceTip(index: number): { readonly left: number; readonly rows: readonly TipRow[] } {
    const slice = this.slices()[index];
    const value = this.valueFormat()(this.donutValues()[index] ?? 0);
    return {
      left: this.donutCenter().left,
      rows: [{ name: this.series()[0]?.name ?? '', color: slice?.color ?? TONE_COLORS.primary, value: `${value} · ${slice?.share ?? ''}` }],
    };
  }

  private columnTip(index: number): { readonly left: number; readonly rows: readonly TipRow[] } {
    const format = this.valueFormat();
    return {
      left: Math.min(Math.max(this.xAt(index), 80), this.width() - 80),
      rows: this.series().map((series, at) => {
        const value = series.values[index];
        return { name: series.name, color: this.colors()[at] ?? TONE_COLORS.primary, value: value === undefined ? '' : format(value) };
      }),
    };
  }

  protected readonly activeX = computed(() => {
    const index = this.active();
    return index === null ? null : this.xAt(index);
  });

  constructor() {
    const host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
    const destroyRef = inject(DestroyRef);
    afterNextRender(() => {
      if (host.clientWidth > 0) {
        this.width.set(host.clientWidth);
      }
      if (typeof ResizeObserver === 'undefined') {
        return;
      }
      const observer = new ResizeObserver((entries) => {
        const width = entries[0]?.contentRect.width ?? 0;
        if (width > 0) {
          this.width.set(Math.round(width));
        }
      });
      observer.observe(host);
      destroyRef.onDestroy(() => {
        observer.disconnect();
      });
    });
  }

  protected point(index: number | null): void {
    this.active.set(index);
  }

  protected focusPlot(): void {
    if (this.active() === null && this.count() > 0) {
      this.active.set(0);
    }
  }

  /** Arrows move between labels (slices), Home and End jump to the ends, Escape hides the tooltip. */
  protected moveByKey(event: KeyboardEvent): void {
    const count = this.count();
    const current = this.active() ?? -1;
    const next: Readonly<Record<string, number | null>> = {
      ArrowRight: Math.min(current + 1, count - 1),
      ArrowDown: Math.min(current + 1, count - 1),
      ArrowLeft: Math.max(current - 1, 0),
      ArrowUp: Math.max(current - 1, 0),
      Home: 0,
      End: count - 1,
      Escape: null,
    };
    if (!(event.key in next) || count === 0) {
      return;
    }
    event.preventDefault();
    this.active.set(next[event.key] ?? null);
  }
}
