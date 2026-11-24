---
name: preview
description: Renders the feature's new screens in the project's previewer (/__preview) with their scenarios, one at a time at 390/768/1280, light and dark, and asks the user to approve them. Use after the plan is approved when the feature has a new or changed screen.
---

# Preview

The real screens are the reference. No drawing on a canvas and rebuilding later: the view you write here is the one
that ships.

## Steps

1. **Start from the catalog.** Read `libs/ui/README.md` and open the closest screen pattern in the previewer (flows
   *Catalog* and *Screen patterns*). The screen is a composition of those components. If one is missing or almost
   fits, stop and use the `catalog` skill first; never build it inside the screen.
2. **Copy first.** Write the approved copy table into the area's `*.copy.ts` (`defineCopy({ en: {...} })`, every
   locale of `copy.locales`, rules/copy.md). No text goes in a template; the lint fails it.
3. For each screen in the plan, write the view-model (`*.view-model.ts`, type + pure function that receives the
   copy) and the scenarios (`*.scenarios.ts`), one example view-model per scenario, the long and odd cases
   included. Scenarios are the test fixtures (see `rules/testing.md`).
4. Write the view (`*.view.ts` + `.html`): only `input()`/`output()`, only catalog and Angular Material components,
   mobile first, no fixed widths, colors and spacing only from the theme's tokens (see `rules/mvvm.md`,
   `rules/responsive.md` and `rules/design.md`). Its tests read the screen through the catalog's harnesses
   (`@app/ui/testing`).
5. Register the scenarios in the previewer: the project's `/__preview` route is
   [`@ligeirinho/previewer`](https://github.com/loliveirawebdev/ligeirinho/tree/main/packages/previewer). Export
   them with `defineScenarios({ flow, title, component, scenarios })` (`flow` is the feature's flow; a state the
   view keeps to itself, like a dialog it opens, gets a `play` for that scenario, see the README), then
   regenerate the registry: `pnpm exec ligeirinho-preview-registry --root libs --out
   apps/web/src/app/preview.registry.ts`. Never write a previewer of your own: if the project doesn't have the
   package, install it from ligeirinho's GitHub Releases and wire `previewRoutes(scenarioRegistry)` as its README
   shows, or tell the user the project wasn't created from the template.
6. Start the previewer (`commands.preview` in `.ligeirinho.yml`) and open `/__preview` in a browser your agent can
   drive. It shows one scenario at a time, and everything is in the URL:
   `/__preview?entry=<id>&scenario=<name>&w=390&h=844&theme=dark`. Walk each scenario at 390, 768 and 1280, light
   and dark, and check that its play steps (panel at the bottom) all pass.
7. **Look at it, with screenshots.** Take a screenshot of every scenario at 390 and 1280 (768 too when the layout
   changes there), light and dark, in a browser you drive, or run the responsive e2e
   (`commands.e2e`), which saves them in `apps/e2e/test-results/screens/<entry>/`. Open every image. Never review
   from the code alone: the problems the user sends back (an icon off its line, text touching an edge, a button
   of another height) only show in the picture.
8. Review it yourself before showing it, with `rules/design.md` ("The review") and `rules/copy.md`: name which of
   the five failures it has and fix that first, then go through hierarchy, content, type, spacing, color, icons and
   density, and read every text against the register and structures of the copy rules, in every scenario, at every
   width, in light and dark. Also: no horizontal scrolling, no cut-off text, no small touch targets. Fix, take the
   screenshots again, look again. When you show it, say in one line what the screen's focal element is.
9. Show it to the user and ask for approval: give them the `/__preview?entry=…` link of each screen. Adjust until
   they approve.

Don't wire the page to the back end yet: that's part of the build. The approved view and view-model go into the
first build chunk with their component tests.

Once approved, run `scripts/state.sh NNN-name build` and move on to the `build` skill.
