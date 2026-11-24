# @ligeirinho/e2e-kit

The ligeirinho Playwright config, plus responsive and accessibility checks that run over **every scenario** in
`@ligeirinho/previewer`. A new screen gets checked just by having scenarios.

## Use

```ts
// apps/e2e/playwright.config.ts
import { defineLigeirinhoConfig } from '@ligeirinho/e2e-kit';

export default defineLigeirinhoConfig({
  testDir: './src',
  baseURL: process.env['E2E_BASE_URL'] ?? 'http://localhost:4200',
});
```

Defaults: `fullyParallel`, `trace: 'retain-on-failure'`, `testIdAttribute: 'data-testid'`, Chromium, list
reporter. On CI (`CI` set) it also forbids `.only`, retries once and adds the html reporter. Any option you pass
overrides the default; `use` is merged.

```ts
// apps/e2e/src/responsive.spec.ts
import { responsiveChecks } from '@ligeirinho/e2e-kit';

responsiveChecks({ previewPath: '/__preview', widths: [390, 768, 1280], themes: ['light', 'dark'] });
```

This declares four tests per width and theme (`responsive 390px light (1 of 4)` …), the entries dealt to them in
turn, so workers share the work and a failure points at a smaller group. Each test reads `window.__ligeirinhoPreview`
from the previewer workbench, opens `${basePath}/render/<entry>/<scenario>?theme=<theme>` for every scenario, one at a time, waits
for its `play` steps (if any) and checks, with soft assertions so one run reports everything (each message names
entry, scenario, width and theme):

0. the play ran (`[menu/opened 390px dark] play failed: step "Open the menu" failed: …`); the checks below still
   run on the state it left;
1. no horizontal scroll (`scrollWidth <= clientWidth` on the document);
2. every visible clickable (`a[href], button, [role=button], input, select, textarea, summary,
   [tabindex]:not([tabindex="-1"])`) is inside the viewport horizontally and not cut off by an
   `overflow: hidden|clip` ancestor;
3. every visible clickable is at least 40 × 40 CSS px (Material 3's compact scale; WCAG 2.5.8 AA asks for 24);
4. every icon (`mat-icon`, `.material-symbols-*`, `.material-icons`) is drawn as a glyph, not as its name in text
   (the font didn't load, or the name isn't in it: `"arrow_bak" drawn as 96px of text`);
5. zero axe-core violations for WCAG 2.1 A/AA (rule ids and targets are printed), at the first width or viewport
   only: axe's rules hardly change with the width, the contrast changes with the theme, and every theme is checked.

With no scenarios the test passes with a `no-scenarios` annotation. Optional: `height` (viewport height for
`widths`, default 900), `viewports` (exact sizes, e.g. `[{ width: 390, height: 844 }, { width: 844, height: 390 }]`
for a phone in portrait and landscape; tests are named `responsive 390x844 light`; use it with or instead of
`widths`), `screenshotsDir` (saves a full-page screenshot of every scenario as
`<entry>/<scenario>-<viewport>-<theme>.png`, for the visual review in rules/design.md), `groups` (tests per width
and theme, default 4; 1 gives one test named `responsive 390px light`), `accessibility` (`'every-viewport'` runs axe
at every width), `entries` (only these entry ids) and `test` (your own extended Playwright `test`, for fixtures or
auth).

**Only what changed:** the `LIGEIRINHO_PREVIEW_ENTRIES` environment variable (entry ids, comma separated) wins over
`entries`, so a gate can check only the screens a change touched without editing the spec; set but empty, nothing is
checked. `ligeirinho-preview-registry --entries-in <dir>…` (from `@ligeirinho/previewer`) prints the ids for a set of
folders.

### Heuristics

- Visible means `checkVisibility()` and larger than 1 × 1 px, so visually-hidden skip links don't count.
- Clickables inside an `overflow-x: auto|scroll` container (carousels, scrollable tables) may sit off screen; they
  are only checked for clipping.
- Touch target exemptions (WCAG 2.5.5 exceptions): an `<a>` with `display: inline` whose nearest block has other text of
  its own (a link inside a sentence), inputs whose `<label>` is at least 40 × 40, and elements whose Angular
  Material hit area is at least 40 × 40 (the 48 px `*-touch-target` inside a button or chip or next to a checkbox, and the
  box of a text field around its `<input>`).
- Compact targets: an element marked `data-touch-target="compact"` only needs WCAG 2.5.8's 24 × 24. For dense grids
  where 40 px would break the layout (a month calendar's event chips), never to dodge a fix.

## Individual checks

For custom specs, each check has a soft-assertion form and a finder that returns the problems:

| Soft assertion | Finder |
|---|---|
| `checkNoHorizontalScroll(page, label?)` | `findHorizontalOverflow(page)` |
| `checkClickablesInView(page, label?)` | `findClickablesOutOfView(page)` |
| `checkTouchTargetSize(page, label?)` | `findSmallTouchTargets(page)` |
| `checkIconsRendered(page, label?)` | `findIconsShownAsText(page)` |
| `checkAccessibility(page, label?)` | `findAccessibilityViolations(page)` |

## Develop

`pnpm build` (tsc into `dist/`), `pnpm test` (Playwright: each check against good and bad static pages,
`responsiveChecks` against a fake previewer, and end to end against the `@ligeirinho/previewer` demo app, which
the web server builds first).
