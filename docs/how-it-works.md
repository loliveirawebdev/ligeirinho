# How ligeirinho works

## Invisible by default

1. The repository has a `.ligeirinho.yml` and enables the plugin for the agents the team uses
   ([agents](agents.md)).
2. At the start of every session, the `SessionStart` hook sees `.ligeirinho.yml` and adds to the context the flow
   ([FLOW.md](../FLOW.md)), where the rules are, and the feature in progress, if any.
3. Skills trigger from the request, sized to it: a question just gets an answer; a small change gets tested and
   committed; a feature goes through clarify → plan → preview → build → close.
4. The skills (`feature`, `clarify`, `plan`, `preview`, `build`, `parallel`, `close`, `init`) can also be called
   by hand as slash commands.

## Hooks

| Script | Event | What it does |
|---|---|---|
| `session-start.sh` | `SessionStart` | loads the flow; says which feature and stage are in progress |
| `before-commit.sh` | `PreToolUse` on the shell with `git commit` | runs `commands.test`; blocks the commit if it fails (reports exit 137 as memory) |
| `pure-view.sh` | `PreToolUse` on file edits to `*.view.ts` | blocks `inject()` and constructors with dependencies |
| `stop.sh` | `Stop` | with the feature in `close`, the turn can't end without a green gate on the current commit, a clean tree and the feature note |

## Scripts the agent calls

- `scripts/state.sh NNN-name <stage>` / `--clear`: stores the stage in `.ligeirinho/state.json`.
- `scripts/gate.sh [full]`: runs the gate with a machine-wide lock (one gate at a time across parallel sessions),
  translates exit 137 and writes `.ligeirinho/gate-green` with the commit.

## Adoption

- **Existing project:** ask "adopt ligeirinho here" (the `init` skill, adoption mode): `.ligeirinho.yml` with
  `adoption.enabled: true`, plugin settings, area and feature docs, a lean instructions file.
- **New project:** the `template/` doesn't exist yet (next step).
