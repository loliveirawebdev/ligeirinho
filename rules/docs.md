# Docs

## A rule lives in one place: the area doc

`docs/areas/<area>.md` holds the area's **current** rules and the why behind each one. When a rule changes, **edit
it in place**. Appending "from X on, this changed" below the old text is forbidden.

**Why:** whoever reads it (a person or an agent) needs to know how things are today, not rebuild the history.
Rules scattered across specs make every session relearn the context.

The area doc ends with a **Glossary**: the business terms and the name each has in the code. National terms kept
untranslated (`cnpj`, `pregao`) are listed there with why they have no English equivalent (code.md, "Code in
English").

**Enforced by:** the close checklist: if the feature changed a rule, the area doc was edited **in the same
commit** and nothing left in it says otherwise.

## The feature note

`docs/features/NNN-name.md`, about one page:

1. **Request** — what the user asked for, in their words.
2. **Clarify** — questions and answers.
3. **Decisions** — what was decided and why (including what the agent decided on its own).
4. **Contract** — routes, fields, errors (or a link to the OpenAPI).
5. **Areas** — a link to the doc of each area touched.

The note **holds no rules** (rules go in the area doc). If a decision is reversed later, the note gets
"superseded by [NNN-other](NNN-other.md)" next to the decision.

**Enforced by:** the stop hook doesn't let the close stage end without the note.

## A lean agent instructions file

`AGENTS.md` (plus `CLAUDE.md` / `GEMINI.md` if they exist) holds only three things:

1. "This repo uses ligeirinho."
2. The `make` commands.
3. What's specific to the project (the domain in one sentence, external integrations, known pitfalls).

Everything else comes from the plugin. No feature summaries in the instructions file.

**Why:** an instructions file that every feature appends to grows to hundreds of lines nobody rewrites, and the
agent reads all of it every session.

**Enforced by:** the close checklist: did the instructions file grow? It has to be something project-specific;
otherwise it goes to the area doc.
