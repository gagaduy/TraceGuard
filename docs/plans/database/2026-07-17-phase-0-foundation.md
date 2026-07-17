<!--
SPDX-FileCopyrightText: 2026 TraceGuard contributors
SPDX-License-Identifier: Apache-2.0
-->

# Phase 0 Database Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. Also follow `.agents/skills/traceguard-database/SKILL.md` throughout execution.

**Goal:** Establish the PostgreSQL 18 foundation, least-privilege roles, fail-closed tenant context, append-only audit, transactional outbox, idempotency, retention policy, isolated integration tests, and migration guarantees required by RFC 0001 Phase 0.

**Architecture:** Drizzle remains the TypeScript schema authority and generates a new forward-only migration after `0000`; custom PostgreSQL DDL for roles, extensions, RLS, triggers, functions, and partitions is appended only to the new migration. A PostGIS-based PostgreSQL 18 image installs pgvector, while an idempotent administrator bootstrap separates database ownership from application, worker, migrator, and auditor access. Real integration tests run against a uniquely named Compose project and fresh test volume.

**Tech Stack:** PostgreSQL 18.4, PostGIS 3.6, pgvector 0.8.2-compatible package, Drizzle ORM 0.45.2, Drizzle Kit 0.31.10, node-postgres 8.22.0, Vitest 4.1.10, TypeScript 5.9.3, Docker Compose.

## Global Constraints

- Work on `backend`; merge the verified result into `develop` with a merge commit; do not modify `frontend` or merge to `main`.
- PostgreSQL 18 is authoritative; identifiers use UUIDv7 and timestamps use UTC `timestamptz`.
- Every tenant-owned table has non-null `organization_id`; relationships use tenant-safe keys.
- RLS fails closed without transaction-local organization context; runtime roles never own tables and never receive `BYPASSRLS`.
- Audit records are append-only and time-partitioned; state, audit, and outbox changes share one transaction.
- Existing migration `packages/database/migrations/0000_glossy_ogun.sql` and its metadata are immutable.
- All migration changes are forward-only and support both empty installation and upgrade from migration `0000`.
- Test infrastructure never mounts, reuses, or removes the repository's normal `postgres-data` volume.
- Each atomic commit includes a matching `[Unreleased]` entry in `CHANGELOG.md`.
- Every project-owned file that supports comments includes Apache-2.0 SPDX headers.

---

## Planned file map

### Create

- `infrastructure/docker/postgres.Dockerfile` — PostgreSQL 18 image with PostGIS and pgvector binaries.
- `infrastructure/compose/postgres/bootstrap-traceguard-roles.sql` — idempotent role/database ownership bootstrap for fresh and existing volumes.
- `scripts/database/bootstrap-roles.sh` — guarded administrator entry point for applying role bootstrap.
- `compose.database-test.yaml` — isolated PostgreSQL integration-test service and volume.
- `scripts/database/test-integration.sh` — creates a unique Compose project, waits, tests, and removes only its own resources.
- `packages/database/src/schema/foundation/common.ts` — reusable UUIDv7 and timestamp column helpers.
- `packages/database/src/schema/foundation/audit-events.ts` — audit schema contract.
- `packages/database/src/schema/foundation/outbox-events.ts` — outbox schema contract.
- `packages/database/src/schema/foundation/idempotency-records.ts` — idempotency schema contract.
- `packages/database/src/schema/foundation/retention-policies.ts` — retention schema contract.
- `packages/database/src/schema/foundation/index.ts` — foundation exports.
- `packages/database/src/context.ts` — transaction-local request context helper.
- `packages/database/src/outbox.ts` — bounded concurrent outbox claim and publication helpers.
- `packages/database/tests/support/database.ts` — admin, migrator, app, worker, and auditor test clients.
- `packages/database/tests/integration/extensions.test.ts` — extension availability tests.
- `packages/database/tests/integration/roles.test.ts` — ownership and privilege tests.
- `packages/database/tests/integration/context-rls.test.ts` — fail-closed tenant isolation tests.
- `packages/database/tests/integration/audit-events.test.ts` — append-only, partition, and rollback tests.
- `packages/database/tests/integration/outbox-events.test.ts` — claim concurrency and transaction tests.
- `packages/database/tests/integration/idempotency-retention.test.ts` — idempotency and retention constraints.
- `packages/database/tests/migrations/migration-path.test.ts` — empty and `0000` upgrade tests.

