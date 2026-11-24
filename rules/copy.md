# Copy

How the words on a screen are written, kept and translated, so labels are right the first time and stay right. Same
rules for every language: they describe structure and register, not word lists. The lint checks what a machine can
in any language; the agent reviews the rest against this file before the user sees a screen.

## The register: formal and impersonal

The product talks like a well-run institution (a bank, a government service, a professional tool), not like a social
app. `copy.register` in `.ligeirinho.yml` is `formal` by default; `neutral` relaxes only the address form.

| Rule | Why |
|---|---|
| **Describe the thing and the action; leave the reader out when possible:** *Changes saved*, *The file could not be uploaded*, not *You did it*, *We couldn’t upload your file* | impersonal text stays correct for every reader and every situation |
| **When the reader must be addressed, use the language’s formal or neutral form** (French *vous*, German *Sie*, Spanish *usted*, Portuguese without *você* where the sentence allows it); never the intimate form | the model knows each language’s convention; the config only says which register |
| **No first person for the product** (*we*, *our team*, *I*) and no feelings (*Sorry*, *Oops*, *Yay*, *Great*) | a tool does not apologize or celebrate; it says what happened |
| **No exclamation marks, emoji, jokes, slang, marketing verbs** (*unlock*, *supercharge*, *seamless*) or text in capitals | they are the clearest tells of chatty, generated copy (the lint catches `!`, emoji and capitals) |
| **Sentence case** for titles, labels and buttons, in every language that has case | Title Case is an English habit and reads as shouting elsewhere |
| **Typography of the locale:** the ellipsis character (…), the locale’s quotes (“ ” in English, « » in French and Spanish when the project chooses them) and apostrophe (’) | straight quotes and three dots look unedited (the lint catches `...` and straight quotes) |

## Structures that work in every language

| Element | Structure | Examples (English) |
|---|---|---|
| Page title | the thing, a noun | *Members*, *Billing*, not *My members*, *Members manager* |
| Button | verb + object, short (at most 4 words; the lint checks keys ending in `Action`) | *Invite member*, *Delete invoice*; never *OK*, *Submit*, *Yes* |
| Button that opens another step | the same, ending in … | *Remove member…* |
| In-progress state | the button’s verb, ending in … | *Inviting…* |
| Field label | a short noun, no colon | *Email*, *Due date* |
| Placeholder | an example or a hint, never the label or the button | *name@company.com* |
| Error | what happened, then what to do; no blame, no codes | *The payment was declined. Use another card or contact the bank.* |
| Empty state | what will be here, then how to start; different per case | first use: *No members yet*; no results: *No members match “ana”*; all done: *All done* |
| Confirmation dialog | the title is the question, the button repeats verb and object | *Remove Ana Souza?* · *Cancel* · *Remove member* |
| Result | the past state, in a snack bar | *Member removed* |
| Counts | digits, real plurals (the locale’s plural forms), zero in words | *1 open task*, *2 open tasks*, *All done* |
| Dates | relative while recent, then the locale’s short date | *Today*, *Yesterday*, *Mar 3* |

## One term per concept: the glossary

`docs/glossary.md` holds the product’s terms, one row per concept, one column per locale of `copy.locales`. If the
thing is a *member*, it is never a *user*, *person* or *account* on another screen, in any language. A new term goes
into the glossary before it goes on a screen; translations come from the glossary, not from a fresh guess.

## Keys, not strings

| Rule | Why |
|---|---|
| **No text in templates.** Every string a screen shows lives in the area’s `*.copy.ts`, one `defineCopy({ en: {...} })` per screen or area, and reaches the template through the view-model or an input (the lint `@ligeirinho/no-literal-text` fails any text, `aria-label`, `placeholder` or `title` written in a template) | one place per string is what makes it reviewable and translatable |
| **A key names the meaning, not the place:** `inviteAction`, `emailLabel`, `loadFailedTitle`; a key ending in `Action` is a button label | keys outlive layouts |
| **The same data, the same key, on every screen.** The label of a value is the label of the field that collected it: the detail page shows *Email* because the form asked for *Email* | the same thing named twice drifts into two names |
| **Whole sentences with `{placeholders}`, never concatenated pieces:** `'Complete “{title}”'`, plurals as `{ one, other }` (plus `few`, `many`… where the locale needs them) | word order and plural rules change between languages |
| **Every locale has every key and the same placeholders** (`@ligeirinho/copy-text`, from `copy.locales`) | a missing key ships the source language in the middle of a translated screen |

The view-model receives the copy (`buildXViewModel(state, copy)`) and formats with `formatText` and `pluralText`
from `@app/ui`; the page gets it with `injectCopy(xCopy)`, in the app’s `LOCALE_ID`.

## The flow

1. **Copy table before the view.** With the plan, the agent writes the screen’s keys in `copy.source` and shows them
   as a table (key, text, where it appears) with the glossary terms it uses. The user approves the words here, once,
   instead of renaming labels after the screen is built.
2. **Translate from the approved source,** with the glossary, into every locale of `copy.locales`. The lint fails
   missing keys and mismatched placeholders.
3. **Review on the screen** (the `preview` stage): the real texts in every scenario, the long ones included, checked
   against this file.

**Enforced by:** `@ligeirinho/no-literal-text` and `@ligeirinho/copy-text` in the lint; the copy table in the plan and
the review in the `preview` stage for tone and structure.
