<!--
SPDX-FileCopyrightText: 2026 TraceGuard contributors
SPDX-License-Identifier: Apache-2.0
-->

# Changelog

All notable changes to TraceGuard are documented in this file.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the project uses [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

- Remove trailing blank lines from backend container metadata.
- Containerize the API, Temporal worker, and private AI service as non-root application services.

### Added

- Add a host-accessible development PostgreSQL service and an idempotent migration container that must complete before the API starts.
- Establish the public project identity, architecture overview, contribution guidance, security process, governance model, support routes, and GitHub collaboration templates.
- Declare Apache-2.0 licensing and file-level SPDX conventions for project-owned files.
- Add the pnpm and Turborepo workspace foundation, shared TypeScript quality configuration, stable `just` command interface, and local toolchain diagnostics.
- Add a profile-based Docker Compose environment for PostgreSQL, Valkey, object storage, Temporal, Keycloak, local mail, and the observability stack.
- Add GitHub Actions validation and scoped Dependabot updates for workspace dependencies, Compose images, and workflow actions.
- Define the shared OpenAPI 3.1 contract for liveness, readiness, and RFC 9457 Problem Details responses.
- Use TypeScript 5.9 as the supported compiler line for compatibility with the current OpenAPI and lint toolchain.
- Add the Express platform API, PostgreSQL adapter, health/readiness contract implementation, structured request context, graceful shutdown, and API tests.
- Add the Temporal TypeScript worker process, validated runtime configuration, and deterministic platform probe workflow.
- Add the private FastAPI compute-service boundary with versioned health schemas, safe readiness failure, locked Python dependencies, and tests.

### Fixed

- Record privacy-safe audit events for denied organization-context access and
  unauthorized organization settings mutations.
- Ensure `just down` stops services from every supported Compose profile without deleting named volumes.

[Unreleased]: https://github.com/gagaduy/TraceGuard/commits/main