### Modify

- `.env.example` — distinct local-only role passwords and migration URL.
- `compose.yaml` — build the extension image and use the application role at runtime.
- `infrastructure/compose/postgres/init-databases.sh` — invoke the same role model for fresh volumes.
- `justfile` — role bootstrap and isolated database-test commands.
- `package.json` and `turbo.json` — route integration validation consistently.
- `packages/database/drizzle.config.ts` — require the dedicated migration connection.
- `packages/database/package.json` — add `test:integration` and migration-path scripts.
- `packages/database/src/schema/organizations.ts` — add update/version columns without changing migration `0000`.
- `packages/database/src/schema/index.ts` and `packages/database/src/index.ts` — export foundation schema and helpers.
- `packages/database/src/seed.ts` — deterministic two-organization Phase 0 fixture.
- `packages/database/README.md` — replace `tenant_id` with the approved `organization_id` contract and document role/migration commands.
- `docs/operations/local-development.md` — document safe bootstrap and test isolation.
- `docs/roadmaps/database-implementation.md` — record Phase 0 evidence only after all gates pass.
- `CHANGELOG.md` — one `[Unreleased]` line per task commit.
- `pnpm-lock.yaml` — only if package script tooling introduces a dependency; no dependency is planned initially.

## Task 1: Extension image and isolated PostgreSQL harness

**Files:**

- Create: `infrastructure/docker/postgres.Dockerfile`
- Create: `compose.database-test.yaml`
- Create: `scripts/database/test-integration.sh`
- Create: `packages/database/tests/integration/extensions.test.ts`
- Modify: `compose.yaml`
- Modify: `packages/database/package.json`
- Modify: `package.json`
- Modify: `turbo.json`
- Modify: `justfile`
- Modify: `CHANGELOG.md`

**Interfaces:**

- Consumes: Docker Compose, `.env`, and the current `postgres` service contract.
- Produces: `just db-test`, `pnpm --filter @traceguard/database test:integration`, and `TRACEGUARD_TEST_DATABASE_URL` for later tasks.

- [ ] **Step 1: Add the failing extension integration test**

Create `packages/database/tests/integration/extensions.test.ts` with a `pg.Pool` using `TRACEGUARD_TEST_DATABASE_URL`. Query `server_version_num` and `pg_available_extensions`; assert PostgreSQL major `18` and availability of `postgis`, `vector`, and `pgcrypto`. The test must throw this exact configuration error when the URL is absent:

```ts
const connectionString = process.env.TRACEGUARD_TEST_DATABASE_URL;

if (!connectionString) {
  throw new Error(
    "TRACEGUARD_TEST_DATABASE_URL is required for database integration tests",
  );
}
```

- [ ] **Step 2: Add the minimal isolated Compose runner and verify RED**

Create `compose.database-test.yaml` and `scripts/database/test-integration.sh` as specified in Step 4, initially using `postgres:18.4-bookworm`. Add the package and `just db-test` commands from Step 5, then run `just db-test`.

Expected: the harness starts and cleans up its unique project, while `extensions.test.ts` fails because the stock image does not provide PostGIS and pgvector.

- [ ] **Step 3: Add the PostgreSQL extension image**

Create `infrastructure/docker/postgres.Dockerfile`:

```dockerfile
# SPDX-FileCopyrightText: 2026 TraceGuard contributors
# SPDX-License-Identifier: Apache-2.0

FROM postgis/postgis:18-3.6

RUN apt-get update \
    && apt-get install --yes --no-install-recommends postgresql-18-pgvector \
    && rm -rf /var/lib/apt/lists/*
```

Change `compose.yaml` so `postgres` builds this Dockerfile and tags the local result `traceguard/postgres:18.4-postgis3.6-vector0.8`. Preserve the PostgreSQL 18 volume mount at `/var/lib/postgresql`; do not change it to the pre-18 `/var/lib/postgresql/data` path.

- [ ] **Step 4: Finish the isolated Compose project**

