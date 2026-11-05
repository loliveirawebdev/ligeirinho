#!/usr/bin/env bash
# PreToolUse (file edits): views (*.view.ts) are pure.
# Blocks inject() and constructors with parameters. See rules/mvvm.md.
set -euo pipefail
source "$(dirname "$0")/lib.sh"

read_hook_input
project_uses_ligeirinho || exit 0

new_view_text="$(text_written_to_files_matching '\.view\.ts$')"
[ -n "$new_view_text" ] || exit 0

violations=()
grep -Eq '(^|[^[:alnum:]_])inject[[:space:]]*(<[^>]*>)?[[:space:]]*\(' <<<"$new_view_text" \
  && violations+=("uses inject()")
grep -Eq 'constructor[[:space:]]*\([[:space:]]*[^)[:space:]]' <<<"$new_view_text" \
  && violations+=("has a constructor with dependencies")

[ "${#violations[@]}" -eq 0 ] && exit 0

violation_list="${violations[0]}"
[ "${#violations[@]}" -gt 1 ] && violation_list="$violation_list and ${violations[1]}"

deny_tool "ligeirinho: a view (*.view.ts) $violation_list.
A view is pure: it receives the view-model through input() and emits intents through output().
The page (*.page.ts) injects services and fetches data; presentation logic goes in the view-model (*.view-model.ts).
See $LIGEIRINHO_PLUGIN_ROOT/rules/mvvm.md"
