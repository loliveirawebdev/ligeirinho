import { type Page, expect } from '@playwright/test';
import { type InspectedClickable, inspectClickables } from './clickable-inspection.js';

export const MINIMUM_TARGET_SIZE = 44;

export interface SmallTouchTarget {
  readonly element: string;
  readonly width: number;
  readonly height: number;
}

const SUBPIXEL_TOLERANCE = 0.5;

/**
 * Visible clickables smaller than 44 × 44 CSS px.
 *
 * Exemptions (heuristics for the WCAG 2.5.5 exceptions):
 * - inline text links: an `<a>` with `display: inline` whose nearest block ancestor has other text of its own
 *   outside the link (the link is part of a sentence, e.g. inside a paragraph);
 * - inputs whose associated `<label>` is at least 44 × 44 (the label is part of the target).
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
  if (clickable.inlineTextLink || isAtLeastMinimum(clickable.labelWidth, clickable.labelHeight)) {
    return false;
  }
  return !isAtLeastMinimum(clickable.width, clickable.height);
}

function isAtLeastMinimum(width: number, height: number): boolean {
  return width + SUBPIXEL_TOLERANCE >= MINIMUM_TARGET_SIZE && height + SUBPIXEL_TOLERANCE >= MINIMUM_TARGET_SIZE;
}

/** Soft assertion: every visible clickable is at least 44 × 44 CSS px. */
export async function checkTouchTargetSize(page: Page, label: string = page.url()): Promise<void> {
  const smallTargets = await findSmallTouchTargets(page);
  const details = smallTargets.map((target) => `\n  ${target.element}: ${target.width}×${target.height}px`).join('');
  expect
    .soft(smallTargets, `[${label}] ${smallTargets.length} touch target(s) under 44×44px:${details}`)
    .toEqual([]);
}