Update `compose.database-test.yaml` so its one `database-test` service builds the same Dockerfile. Keep its health check, host binding at `127.0.0.1:${TRACEGUARD_TEST_DATABASE_PORT:-55432}:5432`, dedicated `database-test-data` named volume, test-only literal credentials, and mounts limited to `infrastructure/compose/postgres/init-databases.sh` plus later bootstrap SQL. It must not reference `postgres-data`.

Create `scripts/database/test-integration.sh` with `set -euo pipefail`. Require a project name matching `^traceguard-db-test-[a-zA-Z0-9_-]+$`, generate one from the process ID when absent, use `docker compose --project-name`, install an `EXIT` trap, and run:

```bash
docker compose --project-name "${project_name}" \
  --file compose.database-test.yaml up --detach --wait database-test

TRACEGUARD_TEST_DATABASE_URL="postgresql://traceguard:traceguard-test@127.0.0.1:${TRACEGUARD_TEST_DATABASE_PORT:-55432}/traceguard" \
  pnpm --filter @traceguard/database test:integration
```

The trap may run `down --volumes` only for the validated test project name and `compose.database-test.yaml`.

- [ ] **Step 5: Wire repository commands**

Add `"test:integration": "vitest run tests/integration tests/migrations"` to `packages/database/package.json`. Ensure the root `test:integration` Turbo task discovers it. Add `db-test` to `justfile` as `scripts/database/test-integration.sh`.

- [ ] **Step 6: Run the isolated test and verify GREEN**

Run `just db-test`.

Expected: the extension test reports PostgreSQL 18 and all three extensions available; Compose removes only the uniquely named test project afterward.

- [ ] **Step 7: Commit**

Add an `[Unreleased]` entry describing the isolated PostgreSQL extension harness, then run format, lint, SPDX, and Compose config checks. Commit:

```bash
git add infrastructure/docker/postgres.Dockerfile compose.yaml compose.database-test.yaml \
  scripts/database/test-integration.sh packages/database/tests/integration/extensions.test.ts \
  packages/database/package.json package.json turbo.json justfile CHANGELOG.md
git commit -m "test(database): add isolated PostgreSQL harness"
```

## Task 2: Least-privilege role bootstrap

**Files:**

- Create: `infrastructure/compose/postgres/bootstrap-traceguard-roles.sql`
- Create: `scripts/database/bootstrap-roles.sh`
- Create: `packages/database/tests/support/database.ts`
- Create: `packages/database/tests/integration/roles.test.ts`
- Modify: `infrastructure/compose/postgres/init-databases.sh`
- Modify: `compose.database-test.yaml`
- Modify: `.env.example`
- Modify: `compose.yaml`
- Modify: `justfile`
- Modify: `CHANGELOG.md`

**Interfaces:**

- Consumes: the isolated database harness from Task 1.
- Produces: roles `traceguard_owner`, `traceguard_migrator`, `traceguard_app`, `traceguard_worker`, and `traceguard_auditor`; `DATABASE_MIGRATION_URL`; typed admin, migration, app, worker, and auditor test pools exported by `tests/support/database.ts`.

- [ ] **Step 1: Write failing ownership and privilege tests**

In `roles.test.ts`, connect as administrator and assert:

- `traceguard_owner` is `NOLOGIN`, owns the database and application objects, and has no `BYPASSRLS`;
- the four login roles are `NOSUPERUSER NOCREATEDB NOCREATEROLE NOBYPASSRLS`;
- migrator may `SET ROLE traceguard_owner` but runtime roles cannot;
- app and worker cannot create schemas or tables;
- auditor has read-only transaction defaults.

Run `just db-test`; expect FAIL because these roles do not yet exist.

- [ ] **Step 2: Add idempotent bootstrap SQL**

Create a `psql` script that receives four password variables, creates missing roles inside `DO` blocks, applies attributes on every run, grants `traceguard_owner` to `traceguard_migrator` with `SET TRUE`, transfers ownership of the `traceguard` database and existing `public` objects from legacy `traceguard` to `traceguard_owner`, then changes legacy `traceguard` to `NOLOGIN`. Revoke `CREATE` on database and schema from `PUBLIC`.

The final privilege shape must be:

