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
infrastructure_changed() {
  [ "$mode" != "affected" ] && return 0
  git diff --name-only "$(base_commit)" -- package.json pnpm-lock.yaml nx.json tsconfig.base.json \
    eslint.config.mjs compose.yaml docker prisma tools | grep -q .
}

reset_test_database() {
  step "Resetting the test database"
  MIGRATION_DATABASE_URL="$TEST_MIGRATION_DATABASE_URL" pnpm exec prisma migrate reset --force
}

run_integration_tests() {
  reset_test_database
  step "Integration tests"
  # shellcheck disable=SC2046
  DATABASE_URL="$TEST_DATABASE_URL" nx $(scope_arguments) -t test-integration
}

run_e2e() {
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
