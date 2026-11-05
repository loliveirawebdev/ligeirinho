#!/usr/bin/env bash
# SessionStart: when the repository has .ligeirinho.yml, loads the flow and says where the rules are.
# Without the file, stays quiet.
set -euo pipefail
source "$(dirname "$0")/lib.sh"

read_hook_input
project_uses_ligeirinho || exit 0

context="$(cat "$LIGEIRINHO_PLUGIN_ROOT/FLOW.md")

## Where things are

- Rules (read the ones the task touches before planning or writing code): $LIGEIRINHO_PLUGIN_ROOT/rules/
- Ligeirinho scripts: $LIGEIRINHO_PLUGIN_ROOT/scripts/
  - \`state.sh <NNN-feature> <stage>\` records the current feature stage; \`state.sh --clear\` ends it.
  - \`gate.sh\` runs the project gate with a machine-wide lock and records the green-gate stamp.
- Project config: $(config_file)"

if [ "$(read_config adoption.enabled)" = "true" ]; then
  context="$context
- This project is in **adoption**: rules not yet met by old code are warnings; new code follows all of them."
fi

current_feature="$(read_state feature)"
if [ -n "$current_feature" ]; then
  features_dir="$(read_config docs.features)"
  context="$context

## Feature in progress

Feature \`$current_feature\`, stage \`$(read_state stage)\`. Resume from there (the note is in ${features_dir:-docs/features}/$current_feature.md)."
fi

add_session_context "$context"
