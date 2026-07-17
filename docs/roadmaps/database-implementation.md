<!--
SPDX-FileCopyrightText: 2026 TraceGuard contributors
SPDX-License-Identifier: Apache-2.0
-->

# TraceGuard Database Implementation Roadmap

> For agentic workers: follow `.agents/skills/build-open-source-repository/SKILL.md`, the accepted database RFC, and the focused plan for the selected phase before changing schema or migrations.

## Purpose

This roadmap turns [RFC 0001](../rfcs/0001-database-architecture.md) into ten independently verifiable delivery phases. The mature design ceiling is 60 tables, not a quota. Tables are created only when the current phase has a use case, invariant, query, and test that require them.

Database implementation occurs on `backend`. Each verified phase is merged with a merge commit into `develop`, where the full monorepo validation runs. Database-only work does not modify `frontend`, and this roadmap stops before `main`.

## Schema growth

| Milestone | Domain                                | Tables added | Cumulative |
| --------- | ------------------------------------- | -----------: | ---------: |
| Existing  | Organization baseline                 |            1 |          1 |
| Phase 0   | Foundation                            |            4 |          5 |
| Phase 1   | Identity and organization             |            4 |          9 |
| Phase 2   | Product and supply network            |            9 |         18 |
| Phase 3   | Evidence, claims, and relations       |            7 |         25 |
| Phase 4   | Signals, incidents, and investigation |            9 |         34 |
| Phase 5   | Trust state and recall planning       |            6 |         40 |
| Phase 6   | Policy and approval                   |            5 |         45 |
| Phase 7   | Recall execution and communication    |            7 |         52 |
| Phase 8   | Recovery and CAPA                     |            5 |         57 |
| Phase 9   | Integrations and hardening            |            3 |         60 |

A new table outside this map requires all of the following:

1. An independent lifecycle.
2. A constraint or foreign key that cannot be protected safely in an existing table.
3. A critical query that needs its own indexing boundary.
4. A phase use case and database-backed test that consume it.

JSONB is limited to schema-versioned snapshots, flexible metadata, and provider payloads. It never replaces tenant keys, required foreign keys, consequential state, authorization, money, or values that need database constraints.

## Delivery contract

Every phase follows this loop:

1. Start from the current `backend` branch after its preceding `develop` integration.
2. Review the phase table list against real use cases and remove any table that is not yet required.
3. Write and review a focused phase plan before editing code.
4. Add failing PostgreSQL integration tests for the phase invariants.
5. Add focused schema modules and new forward-only migrations.
6. Prove clean installation and upgrade from the preceding phase.
7. Validate RLS, privileges, constraints, concurrency, seeds, and critical query plans.
8. Update package documentation and `[Unreleased]` in `CHANGELOG.md`.
9. Commit atomically, review, then merge `backend` into `develop` with history preserved.
10. Run the complete repository checks on `develop` and stop there.

No phase may edit a migration already shared through Git. Test databases use isolated resources and never mount, reuse, or remove a developer's normal database volume.

## Phase 0: Database foundation

**Tables:** `audit_events`, `outbox_events`, `idempotency_records`, and `retention_policies`.

**Deliverables:**

- Establish PostgreSQL 18 extensions, least-privilege roles, transaction-local tenant context, fail-closed RLS helpers, and append-only protection.
- Partition `audit_events` by time and use typed audit events for consequential state-transition history.
- Establish shared UUIDv7, timestamp, organization-key, optimistic-version, and index helpers.
- Create reusable two-organization fixtures and isolated integration-test utilities.
- Replace stale `tenant_id` package wording with the RFC-approved `organization_id`.

**Gate:** empty install and upgrade from migration `0000`; no-context denial; role isolation; append-only audit; atomic state/audit/outbox rollback; disjoint outbox claims; repeatable seed; reviewed tenant/time query plans.

## Phase 1: Identity and organization

**Tables:** `users`, `organization_memberships`, `roles`, and `role_assignments`; evolve existing `organizations`.

**Deliverables:**

- Store Keycloak subject references while PostgreSQL owns membership and business authorization.
- Store validated permission codes on roles and constrained authority/resource scope on assignments.
- Preserve revoked memberships and historical actor references.

**Gate:** revocation removes access without deletion; invalid and cross-organization assignments fail; multi-organization membership is isolated; authorization changes are audited transactionally.

## Phase 2: Product and supply network

**Tables:** `products`, `batches`, `suppliers`, `facilities`, `components`, `product_components`, `batch_components`, `shipments`, and `shipment_items`.

**Deliverables:**

- Represent variants as product rows linked to a parent product.
- Separate expected product composition from actual batch inputs.
- Effective-date only relationships whose historical truth must be reconstructed.
- Retain minimal market, route, and pseudonymous recipient snapshots for traceability.

**Gate:** invalid quantities/ranges and tenant-crossing links fail; composition history is reconstructable; exposure traces in both directions; critical traceability plans are reviewed.

## Phase 3: Evidence, claims, and relations

**Tables:** `evidence_sources`, `evidence`, `evidence_versions`, `claims`, `evidence_claim_links`, `chain_of_custody_events`, and `evidence_relations`.

