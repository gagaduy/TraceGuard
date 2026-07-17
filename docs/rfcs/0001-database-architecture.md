<!--
SPDX-FileCopyrightText: 2026 TraceGuard contributors
SPDX-License-Identifier: Apache-2.0
-->

# TraceGuard Database Design

| Field          | Value                   |
| -------------- | ----------------------- |
| Status         | Accepted                |
| Created        | 2026-07-17              |
| Implementation | `backend`               |
| Integration    | `develop`               |
| Release        | Explicitly out of scope |

## Status and scope

This specification defines the complete target database architecture for TraceGuard and divides delivery into independently deployable phases. It covers PostgreSQL schema, migrations, tenant isolation, constraints, indexing, retention, auditability, backup, restore, and database integration tests.

Database implementation belongs to the `backend` branch. Completed and verified phases are merged into `develop`. This work does not change `frontend`, and neither the design nor its implementation is merged or pushed to `main`.

The database design does not define REST endpoints, screens, or API-client behavior. Those require separate designs after the database contracts they consume are stable.

## Goals

- Make PostgreSQL 18 the authoritative store for every TraceGuard business-state transition.
- Preserve the exact evidence, policy, option, approval, plan, and analytical method versions used by consequential decisions.
- Prevent cross-organization reads, writes, and relationships at both application and database layers.
- Support durable workflow retries without duplicated external consequences.
- Retain an append-only business audit trail outside ordinary update and delete paths.
- Deliver the complete model incrementally so every phase remains migratable, testable, and operable.
- Meet an initial recovery objective of RPO no greater than 15 minutes and RTO no greater than two hours.

## Non-goals

- Replacing ERP, WMS, CRM, QMS, laboratory, or notification-provider systems.
- Storing evidence binaries in PostgreSQL.
- Introducing a graph database, Elasticsearch, event sourcing, per-tenant schemas, or per-tenant databases.
- Persisting full customer profiles when a pseudonymous recipient reference is sufficient.
- Building API or frontend features as part of the database roadmap.

## Architecture decisions

### Source of truth and ownership

PostgreSQL is the source of truth. The Express API is the only public business backend and the only process allowed to authorize authoritative business-state changes. Temporal coordinates long-running work but does not own state or authorization. The internal AI service returns advisory, versioned analysis and cannot approve or execute a recall.

Drizzle defines the TypeScript schema and generates immutable SQL migrations. Migration files are forward-only. Production changes use expand-and-contract deployment: add compatible structures, backfill in bounded batches, move readers and writers, then remove obsolete structures in a later migration.

### Tenant isolation

TraceGuard uses a shared schema. Every tenant-owned table contains `organization_id`. Request transactions set organization, actor, and correlation context with transaction-local PostgreSQL settings. Row-Level Security fails closed when organization context is absent.

Tenant-owned resource keys expose a unique `(organization_id, id)` pair. Cross-resource relationships use composite foreign keys containing both organization IDs. This makes a relationship between resources owned by different organizations invalid even if application authorization is defective.

The database uses separate migration, application, worker, and read-only auditor roles. None of the runtime roles owns tables or has `BYPASSRLS`.

### Identifiers and common columns

- Primary keys use PostgreSQL 18 UUIDv7 defaults.
- Timestamps use `timestamptz` and UTC.
- Mutable aggregate roots use `row_version bigint` for optimistic concurrency.
- Money uses `amount_minor bigint` plus `currency_code char(3)`.
- Quantities use `numeric` plus an explicit unit.
- Evolving states use `text` with `CHECK` constraints instead of PostgreSQL enums.
- Configuration records may use `archived_at`; `deleted_at` is not added universally.

### Versioning and append-only records

Versioning is selective. Evidence keeps explicit `evidence_versions` because binary provenance and legal hold have an independent lifecycle. Policies, approval matrices, recall options, recall plans, and notification templates store immutable version rows in their owning table using a logical identifier plus a monotonically increasing version. Trust snapshots and simulation runs are immutable snapshots.

Effective dating with `valid_from` and `valid_to` is limited to facts whose business validity changes over time, including product composition and supplier relationships. The design does not impose bitemporal modeling on every table.

Custody events, approval decisions, approval invalidations, decision logs, consequential version rows, and audit events cannot be updated or deleted by runtime roles. Important state transitions are recorded as typed `audit_events` with before and after state instead of one transition table per aggregate. Database privileges and defensive triggers enforce these rules.

### Evidence storage and privacy

Evidence binaries live in versioned S3-compatible object storage. PostgreSQL stores the bucket, object key, object version, checksum, media type, size, classification, retention class, and legal-hold state.

Recipient data is pseudonymous by default. TraceGuard stores an external reference, recipient type, market, and the minimum fields needed to track recall communication. Sensitive contact data is retrieved from an authoritative integration or stored as an encrypted provider payload only when required. TraceGuard does not become a CRM.

Retention is defined by data class. Evidence, approval, decision, and audit records are not hard-deleted. Expired PII is anonymized while stable audit references remain. Configuration is archived. Purge and anonymization operations run as auditable jobs.