```sql
ALTER ROLE traceguard_owner NOLOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOBYPASSRLS;
ALTER ROLE traceguard_migrator LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOBYPASSRLS;
ALTER ROLE traceguard_app LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOBYPASSRLS;
ALTER ROLE traceguard_worker LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOBYPASSRLS;
ALTER ROLE traceguard_auditor LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOBYPASSRLS;
ALTER ROLE traceguard_auditor SET default_transaction_read_only = on;
GRANT traceguard_owner TO traceguard_migrator WITH SET TRUE, INHERIT TRUE;
```

Use `ALTER DEFAULT PRIVILEGES FOR ROLE traceguard_owner` to grant table/sequence access deliberately to app and worker and read-only access to auditor. Do not grant DDL or ownership to runtime roles.

While connected to the `traceguard` database as administrator, enable `postgis`, `vector`, and `pgcrypto` with `CREATE EXTENSION IF NOT EXISTS`. Extension provisioning stays in this privileged bootstrap instead of the application migration.

- [ ] **Step 3: Add the guarded bootstrap entry point**

Create `scripts/database/bootstrap-roles.sh`. Require all role password variables, verify the target service is named `postgres` or `database-test`, and execute the SQL inside that container as `${POSTGRES_ADMIN_USER}` with `ON_ERROR_STOP=1`. Add `just db-bootstrap-roles` for the normal service. The test harness invokes the same SQL after container health and before migrations.

After bootstrap, the test harness exports `TRACEGUARD_TEST_ADMIN_DATABASE_URL`, `TRACEGUARD_TEST_MIGRATION_DATABASE_URL`, `TRACEGUARD_TEST_DATABASE_URL`, `TRACEGUARD_TEST_WORKER_DATABASE_URL`, and `TRACEGUARD_TEST_AUDITOR_DATABASE_URL`. `tests/support/database.ts` must require these exact variables and must never substitute one role's URL for another.

- [ ] **Step 4: Separate runtime and migration credentials**

Add these local-only values to `.env.example`:

```dotenv
TRACEGUARD_MIGRATOR_PASSWORD=traceguard-local-migrator
TRACEGUARD_DATABASE_PASSWORD=traceguard-local-app
TRACEGUARD_WORKER_PASSWORD=traceguard-local-worker
TRACEGUARD_AUDITOR_PASSWORD=traceguard-local-auditor
DATABASE_MIGRATION_URL=postgresql://traceguard_migrator:traceguard-local-migrator@postgres:5432/traceguard
DATABASE_URL=postgresql://traceguard_app:traceguard-local-app@postgres:5432/traceguard
```

Keep `DATABASE_URL` as the application-facing variable. Change `packages/database/drizzle.config.ts` and Drizzle commands to require `DATABASE_MIGRATION_URL` explicitly rather than silently falling back to the runtime URL.

- [ ] **Step 5: Prove bootstrap repeatability and privileges**

Run the bootstrap twice, then `just db-test`.

Expected: both bootstrap runs succeed; all role tests pass; `traceguard_app`, `traceguard_worker`, and `traceguard_auditor` cannot perform DDL.

- [ ] **Step 6: Commit**

Add the changelog entry and commit:

```bash
git add infrastructure/compose/postgres/bootstrap-traceguard-roles.sql \
  infrastructure/compose/postgres/init-databases.sh scripts/database/bootstrap-roles.sh \
  packages/database/tests/support/database.ts packages/database/tests/integration/roles.test.ts \
  compose.database-test.yaml compose.yaml .env.example justfile CHANGELOG.md
git commit -m "feat(database): separate PostgreSQL runtime roles"
```

## Task 3: Common schema and fail-closed tenant context

**Files:**

- Create: `packages/database/src/schema/foundation/common.ts`
- Create: `packages/database/src/schema/foundation/index.ts`
- Create: `packages/database/src/context.ts`
- Create: `packages/database/tests/integration/context-rls.test.ts`
- Modify: `packages/database/src/schema/organizations.ts`
- Modify: `packages/database/src/schema/index.ts`
- Modify: `packages/database/src/index.ts`
- Generate: the first new Phase 0 migration after `0000`
- Modify: `CHANGELOG.md`

**Interfaces:**