**Deliverables:**

- Keep binaries outside PostgreSQL while retaining object version, checksum, classification, retention, and legal-hold state.
- Make versions and custody events append-only.
- Use directed `evidence_relations` as the initial Evidence Graph with provenance and effective time.
- Add full-text and vector indexes only when query plans justify them.

**Gate:** mutation rejection; legal-hold enforcement; checksum deduplication never replaces records silently; tenant-isolated claim and recursive relation traversal with complete provenance.

## Phase 4: Signals, incidents, and investigation

**Tables:** `signals`, `signal_occurrences`, `assessments`, `incidents`, `incident_signals`, `incident_evidence`, `incident_scope_items`, `investigation_tasks`, and `decision_logs`.

**Deliverables:**

- Use exactly-one-owner checks for signal/incident assessments.
- Use typed nullable foreign keys and exactly-one-target checks for incident scope.
- Encode valid incident transitions through current state plus typed immutable audit events.
- Require an immutable decision log to close without recall.

**Gate:** idempotent signal ingestion; invalid transitions and stale versions fail; cross-tenant scope fails; closing decisions retain actor, reason, evidence, and assessment version.

## Phase 5: Trust state and recall planning

**Tables:** `scoring_methods`, `trust_snapshots`, `recall_options`, `recall_scope_items`, `simulation_runs`, and `recall_plans`.

**Deliverables:**

- Keep scores, methods, inputs, explanations, and uncertainty reproducible.
- Store immutable option and plan version rows in their owning table.
- Store simulation input/result snapshots with explicit schema versions.
- Keep options structurally advisory and unable to authorize execution.

**Gate:** immutable results; unknown remains unknown; reproducibility from retained inputs; tenant-safe scope; unapproved options cannot become executable plans.

## Phase 6: Policy and approval

**Tables:** `policies`, `approval_matrices`, `approval_requests`, `approval_decisions`, and `approval_invalidations`.

**Deliverables:**

- Store immutable policy and matrix version rows.
- Snapshot policy evaluation and requirements on the approval request.
- Bind decisions to exact option, policy, matrix, evidence, actor, and strong-auth versions.
- Append invalidations for material changes.

**Gate:** immutable decisions; material-change invalidation; quorum, authority, strong-auth, and separation-of-duties concurrency tests; no invalid approval reaches execution.

## Phase 7: Recall execution and communication

**Tables:** `recall_executions`, `action_tasks`, `action_attempts`, `affected_items`, `notification_templates`, `notifications`, and `delivery_attempts`.

**Deliverables:**

- Keep PostgreSQL authoritative while retaining Temporal workflow/run references.
- Apply idempotency keys to every retryable side effect.
- Represent one recipient per notification and retain delivery plus acknowledgement state.
- Keep template versions and approved plan references immutable.

**Gate:** at most one active execution per approved plan version; atomic execution state/audit/outbox; retry-safe activities and callbacks; exact approved content provenance.

## Phase 8: Recovery and CAPA

**Tables:** `recovery_metric_definitions`, `recovery_measurements`, `capas`, `capa_actions`, and `effectiveness_checks`.

**Deliverables:**

- Retain metric definition, source, scope, numerator, denominator, and time-window provenance.
- Derive recovery snapshots until measured evidence requires storing them.
- Require successful effectiveness evaluation before CAPA closure.

**Gate:** unknown denominator handling; closure constraint; immutable measurements and checks; tenant-isolated execution-to-recovery and incident-to-root-cause queries.

## Phase 9: Integrations and operational hardening

**Tables:** `integrations`, `integration_events`, and `operational_jobs`.

**Deliverables:**

- Retain managed secret references, sync/webhook outcomes, retries, and audit provenance.
- Use constrained operational job types for AI analysis, export, retention/purge, and restore drills.
- Complete representative-scale partition, index, retention, anonymization, backup, and recovery review.

**Gate:** retry-safe integration/jobs; advisory and attributable AI results; legal-hold-safe retention; recorded restore evidence meeting RPO no greater than 15 minutes and RTO no greater than two hours.

## Required verification for every phase

Run at least:

```bash
just format-check
just lint
just typecheck
just test
just test-integration
just build
just license-audit
just security
docker compose config --quiet
```

The focused phase plan adds exact migration commands, fixture setup, test filters, expected failure messages, and query-plan assertions. Passing mock tests alone does not complete a phase.

## Progress record

| Phase | Status      | Backend evidence | Develop integration |
| ----- | ----------- | ---------------- | ------------------- |
| 0     | Not started | —                | —                   |
| 1     | Not started | —                | —                   |
| 2     | Not started | —                | —                   |
| 3     | Not started | —                | —                   |
| 4     | Not started | —                | —                   |
| 5     | Not started | —                | —                   |
| 6     | Not started | —                | —                   |
| 7     | Not started | —                | —                   |
| 8     | Not started | —                | —                   |
| 9     | Not started | —                | —                   |

Update this table only after the completion gate is evidenced. Do not mark a phase complete because schema files merely exist.
