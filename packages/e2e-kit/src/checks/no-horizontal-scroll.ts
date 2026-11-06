import { type Page, expect } from '@playwright/test';

export interface HorizontalOverflow {
  readonly scrollWidth: number;
  readonly clientWidth: number;
}

/** The document is wider than the viewport (`scrollWidth > clientWidth`), or null when it fits. */
export async function findHorizontalOverflow(page: Page): Promise<HorizontalOverflow | null> {
  const size = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));
  return size.scrollWidth > size.clientWidth ? size : null;
}

/** Soft assertion: no horizontal scrolling. */
export async function checkNoHorizontalScroll(page: Page, label: string = page.url()): Promise<void> {
  const overflow = await findHorizontalOverflow(page);
  const message =
    overflow === null
      ? `[${label}] no horizontal scroll`
      : `[${label}] horizontal scroll: the document is ${overflow.scrollWidth}px wide in a ${overflow.clientWidth}px viewport`;
  expect.soft(overflow, message).toBeNull();
}
