import { type Page, expect } from '@playwright/test';

export interface IconShownAsText {
  /** The icon's name, as the font would have drawn it (`arrow_back`). */
  readonly name: string;
  readonly width: number;
}

/** Icon font elements: Angular Material's `<mat-icon>` and the Material Symbols / Icons classes. */
export const ICON_SELECTOR = 'mat-icon, .material-symbols-outlined, .material-symbols-rounded, .material-icons';

/** A ligature draws a square glyph; text much wider than tall is the icon's name, spelled out. */
const MAXIMUM_ASPECT_RATIO = 1.5;

/**
 * Icons the browser drew as their name instead of the glyph: the icon font didn't load, or the name isn't in it
 * (a renamed or invented icon). Measures the text itself against the font size, so neither the icon's padding (a
 * text field's prefix icon is 48 px wide around a 24 px glyph), nor a badge, nor a box that clips the overflow
 * misleads it.
 */
export async function findIconsShownAsText(page: Page): Promise<IconShownAsText[]> {
  return page.locator(ICON_SELECTOR).evaluateAll(
    (icons, maximumAspectRatio) =>
      icons.flatMap((icon) => {
        // Only the icon's own text: a badge (`matBadge`) is a child element with text of its own.
        const ownText = [...icon.childNodes].filter((node) => node.nodeType === Node.TEXT_NODE);
        const name = ownText.map((node) => node.textContent ?? '').join('').trim();
        const box = icon.getBoundingClientRect();
        if (name === '' || box.width === 0 || box.height === 0 || icon.querySelector('svg') !== null) {
          return [];
        }
        const textWidth = ownText.reduce((width, node) => {
          const text = document.createRange();
          text.selectNodeContents(node);
          return width + text.getBoundingClientRect().width;
        }, 0);
        const fontSize = Number.parseFloat(getComputedStyle(icon).fontSize);
        return textWidth > fontSize * maximumAspectRatio ? [{ name, width: Math.round(textWidth) }] : [];
      }),
    MAXIMUM_ASPECT_RATIO,
  );
}

/** Soft assertion: every icon is drawn as an icon. */
export async function checkIconsRendered(page: Page, label: string = page.url()): Promise<void> {
  const icons = await findIconsShownAsText(page);
  const details = icons.map((icon) => `\n  "${icon.name}" drawn as ${icon.width}px of text`).join('');
  expect
    .soft(icons, `[${label}] ${icons.length} icon(s) shown as text (font missing or unknown name):${details}`)
    .toEqual([]);
}
