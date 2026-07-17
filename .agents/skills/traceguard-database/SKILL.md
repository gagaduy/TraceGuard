---
name: traceguard-database
description: Implement and review TraceGuard PostgreSQL database phases safely. Use for Drizzle schemas, SQL migrations, tenant RLS, composite foreign keys, seeds, evidence and audit versioning, outbox and idempotency records, database integration tests, retention, indexing, backup, restore, or any task under packages/database.
---

<!--
SPDX-FileCopyrightText: 2026 TraceGuard contributors
SPDX-License-Identifier: Apache-2.0
-->

# TraceGuard database

## Orient before editing

1. Read `AGENTS.md` and `docs/rfcs/0001-database-architecture.md` completely.
2. Inspect `packages/database/README.md`, the current schema, migrations, tests, and recent commits.
3. Identify the requested phase and verify that all prerequisite phase gates are complete.
4. Confirm branch ownership: implementation belongs on `backend`; documentation and integration belong on `develop`. Do not modify `frontend` or merge to `main` for database-only work.
5. Stop and report the mismatch if the current branch or requested scope violates these rules.

## Protect the invariants

- Include `organization_id` on every tenant-owned table and use composite `(organization_id, id)` foreign keys for tenant relationships.
- Make row-level security fail closed when tenant context is absent. Runtime roles must not own tables or have `BYPASSRLS`.
- Use PostgreSQL 18 UUIDv7 identifiers, `timestamptz`, UTC, and `row_version` on mutable aggregate roots.
- Keep audit and selected version records append-only. Preserve the exact inputs used by consequential decisions.
- Commit state, history, business audit, and outbox records in one transaction when a workflow transition has external consequences.
- Model unknown values explicitly. Never treat unknown risk or trust as safe or zero.
- Store object metadata and integrity hashes in PostgreSQL, but keep evidence binaries in object storage.
- Use forward-only expand-and-contract migrations. Never rewrite a migration that may be shared.

## Implement one phase at a time

1. Restate the phase boundary, prerequisites, target tables, constraints, and completion gates.
2. Map the exact files to change before editing.
3. Add a failing integration test against real PostgreSQL 18 for each required behavior.
4. Add the focused Drizzle schema and generate a new migration.
5. Put RLS, roles, triggers, partitions, extensions, or other unsupported DDL only in that new migration.
6. Prove migration from an empty database and upgrade from the previous completed phase.
7. Test constraints, tenant isolation, roles, append-only enforcement, seeds, concurrency, retries, and rollback behavior relevant to the phase.
8. Inspect query plans for new critical access paths and add only justified indexes.
9. Update package documentation and add a matching `[Unreleased]` changelog entry.

## Validate safely

Use an isolated Compose project and fresh test volumes. Never remove, rename, mount, or reuse a developer's existing database volume.

Run the repository checks applicable to the change, including:

```bash
just format-check
just lint
just typecheck
just test
just build
just license-audit
just security
docker compose config --quiet
```

Database tests must prove, where applicable:

- clean installation and upgrade from the preceding phase;
- tenant isolation with and without transaction-local context;
- least-privilege behavior for application, worker, migration, and auditor roles;
- rejected mutation of append-only records;
- rollback after a failed multi-record transition;
- idempotent retries without duplicate external effects.

Mock-only database tests are insufficient evidence.

## Commit and integrate

- Keep commits atomic and include the corresponding changelog entry.
- Report the phase, branch, migration, tests, audit results, and unresolved risks.
- After the phase passes review, merge `backend` into `develop` with history preserved.
- Stop at `develop`; merging or pushing to `main` requires a separate explicit instruction.
