---
name: close
description: Closes a ligeirinho feature - green gate, e2e for the journeys touched, review of the whole diff against the rules, feature note and updated area doc. Use once every build chunk is committed.
---

# Close

The stop hook won't let the turn end while the feature is in `close` without a green gate on the current commit and
without the note.

## Steps

1. **Review the whole diff** of the feature (`git diff <base>...HEAD`) against the rules, with the build checklist
   plus:
   - repetition **by meaning** with the rest of the repo (what jscpd doesn't catch): look for similar functions,
     components and rules outside the diff;
   - every item in the plan's test list exists;
   - every new route has its authorization tests; every new critical journey has e2e;
   - every new or changed screen passes the review in `rules/design.md` in its final state, not just at preview;
   - no rule was left out of the area doc.
   Fix what you find (with a test, if it's behavior) and commit.
2. **Area doc** (`docs/areas/<area>.md`): if the feature changed a rule, **edit it in place**, with the why. Delete
   whatever became false. No "from X on, this changed".
3. **Feature note** (`docs/features/NNN-name.md`), about one page: Request · Clarify · Decisions (and why) ·
   Contract · Areas (links). No rules. If it reversed a decision from an older feature, mark it there as
   "superseded by [NNN-name](NNN-name.md)".
4. **Agent instructions file** (`AGENTS.md` and friends): only if something project-specific came up (a new
   command, a new integration). No feature summary.
5. Commit docs **in the same commit** as the rule change when possible; otherwise, in a `docs(area): …` commit
   right after.
6. **Gate**: run `scripts/gate.sh` (machine lock and stamp). Red → fix, commit, run it again.
7. With the gate green, run `scripts/state.sh --clear`.
8. Tell the user in a few lines what was done and ask whether you can push. **Never push unless they ask.**
