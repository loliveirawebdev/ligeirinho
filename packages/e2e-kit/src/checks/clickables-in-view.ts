import { type Page, expect } from '@playwright/test';
import { type InspectedClickable, inspectClickables } from './clickable-inspection.js';

export interface ClickableOutOfView {
  readonly element: string;
  readonly reason: string;
}

const PIXEL_TOLERANCE = 1;

/**
 * Visible clickables that stick out of the viewport horizontally or are cut off by an `overflow: hidden|clip`
 * ancestor. Clickables inside a horizontal scroller (`overflow-x: auto|scroll`) may sit off screen and are only
 * checked for clipping.
 */
export async function findClickablesOutOfView(page: Page): Promise<ClickableOutOfView[]> {
  const clickables = await inspectClickables(page);
  return clickables.flatMap((clickable) => {
    const reason = outOfViewReason(clickable);
    return reason === null ? [] : [{ element: clickable.description, reason }];
  });
}

function outOfViewReason(clickable: InspectedClickable): string | null {
  if (clickable.clippingAncestor !== null) {
    return `cut off by ${clickable.clippingAncestor} (overflow hidden)`;
  }
  if (clickable.insideHorizontalScroller) {
    return null;
  }
  if (clickable.left < -PIXEL_TOLERANCE) {
    return `left edge at ${Math.round(clickable.left)}px, outside the viewport`;
  }
  if (clickable.right > clickable.viewportWidth + PIXEL_TOLERANCE) {
    return `right edge at ${Math.round(clickable.right)}px, viewport is ${clickable.viewportWidth}px`;
  }
  return null;
}

/** Soft assertion: every visible clickable is fully in view. */
export async function checkClickablesInView(page: Page, label: string = page.url()): Promise<void> {
  const problems = await findClickablesOutOfView(page);
  const details = problems.map((problem) => `\n  ${problem.element}: ${problem.reason}`).join('');
  expect.soft(problems, `[${label}] ${problems.length} clickable(s) off screen or cut off:${details}`).toEqual([]);
}
