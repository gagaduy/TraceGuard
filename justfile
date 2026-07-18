# SPDX-FileCopyrightText: 2026 TraceGuard contributors
# SPDX-License-Identifier: Apache-2.0

set dotenv-load := true
set shell := ["bash", "-euo", "pipefail", "-c"]

default:
    @just --list

doctor:
    @scripts/doctor.sh

env:
    @test -f .env || cp .env.example .env

install:
    pnpm install --frozen-lockfile
    @if test -f apps/ai-service/pyproject.toml; then cd apps/ai-service && uv sync --frozen; fi

bootstrap: doctor env install

infra-up:
    docker compose --profile core up -d

up:
    docker compose --profile core --profile app up -d --build

tools-up:
    docker compose --profile core --profile tools up -d

observe-up:
    docker compose --profile observability up -d

down:
    docker compose --profile core --profile tools --profile observability --profile app down

ps:
    docker compose ps

logs service="":
    docker compose logs --follow {{service}}

dev:
    docker compose --profile core --profile app up --build

docker-build:
    docker compose --profile app build web api migrate workflows ai-service

build:
    pnpm run build

format:
    pnpm run format
    @if test -f apps/ai-service/pyproject.toml; then cd apps/ai-service && uv run ruff format .; fi

format-check:
    pnpm run format:check
    @if test -f apps/ai-service/pyproject.toml; then cd apps/ai-service && uv run ruff format --check .; fi

lint:
    pnpm run lint
    @if test -f apps/ai-service/pyproject.toml; then cd apps/ai-service && uv run ruff check .; fi

typecheck:
    pnpm run typecheck
    @if test -f apps/ai-service/pyproject.toml; then cd apps/ai-service && uv run pyright; fi

test:
    pnpm run test
    @if test -f apps/ai-service/pyproject.toml; then cd apps/ai-service && uv run pytest; fi

test-integration:
    pnpm run test:integration

test-e2e:
    pnpm run test:e2e

license-audit:
    @scripts/check-spdx.sh

security:
    pnpm audit --audit-level high

openapi:
    pnpm run openapi:lint

db-generate:
    pnpm --filter @traceguard/database db:generate

db-migrate:
    docker compose --profile core --profile app run --rm --build migrate

db-shell:
    docker compose exec postgres psql --username traceguard --dbname traceguard

db-seed:
    pnpm --filter @traceguard/database db:seed

check: format-check lint typecheck test build openapi

ci: check test-integration test-e2e license-audit security
