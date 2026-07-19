<!--
SPDX-FileCopyrightText: 2026 TraceGuard contributors
SPDX-License-Identifier: Apache-2.0
-->

# Changelog

All notable changes to TraceGuard are documented in this file.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the project uses [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

- Add a portable open-source repository skill and root agent guide for handoff.

### Changed

- Make `just up` and `just dev` apply database migrations automatically, and document direct local PostgreSQL inspection on port 5433.

### Added

- Add a host-accessible development PostgreSQL service and an idempotent migration container that must complete before the API starts.
- Implement the first organization-access capability with OIDC authentication, atomic tenant bootstrap, role-scoped organization administration, and append-only audit evidence.
- Add an importable local Keycloak realm and isolated PostgreSQL migrations for identity, membership, idempotency, and organization access.
- Add the authenticated web journey from sign-in and organization onboarding through responsive overview and version-safe organization settings.
- Define the authenticated organization-access API contract and generated browser types.
- Define the organization-access design and TDD implementation plan for authentication, tenant onboarding, safe organization switching, and the authenticated application shell.
- Add a reusable production-frontend skill with screen specifications, local visual verification, and monorepo-aware structural auditing.
- Add explicit frontend deliverables to every feature-first roadmap task.
- Add the end-to-end master implementation checklist for feature-first MVP and production delivery.
- Define the feature-first delivery roadmap, complete MVP boundary, and per-capability integration gates.
- Establish the public project identity, architecture overview, contribution guidance, security process, governance model, support routes, and GitHub collaboration templates.
- Declare Apache-2.0 licensing and file-level SPDX conventions for project-owned files.
- Add the pnpm and Turborepo workspace foundation, shared TypeScript quality configuration, stable `just` command interface, and local toolchain diagnostics.
- Add a profile-based Docker Compose environment for PostgreSQL, Valkey, object storage, Temporal, Keycloak, local mail, and the observability stack.
- Add GitHub Actions validation and scoped Dependabot updates for workspace dependencies, Compose images, and workflow actions.
- Define the shared OpenAPI 3.1 contract for liveness, readiness, and RFC 9457 Problem Details responses.
- Use TypeScript 5.9 as the supported compiler line for compatibility with the current OpenAPI and lint toolchain.
- Add a typed frontend API client generated from the shared OpenAPI contract, with a deterministic drift check and transport test.
- Add the accessible shared UI foundation and a responsive Next.js application shell that explains TraceGuard's product loop, trust boundaries, and pre-release status.
- Add a pinned, multi-stage, non-root web container and frontend-only Compose application profile.
- Add the Express platform API, PostgreSQL adapter, health/readiness contract implementation, structured request context, graceful shutdown, and API tests.
- Add the Temporal TypeScript worker process, validated runtime configuration, and deterministic platform probe workflow.
- Add the private FastAPI compute-service boundary with versioned health schemas, safe readiness failure, locked Python dependencies, and tests.
- Containerize the API, Temporal worker, and private AI service as non-root application services.

### Removed

- Remove the superseded database-first RFC, phase roadmap, and foundation plan; feature slices now introduce only the schema they use.

### Fixed

- Record privacy-safe audit events for denied organization-context access and
  unauthorized organization settings mutations.
- Ensure `just down` stops services from every supported Compose profile without deleting named volumes.
- Normalize trailing blank lines in backend container metadata.
- Point Docker dependency updates at the directories that contain Dockerfiles.

[Unreleased]: https://github.com/gagaduy/TraceGuard/commits/main
