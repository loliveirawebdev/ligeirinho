---
name: catalog
description: Adds or changes a component or screen pattern in the project's catalog (libs/ui) with its docs row, scenarios, harness and tests, before any screen uses it. Use when a screen needs a pattern the catalog doesn't have, or one that almost fits.
---

# Catalog

The catalog (`libs/ui`) is where the look of every screen is decided once. A screen that rebuilds a pattern drifts;
a screen that composes the catalog can't. So a missing pattern is never built inside the screen: it goes here
first, and the screen uses it.

## Before

1. Read `libs/ui/README.md`. Is there a component that does the job, or almost? Changing it (a new input, a new
   tone) beats a new component. Two components that do nearly the same thing are the drift this skill prevents.
2. Look at how Angular Material solves it (https://material.angular.dev) and how Material 3 describes it
   (https://m3.material.io). The component wraps Material; it never reimplements a control Material has.

## Steps

1. **The component** in `libs/ui/src/lib/<name>/<name>.ts` + `.html` (selector `ui-<name>`): signal `input()` and
   `output()`, OnPush, no text of its own (every label is an input), colors and type only from the token
   utilities, spacing from the scale. Material internals only through documented tokens (`--mat-*`).
2. **Scenarios** in `<name>.scenarios.ts` (`flow: 'Catalog'`): a small preview host with a `model` input, and
   the real cases: long text, one item, many, every tone or state.
3. **Harness** in `<name>.harness.ts` (`ComponentHarness`, `hostSelector = 'ui-<name>'`), exported from
   `src/testing/index.ts`: the reads and actions a view's test needs, in the user's terms (`openRow('Open Ana')`).
4. **Tests** in `<name>.spec.ts`, through the harness.
5. **Docs:** a row in `libs/ui/README.md` (use it for, instead of), the export in `src/index.ts`. A whole-screen
   composition goes in `src/examples` with its scenarios (`flow: 'Screen patterns'`) and a row under "Screen
   patterns".
6. **The gate:** when the hand-built version is recognizable (an element, an attribute, a class), add it to
   `catalog` in `eslint.config.mjs` so screens can't rebuild it. `catalog.spec.ts` fails a component missing any
   file above.
7. **Look at it** in the previewer at 390 and 1280, light and dark, with screenshots, and review it with
   `rules/design.md` ("The review"), as for a screen.

Then go back to the screen that needed it.
