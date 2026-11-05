#!/usr/bin/env bash
# Records which stage the current feature is in. State lives in .ligeirinho/ (ignored by git).
#   state.sh 003-team-invites plan
#   state.sh --clear
set -euo pipefail
source "$(dirname "$0")/lib.sh"

valid_stages="clarify plan preview build close"
ensure_state_dir

if [ "${1:-}" = "--clear" ]; then
  rm -f "$(state_file)" "$(state_dir)/gate-green" "$(state_dir)/last-stop-block"
  echo "ligeirinho: no feature in progress."
  exit 0
fi

feature="${1:?usage: state.sh <NNN-feature-name> <stage> | --clear}"
stage="${2:?stages: $valid_stages}"

if ! grep -qw "$stage" <<<"$valid_stages"; then
  echo "ligeirinho: stage '$stage' does not exist. Use one of: $valid_stages" >&2
  exit 1
fi
if ! grep -Eq '^[0-9]{3}-[a-z0-9]+(-[a-z0-9]+)*$' <<<"$feature"; then
  echo "ligeirinho: the feature name must be NNN-kebab-case-name (e.g. 003-team-invites)." >&2
  exit 1
fi

jq -n --arg feature "$feature" --arg stage "$stage" '{feature: $feature, stage: $stage}' > "$(state_file)"
echo "ligeirinho: feature $feature is at stage $stage."
