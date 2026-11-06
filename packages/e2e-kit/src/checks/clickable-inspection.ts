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
  /** An inline `<a>` inside a sentence: exempt from the 44 px rule (WCAG 2.5.5 "inline" exception). */
  readonly inlineTextLink: boolean;
  /** Size of the largest associated `<label>`, which extends the target of inputs; 0 when there is none. */
  readonly labelWidth: number;
  readonly labelHeight: number;
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

  function inspect(element: Element): InspectedClickable {
    const rect = element.getBoundingClientRect();
    const ancestors = ancestorsOf(element);
    const clippingAncestor = ancestors.find((ancestor) => clips(ancestor, rect));
    const label = largestLabel(element);
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
    };
  }

  return [...document.querySelectorAll(clickableSelector)].filter(isVisible).map(inspect);
}
