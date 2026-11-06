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

This declares one test per width and theme. Each test reads `window.__ligeirinhoPreview` from the previewer grid,
opens `${basePath}/render/<entry>/<scenario>?theme=<theme>` for every scenario and checks, with soft assertions so
one run reports everything (each message names entry, scenario, width and theme):

1. no horizontal scroll (`scrollWidth <= clientWidth` on the document);
2. every visible clickable (`a[href], button, [role=button], input, select, textarea, summary,
   [tabindex]:not([tabindex="-1"])`) is inside the viewport horizontally and not cut off by an
   `overflow: hidden|clip` ancestor;
3. every visible clickable is at least 44 × 44 CSS px;
4. zero axe-core violations for WCAG 2.1 A/AA (rule ids and targets are printed).

With no scenarios the test passes with a `no-scenarios` annotation. Optional: `height` (viewport height, default
900) and `test` (your own extended Playwright `test`, for fixtures or auth).

### Heuristics

- Visible means `checkVisibility()` and larger than 1 × 1 px, so visually-hidden skip links don't count.
- Clickables inside an `overflow-x: auto|scroll` container (carousels, scrollable tables) may sit off screen; they
  are only checked for clipping.
- 44 px exemptions (WCAG 2.5.5 exceptions): an `<a>` with `display: inline` whose nearest block has other text of
  its own (a link inside a sentence), and inputs whose `<label>` is at least 44 × 44.

## Individual checks

For custom specs, each check has a soft-assertion form and a finder that returns the problems:

| Soft assertion | Finder |
|---|---|
| `checkNoHorizontalScroll(page, label?)` | `findHorizontalOverflow(page)` |
| `checkClickablesInView(page, label?)` | `findClickablesOutOfView(page)` |
| `checkTouchTargetSize(page, label?)` | `findSmallTouchTargets(page)` |
| `checkAccessibility(page, label?)` | `findAccessibilityViolations(page)` |

## Develop

`pnpm build` (tsc into `dist/`), `pnpm test` (Playwright: each check against good and bad static pages,
`responsiveChecks` against a fake previewer, and end to end against the `@ligeirinho/previewer` demo app, which
the web server builds first).