### Relational model and Evidence Graph

Explicit relational links enforce business invariants. Consolidated scope tables use nullable typed foreign keys plus a `CHECK` requiring exactly one supported target, so fewer tables do not weaken referential integrity. Flexible metadata never replaces tenant keys, consequential state, money, authorization, or required foreign keys.

`evidence_relations` is the initial Evidence Graph and retains direction, relationship type, provenance, effective time, and source-version references. Initial traversal uses recursive PostgreSQL CTEs; separate graph-node and graph-edge tables are deferred until measured query or integrity requirements justify them. Full-text search and pgvector support hybrid evidence retrieval, while PostGIS supports geographic recall scope.

## Schema organization

Schema source is organized by domain:

```text
packages/database/src/schema/
├── foundation/
├── identity/
├── supply/
├── evidence/
├── incidents/
├── trust/
├── recall/
├── governance/
├── execution/
├── recovery/
└── platform/
```

Each module owns focused table definitions, constraints, indexes, relations, and exported types. The root schema index re-exports domain modules for Drizzle migration generation.

The mature schema has a design ceiling of 60 tables, not a quota. A table outside this design requires an independent lifecycle, a constraint or foreign key that cannot be protected safely when consolidated, and a critical query that needs its own indexing boundary. If the complete product needs fewer tables, no placeholder tables are added.

## Delivery phases

### Phase 0: Database foundation

Enable pgvector, PostGIS, and approved crypto or search extensions. Add database roles, RLS context helpers, append-only protection, and four cross-cutting tables:

- `audit_events`
- `outbox_events`
- `idempotency_records`
- `retention_policies`

`audit_events` is append-only and time-partitioned. Typed events retain consequential state-transition history. The phase includes migration testing from an empty database and from the existing organization-only schema. With the existing `organizations` table, Phase 0 ends with five tables.

### Phase 1: Identity and organization

- `organizations`
- `users`
- `organization_memberships`
- `roles`
- `role_assignments`

Keycloak subjects identify users, but TraceGuard owns membership state and business authorization. Roles carry validated permission codes; assignments carry constrained authority and resource scope. Revoking a membership removes access without deleting the user or historical actions. This phase adds four new tables and brings the cumulative total to nine.

### Phase 2: Product and supply network

- `products`
- `batches`
- `suppliers`
- `facilities`
- `components`
- `product_components`
- `batch_components`
- `shipments`
- `shipment_items`

Product variants are product rows linked to a parent product. Product composition and supplier relationships support effective dating. `batch_components` records actual inputs rather than only expected composition. Shipment items retain the minimum market, route, and pseudonymous recipient snapshot required for traceability. This phase brings the cumulative total to 18.

### Phase 3: Evidence, claims, and relations

- `evidence_sources`
- `evidence`
- `evidence_versions`
- `claims`
- `evidence_claim_links`
- `chain_of_custody_events`
- `evidence_relations`

Evidence versions and custody events are append-only. Object location, checksum, classification, retention, and legal-hold state belong to evidence versions. `evidence_relations` provides the initial directed Evidence Graph without duplicate graph-node and graph-edge tables. This phase brings the cumulative total to 25.

### Phase 4: Signals, incidents, and investigation

- `signals`
- `signal_occurrences`
- `assessments`
- `incidents`
- `incident_signals`
- `incident_evidence`
- `incident_scope_items`
- `investigation_tasks`
- `decision_logs`

`assessments` has nullable signal and incident foreign keys with a check requiring exactly one owner. `incident_scope_items` uses typed nullable foreign keys with an exactly-one-target check for products, batches, and facilities; market scope uses validated codes. Closing an incident without recall requires an immutable decision log referencing actor, reason, evidence, and assessment version. This phase brings the cumulative total to 34.

### Phase 5: Trust state and recall planning

- `scoring_methods`
- `trust_snapshots`
- `recall_options`
- `recall_scope_items`
- `simulation_runs`
- `recall_plans`

Trust snapshots and simulation runs are immutable. Dimensions, inputs, results, explanations, and uncertainty use schema-versioned snapshots where independent querying is not required. Recall options and plans keep immutable version rows in their owning table. Scope items retain typed foreign keys or validated market and recipient references. Options remain proposals and cannot authorize execution. This phase brings the cumulative total to 40.

### Phase 6: Policy and approval

- `policies`
- `approval_matrices`
- `approval_requests`
- `approval_decisions`
- `approval_invalidations`

Policies and matrices keep immutable version rows. Approval requests retain the exact policy evaluation, requirements, option version, evidence snapshot, and matrix version reviewed. Strong-auth evidence belongs to the immutable decision. Material scope, severity, evidence, or policy changes append invalidation records and require reevaluation. This phase brings the cumulative total to 45.

### Phase 7: Recall execution and communication

- `recall_executions`
- `action_tasks`
- `action_attempts`
- `affected_items`
- `notification_templates`
- `notifications`
- `delivery_attempts`