- Produces: `setDatabaseContext(transaction, context): Promise<void>`, `DatabaseContext`, `uuidv7Default`, `createdAt`, `updatedAt`, and `rowVersion`.

- [ ] **Step 1: Write failing context and RLS tests**

Test two organizations with the application role. Assert no organization rows are visible without context, only the selected organization is visible inside a transaction, invalid UUID context fails, context disappears after commit, and changing context in one pooled transaction cannot leak to another.

Use this public TypeScript interface in the test:

```ts
export interface DatabaseContext {
  actorId: string;
  correlationId: string;
  organizationId: string;
}

export async function setDatabaseContext(
  transaction: Pick<PoolClient, "query">,
  context: DatabaseContext,
): Promise<void>;
```

Run only `context-rls.test.ts`; expect FAIL because RLS and the helper do not exist.

- [ ] **Step 2: Add shared schema helpers and evolve organizations**

Keep the organization definition at its existing path so Phase 0 does not introduce a cosmetic file move. Add `updated_at timestamptz NOT NULL DEFAULT now()` and `row_version bigint NOT NULL DEFAULT 1 CHECK (row_version > 0)`. Export reusable SQL defaults from `foundation/common.ts`; do not create a generic column bundle that hides column names from Drizzle.

- [ ] **Step 3: Generate the new migration and append custom DDL**

Run:

Run `just db-generate` with `DATABASE_MIGRATION_URL` loaded from the environment.

Verify Drizzle generates exactly one migration after `0000`. Create schema `traceguard`; add `traceguard.current_organization_id()`, `traceguard.current_actor_id()`, and `traceguard.current_correlation_id()` as `STABLE` SQL functions using `current_setting(..., true)` plus `NULLIF`. Do not create extensions here; Task 2 provisions them through the administrator bootstrap because the migrator is intentionally not a superuser.

Enable and force RLS on `organizations`, with both `USING` and `WITH CHECK` requiring:

```sql
id = traceguard.current_organization_id()
```

The object owner remains `traceguard_owner`; grants allow app, worker, and auditor only their intended operations.

- [ ] **Step 4: Implement transaction-local context**

Implement `setDatabaseContext` with three parameterized `SELECT set_config(name, value, true)` calls. Reject use outside a transaction by documenting that callers must pass a checked-out transaction client; integration tests prove locality rather than relying on a mock.

- [ ] **Step 5: Verify tenant isolation and generated metadata**

Run the focused integration test, typecheck, and Drizzle generation a second time. Expected: tests pass and the second generation produces no schema drift.

- [ ] **Step 6: Commit**

Add the changelog entry and commit the new migration and its new metadata files together:

```bash
git add packages/database/src packages/database/tests/integration/context-rls.test.ts \
  packages/database/migrations CHANGELOG.md
git commit -m "feat(database): enforce transaction tenant context"
```

## Task 4: Partitioned append-only business audit

**Files:**

- Create: `packages/database/src/schema/foundation/audit-events.ts`
- Create: `packages/database/tests/integration/audit-events.test.ts`
- Modify: `packages/database/src/schema/foundation/index.ts`
- Generate: a new audit migration after the committed context migration
- Modify: `CHANGELOG.md`

**Interfaces:**

- Produces: `auditEvents` Drizzle table and SQL function `traceguard.append_audit_event(text, text, uuid, jsonb, jsonb)` returning the inserted event UUID.

- [ ] **Step 1: Write failing audit tests**

Assert tenant isolation, required actor/correlation context, JSON object payloads, UUIDv7 IDs, monthly partition routing, and rejection of update/delete by every runtime role. Add a transaction test that inserts a tenant row, appends an audit event, raises an error, rolls back, and proves neither change survived.

- [ ] **Step 2: Define the audit schema**

Define these columns: `organization_id`, `occurred_at`, `id`, `actor_id`, `correlation_id`, `event_type`, `subject_type`, `subject_id`, `before_state`, `after_state`, `metadata`, `schema_version`, and `checksum`. Use primary key `(organization_id, occurred_at, id)` so PostgreSQL permits partitioning. Require `schema_version > 0` and JSON objects for non-null state/metadata values.

- [ ] **Step 3: Generate a new audit migration**

