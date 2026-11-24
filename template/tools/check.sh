#!/usr/bin/env bash
# The gate, run inside the toolbox. Modes:
#   affected     only what changed since main (make check)
#   all          everything (make gate, CI)
#   integration  integration tests only
#   e2e          every e2e journey and responsive check
set -euo pipefail

mode="${1:-affected}"
nx() { pnpm exec nx "$@"; }

step() { printf '\n\033[1m▶ %s\033[0m\n' "$*"; }

base_commit() {
  git merge-base HEAD origin/main 2>/dev/null \
    || git merge-base HEAD main 2>/dev/null \
    || git rev-parse HEAD~1 2>/dev/null \
    || git rev-parse HEAD
}

scope_arguments() {
  if [ "$mode" = "affected" ]; then
    echo "affected --base=$(base_commit)"
  else
    echo "run-many --all"
  fi
}

# A change to infrastructure files can break anything, so it turns an affected run into a full one.
# So does running on main itself: there is nothing to compare with (a new project, CI on main).
infrastructure_changed() {
  [ "$mode" != "affected" ] && return 0
  [ "$(git rev-parse --abbrev-ref HEAD)" = "main" ] && return 0
  git diff --name-only "$(base_commit)" -- package.json pnpm-lock.yaml nx.json tsconfig.base.json \
    eslint.config.mjs compose.yaml docker prisma tools | grep -q .
}

reset_test_database() {
  step "Resetting the test database"
  MIGRATION_DATABASE_URL="$TEST_MIGRATION_DATABASE_URL" pnpm exec prisma migrate reset --force
  # The reset drops the schema, and the application user's grants with it.
  MIGRATION_DATABASE_URL="$TEST_MIGRATION_DATABASE_URL" pnpm exec prisma db execute --file docker/postgres/02-application-grants.sql
}

run_integration_tests() {
  reset_test_database
  step "Integration tests"
  # shellcheck disable=SC2046
  DATABASE_URL="$TEST_DATABASE_URL" nx $(scope_arguments) -t test-integration
}

# Which screens the responsive checks open. A full run checks every one. An affected run checks only the screens of
# the projects the change reaches (LIGEIRINHO_PREVIEW_ENTRIES, read by @ligeirinho/e2e-kit), unless it touched the
# app's own files (theme, styles, routes) or the e2e specs, which reach every screen.
choose_responsive_screens() {
  unset LIGEIRINHO_PREVIEW_ENTRIES
  [ "$mode" = "affected" ] || return 0
  if git diff --name-only "$(base_commit)" -- apps/web apps/e2e | grep -q .; then
    return 0
  fi
  local graph_dir roots entries
  graph_dir="$(mktemp -d)"
  nx graph --file="$graph_dir/graph.json" >/dev/null
  roots="$(nx show projects --affected --base="$(base_commit)" \
    | node -e '
      const nodes = require(process.argv[1]).graph.nodes;
      const listed = require("fs").readFileSync(0, "utf8").trim();
      // A JSON array when piped, one name per line on a terminal.
      const names = listed.startsWith("[") ? JSON.parse(listed) : listed.split("\n").filter(Boolean);
      console.log(names.map((name) => nodes[name]?.data.root).filter(Boolean).join(" "));
    ' "$graph_dir/graph.json")"
  rm -rf "$graph_dir"
  if [ -z "$roots" ]; then
    export LIGEIRINHO_PREVIEW_ENTRIES=""
    echo "Responsive checks: no screen is reached by this change"
    return 0
  fi
  # shellcheck disable=SC2046
  if entries="$(pnpm exec ligeirinho-preview-registry $(printf -- '--entries-in %s ' $roots))"; then
    export LIGEIRINHO_PREVIEW_ENTRIES="$entries"
    echo "Responsive checks only for the screens this change reaches: ${entries:-none}"
  fi
}

run_e2e() {
  choose_responsive_screens
  reset_test_database
  step "Building the API for e2e"
  nx build api
  step "E2E journeys and responsive checks"
  TEST_DATABASE_URL="$TEST_DATABASE_URL" nx e2e e2e
}

check_contract() {
  step "OpenAPI contract"
  nx run api:openapi
  pnpm exec spectral lint dist/openapi.json --fail-severity=warn
  pnpm exec ligeirinho-bruno drift --openapi dist/openapi.json --collection bruno
}

check_code() {
  step "Preview registry is up to date"
  pnpm exec ligeirinho-preview-registry --root libs --out apps/web/src/app/preview.registry.ts --check
  step "Lint, types, unit tests and build"
  # shellcheck disable=SC2046
  nx $(scope_arguments) -t lint typecheck test build
  step "Copied code"
  pnpm exec ligeirinho-jscpd apps libs tools
  step "Secrets"
  gitleaks git --no-banner --redact .
}

case "$mode" in
  integration)
    run_integration_tests
    ;;
  e2e)
    run_e2e
    ;;
  affected | all)
    if infrastructure_changed; then
      mode="all"
    fi
    check_code
    run_integration_tests
    check_contract
    run_e2e
    ;;
  *)
    echo "usage: tools/check.sh [affected|all|integration|e2e]" >&2
    exit 2
    ;;
esac

printf '\n\033[1;32m✔ %s checks passed\033[0m\n' "$mode"
