import { expect, test } from '@playwright/test';
import {
  checkAccessibility,
  checkClickablesInView,
  checkNoHorizontalScroll,
  checkTouchTargetSize,
  findAccessibilityViolations,
  findClickablesOutOfView,
  findHorizontalOverflow,
  findSmallTouchTargets,
} from '../../src/index.js';
import {
  axeViolationPage,
  clippedButtonPage,
  goodPage,
  offscreenButtonPage,
  standaloneSmallLinkPage,
  tinyButtonPage,
  widePage,
} from '../fixtures/pages.js';

test.use({ viewport: { width: 390, height: 800 } });

test.describe('good page', () => {
  test('passes every check', async ({ page }) => {
    await page.setContent(goodPage);

    expect(await findHorizontalOverflow(page)).toBeNull();
    expect(await findClickablesOutOfView(page)).toEqual([]);
    expect(await findSmallTouchTargets(page)).toEqual([]);
    expect(await findAccessibilityViolations(page)).toEqual([]);
  });

  test('the soft check functions report nothing', async ({ page }) => {
    await page.setContent(goodPage);

    await checkNoHorizontalScroll(page, 'good');
    await checkClickablesInView(page, 'good');
    await checkTouchTargetSize(page, 'good');
    await checkAccessibility(page, 'good');

    expect(test.info().errors).toEqual([]);
  });
});

test.describe('no horizontal scroll', () => {
  test('catches a document wider than the viewport', async ({ page }) => {
    await page.setContent(widePage);

    expect(await findHorizontalOverflow(page)).toEqual({ scrollWidth: expect.any(Number), clientWidth: 390 });
  });
});

test.describe('clickables in view', () => {
  test('catches a button past the right edge, even when overflow is hidden on the body', async ({ page }) => {
    await page.setContent(offscreenButtonPage);

    expect(await findClickablesOutOfView(page)).toEqual([
      { element: '<button> "Save"', reason: expect.stringMatching(/cut off by <(html|body)>|right edge at \d+px/) },
    ]);
  });

  test('catches a button cut off by an overflow hidden ancestor', async ({ page }) => {
    await page.setContent(clippedButtonPage);

    expect(await findClickablesOutOfView(page)).toEqual([
      { element: '<button> "Delete"', reason: 'cut off by <div> "Delete" (overflow hidden)' },
    ]);
  });
});

test.describe('touch target size', () => {
  test('catches a 24 px button', async ({ page }) => {
    await page.setContent(tinyButtonPage);

    expect(await findSmallTouchTargets(page)).toEqual([{ element: '<button> "Close"', width: 24, height: 24 }]);
  });

  test('catches a small link that is not part of a sentence', async ({ page }) => {
    await page.setContent(standaloneSmallLinkPage);

    expect(await findSmallTouchTargets(page)).toEqual([
      { element: '<a> "Help"', width: expect.any(Number), height: expect.any(Number) },
    ]);
  });
});

test.describe('accessibility', () => {
  test('reports axe rule ids and targets', async ({ page }) => {
    await page.setContent(axeViolationPage);

    const violations = await findAccessibilityViolations(page);

    expect(violations.map((violation) => violation.ruleId).sort()).toEqual(['color-contrast', 'label']);
    expect(violations.find((violation) => violation.ruleId === 'label')?.targets).toEqual(['input']);
  });
});
