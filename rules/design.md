# Design

How a screen should look, so the agent's screens read like a product a designer shipped, not like generated UI.
[responsive.md](responsive.md) covers how a screen adapts; this file covers what it looks like at any size.

Adapted for real app screens from the craft rules in Benji Taylor's
[stageshow](https://github.com/benjitaylor/skills/tree/main/stageshow) skill (MIT), which are written for product
illustrations.

## The one idea

**A screen shows the user's task, simplified to what they need now, with one clear place for the eye to land.**

Generated UI fails in five ways. Name the one you see before fixing anything:

| Failure | What it looks like |
|---|---|
| **Too much** | every field, number and badge on screen at once; three ways to do the same thing |
| **Wireframe** | gray boxes and a button; correct but nothing to recognize |
| **Boxed** | every block in its own bordered card, cards inside cards |
| **Flat** | everything the same size and weight; the eye has nowhere to land |
| **Generic** | could be any app: default grays, a sparkle icon, a purple gradient, an invented logo |

**Why:** these are the tells people notice first. Naming them makes the review concrete instead of "make it nicer".

## Hierarchy

| Rule | Why |
|---|---|
| **One focal element per screen:** the thing the user came to do or see | a screen with two heroes has none |
| **The heaviest marks sit on the subject:** size, weight and the accent go to what matters; secondary information is quieter (smaller, `text-muted-foreground`), never decorated | weight is a budget; spent everywhere it means nothing |
| **One number gets to be big;** the rest are normal text | a dashboard of equal big numbers is flat |
| **Hierarchy from size, space and one weight step,** not from more boxes, borders or colors | boxes add noise faster than they add order |
| **No cards inside cards.** A card is for an object the user acts on as a whole; a section is just space and a heading | nested frames are the most common "boxed" failure |
| **Say it once:** one primary action per screen or section, one confirmation of a result | repeated signals compete with each other |
| **Simplify before polishing:** the fewest surfaces and words that do the job; borders, badges and shadows only where they earn their place | polish on clutter is still clutter |
| **Judge the silhouette first:** squint (or look at the 390 px preview zoomed out). Subject, support and empty space should make one clear picture | details can't fix a confused composition |

## Content

| Rule | Why |
|---|---|
| **Real words:** labels and sample data from the domain (the scenarios' data), never lorem ipsum or "Item 1" | fake text hides whether the layout works with real lengths |
| **Scenarios include the hard cases:** the long name that wraps, the empty list, the error, one item, many items | layouts break on the cases nobody drew |
| **Empty and error states say what happened and what to do next,** with the action right there | "No data" is a dead end |
| **Keep the domain's signature content:** the avatar, the thumbnail, the status the user scans for | swapping it for generic rows makes every screen look the same |

## Words

The copy is part of the design: generic copy makes a well-drawn screen look generated. Write like a careful product
writer talking to one person who is busy. Drawn from the content guides of Shopify Polaris, GOV.UK, Material and
Apple's HIG.

| Rule | Why |
|---|---|
| **Plain, short, specific.** Cut filler (*simply*, *just*, *please*, *successfully*, *in order to*); front-load the word the user scans for | every extra word is read on every visit |
| **No "Oops", no "Uh-oh", no exclamation marks, no emoji, no jokes in errors**; no "Welcome to…", "Let's…", "Unlock", "Seamless", "Effortless", "Powerful" | cheerful filler and marketing verbs are the clearest tells of generated copy |
| **One word per concept,** used everywhere: if the thing is a *task*, it is never an *item*, *todo* or *entry*; the button verb, the in-progress state and the result share a verb (*Add task* → *Adding…*) | synonyms make users wonder whether they are different things |
| **Titles name the thing** (*Tasks*, *Billing*), not the user (*My tasks*) or the app (*Task Manager*) | the screen is already theirs |
| **Buttons are verb + object** (*Add task*, *Delete invoice*), never *OK*, *Submit*, *Yes*; a destructive button names what is destroyed | the label is the last thing read before acting |
| **Labels are short nouns without colons;** the placeholder is a hint or example (*What needs doing?*), never the label and never a copy of the button | placeholders vanish on typing; repeating the button adds nothing |
| **Counts as digits, with real plurals, and zero in words:** *1 open task*, *2 open tasks*, *All done* or *Nothing open* rather than *0 open tasks*; don't show a count next to an empty state that already says it | *0 items* reads like a database, and saying it twice is noise |
| **Dates relative while recent** (*today*, *yesterday*), then *Mar 3*, adding the year only when it isn't the current one | users think in days, not timestamps |
| **Empty states say what will be here and how to start,** and differ by case: first use (*No tasks yet*), no results (*No tasks match "x"*), all done (*All done*) | one generic "No data" fits none of them |
| **Errors: what happened, then what to do,** in human words, without blame, codes or *Error:* prefixes; never *Something went wrong* on its own | the user needs the next step, not an apology |
| **Headlines and labels have no final period; body sentences do.** Sentence case everywhere | periods on labels look like prose; Title Case reads like a form from 2005 |
| **Real typography:** curly apostrophes and quotes (’ “ ”), the ellipsis character (…), an en dash for ranges (9–5); *…* ends in-progress states (*Saving…*) and actions that open another step | straight quotes and three dots are what unedited text looks like |
| **Icon-only and repeated buttons get a full accessible name** with their object: *Complete “Review the plan”*, not *Complete* ten times | a screen reader user hears the list out of context |
| **Never build a sentence by concatenating fragments;** each full string lives in one place (the view-model) so it can be translated | word order changes between languages |

## Type

| Rule | Why |
|---|---|
| **One family:** the design system's font. Monospace only for code, identifiers and aligned numbers | a second family is noise unless it carries meaning |
| **Sizes from the type scale only:** UI text 14 to 16 px, inputs 16 px on phones (smaller makes iOS zoom in), nothing under 12 px | real sizes keep it legible; a scale keeps it consistent |
| **Line height at least 1.3 for UI text,** around 1.5 for paragraphs; paragraphs capped at about 65 characters (`max-w-prose`) | tight or very long lines are hard to read |
| **Numbers that are compared or that change use `tabular-nums`** | proportional digits jump and misalign in columns |
| **One weight step for hierarchy** (regular and medium or semibold), not four | many weights read as indecision |
| **A title over its subtitle reads as one item:** 4 to 6 px apart, with more space before the next item | proximity is what groups them |

## Spacing and alignment

| Rule | Why |
|---|---|
| **Spacing from the scale only** (Tailwind's 4 px steps); no arbitrary values like `mt-[13px]` | a scale makes rhythm; arbitrary values make drift |
| **Proximity groups:** things that belong together are closer to each other than to anything else; never spread items evenly to fill a space | even spacing erases the structure |
| **Text keeps an inset of at least 12 px (16 px is the default)** from the edge of a card, panel or row; nothing touches a border | text touching an edge is the clearest "unfinished" signal |
| **Inputs, selects and buttons share one height** (`h-11`, 44 px, the template's default for both); a button next to a field never uses another size | mismatched control heights in a row are the first thing a designer spots |
| **A button sits 8 to 12 px from the field or block it belongs to** | touching reads as a mistake; far away it belongs to nothing |
| **No near-tangents:** two edges either line up exactly or are at least 8 px apart | edges 1 to 3 px apart look like an accident |
| **Nested rounded shapes:** outer radius = inner radius + the padding between them; even padding on every side | mismatched radii look off even when nobody can say why |
| **Columns line up:** rows of a list share one grid (fixed tracks), optional content keeps its track empty | ragged columns make a list hard to scan |
| **A control hugs its content;** it doesn't stretch with its contents stuck at one end (full width on phones is a layout choice, not a default) | lopsided controls look broken |
| **Dots, badges and focus rings stay inside the content edge** | marks that stick out read as glitches |
| **Fix overflow by fitting the content** (wrap, truncate with a tooltip, shorten), not by widening the container | a wider box only moves the problem to the next width |

## Color

| Rule | Why |
|---|---|
| **Colors only from the theme's tokens** (`bg-background`, `text-muted-foreground`, `bg-primary`, `border`, …), never hex values or Tailwind's raw palette (`bg-blue-500`) in components | tokens make light and dark work and keep one palette |
| **One neutral family and one accent** to start; the accent marks the primary action and the current selection, little else | an accent everywhere is no accent |
| **Status colors mean status only** (destructive, success, warning), and never color alone: an icon or a word goes with it | color-blind users and quick scanning both need the second cue |
| **Try the fill alone before adding a border;** a border is for separation or state, not decoration | redundant borders are where "boxed" starts |
| **No decorative gradients, glows or glassmorphism** unless the product's identity asks for them | they date fast and fight the content |
| **A filled button keeps its color on hover:** one step of its own color, never a swap to gray | a color swap reads as a different button |
| **Buttons and inputs are flat:** no shadow, glow or gradient on controls; elevation belongs to surfaces | shadowed buttons are a dated, generated look |
| **Dark theme: depth from a lighter surface, not from shadows** | shadows disappear on dark backgrounds |
| **Check both themes:** a screen that works in light is not proven in dark; the previewer shows both side by side | the second theme is where forgotten raw colors show up |
| **Quiet is not faint:** muted text still passes contrast against its real background | low-contrast "elegant" gray fails real users (axe checks it in the gate) |

## Icons and imagery

| Rule | Why |
|---|---|
| **One icon set** (Lucide, through Spartan's icon component), one size and one stroke width per context (16 px inline, 20 px in buttons) | mixed sets and weights are a top tell of generated UI |
| **Never hand-draw an icon or a logo** in SVG; never invent a logo (a letter in a colored square); use the real mark or a plain text wordmark | hand-made glyphs never match their neighbors |
| **An icon earns its place:** it speeds recognition (actions, status, navigation); no icon on every label | decorative icons are noise |
| **Icon-only buttons have an accessible label** (and a tooltip on desktop) | an unlabeled icon is a guess |
| **Emoji are content, never icons** | they render differently on every platform and look unprofessional as UI |
| **AI features get no sparkle, wand or purple:** show what the feature does, in the same visual language as the rest | the sparkle is the most generic mark in software today |
| **No invented illustrations;** a simple icon or nothing in empty states | generic stock art cheapens the screen |

## Density

| Rule | Why |
|---|---|
| **Density follows the task:** a list the user scans every day can be compact; a form filled once a month gets room | one density for everything is wrong for most screens |
| **Empty space is allowed** when it is hierarchy; it is not when it is a void (a list that stops halfway down a pane with nothing below, a gap between a label and its value) | whitespace groups; voids look unfinished |
| **Enlarge or clarify content before adding more elements** | more anatomy is rarely the fix |

## The look: Notion-like

Every app built from the template shares one look, modeled on Notion's: a calm document-like page, warm grays, almost
no chrome, one blue for the primary action. **An app changes only its theme** (below); everything else is shared and
changes in the template, for everyone. It lives in `apps/web/src/styles.css` (tokens, in a THEME and a BASE block)
and the Spartan components in `libs/ui/spartan`.

### Theme: the only part an app changes

| Token | What it is |
|---|---|
| `--primary`, `--primary-foreground` | the accent: primary button, checked boxes, links. White text on it must pass 4.5:1 |
| `--ring` | the focus ring, usually the same as `--primary` |
| `--font-app` | the font stack; the default is the system UI stack (like Notion). An app with a brand font self-hosts it and sets it here |

Set both the `:root` and `:root.dark` values in the THEME block. Don't touch the BASE block per app, don't add
tokens per app, and don't restyle components per app: if an app needs something the look doesn't give, it is a
template change.

### Page and type

| Rule | Why |
|---|---|
| **Page = white** (`#fff`) in light, **`#191919`** in dark; text is warm near-black **`#37352f`** (light) and white at 81 % (dark), never pure black or pure white | the warm gray text on white is what makes it read as Notion rather than a generic app |
| **Muted text is warm gray** (`text-muted-foreground`) for metadata, counts and hints | one quiet level is enough |
| **Page title large and bold** (`text-3xl font-bold`), a muted subtitle 4 px under it; section titles `text-lg font-semibold` | the title is the anchor of a document-like page |
| **Content in one readable column** (`max-w-2xl`, centered) for lists and forms; wider only for tables | Notion pages are a column of text, not a dashboard grid |

### Surfaces

| Rule | Why |
|---|---|
| **No cards, no dividers, no shadows on page content.** A list is plain rows; a group is a heading and space | Notion's calm comes from the absence of boxes |
| **Rows highlight on hover** (`hover:bg-hover`, `rounded-md`, `-mx-2 px-2` so the text stays aligned with the column) | the hover shows what is clickable without drawing borders |
| **A callout** (`bg-secondary rounded-md p-4`) is the only "box": errors, notices, summaries | one kind of box, used rarely |
| **Shadows only for what floats** (menus, popovers, dialogs: `shadow-surface`) | elevation means "on top", nothing else |

### Controls

| Rule | Why |
|---|---|
| **Buttons:** `default` = solid `--primary`, the one primary action per screen; `outline` = hairline border, transparent; `ghost` = muted text, gray on hover; `secondary` = light gray fill. All flat, radius `rounded-md` | blue only where the user should act; everything else stays neutral |
| **Inputs:** faint warm-gray fill (`bg-field`) with a hairline border; on focus, a `--ring` border and a soft ring. Labels are small (`text-sm`), above the field | Notion's fields read as part of the page, not as boxes |
| **Checkboxes are square** (16 px, 3 px radius), gray border; checked = `--primary` fill with a white check | round checks read as a different product |
| **Every control is 44 px tall** (inputs, buttons, icon buttons share `h-11` / `size-11`); a 16 px checkbox sits in a 44 px hit area | the gate checks 44 px touch targets at every width |
| **Primary hover darkens its own color** (`color-mix` with black) | opacity hovers look washed out |
| **Destructive actions confirm in a dialog**, never inline on the screen: the Spartan alert dialog (`pnpm exec nx g @spartan-ng/cli:ui alert-dialog`, brought to the look). Title is the question (*Discard this opportunity?*), the description says what happens, the confirm button repeats the verb and the object (*Discard opportunity*); *Cancel* is ghost. The button that opens it ends in *…* | an inline confirm shifts the layout and is easy to click through; a dialog stops the user and names the consequence |
| **Clickable rows get `cursor-pointer`** and the row hover; no extra icon to say they open something | the pointer and the hover are enough of a cue; an icon on every row is noise |
| **Icons are Lucide through `@ng-icons`**, 16 px inline, stroke 2 (3 for the small check) | one set, never hand-drawn |

## The review

Before showing a screen to the user (the `preview` stage), look at every scenario at 390, 768 and 1280, light and
dark, the way the most exacting designer you know would: the one who screenshots the single wrong thing and sends
it back with "what is this?". If you can picture that screenshot (a badge off its avatar, text touching a card edge,
two icons of different weights, a gray hover on a blue button), that is the next fix.

1. Name which of the five failures it has, if any, and fix that first.
2. Then go through hierarchy, content, words, type, spacing, color, icons and density above, and fix what doesn't pass.
3. Say in one line what the focal element is. If you can't, the screen isn't done.

**Enforced by:** checklist in the `preview` stage (before the user sees the screen) and again at the close; axe in
the gate catches contrast and missing labels; the raw-elements lint keeps screens on the design system.