Run `just db-generate`, verify it creates exactly one migration after the context migration, and confirm no earlier SQL or Drizzle snapshot changed.

- [ ] **Step 4: Add partition, RLS, append-only, and checksum SQL**

Declare the parent `PARTITION BY RANGE (occurred_at)`, create current and next-month partitions plus a default partition, and add tenant/time and subject/time indexes. Create a trigger function that always raises SQLSTATE `55000` on update/delete. The insert helper derives organization, actor, and correlation from transaction context and computes a SHA-256 checksum with `digest()` over a canonical ordered field expression.

Because Drizzle does not declare PostgreSQL partition parents, edit only the new uncommitted audit migration's generated `CREATE TABLE audit_events` statement to append `PARTITION BY RANGE (occurred_at)`. Never make this adjustment in an earlier committed migration.

Grant app and worker insert/select, auditor select, and no runtime update/delete privileges. Enable and force tenant RLS on the parent so partitions inherit policy behavior.

- [ ] **Step 5: Run focused tests and inspect the plan**

Run `audit-events.test.ts`. Execute `EXPLAIN (FORMAT JSON)` for `(organization_id, occurred_at DESC)` and assert a tenant/time index is selected after loading enough deterministic rows for the planner.

- [ ] **Step 6: Commit**

Add the changelog entry and commit:

```bash
git add packages/database/src/schema/foundation packages/database/tests/integration/audit-events.test.ts \
  packages/database/migrations CHANGELOG.md
git commit -m "feat(database): add append-only audit ledger"
```

## Task 5: Transactional outbox and concurrent claims

**Files:**

- Create: `packages/database/src/schema/foundation/outbox-events.ts`
- Create: `packages/database/src/outbox.ts`
- Create: `packages/database/tests/integration/outbox-events.test.ts`
- Modify: `packages/database/src/schema/foundation/index.ts`
- Modify: `packages/database/src/index.ts`
- Generate: a new outbox migration after the committed audit migration
- Modify: `CHANGELOG.md`

**Interfaces:**

- Produces:

```ts
export interface ClaimedOutboxEvent {
  aggregateId: string;
  aggregateType: string;
  attemptCount: number;
  eventType: string;
  id: string;
  organizationId: string;
  payload: unknown;
}

export async function claimOutboxEvents(
  client: PoolClient,
  workerId: string,
  limit: number,
): Promise<ClaimedOutboxEvent[]>;

export async function markOutboxPublished(
  client: PoolClient,
  eventId: string,
): Promise<void>;
```

- [ ] **Step 1: Write failing transaction and concurrency tests**

Test tenant RLS, positive bounded limit, `available_at`, rollback with business state/audit, and two worker transactions claiming disjoint sets. Test that a failed publication increments attempt count, stores a bounded error string, releases the claim, and schedules a future retry.

- [ ] **Step 2: Define the outbox table and indexes**

Add `organization_id`, UUIDv7 `id`, aggregate and event identifiers, JSON object `payload`, `occurred_at`, `available_at`, `claimed_at`, `claimed_by`, `published_at`, `attempt_count`, and bounded `last_error`. Add tenant-safe uniqueness on `(organization_id, id)`, checks for attempts and claim-field consistency, and a partial index for unpublished available events.

- [ ] **Step 3: Generate a new outbox migration**

Run `just db-generate`, verify exactly one new migration appears, and append only outbox-specific RLS and grant DDL to that uncommitted migration.

- [ ] **Step 4: Implement atomic claims**

Use one parameterized statement with a CTE selecting eligible IDs `FOR UPDATE SKIP LOCKED LIMIT $1`, then update claim metadata and return rows. Reject limits outside `1..100` before executing SQL. Publication update must require matching organization context and an active claim.

- [ ] **Step 5: Apply RLS and privileges**

Force tenant RLS. App may insert/select but not claim; worker may select/update claim and publication fields but cannot delete; auditor is read-only. Add column-level grants where table-level update would be broader than required.

- [ ] **Step 6: Verify concurrent behavior**

Run the test at least ten repeated claim rounds. Expected: no duplicate claimed ID, no blocked second worker, and exact rollback behavior.

- [ ] **Step 7: Commit**

