<!--
SPDX-FileCopyrightText: 2026 TraceGuard contributors
SPDX-License-Identifier: Apache-2.0
-->

# TraceGuard Database Implementation Roadmap

> For agentic workers: follow `.agents/skills/traceguard-database/SKILL.md` and write a focused implementation plan for the selected phase before changing schema or migrations.

## Purpose

This roadmap turns [RFC 0001](../rfcs/0001-database-architecture.md) into ten independently verifiable delivery phases. The RFC is the architectural authority; this document defines order, outputs, and completion gates. A phase-specific plan supplies exact test cases and file edits using the repository state that exists when work begins.

Database implementation occurs on `backend`. Each verified phase is merged with a merge commit into `develop`, where the full monorepo validation runs. Database-only work does not modify `frontend`, and this roadmap stops before `main`.

## Delivery contract

Every phase follows this loop:

1. Start from the current `backend` branch after its preceding `develop` integration.
2. Write and review a phase-specific plan before editing code.
3. Add failing PostgreSQL integration tests for the phase invariants.
4. Add focused schema modules and one or more new forward-only migrations.
5. Prove clean installation and upgrade from the preceding phase.
6. Validate RLS, privileges, constraints, concurrency, seeds, and critical query plans.
7. Update package documentation and `[Unreleased]` in `CHANGELOG.md`.
8. Commit atomically, review, then merge `backend` into `develop` with history preserved.
9. Run the complete repository checks on `develop` and stop there.

No phase may edit a migration already shared through Git. Test databases must use an isolated Compose project and fresh volumes.

## Shared implementation layout

The implementation should converge on this structure as phases introduce domains:

```text
packages/database/
├── migrations/
├── src/
│   ├── schema/
│   │   ├── foundation/
│   │   ├── identity/
│   │   ├── supply/
│   │   ├── evidence/
│   │   ├── detection/
│   │   ├── incidents/
│   │   ├── trust/
│   │   ├── recall/
│   │   ├── governance/
│   │   ├── execution/
│   │   ├── recovery/
│   │   ├── capa/
│   │   └── platform/
│   ├── client.ts
│   ├── index.ts
│   └── seed.ts
└── tests/
    ├── integration/
    ├── migrations/
    └── support/
```

Names may be refined by a phase plan, but domain ownership and root exports must remain clear. The existing organization-only migration is historical input, not a file to rewrite.

## Dependency map

| Phase | Capability                         | Depends on | Primary domains                    |
| ----- | ---------------------------------- | ---------- | ---------------------------------- |
| 0     | Database foundation                | Existing   | `foundation`, `platform`           |
| 1     | Identity and organization          | 0          | `identity`                         |
| 2     | Product and supply network         | 1          | `supply`                           |
| 3     | Evidence, claims, and graph        | 1, 2       | `evidence`                         |
| 4     | Signals, incidents, investigation  | 2, 3       | `detection`, `incidents`           |
| 5     | Trust state and recall simulation  | 3, 4       | `trust`, `recall`                  |
| 6     | Policy, approval, and recall plans | 1, 4, 5    | `governance`, `recall`             |
| 7     | Recall execution and communication | 6          | `execution`                        |
| 8     | Recovery and CAPA                  | 4, 7       | `recovery`, `capa`                 |
| 9     | Integrations and hardening         | 0–8        | `platform` and cross-domain review |

## Phase 0: Database foundation

### Deliverables

- Establish PostgreSQL 18 extensions, runtime and migration roles, transaction-local tenant context helpers, fail-closed RLS helpers, and append-only protection.
- Add `audit_events`, `outbox_events`, `idempotency_records`, and `retention_policies`; partition `audit_events` by time.
- Establish shared schema helpers for UUIDv7, timestamps, organization keys, optimistic versions, and common indexes.
- Replace the stale `tenant_id` wording in package documentation with the RFC-approved `organization_id` contract.
- Create reusable two-organization fixtures and isolated database-test utilities.

### Completion gate

- Empty install and upgrade from migration `0000` both succeed.
- Missing tenant context returns no tenant rows; mismatched composite keys fail.
- Runtime roles cannot bypass RLS or mutate append-only rows.
- Business state, audit, and outbox roll back together; concurrent outbox claims do not duplicate work.
- Seed execution is repeatable, and representative tenant/time queries use intended indexes.

## Phase 1: Identity and organization

### Deliverables

- Add users, memberships, roles, permissions, role mappings, scope grants, authority grants, and membership transition history.
- Evolve organizations compatibly without rewriting migration `0000`.
- Store Keycloak subjects as identity references while keeping authorization and membership state in PostgreSQL.
- Seed deterministic system permissions and roles without granting cross-organization access.

### Completion gate

- Membership revocation removes access without deleting identity or historical actions.
- Role, scope, and authority constraints reject invalid or cross-organization assignments.
- Authorization fixtures cover two organizations and a user who legitimately belongs to both.
- Transition history and audit records are append-only and transactional.

## Phase 2: Product and supply network

### Deliverables

- Add products, variants, batches, serial ranges, suppliers, facilities, components, composition links, markets, jurisdictions, shipments, stops, items, and pseudonymous recipient references.
- Model expected product composition separately from actual batch inputs.
- Apply effective dating only to relationships whose historical truth must be reconstructed.
- Add tenant-prefixed traceability indexes for product-to-batch and batch-to-shipment journeys.

