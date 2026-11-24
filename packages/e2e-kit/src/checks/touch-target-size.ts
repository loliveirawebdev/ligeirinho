import { type Page, expect } from '@playwright/test';
import { type InspectedClickable, inspectClickables } from './clickable-inspection.js';

export const MINIMUM_TARGET_SIZE = 40;

/** WCAG 2.5.8 (AA): the floor for targets marked `data-touch-target="compact"`. */
export const COMPACT_TARGET_SIZE = 24;

export interface SmallTouchTarget {
  readonly element: string;
  readonly width: number;
  readonly height: number;
}

const SUBPIXEL_TOLERANCE = 0.5;

/**
 * Visible clickables smaller than 40 × 40 CSS px.
 *
 * Exemptions (heuristics for the WCAG 2.5.5 exceptions):
 * - inline text links: an `<a>` with `display: inline` whose nearest block ancestor has other text of its own
 *   outside the link (the link is part of a sentence, e.g. inside a paragraph);
 * - inputs whose associated `<label>` is at least 40 × 40 (the label is part of the target);
 * - elements whose component hit area is at least 40 × 40 (Angular Material's 48 px touch targets and text field
 *   boxes, see `InspectedClickable.hitAreaWidth`).
 *
 * Targets marked `data-touch-target="compact"` (a dense grid, like a calendar's event chips) only need 24 × 24.
 */
export async function findSmallTouchTargets(page: Page): Promise<SmallTouchTarget[]> {
  const clickables = await inspectClickables(page);
  return clickables.filter(isSmallTarget).map((clickable) => ({
    element: clickable.description,
    width: Math.round(clickable.width),
    height: Math.round(clickable.height),
  }));
}

function isSmallTarget(clickable: InspectedClickable): boolean {
  const minimum = clickable.compactTarget ? COMPACT_TARGET_SIZE : MINIMUM_TARGET_SIZE;
  const hasLargeEnoughArea =
    isAtLeast(minimum, clickable.labelWidth, clickable.labelHeight) ||
    isAtLeast(minimum, clickable.hitAreaWidth, clickable.hitAreaHeight);
  if (clickable.inlineTextLink || hasLargeEnoughArea) {
    return false;
  }
  return !isAtLeast(minimum, clickable.width, clickable.height);
}

function isAtLeast(minimum: number, width: number, height: number): boolean {
  return width + SUBPIXEL_TOLERANCE >= minimum && height + SUBPIXEL_TOLERANCE >= minimum;
}

/** Soft assertion: every visible clickable is at least 40 × 40 CSS px. */
export async function checkTouchTargetSize(page: Page, label: string = page.url()): Promise<void> {
  const smallTargets = await findSmallTouchTargets(page);
  const details = smallTargets.map((target) => `\n  ${target.element}: ${target.width}×${target.height}px`).join('');
  expect
    .soft(smallTargets, `[${label}] ${smallTargets.length} touch target(s) under ${MINIMUM_TARGET_SIZE}×${MINIMUM_TARGET_SIZE}px:${details}`)
    .toEqual([]);
}
