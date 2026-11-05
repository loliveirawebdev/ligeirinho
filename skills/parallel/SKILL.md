---
name: parallel
description: Splits the independent chunks of an approved ligeirinho plan across parallel sessions or subagents, each in its own git worktree, and merges them at the end. Use during the build when the plan has two or more chunks that don't depend on each other or touch the same files.
---

# Chunks in parallel

## When it's worth it

Two or more chunks that: don't need each other's results, don't touch the same files and can be committed
separately. If only one is left, do it here. If your agent can't run parallel sessions or subagents, do the chunks
one after another.

## Brief for each session

Each session starts in its own git worktree, from the current commit, and gets as its brief:

1. "This repo uses ligeirinho. Do only the chunk below, in the `build` skill loop."
2. The **whole approved plan** (for context) and, highlighted, **its chunk**: what changes, the tests, the files it
   may touch.
3. "Don't touch files outside the chunk. Don't push. When done, reply with the branch name and the list of
   commits."

## Machine resources

`gate.sh` has a lock: only one gate runs at a time on the machine, the others wait. Fast tests (`commands.test`)
run in the always-up toolbox, with `docker compose exec`. If something dies with exit 137, it's memory: wait for
the other one to finish, don't hunt for a bug.

## Merge

When they're all done:

1. Check each branch's diff against its chunk in the plan.
2. Merge the branches into the feature branch one at a time, running `commands.test` after each one.
3. Conflicts: resolve them keeping both chunks and run the tests again.
4. Move on to the close.
