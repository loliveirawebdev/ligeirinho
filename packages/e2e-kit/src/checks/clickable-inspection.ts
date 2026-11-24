import type { Page } from '@playwright/test';

/** Everything a user can click or focus, per `rules/responsive.md`. */
export const CLICKABLE_SELECTOR =
  'a[href], button, [role=button], input, select, textarea, summary, [tabindex]:not([tabindex="-1"])';

export interface InspectedClickable {
  /** e.g. `<button#save> "Save"`. */
  readonly description: string;
  readonly left: number;
  readonly right: number;
  readonly width: number;
  readonly height: number;
  readonly viewportWidth: number;
  /** Description of the nearest `overflow: hidden|clip` ancestor that cuts the element off, if any. */
  readonly clippingAncestor: string | null;
  /** Inside an `overflow-x: auto|scroll` container (a carousel, a scrollable table): it may sit off screen. */
  readonly insideHorizontalScroller: boolean;
  /** An inline `<a>` inside a sentence: exempt from the touch target rule (WCAG 2.5.5 "inline" exception). */
  readonly inlineTextLink: boolean;
  /** Size of the largest associated `<label>`, which extends the target of inputs; 0 when there is none. */
  readonly labelWidth: number;
  readonly labelHeight: number;
  /**
   * Size of the component's own hit area around a smaller native element; 0 when there is none. Angular Material
   * draws a 48 px touch target next to (checkbox, radio) or inside (buttons) the element, and a click anywhere on a
   * text field's box focuses its `<input>`.
   */
  readonly hitAreaWidth: number;
  readonly hitAreaHeight: number;
  /**
   * Marked `data-touch-target="compact"`: a dense grid's target (a calendar's event chips) held to WCAG 2.5.8's
   * 24 px instead of the 40 px rule.
   */
  readonly compactTarget: boolean;
}

/** Inspects every visible clickable in one browser round trip. */
export async function inspectClickables(page: Page): Promise<InspectedClickable[]> {
  return page.evaluate(inspectClickablesInBrowser, CLICKABLE_SELECTOR);
}

