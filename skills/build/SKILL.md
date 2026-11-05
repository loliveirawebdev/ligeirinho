---
name: build
description: Builds the approved ligeirinho feature chunk by chunk, each in the loop failing test → code → green tests → checklist on the diff → commit. Use after the plan (and preview) are approved, or for a small change.
---

# Build

## Loop per chunk

For each chunk in the plan, in order (independent ones can go to the `parallel` skill):

1. **Failing test.** Write the chunk's tests from the plan's list, through public behavior. Run them and watch them
   fail for the right reason.
2. **Code.** The minimum to pass, following the layers (`rules/architecture.md`) and MVVM (`rules/mvvm.md`). Fakes
   instead of mocks.
3. **The chunk's tests green.** Run `commands.test` from `.ligeirinho.yml`.
4. **Checklist on the diff** (below). Fix whatever fails.
5. **Commit.** A short message in the form `type(area): what changed` (e.g. `feat(registrations): cancel with
   refund`). The hook runs the tests first; if it blocks, fix and try again. Never get around the hook.

One chunk per commit. No commits with red tests, no "I'll fix it later".

## Checklist on the diff (before every commit)

Run `git diff --staged` and check:

- [ ] Explicit names, in the business language; no `data`, `tmp`, `res`, `aux`, abbreviations.
- [ ] No `any`, `!` or "trust me" casts.
- [ ] Validation only at the edge; typed errors, no `catch` that hides them.
- [ ] Small functions; no boolean that changes behavior.
- [ ] Dependencies point inward only; views without services; presentation logic in the view-model.
- [ ] Nothing repeated (literally or by meaning) from what already exists in the repo: search before creating.
- [ ] No new `utils`/`helpers`/`manager`.
- [ ] New route: denied by default, tests for who can and who can't, contract matching the plan.
- [ ] Lists paginated; new queries with an index; no N+1.
- [ ] Secrets out of code, logs and URLs; sensitive operations audited.
- [ ] No dead code, no TODOs, comments only for the why.
- [ ] Raw elements only in the design system; nothing that depends on hover; touch targets ≥ 44 px.

If your agent has no hooks, also run `commands.test` yourself right before each commit and don't commit if it fails.

## Questions midway

Did a question come up that changes the product? Stop and ask (clarify format). Technical details: decide and note
them for the feature note.

## End of the build

With every chunk committed, run `scripts/state.sh NNN-name close` and move on to the `close` skill. A small change
(no feature) ends at the commit.
