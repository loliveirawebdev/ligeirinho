# This repository uses ligeirinho

Reply in the user's language. The process is **highly opinionated**: the rules in `rules/` always apply, without
anyone having to ask for quality, security or tests. The user just talks; nobody has to run a command.

## Sized to the request

Before acting, classify the request:

| Request | What to do |
|---|---|
| **Question** (how does it work, why, where is it) | just answer. No plan, no commit. |
| **Small change** (one or a few files, no new rule, no new route, no new screen) | failing test → code → green tests → commit. No clarify or plan unless a question that changes the product comes up. |
| **Feature** (new rule, new route, new screen, more than one area, or an open product question) | the `feature` skill: clarify → plan → preview → build → close. |

If you can't tell a small change from a feature, ask the user in one sentence.

## Stages of a feature (each one is a skill)

1. **`clarify`** — questions, one at a time, most important first, always with a recommendation and options. No
   limit. Stop when nothing is left that changes the product, a rule, the contract or the experience.
2. **`plan`** — a short plan: domain rules, API contract, screens and view-models, risks and patterns
   (researched, with sources), test list, parallel chunks. The user approves it.
3. **`preview`** — new screens in the previewer with their scenarios, side by side. The user approves them.
4. **`build`** — chunk by chunk: test first → code → green tests → checklist on the diff → commit. Independent
   chunks can go to parallel sessions (`parallel`).
5. **`close`** — green gate, e2e for the journeys touched, diff review against the rules, feature note, area doc
   updated.

The stages chain together, but none is mandatory when it makes no sense (a back-end-only feature has no preview).
Reuse what was already decided in the conversation and in the notes in `docs/features/`. **Any stage goes back to
asking** if a question comes up that changes the product.

## Where the user steps in

Only for decisions: answering clarify, approving the plan, approving the screens, and the push. Technical details
are yours to decide; explain them in the plan. **Never push unless the user asks.**

## Hooks already in place (where the agent supports them)

- Before every `git commit`, the project's fast tests run; if they fail, the commit is blocked.
- Writing `inject(` or a constructor with dependencies in a `*.view.ts` file is blocked (views are pure).
- With a feature in the close stage, the turn can't end without a green gate on the current commit and the
  feature note.

If your agent has no hooks, apply these three checks yourself.
