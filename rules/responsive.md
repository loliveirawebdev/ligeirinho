# Responsive

## Layout rules

| Rule | Why |
|---|---|
| **Mobile first**: the base style is for phones; `min-width` adds on top | the phone is the hardest case; starting there avoids hiding things later |
| **Fluid layout**: no fixed px widths for columns; `max-width` only for text (readability) | fixed widths break between breakpoints |
| **Container queries** in components | a component adapts to the space it has, not to the screen; it works the same in a sidebar and on a full page |
| **Breakpoints only from the tokens** of the design system | three known breakpoints, not twenty |
| **Touch targets ≥ 44 px** | WCAG 2.5.5 and Apple/Google guidelines |
| **Nothing that depends on hover** (menus, actions, information) | phones have no hover |
| **Tables become cards on phones** through a design system component | a wide table doesn't fit; one component solves it for every screen |

**Enforced by:** style lint (stylelint: forbids px `width` outside tokens, `@media` with non-token values, `:hover`
as the only trigger); automatic gate checks (below); checklist for the rest.

## Gate checks (properties, not images)

For **every scenario** of every view, Playwright opens the previewer at **390, 768 and 1280** and checks:

1. no horizontal scrolling (`scrollWidth <= clientWidth` on the document);
2. no clickable element cut off or off screen;
3. every clickable target at least 44 × 44 px;
4. no axe violations (accessibility).

A new screen gets these checks **just by having scenarios**: the test reads the previewer's scenario list, nobody
has to write anything.

**Why:** image comparison is brittle and needs someone looking at it. Properties catch what actually breaks and
run on their own.

**Enforced by:** `e2e-kit` (a ligeirinho package) in the gate.
