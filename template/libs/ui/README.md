# ui: the catalog

Every screen is composed from these components. They wrap Angular Material and add the parts it leaves open:
page structure, states, and the patterns real screens kept getting wrong. Read this before writing a view, and
look at them in the previewer (`/__preview`, flows **Catalog** and **Screen patterns**).

- **Reuse first.** If a pattern here fits, use it. If it almost fits, change it here, for every screen, and never
  rebuild it in the screen. The lint stops the hand-built versions (`@ligeirinho/use-catalog` in
  `eslint.config.mjs`).
- **A new pattern starts here** (the `catalog` skill): the component, its scenarios, its harness, its tests and its
  row below, then the screen that needed it. `catalog.spec.ts` fails a component that is missing any of them.
- **No text inside.** Every label comes in through an input, from the screen's copy (rules/copy.md).

## Components

| Component | Use it for | Instead of |
|---|---|---|
| `ui-app-shell` | The frame of an app with sections: product name, navigation drawer (open beside the content from 840 px, over it behind a menu button on phones; entries in titled sections, one subject each), a top bar only for app-wide icons (`actions`, with badges) and the person signed in (`user`, whose button opens an account card like Google’s), the page inside at full width; variants: `railCollapsible` folds the drawer to a rail of icons with tooltips (the page keeps `collapsed`/`collapsedChange`), `secondaryNavigation` adds quieter links at the drawer's foot (help, feedback), `aside` a right-hand panel (`uiShellAside`) beside the page from 1200 px and behind a top-bar button below | a hand-made `mat-sidenav-container`, a top bar of links |
| `ui-page-header` | The top of every page: the one `<h1>`, a line under it (a count, a status), a back link, the page's actions (`uiPageActions`, under the title at its start) | a free `<h1>` and buttons laid out by hand |
| `ui-filter-bar` | Search and the filters above a list or table, beside the field or under it (`filtersPosition`): one row of chips with one chosen at a time (`filters`), and/or a chip per filter that opens its options, one or several, shows what was chosen (*Status: Active*) and clears it (`lightFilters`) | a search field and chips arranged per screen |
| `ui-data-table` | Records the user scans and opens: a table from 600 px (cells on one line; it scrolls sideways when the columns don't fit, never squeezes), a list on phones (the first column or `titleColumn` as title, each other column a line, after its name with `phoneLabels`; one line with an ellipsis each, wrapping with `phoneWrap`), edge to edge of the page with `fullBleed`; columns with a `sortLabel` sort from their header (`sort`, `sortChange`; the page orders the rows); `paging` adds numbered pages (a paginator at a fixed page size, no rows-per-page choice), a *Show more* bar or infinite scroll; `selection` puts a checkbox on every row (and *select all* in the header) and, once any is picked, a floating bar with the count and the page's bulk actions (`uiBulkActions`); `reorder` puts a handle on every row to order them by hand (drag, or the arrow keys), every row one target | `table mat-table` in a screen, rows that are not clickable as a whole |
| `ui-item-list` | Records in one column (invoices, messages, recent items): title, a line, trailing meta | `mat-nav-list` for records, rows of `div`s |
| `ui-detail-list` | The facts of one record, label beside value (wrapping; one line with an ellipsis with `truncate`) | `<p><strong>Label:</strong> value</p>`, grids made by hand |
| `ui-input-group` | A field and its one action, attached (add, invite, subscribe) | a button inside the field (`matSuffix`), a field and a loose button |
| `ui-mask` (`[uiMask]` on a `matInput`) | Text typed in a fixed shape (tax ids, phone, postal code, dates, plates): `[uiMask]="masks.cpf"` from `MASKS`, or a pattern of its own (`0` digit, `A` letter, `*` either; a list for alternatives by length, like 8- or 9-digit phones); the field shows `123.456.789-00` while the form keeps `12345678900` (`uiMaskValue="masked"` keeps it as shown); the caret stays put, pastes are formatted, digit masks open the numeric keyboard. Amounts of money are not a mask: a number field formatted with the locale | `(input)` handlers reformatting per screen, a mask library, a hint asking for "numbers only" |
| `ui-number-input` | A small count with − and + attached (guests, seats, quantity): a real outlined field, the arrow keys step, clamped to `min`/`max` on blur, the buttons off at the limits | `<input type="number">` with the browser's spinners |
| `ui-otp-input` | A one-time code (sign-in, confirming an email or phone): a box per digit (`length`), pasted or autofilled codes fill every box, Backspace and the arrows move between them, `error` under them, `completed` once full. The default way to sign in (screen pattern *Sign in*) | one text field with `maxlength`, boxes made by hand |
| `ui-cascader` | One leaf of a hierarchy (country › state › city, category › subcategory): an outlined field showing the path (*Brazil / São Paulo / Campinas*) that opens a column per level side by side (one at a time with a back row on phones); arrows within a column, Right or Enter opens a branch, Left goes back; the value is the values along the path | chained selects that reset each other, a long flat select of "Country - State - City" |
| `ui-tree-select` | One node of a tree, or several (`multiple`) (folders, departments): an outlined field showing the label, or a removable chip each up to `maxChips` and then *3 selected*; a panel with a search box (ancestors of every match kept) and the tree | a `mat-select` with indented option labels, a tree in a dialog made per screen |
| `ui-transfer` | Several items out of many, moved between two lists side by side (stacked on phones): available and chosen, each with a title, a count, a search box and *select all*, the move buttons between them; the value is the chosen ids | two selection lists and buttons wired per screen, a multi-select with hundreds of options |
| `ui-mention-input` | A text area where typing `@` suggests people, filtered by what follows (arrows, Enter or Tab chooses, Esc closes) and writes *@Name*; the value is the text, `mentionsChange` the ids mentioned | a text area plus a separate "notify" picker, `@` handling per screen |
| `ui-rating` | A score in whole stars, to give (a radio group: arrows, screen readers) or to show (`readonly`, read as one value) | star buttons made by hand, a select of 1–5 |
| `ui-color-picker` | A color from presets (`swatches`, a radio group), and a custom one from the browser's picker (`customLabel`); the value is the hex | a bare `<input type="color">`, a select of color names |
| `ui-file-upload` | Adding files to a record: a dashed dropzone with a real file picker behind its button (`accept`, `multiple`), files too large (`maxSize`) or of another type listed with why and never emitted, then the page's `files` with size, progress bar, *Remove* and, when failed, *Retry*; the page uploads what `filesAdded` gives it | a bare `<input type="file">`, drop zones and progress lists per screen |
| `ui-dialog` | The inside of every dialog a `MatDialog` opens: title, a line under it, the content, the actions (`uiDialogActions`) in a footer under a divider, at the end; a close button in the corner (`closeLabel`) only for dialogs that only show something | `mat-dialog-title`/`-content`/`-actions` laid out by hand, actions without the divider |
| `ui-form-dialog` | A short form in a dialog (invite, rename): *Cancel* and the submit button in the footer, Enter submits (`submitted`), the saving state (`saving`, nothing closes it), a failed save right above the buttons (`error`), and with unsaved changes (`dirty`) closing asks first (`discardText`); the page closes it once saved | a form and its buttons wired to a dialog per screen |
| `ui-confirm-dialog` | Confirming a destructive action: `inject(ConfirmDialogs).ask(text)` opens the question, what happens, *Cancel* (focused first) and the verb with its object, and answers true only on confirm | a dialog component per confirmation, `confirm()` |
| `ui-command-palette` | Running any command by name (⌘K): `inject(CommandPalette).open(commands, text)` shows a search field at the top third and the commands under their groups (icon, shortcut with `ui-kbd`), filtered by label and keywords ignoring case and accents; arrows move, Enter answers the command's id; bind ⌘K / Ctrl+K once at the app's root with `(uiCommandPaletteShortcut)` | a search dialog per app, keydown listeners per screen |
| `ui-notification` | Something that happened away from the screen (an export finished, a sync failed, a mention): `inject(Notifications).show(config)`, a card at the top-right (the bottom, full width, on phones), at most three, gone after a few seconds (paused on hover or focus), errors announced at once; the ref gives `afterDismissed()` and `onAction()` | toasts made per screen; the result of what the user just did stays a snack bar, a message about the page `ui-notice` |
| `ui-breadcrumb` | Where a deep back office page sits (*Clients › Northwind › Contract 2026*), above the page header's title: every level a link, the page itself last | a row of links and slashes by hand; on a page one level down, the header's back link is enough |
| `ui-tag` | A short label on a record (status, kind, plan), not clickable; `tone` by meaning: success done, warning needs attention, error failed, primary new, neutral the rest | colored `span`s per screen, chips for things that aren't filters |
| `ui-avatar`, `ui-avatar-group` | A person as a photo or initials (each name always the same color), `decorative` beside the written name; a few people overlapping, then *+N*, read by one `label` | initials in hand-made circles |
| `ui-kbd` | A keyboard shortcut, key by key (`['⌘', 'K']`), beside a menu item or in a hint | `<code>` or plain text for keys |
| `ui-statistic` | One number that matters (revenue, open tickets): its name, the value formatted by the view-model, how it moved (green when good, red when not, whichever the direction), a line under it; several in a grid | big numbers styled by hand per dashboard |
| `ui-timeline` | What happened to a record, in order (history, audit trail, activity): a marker per event on a line, in one quiet color (`icon` for the steps that matter, a dot for the rest), the title, when, a line about it | lists of dates and bullets by hand |
| `ui-result` | How a flow ended, as the whole page or panel: success, error, warning, neutral (information), no access (`locked`), not found; the outcome as the heading, what to do next (`uiResultActions`), details under it | an empty state or a notice standing in for an outcome page |
| `ui-skeleton` | Gray shapes where content appears in place (list rows with `avatar`, lines of text, a card's body), so nothing jumps; heard once by `label` | skeletons drawn per screen; a whole page loading is still `ui-loading-state` |
| `ui-panel` | A titled block of a dashboard or detail page (outlined, title, a line under it, actions in `uiPanelActions`); with `split`, panels side by side (`row`, stacked on phones) or one under the other (`column`) inside one outline, divided by lines, each with its `size`. Statistic cards are a row split of `ui-statistic`s | cards nested in cards, grids of boxes drawn per dashboard |
| `ui-splitter` | Two panes the user sizes by dragging the line between them (`uiSplitterStart`, `uiSplitterEnd`; `row` or `column`), the line a focusable separator moved by the arrow keys; keep `sizeChange` per user; stacked on phones | fixed side-by-side layouts the user can't adjust, hand-made drag handles |
| `ui-check-cards` | A choice that needs more than a label: a card per option (icon, title, what it means, a note such as the price), one at a time or several (`multiple`), real radios and checkboxes underneath | radio buttons with long labels, clickable cards made by hand |
| `ui-chart` | Dashboard charts in SVG with the theme's colors: `line`, `area`, `bar` over labels (light gridlines, axis formatted by `valueFormat`, a legend from 2 series), `donut` for the shares of one series, `sparkline` for a tiny trend beside a number; takes the width it's given; hover, or focus and the arrows, for a tooltip; screen readers get the numbers as a table | chart libraries, charts drawn per screen, images of charts |
| `ui-calendar` | A month of events (schedule, deadlines, bookings): the month's name with previous, next and *Today*, whole weeks with the days around the month muted and today marked, up to `maxEvents` colored chips per day and *+N more*; `dayOpened`, `eventOpened`, arrow keys between days; compact with dots on phones, the chosen day's events under it | `mat-calendar` stretched into a schedule, grids of days by hand |
| `ui-anchor` | The table of contents of a long page (settings, a contract, docs): a link per section (`children` indented), the section being read marked while scrolling, a smooth scroll on click; sticky by itself (`position: sticky`, `offset`), so there is no separate Affix | hand-made lists of `#` links, scroll listeners per page |
| `ui-notice` | A message about the page: error with *Try again*, a pending state, a saved confirmation; `tone` neutral, success or error | `bg-error-container` blocks, banners, icons centered on wrapped text |
| `ui-empty-state` | Nothing to show yet, no results, all done: what will be here and how to start (`uiEmptyAction`) | "No data", an empty table |
| `ui-loading-state` | While a page or list loads from nothing | spinners in random places, skeletons per screen (parts whose shape is known: `ui-skeleton`) |

Copy helpers (`defineCopy`, `injectCopy`, `selectCopy`, `formatText`, `pluralText`) live here too: see
[rules/copy.md](https://github.com/loliveirawebdev/ligeirinho/blob/main/rules/copy.md).

## Screen patterns

`src/examples` composes the components into whole screens. Copy the composition, not the markup:

| Pattern | Scenario | What it shows |
|---|---|---|
| Form controls | `form-controls` (flow **Catalog**) | every Material form control at the compact scale and when to use each: text fields (icon, hint, error, disabled, clear button), text area, date, date range, time, select (one, several), autocomplete, radio, filter chips, checkbox, toggle, slider. Screens use Material directly |
| Buttons | `buttons` (flow **Catalog**) | every Material button at the compact scale and when to use each: the five text buttons by emphasis (filled, tonal, outlined, elevated, text) (plain, icon, icon at the end, disabled), icon buttons, FABs, the toggle group (also the segmented control: one choice among a few views or modes). Screens use Material's directives directly |
| Navigation | `navigation` (flow **Catalog**) | tabs (plain, with icons), the menu (icons, a submenu, disabled, the destructive item last), the context menu (right click or Shift+F10, at the pointer), the stepper (horizontal, vertical), the toolbar of a panel, the side sheet (`mat-drawer` at the end, over the list, the record's facts in `ui-detail-list`) |
| Feedback and overlays | `feedback-and-overlays` (flow **Catalog**) | the destructive confirmation (`ConfirmDialogs`), the bottom sheet of actions, the snack bar with *Undo*, progress bars (determinate, indeterminate, buffer), spinners (alone, in the button that started the work), tooltips, badges (a count, a dot) |
| Containers and lists | `containers-and-lists` (flow **Catalog**) | cards (outlined, raised; never filled) with their actions under a divider, the accordion, lists (icons, two lines, subheader, selection, dividers), the grid list, the tree |
| Back office list | `back-office-list` | shell, header with the primary action, filter bar, then exactly one of loading, error, empty or the table, *Show more* under it |
| Back office detail | `back-office-detail` | back link, the record's name as title with its actions, a notice when something needs attention, facts in titled sections (no cards) |
| Dashboard | `dashboard` | shell, header with the period as a toggle, the KPIs as a row split of `ui-statistic`s, the trend as an area `ui-chart` in a panel, recent records in `ui-data-table`; skeletons in place while loading |
| Sign in | `sign-in` | one-time-code sign-in without a password: the email, then the 6-digit code (`ui-otp-input`) with resend and change-email, in a centered card |
| Single-column task page | `task-list` (tasks area) | header with a count, input group, the list, the states |

## Testing with the harnesses

Each component has a harness in `@app/ui/testing`, so a view's test reads the screen the way the user does and
survives markup changes:

```ts
const { fixture } = await render(MemberListView, { inputs: { model: memberListScenarios.scenarios.full } });
const loader = TestbedHarnessEnvironment.loader(fixture);
const table = await loader.getHarness(DataTableHarness);
await table.openRow('Open Ana Souza');
```