Add the changelog entry and commit:

```bash
git add packages/database/src packages/database/tests/integration/outbox-events.test.ts \
  packages/database/migrations CHANGELOG.md
git commit -m "feat(database): add transactional outbox claims"
```

## Task 6: Idempotency and retention policy tables

**Files:**

- Create: `packages/database/src/schema/foundation/idempotency-records.ts`
- Create: `packages/database/src/schema/foundation/retention-policies.ts`
- Create: `packages/database/tests/integration/idempotency-retention.test.ts`
- Modify: `packages/database/src/schema/foundation/index.ts`
- Generate: a new idempotency/retention migration after the committed outbox migration
- Modify: `CHANGELOG.md`

**Interfaces:**

- Produces: `idempotencyRecords`, `retentionPolicies`, and tenant-safe unique keys used by later phases.

- [ ] **Step 1: Write failing constraint tests**

For idempotency, prove `(organization_id, operation, key)` uniqueness, request-hash mismatch detection, valid state transitions `processing -> completed|failed`, expiry after creation, and tenant reuse of the same key. For retention, prove one active policy per tenant/data class, positive duration, actions restricted to `retain|archive|anonymize|purge`, and legal-hold protection.

- [ ] **Step 2: Define idempotency records**

Use `organization_id`, UUIDv7 `id`, `operation`, `key`, `request_hash`, `status`, optional JSON object response, optional bounded error code, `locked_until`, `expires_at`, timestamps, and `row_version`. Store hashes as `bytea`; do not store raw request secrets. Add tenant/status/expiry indexes and forced RLS.

- [ ] **Step 3: Define retention policies**

Use `organization_id`, UUIDv7 `id`, `data_class`, `retention_days`, `action`, `legal_hold_overrides_action` fixed to `true`, `archived_at`, timestamps, and `row_version`. Add a partial unique index on active `(organization_id, data_class)` and forced RLS. Phase 0 records policy; purge execution remains Phase 9.

- [ ] **Step 4: Generate a new idempotency/retention migration**

Run `just db-generate`, verify exactly one new migration appears, and append only idempotency/retention RLS and privilege DDL to that uncommitted migration.

- [ ] **Step 5: Verify constraints and tenant isolation**

Run the focused test and typecheck. Expected: every invalid state is rejected by PostgreSQL, not only TypeScript.

- [ ] **Step 6: Commit**

Add the changelog entry and commit:

```bash
git add packages/database/src/schema/foundation \
  packages/database/tests/integration/idempotency-retention.test.ts \
  packages/database/migrations CHANGELOG.md
git commit -m "feat(database): add idempotency and retention controls"
```

## Task 7: Migration paths and deterministic foundation seed

**Files:**

- Create: `packages/database/tests/migrations/migration-path.test.ts`
- Modify: `packages/database/src/seed.ts`
- Modify: `packages/database/package.json`
- Modify: `packages/database/README.md`
- Modify: `docs/operations/local-development.md`
- Modify: `CHANGELOG.md`

**Interfaces:**

- Consumes: all Phase 0 schema and migration output.
- Produces: repeatable two-organization seed and evidence for empty/upgrade migration gates.

- [ ] **Step 1: Write failing migration-path tests**

Create temporary databases with administrator credentials. Path A applies every committed migration to an empty database. Path B creates a temporary migration folder containing the exact committed `0000` SQL, snapshot, and a journal with only entry zero; applies that folder through Drizzle; inserts an organization using legacy ownership; runs the Phase 0 role bootstrap; then applies the full committed migration folder. Assert schema objects, extensions, ownership, RLS, partitions, preserved organization data, and Drizzle journal state. Drop only databases whose generated names match `^traceguard_phase0_test_[a-f0-9]+$`; never edit the repository migration folder to construct either path.

- [ ] **Step 2: Make the seed deterministic and repeatable**

Seed two fixed organizations with stable slugs `traceguard-local-alpha` and `traceguard-local-beta`. Use conflict handling that updates display names without changing IDs already referenced. Insert default retention policies for audit and outbox data under both organizations. Run the seed twice and assert unchanged row counts and keys.

- [ ] **Step 3: Document operator workflow**