### Completion gate

- Invalid ranges, overlapping relationships where prohibited, impossible quantities, and tenant-crossing links fail.
- Historical composition and supplier relationships remain reconstructable.
- Shipment exposure can be traced in both directions without storing unnecessary customer profiles.
- Representative traceability queries have reviewed plans at fixture scale.

## Phase 3: Evidence, claims, and graph

### Deliverables

- Add evidence sources, evidence and versions, object metadata, claims, evidence links, custody events, legal holds, evidence relations, graph nodes, graph edges, and edge versions.
- Keep binaries outside PostgreSQL while preserving object location, checksum, media metadata, and custody.
- Preserve directed graph provenance and the source version that asserted each relationship.
- Add hybrid relational and vector retrieval indexes justified by query plans.

### Completion gate

- Evidence versions, custody events, and graph-edge versions reject update and delete.
- Duplicate checksums suggest deduplication but never silently replace records.
- Legal holds override ordinary retention actions.
- Claims and graph traversals cannot cross organizations and retain complete provenance.

## Phase 4: Signals, incidents, and investigation

### Deliverables

- Add signals, occurrences, assessments, deduplication links, signal evidence, incidents, explicit incident subject links, assessments, tasks, decision logs, and state transitions.
- Model incident relationships with explicit tables rather than polymorphic foreign keys.
- Encode valid incident transitions and optimistic concurrency behavior.

### Completion gate

- Duplicate signal ingestion is idempotent while preserving source occurrences.
- Invalid incident transitions and stale `row_version` updates fail.
- Closing without recall requires a decision log referencing actor, reason, evidence, and assessment version.
- Simultaneous assessment and transition tests demonstrate deterministic results and complete audit/outbox transactions.

## Phase 5: Trust state and recall simulation

### Deliverables

- Add scoring methods, immutable trust snapshots and dimensions, observations, change reasons, versioned recall options and scope links, simulation runs, inputs, and impact estimates.
- Record method version, inputs, explanation, and uncertainty for every consequential score or estimate.
- Keep recall options advisory and structurally unable to authorize execution.

### Completion gate

- Trust and simulation outputs reject mutation.
- Missing evidence, exposure, or denominators remains explicitly unknown rather than safe or zero.
- Every result can be reproduced from retained method and input references.
- Recall-scope queries for batches, markets, and recipients remain tenant-isolated and indexed.

## Phase 6: Policy, approval, and recall plans

### Deliverables

- Add versioned policies and approval matrices, evaluations, approval requests, requirements, decisions, invalidations, strong-auth evidence, and versioned recall plans.
- Bind each approval decision to exact option, policy, matrix, evidence, and actor-authentication versions.
- Encode material-change invalidation and plan approval invariants.

### Completion gate

- Approval decisions and invalidations are append-only.
- Material scope, severity, evidence, or policy changes invalidate affected approval state.
- Concurrent decisions cannot bypass quorum, separation-of-duties, authority, or strong-auth rules.
- An approved plan version is immutable and no unapproved option can reach execution eligibility.

## Phase 7: Recall execution and communication

### Deliverables

- Add executions, workflow references, action tasks and attempts, affected items and dispositions, exceptions, transition history, regulatory packages, versioned templates, notifications, recipients, delivery attempts, and acknowledgements.
- Partition delivery attempts and add idempotency keys to all retryable side effects.
- Keep Temporal identifiers as coordination references while PostgreSQL remains authoritative.

### Completion gate

- A partial unique index permits at most one active execution for an approved plan version.
- Execution transitions commit state, history, audit, and outbox together.
- Replayed activities and provider callbacks do not duplicate external effects.
- Notification content always references the approved plan and template versions used.

## Phase 8: Recovery and CAPA

### Deliverables

- Add recovery metric definitions, measurements, snapshots, CAPAs, root causes, actions, evidence, effectiveness checks, and CAPA transitions.
- Partition high-growth recovery measurements and retain calculation definitions with each snapshot.
- Encode effectiveness prerequisites for CAPA closure.

### Completion gate

- Undefined denominators remain unknown, and metric calculations retain source and time-window provenance.
- CAPA closure fails until required actions and successful effectiveness checks exist.
- Recovery and CAPA state histories are immutable and tenant-isolated.
- Execution-to-recovery and incident-to-root-cause query paths have reviewed plans.

## Phase 9: Integrations and operational hardening

### Deliverables

- Add integrations, secret references, sync cursors, webhook endpoints and deliveries, AI model and analysis records, export jobs, purge jobs, and restore drills.
- Keep secrets outside ordinary database fields and preserve only managed secret references.
- Complete retention, anonymization, partition, and index review with representative scale data.
- Document and automate encrypted backup, continuous WAL archiving, point-in-time recovery, and restore validation.

### Completion gate

- Webhooks, syncs, analyses, exports, and purges are retry-safe and auditable.
- AI output remains advisory, versioned, attributable, and incapable of approval or execution.
- Retention and anonymization preserve legal holds and audit references.
- A recorded restore drill proves RPO no greater than 15 minutes and RTO no greater than two hours, including migration, checksum, RLS, and representative business-query checks.

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

The phase-specific plan must add exact migration commands, fixture setup, test filters, expected failure messages, and query-plan assertions. Record commands and results in the handoff or pull request; passing mock tests alone does not complete a phase.

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
