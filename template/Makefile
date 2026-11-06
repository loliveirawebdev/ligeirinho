# Everything runs in Docker; the host only needs Docker and make.
SHELL := /bin/bash
COMPOSE := docker compose
EXEC := $(COMPOSE) exec -T toolbox
FRESH_TOOLBOX := $(COMPOSE) run --rm -T --no-deps toolbox
NX := pnpm exec nx
# One Nx cache per repository, shared by all its worktrees.
NX_CACHE_VOLUME := $(notdir $(patsubst %/.git,%,$(shell git rev-parse --path-format=absolute --git-common-dir 2>/dev/null || pwd)))-nx-cache
export NX_CACHE_VOLUME

.DEFAULT_GOAL := help
.PHONY: help up down install migrate dev preview test test-integration check gate e2e seed bruno-env shell

help: ## List the commands
	@grep -E '^[a-z-]+:.*## ' $(MAKEFILE_LIST) | awk -F':.*## ' '{printf "  make %-17s %s\n", $$1, $$2}'

.env:
	@sed "s/^TOKEN_SECRET=.*/TOKEN_SECRET=$$(openssl rand -hex 32)/" .env.example > .env
	@echo "Created .env with a fresh TOKEN_SECRET"

up: .env ## Start the toolbox and databases, install dependencies, migrate
	$(COMPOSE) up -d --build --wait toolbox db db-test
	$(MAKE) install migrate

down: ## Stop everything (the dev database keeps its data)
	$(COMPOSE) down

install: ## Install dependencies and generate the Prisma client
	$(EXEC) pnpm install --frozen-lockfile
	$(EXEC) pnpm exec prisma generate

migrate: ## Apply migrations to the dev and test databases
	$(EXEC) pnpm exec prisma migrate deploy
	$(EXEC) sh -c 'MIGRATION_DATABASE_URL="$$TEST_MIGRATION_DATABASE_URL" pnpm exec prisma migrate deploy'

dev: ## Run the API (localhost:3000) and the web app (localhost:4200)
	$(EXEC) $(NX) run-many -t serve -p api web

preview: ## Run the web app; screens with scenarios are at localhost:4200/__preview
	$(EXEC) $(NX) serve web

test: ## Fast checks for what changed (runs before every commit)
	$(EXEC) $(NX) affected -t lint typecheck test --uncommitted

test-integration: ## Integration tests against the test database
	$(EXEC) tools/check.sh integration

check: ## Gate for what changed since main: lint, types, tests, contract, e2e of affected journeys
	$(EXEC) tools/check.sh affected

gate: ## Full gate in a fresh container with the dev servers stopped (CI runs the same)
	$(COMPOSE) stop toolbox
	$(COMPOSE) up -d --wait db-test
	$(FRESH_TOOLBOX) tools/check.sh all; status=$$?; $(COMPOSE) up -d toolbox; exit $$status

e2e: ## All e2e journeys and responsive checks
	$(EXEC) tools/check.sh e2e

seed: ## Fill the dev database with example data and write test tokens to .ligeirinho/seed.json
	$(EXEC) pnpm exec tsx tools/seed.ts

bruno-env: seed ## Fill the Bruno "local" environment with the seed's base URL and tokens
	$(EXEC) pnpm exec ligeirinho-bruno env --collection bruno --env local --values .ligeirinho/seed.json

shell: ## Open a shell in the toolbox
	$(COMPOSE) exec toolbox bash