// Runs inside the page: everything it needs has to be declared inside it.
function inspectClickablesInBrowser(clickableSelector: string): InspectedClickable[] {
  const viewportWidth = document.documentElement.clientWidth;
  const pixelTolerance = 1;

  function describe(element: Element): string {
    const tag = element.tagName.toLowerCase();
    const id = element.id === '' ? '' : `#${element.id}`;
    const name = element.getAttribute('aria-label') ?? element.textContent ?? element.getAttribute('value') ?? '';
    return `<${tag}${id}> "${name.trim().replace(/\s+/g, ' ').slice(0, 60)}"`;
  }

  function isVisible(element: Element): boolean {
    const rect = element.getBoundingClientRect();
    // 1 px elements are the visually-hidden pattern (skip links, screen-reader text), not targets.
    return element.checkVisibility({ visibilityProperty: true }) && rect.width > 1 && rect.height > 1;
  }

  function ancestorsOf(element: Element): Element[] {
    const ancestors: Element[] = [];
    for (let ancestor = element.parentElement; ancestor !== null; ancestor = ancestor.parentElement) {
      ancestors.push(ancestor);
    }
    return ancestors;
  }

  function clips(ancestor: Element, rect: DOMRect): boolean {
    const style = getComputedStyle(ancestor);
    const box = ancestor.getBoundingClientRect();
    const hides = (overflow: string): boolean => overflow === 'hidden' || overflow === 'clip';
    const outsideX = rect.left < box.left - pixelTolerance || rect.right > box.right + pixelTolerance;
    const outsideY = rect.top < box.top - pixelTolerance || rect.bottom > box.bottom + pixelTolerance;
    return (hides(style.overflowX) && outsideX) || (hides(style.overflowY) && outsideY);
  }

  function isScroller(ancestor: Element): boolean {
    if (ancestor === document.documentElement || ancestor === document.body) {
      return false;
    }
    const style = getComputedStyle(ancestor);
    const scrolls = (overflow: string): boolean => overflow === 'auto' || overflow === 'scroll';
    return scrolls(style.overflowX) || scrolls(style.overflowY);
  }

  /** Only up to the nearest scroller: past its edge the element is scrolled out of sight, not cut off. */
  function clippingAncestorOf(ancestors: readonly Element[], rect: DOMRect): Element | undefined {
    const scroller = ancestors.findIndex(isScroller);
    const reachable = scroller === -1 ? ancestors : ancestors.slice(0, scroller);
    return reachable.find((ancestor) => clips(ancestor, rect));
  }

  function isHorizontalScroller(ancestor: Element): boolean {
    if (ancestor === document.documentElement || ancestor === document.body) {
      return false;
    }
    const overflowX = getComputedStyle(ancestor).overflowX;
    return overflowX === 'auto' || overflowX === 'scroll';
  }

  function nearestBlock(node: Node): Element | undefined {
    for (let ancestor = node.parentElement; ancestor !== null; ancestor = ancestor.parentElement) {
      if (!getComputedStyle(ancestor).display.startsWith('inline')) {
        return ancestor;
      }
    }
    return undefined;
  }

  // An inline link counts as "in a sentence" when its block has other visible text outside the link.
  function isInlineTextLink(element: Element): boolean {
    if (element.tagName !== 'A' || getComputedStyle(element).display !== 'inline') {
      return false;
    }
    const block = nearestBlock(element);
    if (block === undefined) {
      return false;
    }
    const walker = document.createTreeWalker(block, NodeFilter.SHOW_TEXT);
    for (let textNode = walker.nextNode(); textNode !== null; textNode = walker.nextNode()) {
      const isSentenceText = (textNode.textContent ?? '').trim() !== '' && !element.contains(textNode);
      if (isSentenceText && nearestBlock(textNode) === block) {
        return true;
      }
    }
    return false;
  }

  function largestLabel(element: Element): { readonly width: number; readonly height: number } {
    const labels = 'labels' in element && element.labels instanceof NodeList ? [...element.labels] : [];
    const rects = labels.filter((label) => label instanceof Element).map((label) => label.getBoundingClientRect());
    return {
      width: Math.max(0, ...rects.map((rect) => rect.width)),
      height: Math.max(0, ...rects.map((rect) => rect.height)),
    };
  }

  function hitArea(element: Element): { readonly width: number; readonly height: number } {
    const touchTargetSelector = ':scope > [class*="-touch-target"]';
    // A chip option keeps its touch target inside its label; one inside a nested control is that control's.
    const ownTouchTargets = [...element.querySelectorAll('[class*="-touch-target"]')].filter(
      (touchTarget) => touchTarget.parentElement?.closest(clickableSelector) === element,
    );
    const areas = [
      ...ownTouchTargets,
      element.parentElement?.querySelector(touchTargetSelector) ?? null,
      element.closest('.mat-mdc-text-field-wrapper'),
    ].filter((area) => area !== null);
    const rects = areas.map((area) => area.getBoundingClientRect());
    return {
      width: Math.max(0, ...rects.map((rect) => rect.width)),
      height: Math.max(0, ...rects.map((rect) => rect.height)),
    };
  }

  function inspect(element: Element): InspectedClickable {
    const rect = element.getBoundingClientRect();
    const ancestors = ancestorsOf(element);
    const clippingAncestor = clippingAncestorOf(ancestors, rect);
    const label = largestLabel(element);
    const area = hitArea(element);
    return {
      description: describe(element),
      left: rect.left,
      right: rect.right,
      width: rect.width,
      height: rect.height,
      viewportWidth,
      clippingAncestor: clippingAncestor === undefined ? null : describe(clippingAncestor),
      insideHorizontalScroller: ancestors.some(isHorizontalScroller),
      inlineTextLink: isInlineTextLink(element),
      labelWidth: label.width,
      labelHeight: label.height,
      hitAreaWidth: area.width,
      hitAreaHeight: area.height,
      compactTarget: element.getAttribute('data-touch-target') === 'compact',
    };
  }

  return [...document.querySelectorAll(clickableSelector)].filter(isVisible).map(inspect);
}
