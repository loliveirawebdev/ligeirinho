#!/usr/bin/env bash
# Stop: while a feature is in the close stage, the agent can't end its turn without
#   1. a green gate on the current commit, with a clean tree;
#   2. the feature note in docs/features/.
# In any other stage it stays out of the way (the agent must stop to ask questions in clarify, plan, etc.).
set -euo pipefail
source "$(dirname "$0")/lib.sh"

read_hook_input
project_uses_ligeirinho || exit 0
[ "$(jq -r '.stop_hook_active // false' <<<"$HOOK_INPUT")" = "true" ] && exit 0
[ "$(read_state stage)" = "close" ] || exit 0

feature="$(read_state feature)"
cd "$(project_root)"
pending=()

current_commit="$(git rev-parse HEAD 2>/dev/null || echo no-commit)"
gate_stamp="$(state_dir)/gate-green"
if [ ! -f "$gate_stamp" ] || [ "$(cat "$gate_stamp")" != "$current_commit" ]; then
  pending+=("the gate is not green on the current commit: run $LIGEIRINHO_PLUGIN_ROOT/scripts/gate.sh")
fi
if [ -n "$(git status --porcelain 2>/dev/null)" ]; then
  pending+=("there are uncommitted changes")
fi
features_dir="$(read_config docs.features)"
features_dir="${features_dir:-docs/features}"
if [ ! -f "$features_dir/$feature.md" ]; then
  pending+=("the feature note $features_dir/$feature.md is missing")
fi

[ "${#pending[@]}" -eq 0 ] && exit 0

# Antigravity has no stop_hook_active flag: block only once for the same situation to avoid loops.
situation="$current_commit $(printf '%s;' "${pending[@]}")"
last_block="$(state_dir)/last-stop-block"
if [ "$HOOK_AGENT" = "antigravity" ]; then
  [ -f "$last_block" ] && [ "$(cat "$last_block")" = "$situation" ] && exit 0
  ensure_state_dir
  echo "$situation" > "$last_block"
fi

block_stop "ligeirinho: feature $feature is in the close stage and can't finish yet: $(printf '%s; ' "${pending[@]}")fix that and, once everything is done, run state.sh --clear. If the user asked to stop midway, run state.sh $feature build to leave the close stage."
