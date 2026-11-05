---
name: feature
description: Runs a whole ligeirinho feature (clarify → plan → preview → build → close). Use when the request brings a new rule, a new route, a new screen, touches more than one area or has an open product question, in a repository with .ligeirinho.yml. Don't use it for questions or small changes.
---

# Feature

You run the feature end to end. The user only steps in for decisions.

## 1. Open

1. Check that it really is a feature (see the table in the flow). If it's a small change, do the short loop and
   stop here.
2. Pick the number: the next free `NNN` in `docs/features/` (the folder in `docs.features` of `.ligeirinho.yml`).
   A short kebab-case name in the business language (e.g. `004-team-invites`).
3. Read what already exists and may have decided something: the docs of the areas touched (`docs/areas/`), notes
   from related features, the project's agent instructions file.
4. Run `scripts/state.sh NNN-name clarify` (the scripts path is in the session context).

## 2. Chain the stages

| Stage | Skill | Can skip when | Records state with |
|---|---|---|---|
| Clarify | `clarify` | the request already answers everything that changes the product | `clarify` |
| Plan | `plan` | never, in a feature | `plan` |
| Preview | `preview` | the feature has no new or changed screen | `preview` |
| Build | `build` (+ `parallel`) | never | `build` |
| Close | `close` | never | `close` |

When you skip a stage, say why in one line.

## 3. Go back when needed

At any stage, did a question come up that changes the product, a rule, the contract or the experience? Stop and ask
(the clarify way: one question, a recommendation and options). If the answer changes the approved plan, show only
the part that changed and ask for approval again.
