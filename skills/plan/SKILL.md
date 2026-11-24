---
name: plan
description: Writes the short plan for a ligeirinho feature (domain rules, contract, screens, researched risks with sources, tests, parallel chunks) and asks the user to approve it. Use after clarify, before any code.
---

# Plan

Short. No documents nobody rereads. Only what someone needs to build and review it.

## Before writing

1. Read the rules the feature touches in the plugin's `rules/` (at least `architecture`, `security`, `scale` and,
   if there's a screen, `mvvm`, `responsive`, `design` and `copy`; if there's a route, `rest-api`).
   With a screen, also read the project's catalog (`libs/ui/README.md`) and its glossary (`docs/glossary.md`).
2. **Search the web** for how the problem is usually solved: established patterns, official docs for the stack's
   libraries, OWASP (API Top 10, ASVS, Cheat Sheets). Keep the URLs.

## Format (in this order, each section only if the feature has it)

```markdown
## Plan — NNN-name

### What changes and why
New or changed domain rules, in business sentences. Areas touched.

### API contract
| Method | Route | Who can | Body / query | Responses |
Errors in Problem Details format, with the `type` of each business error.

### Screens
For each screen: the screen pattern it follows and the catalog components it uses (`libs/ui/README.md`; a missing
pattern is a chunk of its own, see the `catalog` skill), view, view-model (fields), scenarios (empty, full, error,
read-only…), page (what it fetches).

### Copy
One table per screen, in `copy.source` (`.ligeirinho.yml`), following rules/copy.md: key, text, where it appears.
Terms come from `docs/glossary.md`; a new term gets its glossary row here, with every locale of `copy.locales`.
| Key | Text | Where |

### Risks and patterns
Security, scale and zero trust: for each risk, the chosen pattern and the source (URL).
Sensitive operations that produce audit events. New queries and the index for each. Idempotency where it applies.

### Technical decisions
What you decided on your own and why (one line each).

### Tests
- Unit: …
- Component: …
- Integration / authorization: who can, who can't, unauthenticated, another owner
- E2E: journeys touched (a new critical journey needs e2e)

### Chunks
1. … (independent)
2. … (independent)
3. … (depends on 1)
```

## Approval

Show the plan and ask the user to approve it, the copy tables included: the words are approved here, once, not
renamed after the screen is built. Adjust until they do. Then:

1. Save the approved plan in the feature note (**Decisions** and **Contract** sections).
2. Run `scripts/state.sh NNN-name preview` (or `build`, if there are no screens).
3. Move on to the `preview` or `build` skill.