Update the package README with `organization_id`, role responsibilities, `DATABASE_MIGRATION_URL`, bootstrap-before-migrate ordering, immutable migration rules, and isolated tests. Update local development docs with safe commands:

```bash
just db-bootstrap-roles
just db-migrate
just db-seed
just db-test
```

State explicitly that bootstrap changes for existing volumes do not rerun through `/docker-entrypoint-initdb.d`.

- [ ] **Step 4: Run both migration paths and seed twice**

Run `just db-test`, then run seed twice against the isolated database before cleanup. Expected: both paths pass, legacy organization data survives, and the second seed changes no stable identity.

- [ ] **Step 5: Commit**

Add the changelog entry and commit:

```bash
git add packages/database/tests/migrations/migration-path.test.ts packages/database/src/seed.ts \
  packages/database/package.json packages/database/README.md \
  docs/operations/local-development.md CHANGELOG.md
git commit -m "test(database): prove Phase 0 migration paths"
```

## Task 8: Phase completion audit and develop integration

**Files:**

- Modify: `docs/roadmaps/database-implementation.md`
- Modify: `CHANGELOG.md`

**Interfaces:**

- Consumes: all Phase 0 commits and completion evidence.
- Produces: reviewed backend tip and a merge commit on `develop`; no main release.

- [ ] **Step 1: Run focused database verification on `backend`**

Use Node 24, pnpm 11.13, Python 3.13, and `uv`. Run:

```bash
just doctor
just db-test
DATABASE_URL="$DATABASE_MIGRATION_URL" just db-generate
git diff --exit-code -- packages/database/migrations
docker compose config --quiet
just format-check
just lint
just typecheck
just test
just build
just license-audit
just security
git diff --check
```

Expected: every command exits zero, Drizzle produces no migration drift, and the working tree is clean except for the roadmap evidence update that follows.

- [ ] **Step 2: Review the Phase 0 invariants explicitly**

Record evidence for: PostgreSQL/extensions, role ownership, no `BYPASSRLS`, missing-context denial, two-tenant isolation, append-only audit, partition routing, atomic rollback, disjoint outbox claims, idempotency uniqueness, retention constraints, repeatable seed, empty install, and `0000` upgrade. Do not mark the phase complete if any item lacks a passing command or test name.

- [ ] **Step 3: Update the roadmap evidence**

Change only the Phase 0 row to `Complete`, add the backend commit range and test command, leave Phases 1–9 as `Not started`, and add the matching `[Unreleased]` completion entry. Commit on `backend`:

```bash
git add docs/roadmaps/database-implementation.md CHANGELOG.md
git commit -m "docs(database): record Phase 0 completion"
```

- [ ] **Step 4: Merge with history into `develop`**

Update local `develop` from `origin/develop`, confirm `frontend` and `main` refs have not moved as part of this work, then merge:

```bash
git switch develop
git pull --ff-only origin develop
git merge --no-ff backend -m "merge(backend): integrate database foundation"
```

- [ ] **Step 5: Run full validation on `develop`**

Run `just ci` and `docker compose config --quiet`. If either fails, fix on `backend`, reverify, and merge the corrective commit; do not patch an unreviewed database fix directly on `develop`.

- [ ] **Step 6: Push only authorized branches**

Push `backend`, then `develop`. Verify `origin/main` and `origin/frontend` remain unchanged. Stop without merging or pushing to `main`.

## Phase 0 definition of done

Phase 0 is complete only when all eight tasks are checked, every atomic commit has a changelog entry, the forward-only Phase 0 migration sequence follows immutable `0000`, all database tests pass against fresh PostgreSQL 18 and the `0000` upgrade path, `backend` is merged into `develop`, and `main` plus `frontend` are untouched.

## Upstream implementation references

- [PostGIS PostgreSQL 18 image and volume-path guidance](https://github.com/postgis/docker-postgis)
- [pgvector 0.8.2 PostgreSQL 18 installation](https://github.com/pgvector/pgvector)
- [PostgreSQL 18 row security policies](https://www.postgresql.org/docs/18/ddl-rowsecurity.html)
- [PostgreSQL 18 transaction-local `set_config`](https://www.postgresql.org/docs/18/functions-admin.html)
