import { MediaMatcher } from '@angular/cdk/layout';
import { DOCUMENT } from '@angular/common';
import { afterNextRender, ChangeDetectionStrategy, Component, computed, effect, inject, Injector, input, signal } from '@angular/core';

/** A section of the page: the `id` of its element, and its name in the table of contents. */
export interface AnchorItem {
  readonly id: string;
  readonly label: string;
  /** Subsections, indented under it. */
  readonly children?: readonly AnchorItem[];
}

interface AnchorRow {
  readonly id: string;
  readonly label: string;
  readonly depth: number;
}

/** The band near the top of the viewport where a section counts as the one being read. */
const READING_BAND = '0px 0px -65% 0px';

function flatten(items: readonly AnchorItem[], depth: number): AnchorRow[] {
  return items.flatMap((item) => [{ id: item.id, label: item.label, depth }, ...flatten(item.children ?? [], depth + 1)]);
}

/**
 * The table of contents of a long page (settings, a contract, documentation), like Ant Design's Anchor: a link per
 * section (subsections indented), the section being read marked while the page scrolls, a smooth scroll to the
 * section on click. It stays in view by itself (`position: sticky`, `offset` from the top of the scrolling area), so
 * there is no separate Affix: put it in a column beside the content.
 */
@Component({
  selector: 'ui-anchor',
  templateUrl: './anchor.html',
  styleUrl: './anchor.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'block self-start',
    '[class.sticky]': 'sticky()',
    '[style.top]': 'sticky() ? offset() : null',
  },
})
export class Anchor {
  readonly items = input.required<readonly AnchorItem[]>();
  /** The navigation's name (*On this page*), read by screen readers. */
  readonly label = input.required<string>();
  /** Stays in view while the page scrolls. */
  readonly sticky = input(true);
  /** How far from the top it sticks. */
  readonly offset = input('24px');

  protected readonly rows = computed(() => flatten(this.items(), 0));
  /** The id of the section being read; the first one until the page scrolls. */
  protected readonly current = signal<string | null>(null);
  protected readonly currentId = computed(() => this.current() ?? this.rows()[0]?.id ?? null);

  private readonly document = inject(DOCUMENT);
  private readonly injector = inject(Injector);
  private readonly media = inject(MediaMatcher);

  constructor() {
    afterNextRender(() => {
      effect(
        (onCleanup) => {
          const observer = this.watch(this.rows());
          onCleanup(() => {
            observer?.disconnect();
          });
        },
        { injector: this.injector },
      );
    });
  }

  /** Scrolls to the section (smoothly, unless the user asked for less motion) and marks it right away. */
  protected go(event: MouseEvent, id: string): void {
    const target = this.document.getElementById(id);
    if (!target) {
      return;
    }
    event.preventDefault();
    this.current.set(id);
    const reduceMotion = this.media.matchMedia('(prefers-reduced-motion: reduce)').matches;
    target.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
    // Keyboard and screen reader users go on reading from the section.
    if (!target.hasAttribute('tabindex')) {
      target.setAttribute('tabindex', '-1');
    }
    target.focus({ preventScroll: true });
    this.document.defaultView?.history.replaceState(null, '', `#${id}`);
  }

  /** Marks the first section, in the page's order, inside the reading band; keeps the last one when none is. */
  private watch(rows: readonly AnchorRow[]): IntersectionObserver | null {
    if (typeof IntersectionObserver === 'undefined') {
      return null;
    }
    const inBand = new Set<string>();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            inBand.add(entry.target.id);
          } else {
            inBand.delete(entry.target.id);
          }
        }
        const first = rows.find((row) => inBand.has(row.id));
        if (first) {
          this.current.set(first.id);
        }
      },
      { rootMargin: READING_BAND },
    );
    for (const row of rows) {
      const section = this.document.getElementById(row.id);
      if (section) {
        observer.observe(section);
      }
    }
    return observer;
  }
}
