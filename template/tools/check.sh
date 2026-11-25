#!/usr/bin/env bash
# The gate, run inside the toolbox. Modes:
#   affected     only what changed since origin/main (make check, local): never widens to a full run
#   all          everything (make gate, CI)
#   integration  integration tests only
#   e2e          every e2e journey and responsive check (on demand)
set -euo pipefail

mode="${1:-affected}"
nx() { pnpm exec nx "$@"; }

step() { printf '\n\033[1m▶ %s\033[0m\n' "$*"; }

# What a local run compares with: the last commit CI has seen. On main with nothing unpushed that's HEAD, so only
# the uncommitted changes are checked.
base_commit() {
  git merge-base HEAD origin/main 2>/dev/null \
    || git merge-base HEAD main 2>/dev/null \
    || git rev-parse HEAD
}

scope_arguments() {
  if [ "$mode" = "affected" ]; then
    echo "affected --base=$(base_commit)"
  else
    echo "run-many --all"
  fi
}

# Files changed since the base: committed, uncommitted and new.
changed_files() {
  # --relative: paths from this folder, which is the repository root in a project (not in ligeirinho's template/).
  { git diff --name-only --relative "$(base_commit)"; git ls-files --others --exclude-standard; } | sort -u
}

# The roots of the projects holding a changed file (not the projects that depend on them: Nx's affected list covers
# those for lint, types and unit tests; the slow checks below look only at what was touched).
touched_project_roots() {
  local graph_dir
  graph_dir="$(mktemp -d)"
  nx graph --file="$graph_dir/graph.json" >/dev/null
  changed_files | node -e '
    const nodes = Object.values(require(process.argv[1]).graph.nodes);
    const roots = nodes.map((node) => node.data.root).filter((root) => root && root !== ".");
    const touched = new Set();
    for (const file of require("fs").readFileSync(0, "utf8").split("\n").filter(Boolean)) {
      const owner = roots.filter((root) => file.startsWith(root + "/")).sort((a, b) => b.length - a.length)[0];
      if (owner) touched.add(owner);
    }
    console.log([...touched].join(" "));
  ' "$graph_dir/graph.json"
  rm -rf "$graph_dir"
}

project_is_affected() {
  [ "$mode" != "affected" ] && return 0
  nx show projects --affected --base="$(base_commit)" --json | node -e '
    process.exit(JSON.parse(require("fs").readFileSync(0, "utf8")).includes(process.argv[1]) ? 0 : 1);
  ' "$1"
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

# Which e2e specs an affected run picks (Playwright filters, relative to apps/e2e), from the touched projects:
#   - the journey of every touched area (libs/<area>/… → src/journeys/<area>.journey.spec.ts) and every journey
#     spec that changed itself;
#   - the responsive checks, only for the screens of the touched projects (LIGEIRINHO_PREVIEW_ENTRIES, read by
#     @ligeirinho/e2e-kit). A change to the theme or a shared component checks only its own screens here; CI checks
#     them all.
e2e_filters=()
choose_e2e_specs() {
  e2e_filters=()
  unset LIGEIRINHO_PREVIEW_ENTRIES
  [ "$mode" = "affected" ] || return 0

  local roots root area journey entries
  roots="$(touched_project_roots)"
  local -A journeys=()
  for root in $roots; do
    if [[ "$root" == libs/*/* ]]; then
      area="${root#libs/}"
      area="${area%%/*}"
      journey="apps/e2e/src/journeys/$area.journey.spec.ts"
      [ -f "$journey" ] && journeys["$journey"]=1
    fi
  done
  while IFS= read -r journey; do
    [ -f "$journey" ] && journeys["$journey"]=1
  done < <(changed_files | grep -E '^apps/e2e/src/journeys/.+\.spec\.ts$' || true)
  for journey in "${!journeys[@]}"; do
    e2e_filters+=("${journey#apps/e2e/}")
  done

  entries=""
  if [ -n "$roots" ]; then
    # shellcheck disable=SC2046,SC2086
    entries="$(pnpm exec ligeirinho-preview-registry $(printf -- '--entries-in %s ' $roots))" || entries=""
  fi
  export LIGEIRINHO_PREVIEW_ENTRIES="$entries"
  [ -n "$entries" ] && e2e_filters+=("src/responsive.spec.ts")

  local picked="${!journeys[*]}"
  echo "Journeys: ${picked:-none}"
  echo "Responsive checks for: ${entries:-no screen}"
}

run_e2e() {
  choose_e2e_specs
  if [ "$mode" = "affected" ] && [ "${#e2e_filters[@]}" -eq 0 ]; then
    step "E2E: no journey or screen touched by this change, skipped"
    return 0
  fi
  reset_test_database
  step "Building the API for e2e"
  nx build api
  step "E2E journeys and responsive checks"
  TEST_DATABASE_URL="$TEST_DATABASE_URL" nx e2e e2e ${e2e_filters[@]+-- "${e2e_filters[@]}"}
}

check_contract() {
  if ! project_is_affected api; then
    step "OpenAPI contract: the API didn't change, skipped"
    return 0
  fi
  step "OpenAPI contract"
  nx run api:openapi
  pnpm exec spectral lint dist/openapi.json --fail-severity=warn
  pnpm exec ligeirinho-bruno drift --openapi dist/openapi.json --collection bruno
}

check_secrets() {
  step "Secrets"
  if [ "$mode" = "affected" ]; then
    local base
    base="$(base_commit)"
    if [ "$base" != "$(git rev-parse HEAD)" ]; then
      gitleaks git --no-banner --redact --log-opts="$base..HEAD" .
    fi
    # Uncommitted and new files too: they are about to be committed.
    local files
    files="$(changed_files | while IFS= read -r file; do [ -f "$file" ] && echo "$file"; done)"
    if [ -n "$files" ]; then
      local staging
      staging="$(mktemp -d)"
      while IFS= read -r file; do
        mkdir -p "$staging/$(dirname "$file")"
        cp "$file" "$staging/$file"
      done <<<"$files"
      gitleaks dir --no-banner --redact "$staging"
      rm -rf "$staging"
    fi
  else
    gitleaks git --no-banner --redact .
  fi
}

check_code() {
  step "Preview registry is up to date"
  pnpm exec ligeirinho-preview-registry --root libs --out apps/web/src/app/preview.registry.ts --check
  step "Lint, types, unit tests and build"
  # shellcheck disable=SC2046
  nx $(scope_arguments) -t lint typecheck test build
  step "Copied code"
  pnpm exec ligeirinho-jscpd apps libs tools
  check_secrets
}

case "$mode" in
  integration)
    run_integration_tests
    ;;
  e2e)
    mode="all"
    run_e2e
    ;;
  affected | all)
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
