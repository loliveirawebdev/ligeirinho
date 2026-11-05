#!/usr/bin/env bash
# Runs the project gate (commands.gate in .ligeirinho.yml) with:
#   - a machine-wide lock: one gate at a time across parallel sessions (otherwise the Docker VM runs out of memory);
#   - an out-of-memory warning when something dies with exit 137;
#   - a green-gate stamp (.ligeirinho/gate-green = current commit) that the close stage checks.
# Usage: gate.sh [full]   (no argument runs commands.gate; "full" runs commands.full_gate)
set -uo pipefail
source "$(dirname "$0")/lib.sh"

if ! project_uses_ligeirinho; then
  echo "ligeirinho: this repository has no .ligeirinho.yml." >&2
  exit 1
fi

config_key="commands.gate"
[ "${1:-}" = "full" ] && config_key="commands.full_gate"
gate_command="$(read_config "$config_key")"
if [ -z "$gate_command" ]; then
  echo "ligeirinho: .ligeirinho.yml does not define $config_key." >&2
  exit 1
fi

cd "$(project_root)" || exit 1
if [ -n "$(git status --porcelain)" ]; then
  echo "ligeirinho: there are uncommitted changes. The gate runs on a commit so the stamp means something." >&2
  exit 1
fi

lock_dir="${LIGEIRINHO_LOCK:-$HOME/.cache/ligeirinho/gate.lock}"
mkdir -p "$(dirname "$lock_dir")"

lock_is_abandoned() {
  local owner
  owner="$(cat "$lock_dir/pid" 2>/dev/null || echo)"
  [ -z "$owner" ] || ! kill -0 "$owner" 2>/dev/null
}

announced_wait=false
until mkdir "$lock_dir" 2>/dev/null; do
  if lock_is_abandoned; then
    rm -rf "$lock_dir"
    continue
  fi
  if [ "$announced_wait" = false ]; then
    echo "ligeirinho: another gate is running ($(cat "$lock_dir/project" 2>/dev/null)). Waiting for its turn…"
    announced_wait=true
  fi
  sleep 5
done
echo $$ > "$lock_dir/pid"
project_root > "$lock_dir/project"
trap 'rm -rf "$lock_dir"' EXIT

echo "ligeirinho: running the gate: $gate_command"
bash -c "$gate_command"
exit_code=$?

if [ "$exit_code" -eq 0 ]; then
  ensure_state_dir
  git rev-parse HEAD > "$(state_dir)/gate-green"
  echo "ligeirinho: gate green at $(git rev-parse --short HEAD)."
  exit 0
fi

if [ "$exit_code" -eq 137 ]; then
  echo "ligeirinho: the gate died with exit 137 (out of memory), most likely not a bug." >&2
  echo "Check the Docker VM memory and whether a dev stack is still up." >&2
fi
echo "ligeirinho: gate red (exit $exit_code)." >&2
exit "$exit_code"
