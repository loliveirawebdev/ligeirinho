# Responsive

## Layout rules

| Rule | Why |
|---|---|
| **Mobile first**: the base style is for phones; `min-width` adds on top | the phone is the hardest case; starting there avoids hiding things later |
| **Fluid layout**: no fixed px widths for columns; `max-width` only for text (readability) | fixed widths break between breakpoints |
| **Container queries** in components | a component adapts to the space it has, not to the screen; it works the same in a sidebar and on a full page |
| **Breakpoints only from the tokens** of the design system | three known breakpoints, not twenty |
| **Touch targets ≥ 40 px** | Material 3's compact scale (36 px buttons in a 40 px target, 40 px rows); WCAG 2.5.8 AA asks for 24 px |
| **Nothing that depends on hover** (menus, actions, information) | phones have no hover |
| **Tables become cards on phones** through a design system component | a wide table doesn't fit; one component solves it for every screen |

**Enforced by:** style lint (stylelint: forbids px `width` outside tokens, `@media` with non-token values, `:hover`
as the only trigger); automatic gate checks (below); checklist for the rest.

## Gate checks (properties, not images)

For **every scenario** of every view, Playwright opens the previewer at **390, 768 and 1280**, in light and dark,
and checks:

1. no horizontal scrolling (`scrollWidth <= clientWidth` on the document);
2. no clickable element cut off or off screen (below the fold of a scrolling area is fine);
3. every clickable target at least 40 × 40 px (a dense grid's, like a calendar's event chips, may be marked
   `data-touch-target="compact"` and held to 24 × 24);
4. every icon drawn as a glyph, not its name;
5. no axe violations (accessibility), at 390.

`make check` checks only the screens of the projects a change touches (a change to the theme or to a `libs/ui`
component checks that component's own screens, not every screen using it); `make gate` and CI check them all.

A new screen gets these checks **just by having scenarios**: the test reads the previewer's scenario list, nobody
has to write anything.

**Why:** image comparison is brittle and needs someone looking at it. Properties catch what actually breaks and
run on their own.

**Enforced by:** `e2e-kit` (a ligeirinho package) in the gate.
