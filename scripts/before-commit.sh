#!/usr/bin/env bash
# PreToolUse (shell): before any `git commit`, runs the project's fast tests.
# If they fail, blocks the commit and hands the output back to the agent to fix.
set -euo pipefail
source "$(dirname "$0")/lib.sh"

read_hook_input
project_uses_ligeirinho || exit 0

shell_command="$(tool_shell_command)"

# Only acts on `git commit` (including `git -C dir commit` and chained with && or ;).
if ! grep -Eq '(^|[;&|[:space:]])git([[:space:]]+-C[[:space:]]+[^[:space:]]+)?[[:space:]]+commit([[:space:]]|$)' <<<"$shell_command"; then
  exit 0
fi

test_command="$(read_config commands.test)"
if [ -z "$test_command" ]; then
  deny_tool "ligeirinho: .ligeirinho.yml does not define commands.test, so tests can't be checked before the commit."
fi

cd "$(project_root)"
set +e
test_output="$(bash -c "$test_command" 2>&1)"
exit_code=$?
set -e
[ "$exit_code" -eq 0 ] && exit 0

reason="ligeirinho: commit blocked, tests failed (\`$test_command\`)."
if [ "$exit_code" -eq 137 ]; then
  reason="$reason
Exit 137: the process was killed for lack of memory, most likely not a bug. Check whether another gate is running."
fi
reason="$reason

$(tail -n 80 <<<"$test_output")"
deny_tool "$reason"