Every retryable side effect carries an idempotency key. PostgreSQL retains authoritative execution state while Temporal identifiers are auditable coordination references. A notification row represents one recipient and retains content, template version, delivery state, and acknowledgement state; provider attempts remain separate. This phase brings the cumulative total to 52.

### Phase 8: Recovery and CAPA

- `recovery_metric_definitions`
- `recovery_measurements`
- `capas`
- `capa_actions`
- `effectiveness_checks`

Metric definitions include numerator, denominator, time window, scope, and data source. Missing denominators remain unknown. Recovery snapshots are derived from versioned definitions and immutable measurements until a measured need for stored snapshots exists. A CAPA cannot close until its effectiveness criteria have been evaluated successfully. This phase brings the cumulative total to 57.

### Phase 9: Integrations and operational hardening

- `integrations`
- `integration_events`
- `operational_jobs`

Integration events retain inbound and outbound delivery, webhook, and synchronization outcomes. Operational jobs use a constrained job type for AI analysis, exports, retention/purge work, and restore drills while keeping schema-versioned inputs and outputs. This phase completes representative-scale partitioning, index review, retention, anonymization, encrypted backup, point-in-time recovery, and restore validation. The mature design ceiling is 60 tables.

## Transaction and event flow

Every business mutation follows this sequence in one database transaction:

1. Authenticate the actor and membership before opening authoritative work.
2. Begin the transaction and set organization, actor, and correlation context locally.
3. Let RLS validate tenant scope.
4. Lock the aggregate or verify its expected `row_version`.
5. Apply the authoritative business-state change.
6. Append the immutable version or state-transition record when required.
7. Append the business audit event.
8. Append an outbox event when a workflow or integration must react.
9. Commit once.

Failure at any step rolls back business state, audit, and outbox together.

Outbox publishers claim work with `FOR UPDATE SKIP LOCKED`. Success records publication time; failure records bounded retry metadata. Consumers and Temporal activities claim an idempotency key before causing an external consequence.

## Concurrency and invariants

- Mutable aggregates use compare-and-swap updates through `row_version`.
- Approval and execution transitions that cannot race use row locks.
- A partial unique index allows at most one active execution for an approved plan version.
- Approval decisions are appended; corrections create another decision or invalidation.
- Cross-organization composite foreign keys reject tenant mismatches.
- A transaction without organization context cannot access tenant-owned data.
- Missing evidence, exposure, or denominators remain `unknown`; they are not converted to safe or zero.
- Evidence checksum matches may suggest deduplication but never silently replace an existing evidence record.
- Deadlocks and serialization failures may be retried a bounded number of times by the application.

## Indexing and scale

The initial target is an SME SaaS deployment with up to approximately 1,000 organizations and tens of millions of high-growth records. Indexes prioritize tenant-prefixed access patterns and the critical journeys from signal to incident, evidence to claim, batch to shipment, recall scope to execution, and execution to recovery.

Time partitioning is enabled for `audit_events` initially and extended to `outbox_events`, `recovery_measurements`, and `delivery_attempts` when their phase is introduced. Other tables remain unpartitioned unless representative query plans demonstrate a need.

## Backup, restore, and migration safety

- Encrypt backups and continuous WAL archives.
- Retain enough WAL to provide point-in-time recovery with RPO no greater than 15 minutes.
- Run scheduled restore drills and record them as `operational_jobs` with the `restore_drill` job type once Phase 9 exists.
- Demonstrate RTO no greater than two hours with checksum, migration-version, RLS, and representative business-query validation.
- Never edit a migration that has run in a shared environment.
- Stop rollout when a migration or backfill fails; do not mark partial work complete.
- Use corrective migrations rather than destructive down migrations in production.

## Testing strategy

Every phase includes:

- Schema tests for defaults, nullability, relations, and exported types.
- Constraint tests for unique, check, foreign-key, and state invariants.
- Cross-tenant read, write, and relationship denial tests.
- Database-role privilege and RLS bypass tests.
- Append-only update and delete rejection tests.
- Empty-database and previous-phase migration tests.
- Repeatable seed tests.
- Concurrency tests for optimistic locks, approval races, and outbox claims.
- Transaction tests proving business state, audit, and outbox commit together.
- Representative query-plan and index tests.
- SPDX, changelog, formatting, typecheck, and integration validation.

The shared fixture contains two isolated organizations, a multi-organization user, products with reused components, batches, multi-stop shipments, conflicting evidence, duplicate signals, incidents with and without recall, multiple options, invalidated approval, retried communication, anonymized recipient data, and preserved audit references.

## Phase completion and branch policy

A phase is complete only when its migration, RLS policies, constraints, indexes, seed fixtures, database tests, migration-path tests, changelog entry, SPDX audit, and Compose PostgreSQL validation pass.

Implementation proceeds on `backend` with atomic commits. A verified phase is merged with a merge commit into `develop`, where the complete monorepo validation runs. The `frontend` branch remains unchanged because this specification contains no frontend work. No commit from this database roadmap is merged or pushed to `main`.
