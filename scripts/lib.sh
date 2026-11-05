#!/usr/bin/env bash
# Shared functions for ligeirinho hooks and scripts.
# Only depends on bash, git, awk and jq (jq ships with macOS 15+).
#
# Hooks run under three agents, each with its own payload and output format:
#   - Claude Code and Codex: snake_case payload (tool_name, tool_input, cwd, stop_hook_active);
#     block a tool with exit 2 + stderr; block Stop with {"decision":"block"}; context on plain stdout.
#   - Antigravity: camelCase payload (toolCall.{name,args}, workspacePaths); everything is JSON on stdout:
#     {"decision":"deny"} for tools, {"decision":"continue"} for Stop, {"injectSteps":[...]} for context.

LIGEIRINHO_PLUGIN_ROOT="${PLUGIN_ROOT:-${CLAUDE_PLUGIN_ROOT:-$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)}}"
HOOK_INPUT='{}'
HOOK_AGENT="claude-compatible"
HOOK_PROJECT_DIR=""

read_hook_input() {
  local raw_input
  raw_input="$(cat)"
  if [ -n "$raw_input" ] && jq -e . >/dev/null 2>&1 <<<"$raw_input"; then
    HOOK_INPUT="$raw_input"
  fi
  if jq -e 'has("conversationId") or has("toolCall") or has("workspacePaths")' >/dev/null <<<"$HOOK_INPUT"; then
    HOOK_AGENT="antigravity"
    HOOK_PROJECT_DIR="$(jq -r '.workspacePaths[0] // empty' <<<"$HOOK_INPUT")"
  else
    HOOK_PROJECT_DIR="$(jq -r '.cwd // empty' <<<"$HOOK_INPUT")"
  fi
}

project_root() {
  local directory="${HOOK_PROJECT_DIR:-${CLAUDE_PROJECT_DIR:-$PWD}}"
  git -C "$directory" rev-parse --show-toplevel 2>/dev/null || echo "$directory"
}

config_file() {
  echo "$(project_root)/.ligeirinho.yml"
}

project_uses_ligeirinho() {
  [ -f "$(config_file)" ]
}

# Reads "section.key" from a two-level YAML file without needing a parser.
# Example: read_config commands.test
read_config() {
  local path="$1"
  local section="${path%%.*}"
  local key="${path#*.}"
  awk -v section="$section" -v key="$key" '
    function print_value(value) {
      sub(/[[:space:]]+#.*$/, "", value)
      gsub(/^["\x27]|["\x27]$/, "", value)
      print value
    }
    /^[^[:space:]#][^:]*:/ {
      name = $0; sub(/:.*/, "", name)
      inside = (name == section)
      next
    }
    inside && $0 ~ "^[[:space:]]+" key ":" {
      value = $0; sub(/^[^:]*:[[:space:]]*/, "", value); print_value(value); exit
    }
  ' "$(config_file)"
}

state_dir() {
  echo "$(project_root)/.ligeirinho"
}

ensure_state_dir() {
  mkdir -p "$(state_dir)"
  [ -f "$(state_dir)/.gitignore" ] || echo '*' > "$(state_dir)/.gitignore"
}

state_file() {
  echo "$(state_dir)/state.json"
}

read_state() {
  local field="$1"
  [ -f "$(state_file)" ] || return 0
  jq -r --arg field "$field" '.[$field] // empty' "$(state_file)"
}

# Shell command the agent is about to run (empty when the tool is not a shell).
tool_shell_command() {
  if [ "$HOOK_AGENT" = "antigravity" ]; then
    jq -r 'select(.toolCall.name == "run_command") | [.toolCall.args | .. | strings] | join("\n")' <<<"$HOOK_INPUT"
    return
  fi
  jq -r 'select(.tool_name == "Bash") | .tool_input.command // empty' <<<"$HOOK_INPUT"
}

# Prints the text being written to files whose path matches the given regex.
# Handles Claude Code (Write/Edit/MultiEdit), Codex (apply_patch) and Antigravity (any args).
text_written_to_files_matching() {
  local path_regex="$1"
  if [ "$HOOK_AGENT" = "antigravity" ]; then
    jq -r --arg regex "$path_regex" '
      [.toolCall.args // {} | .. | strings] as $values
      | if any($values[]; test($regex)) then $values | join("\n") else empty end
    ' <<<"$HOOK_INPUT"
    return
  fi
  if [ "$(jq -r '.tool_name // empty' <<<"$HOOK_INPUT")" = "apply_patch" ]; then
    jq -r '.tool_input.command // .tool_input.input // empty' <<<"$HOOK_INPUT" \
      | awk -v regex="$path_regex" '
          /^\*\*\* (Add|Update) File: / { path = $0; sub(/^\*\*\* (Add|Update) File: /, "", path); inside = (path ~ regex); next }
          /^\*\*\* / { inside = 0; next }
          inside && /^\+/ { print substr($0, 2) }
        '
    return
  fi
  jq -r --arg regex "$path_regex" '
    select((.tool_input.file_path // "") | test($regex))
    | [.tool_input.content, .tool_input.new_string, (.tool_input.edits // [] | .[].new_string)]
    | map(select(. != null)) | join("\n")
  ' <<<"$HOOK_INPUT"
}

# Blocks the tool call with a reason the agent reads and acts on.
deny_tool() {
  local reason="$1"
  if [ "$HOOK_AGENT" = "antigravity" ]; then
    jq -n --arg reason "$reason" '{decision: "deny", reason: $reason}'
    exit 0
  fi
  echo "$reason" >&2
  exit 2
}

# Keeps the agent working instead of ending the turn.
block_stop() {
  local reason="$1"
  if [ "$HOOK_AGENT" = "antigravity" ]; then
    jq -n --arg reason "$reason" '{decision: "continue", reason: $reason}'
  else
    jq -n --arg reason "$reason" '{decision: "block", reason: $reason}'
  fi
  exit 0
}

# Adds text to the agent context at session start.
add_session_context() {
  local context="$1"
  if [ "$HOOK_AGENT" = "antigravity" ]; then
    jq -n --arg context "$context" '{injectSteps: [{systemMessage: $context}]}'
  else
    printf '%s\n' "$context"
  fi
}
