<!--
SPDX-FileCopyrightText: 2026 TraceGuard contributors
SPDX-License-Identifier: Apache-2.0
-->

# TraceGuard Feature-First Master Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver a safe multi-tenant TraceGuard MVP for food manufacturers through complete vertical features from organization access to verified CAPA effectiveness, then expand it to production readiness.

**Architecture:** Build each capability as a frontend-to-database vertical slice on the accepted modular-monolith architecture. PostgreSQL structures, Temporal workflows, AI calls, audit, outbox, and idempotency enter only through the first user outcome that needs them; every independent capability receives its own approved spec and detailed TDD plan before code changes.

**Tech Stack:** Next.js 16, React 19, TypeScript 5.9, Express 5, OpenAPI 3.1, PostgreSQL 18, Drizzle ORM, Temporal TypeScript SDK, Python 3.13, FastAPI, Keycloak, S3-compatible object storage, TanStack Query, React Hook Form, Zod, Vitest, Supertest, Playwright, Docker Compose, pnpm, Turborepo, and `just`.

## Global Constraints

- Treat [the accepted feature-first design](../specs/2026-07-18-feature-first-roadmap-design.md) as the product-delivery source of truth.
- Use a food-manufacturing reference scenario while keeping domain names and contracts industry-neutral where the business meaning is shared.
- Support Admin, Quality Analyst, Recall Coordinator, and Approver in the MVP.
- Enforce tenant isolation at the API and PostgreSQL boundaries from the first tenant-owned feature.
- Keep AI advisory, attributable, schema-validated, human-reviewed, and replaceable by a manual path.
- Never execute a recall without current deterministic policy results and valid human approval for the exact plan version.
- Add a table only when the current feature has a lifecycle, invariant, query, and database-backed test requiring it.
- Keep `frontend` changes to `apps/web`, `packages/ui`, and `packages/api-client`; keep API, database, workflows, AI, and backend infrastructure on `backend`.
- Merge verified branch work into `develop` with merge commits. Do not merge or push `main` without explicit owner approval.
- Use TDD, forward-only migrations, atomic Conventional Commits, Keep a Changelog entries, and SPDX declarations.
- Run `just ci`, license checks, security checks, and the feature's critical browser journey on `develop` before marking a capability complete.

---

## How to use this master checklist

This document tracks product capabilities and integration evidence. It does not guess implementation code for future bounded contexts. Before starting each numbered capability:

- [ ] Brainstorm and approve the capability design against its actor, outcome, invariants, failure modes, and rejection cases.
- [ ] Save the design under `docs/superpowers/specs/YYYY-MM-DD-<capability>-design.md` on `develop`.
- [ ] Write a self-contained TDD plan under `docs/superpowers/plans/features/NN-<capability>.md` with exact files, interfaces, test code, commands, and commits.
- [ ] Execute backend steps on `backend`, push them, and merge them into `develop`.
- [ ] Execute frontend steps on `frontend` from the updated `develop`, push them, and merge them into `develop`.
- [ ] Run the capability integration and browser gates on `develop`.
- [ ] Record backend SHA, frontend SHA, develop merge SHAs, commands, and results in this plan.

## Planned file boundaries

| Concern                           | Primary location                                                     |
| --------------------------------- | -------------------------------------------------------------------- |
| Public contract                   | `openapi/traceguard.openapi.yaml`                                    |
| Generated browser contract        | `packages/api-client/src/generated/schema.d.ts`                      |
| Shared accessible components      | `packages/ui/src/components/`                                        |
| Web routes and feature UI         | `apps/web/app/`, `apps/web/components/`, `apps/web/tests/e2e/`       |
| API platform boundaries           | `apps/api/src/platform/`                                             |
| API domain modules                | `apps/api/src/modules/<domain>/`                                     |
| PostgreSQL schema and migrations  | `packages/database/src/schema/`, `packages/database/migrations/`     |
| Temporal workflows and activities | `apps/workflows/src/workflows/`, `apps/workflows/src/activities/`    |
| Advisory AI schemas and tasks     | `apps/ai-service/app/`, `apps/ai-service/tests/`                     |
| Feature specs and plans           | `docs/superpowers/specs/`, `docs/superpowers/plans/features/`        |
| Integration and browser tests     | `packages/database/tests/`, `apps/api/tests/`, `apps/web/tests/e2e/` |
| Operator documentation            | `docs/operations/`                                                   |

---

### Task 0: Archive the database-first prototype and restore the delivery baseline

**Files:**

- Delete: `docs/roadmaps/database-implementation.md`
- Delete: `docs/rfcs/0001-database-architecture.md`
- Delete: `docs/plans/database/2026-07-17-phase-0-foundation.md`
- Modify: `CHANGELOG.md`
- Verify: `apps/`, `packages/`, `compose.yaml`, `justfile`

**Interfaces:**

- Consumes: local `backend` prototype commits and uncommitted review fixes.
- Produces: local-only `archive/database-first-2026-07-18`, restored public `backend`, and documentation that distinguishes retained database invariants from superseded delivery order.

- [ ] Confirm `develop` contains this master plan and has no unrelated changes.
- [ ] Inspect `backend` commits, dirty files, upstream SHA, and worktree path.
- [ ] Create local branch `archive/database-first-2026-07-18` at the prototype HEAD.
- [ ] Commit the dirty prototype review fixes on the archive branch without pushing it.
- [ ] Verify the archive contains every prototype commit and dirty file before changing `backend`.
- [ ] Restore `backend` to the verified pre-database-first upstream baseline.
- [ ] Mark database phase delivery as superseded while preserving its tenant, integrity, migration, audit, and recovery decisions as references.
- [ ] Run `just ci`, `git diff --check`, and the repository license audit on the restored baseline.
- [ ] Commit documentation on `develop` as `docs(roadmap): supersede database-first delivery`.
- [ ] Record the archive SHA and restored backend SHA below.

**Evidence:** Not started.

---

### Task 1: Organization onboarding, authentication, and application shell

**Feature plan:** `docs/superpowers/plans/features/01-organization-access.md`

**Outcome:** An authenticated user can enter an authorized organization context and see an accessible permission-aware application shell; missing or unauthorized tenant context fails closed.

- [ ] Configure Keycloak OIDC validation for issuer, audience, signature, expiry, and subject.
- [ ] Create or reconcile an organization through an authorized onboarding flow.
- [ ] Resolve organization context explicitly for every business request.
- [ ] Add organization switching without leaking cached data between tenants.
- [ ] Add authenticated layout, navigation, loading, empty, forbidden, and session-expired states.
- [ ] Prove invalid token, absent tenant, and cross-tenant organization access are rejected.
- [ ] Record onboarding and organization-context audit events.
- [ ] Pass API, component, accessibility, and Playwright login/context tests.

**Evidence:** Not started.

### Task 2: Membership lifecycle and four-role authorization

**Feature plan:** `docs/superpowers/plans/features/02-membership-authorization.md`

**Outcome:** An Admin can invite and manage members while every server-side action enforces Admin, Quality Analyst, Recall Coordinator, or Approver permissions and relevant MFA requirements.

- [ ] Invite a member and bind the invitation to one organization.
- [ ] Activate, suspend, and revoke membership without deleting history.
- [ ] Assign and revoke the four MVP roles.
- [ ] Re-check membership and authority at sensitive actions rather than trusting stale browser state.
- [ ] Enforce privileged-role MFA claims.
- [ ] Prevent role escalation, cross-tenant assignment, and unauthorized invitation acceptance.
- [ ] Show permission-aware controls and explicit forbidden states.
- [ ] Pass role-matrix, suspended-user, MFA, stale-session, and two-tenant browser tests.

**Evidence:** Not started.

### Task 3: Product, supplier, facility, and component registry

**Feature plan:** `docs/superpowers/plans/features/03-supply-registry.md`

**Outcome:** Authorized users can maintain the minimum product and supply-network master data needed for later traceability, with provenance and optimistic concurrency.

- [ ] Create, view, update, archive, and list products and variants.
- [ ] Create and maintain suppliers, facilities, and components.
- [ ] Capture source, effective time, status, and organization ownership.
- [ ] Reject duplicate natural identifiers and tenant-crossing relationships.
- [ ] Protect concurrent edits with row versions and conflict UI.
- [ ] Provide filter, sort, pagination, loading, empty, validation, and permission states.
- [ ] Audit consequential changes with reason and before/after state.
- [ ] Pass domain, API, database, component, and two-tenant tests.

**Evidence:** Not started.

### Task 4: Batch composition, shipments, markets, and CSV import

**Feature plan:** `docs/superpowers/plans/features/04-traceability-import.md`

**Outcome:** A user can record or import batches and distribution data, then trace a batch backward to components and forward to markets and privacy-conscious recipient references.

- [ ] Record batch identity, production facility, actual components, quantity, production time, and expiry.
- [ ] Record shipments, shipment items, destination markets, and pseudonymous recipient references.
- [ ] Preview CSV rows before mutation.
- [ ] Validate required columns, types, identifiers, quantities, tenant ownership, and row limits.
- [ ] Make retries idempotent and return durable per-row success or failure results.
- [ ] Preserve import source, checksum, actor, time, and mapping version.
- [ ] Trace component to batch and batch to shipment/market through indexed queries.
- [ ] Pass duplicate-import, partial-row failure, stale-source, cross-tenant, query-plan, and browser tests.

**Evidence:** Not started.

### Task 5: Versioned and classified evidence vault

**Feature plan:** `docs/superpowers/plans/features/05-evidence-vault.md`

**Outcome:** A Quality Analyst can store, classify, version, review, and retrieve file, structured, or externally referenced evidence without silently replacing history.

- [ ] Create evidence metadata with source, provenance, classification, verification state, and occurrence/ingestion times.
- [ ] Upload files through bounded content validation and an S3-compatible versioned object boundary.
- [ ] Store structured evidence with schema version and external evidence with source reference.
- [ ] Record checksum, object version, media type, size, uploader, and malware-scan state.
- [ ] Quarantine unsafe or unscanned objects and deny unauthorized downloads.
- [ ] Create successor versions while preserving decision-linked versions.
- [ ] Apply retention metadata and legal hold without allowing destructive bypass.
- [ ] Pass checksum, malicious-upload, version-history, classification, signed-download, legal-hold, and browser tests.

**Evidence:** Not started.

### Task 6: Weak-signal ingestion and triage

**Feature plan:** `docs/superpowers/plans/features/06-signal-triage.md`

**Outcome:** A Quality Analyst can ingest signals through form, CSV, or API and move them through a fully audited triage state machine.

- [ ] Ingest manual signals with source and subject provenance.
- [ ] Import signal CSV files through the validated import boundary.
- [ ] Expose an organization-scoped idempotent integration endpoint.
- [ ] Display severity, confidence, source reliability, uncertainty, and duplicate candidates separately.
- [ ] Transition New → Triaging → Validated, Rejected, Duplicate, or monitored outcome using explicit reasons.
- [ ] Promote only validated signals while retaining rejected and duplicate history.
- [ ] Handle duplicate requests, stale versions, unauthorized transitions, and partial imports.
- [ ] Pass state-machine, idempotency, cross-tenant, API rejection, inbox component, and Playwright triage tests.

**Evidence:** Not started.

### Task 7: Incident workspace and evidence-backed investigation

**Feature plan:** `docs/superpowers/plans/features/07-incident-investigation.md`

**Outcome:** A validated signal can become an owned incident containing hypotheses, claims, evidence, tasks, assessments, and immutable decision reasons.

- [ ] Open an incident from one or more validated signals without duplicate promotion.
- [ ] Assign and reassign an authorized incident owner.
- [ ] Manage hypotheses and claims with supporting, opposing, or inconclusive evidence links.
- [ ] Create investigation tasks with owner, deadline, status, and escalation.
- [ ] Record severity, likelihood, confidence, and uncertainty as versioned assessments.
- [ ] Move through Open, Investigating, Assessing, Awaiting Decision, Monitoring, and Closed only through valid transitions.
- [ ] Require evidence-backed reason to close without recall and audit every reopen.
- [ ] Pass state, concurrency, ownership, contrary-evidence, close/reopen, and browser workspace tests.

**Evidence:** Not started.

### Task 8: Evidence Graph, affected scope, and trust snapshots

**Feature plan:** `docs/superpowers/plans/features/08-impact-and-trust.md`

**Outcome:** An analyst can explain which products, batches, shipments, recipients, and markets may be affected and view a reproducible product-trust snapshot with explicit unknowns.

- [ ] Create typed, directed, sourced, and effective-dated graph relationships.
- [ ] Traverse component, batch, supplier, facility, shipment, market, evidence, and claim relationships.
- [ ] Prevent cross-tenant edges and unsafe unbounded traversal.
- [ ] Materialize an incident affected-scope proposal without treating it as approved recall scope.
- [ ] Record trust dimensions, method version, inputs, explanation, and uncertainty.
- [ ] Preserve historical trust snapshots when evidence changes.
- [ ] Show supporting, opposing, missing, and restricted evidence states.
- [ ] Pass recursive-query, cycle, depth-limit, tenant, reproducibility, permission-filter, and browser tests.

**Evidence:** Not started.

### Task 9: Bounded advisory AI for evidence and investigations

**Feature plan:** `docs/superpowers/plans/features/09-advisory-ai.md`

**Outcome:** Users may request evidence extraction, duplicate suggestions, or cited incident summaries while retaining human control and a complete manual fallback.

- [ ] Record an AI job with tenant, task, input references, pipeline version, and correlation ID.
- [ ] Execute the job through Temporal and the private Python service.
- [ ] Validate request and response schemas on both sides of the service boundary.
- [ ] Return model/provider/version, confidence, citations, limitations, and warning fields.
- [ ] Require human accept, correct, or reject action before advisory output affects business data.
- [ ] Prevent restricted or cross-tenant evidence from entering prompts or responses.
- [ ] Preserve manual extraction, duplicate review, and case-summary workflows during AI outage.
- [ ] Pass invalid-schema, timeout, retry, tenant-leakage, hallucinated-citation, human-review, and fallback tests.

**Evidence:** Not started.

### Task 10: Recall options and deterministic simulation

**Feature plan:** `docs/superpowers/plans/features/10-recall-options.md`

**Outcome:** A Recall Coordinator can create versioned recall options and compare reproducible scope, coverage, missed risk, over-recall, time, and cost estimates.

- [ ] Create draft options from an incident and exact evidence/trust snapshot.
- [ ] Define product, batch, shipment, market, recipient, and action scope.
- [ ] Capture assumptions, unresolved uncertainty, success criteria, and stop criteria.
- [ ] Run deterministic simulation with versioned formulas and input snapshot.
- [ ] Keep unknown quantities unknown and expose denominator/source definitions.
- [ ] Compare multiple options without deleting rejected alternatives.
- [ ] Freeze an option version when submitted for review and create a new version for material changes.
- [ ] Pass reproducibility, stale-snapshot, invalid-scope, unknown-data, authorization, and browser comparison tests.

**Evidence:** Not started.

### Task 11: Bounded policies, approval matrices, and decisions

**Feature plan:** `docs/superpowers/plans/features/11-policy-approval.md`

**Outcome:** An Admin can configure bounded deterministic rules, and authorized Approvers can decide on an immutable option version under quorum and separation-of-duties constraints.

- [ ] Configure versioned rules for severity, exposure, market, category, and risk threshold.
- [ ] Configure approver role, authority scope, quorum, MFA, expiry, and separation of duties.
- [ ] Evaluate policy deterministically and retain inputs, results, rule version, and explanation.
- [ ] Create an approval request bound to exact option, policy, matrix, assessment, and evidence versions.
- [ ] Record approve, reject, request changes, or abstain as immutable decisions with reasons.
- [ ] Reject self-approval, insufficient authority, stale version, expired request, and missing MFA.
- [ ] Invalidate approval after material option, evidence, severity, scope, or policy changes.
- [ ] Pass concurrent quorum, authority, self-approval, expiry, invalidation, and browser review tests.

**Evidence:** Not started.

### Task 12: Executable recall plan and durable workflow start

**Feature plan:** `docs/superpowers/plans/features/12-recall-plan-workflow.md`

**Outcome:** Only a currently valid approved option can produce one executable plan version and start one durable Temporal recall workflow.

- [ ] Create an immutable plan from the exact approved option and notification content versions.
- [ ] Re-evaluate current policy and approval immediately before execution.
- [ ] Reject stale, invalidated, rejected, expired, or unauthorized execution attempts.
- [ ] Atomically persist execution state, audit, idempotency, and outbox intent.
- [ ] Start or recover one Temporal workflow using a tenant-safe deterministic workflow ID.
- [ ] Make duplicate client requests and outbox deliveries converge on the same execution.
- [ ] Preserve workflow/run references and correlation across API and worker.
- [ ] Pass race, duplicate-start, outbox-retry, worker-restart, invalid-approval, and browser start tests.

**Evidence:** Not started.

### Task 13: Recall action tasks and controlled intervention

**Feature plan:** `docs/superpowers/plans/features/13-recall-actions.md`

**Outcome:** Recall Coordinators can monitor dependency-aware work while authorized users complete tasks or perform audited pause, resume, retry, and manual intervention.

- [ ] Generate action tasks from the approved plan with dependencies, owners, deadlines, and idempotency keys.
- [ ] Prevent dependent tasks from starting before prerequisites are satisfied.
- [ ] Complete, fail, retry, reassign, or escalate tasks through authorized transitions.
- [ ] Re-check current membership and authority for sensitive actions.
- [ ] Pause and resume execution with reason and impact display.
- [ ] Record exceptions and manual intervention without rewriting workflow history.
- [ ] Resume correctly after Temporal worker restart.
- [ ] Pass dependency, retry, crash-recovery, lost-permission, stale-task, escalation, and browser tests.

**Evidence:** Not started.

### Task 14: In-app/email notifications and acknowledgement

**Feature plan:** `docs/superpowers/plans/features/14-notifications.md`

**Outcome:** TraceGuard sends approved, versioned content once per intended recipient, distinguishes delivery from acknowledgement, and safely retries only the failed subset.

- [ ] Version notification templates by channel and locale.
- [ ] Bind outbound content to the approved plan version.
- [ ] Create one notification per recipient with privacy-conscious addressing.
- [ ] Deliver in-app notifications with permission-aware links and read state.
- [ ] Deliver email through an adapter with timeout, bounded retry, and idempotency.
- [ ] Track queued, sent, accepted/delivered, acknowledged, failed, bounced, and suppressed states when available.
- [ ] Retry only transiently failed recipients and escalate permanent failures.
- [ ] Pass duplicate-delivery, partial-provider-failure, template-version, acknowledgement, privacy, and browser tests.

**Evidence:** Not started.

### Task 15: Containment tracking and recall completion

**Feature plan:** `docs/superpowers/plans/features/15-containment-completion.md`

**Outcome:** Operations users can record affected, located, contained, returned, and unresolved quantities, and the execution can finish only under explicit evidence-backed criteria.

- [ ] Record measurements by approved scope item, source, time, unit, and actor.
- [ ] Validate units, nonnegative quantities, scope ownership, and denominator provenance.
- [ ] Preserve unknown exposure instead of displaying a false zero or percentage.
- [ ] Calculate coverage and unresolved exposure from versioned definitions.
- [ ] Record exceptions and supporting evidence.
- [ ] Complete as Completed, Completed With Exceptions, or Failed only when configured criteria are satisfied.
- [ ] Reject stale, cross-tenant, over-counted, and unsupported completion attempts.
- [ ] Pass measurement, concurrency, unknown-denominator, completion-gate, audit, and browser tests.

**Evidence:** Not started.

### Task 16: Recovery metrics and trusted-state restoration

**Feature plan:** `docs/superpowers/plans/features/16-recovery.md`

**Outcome:** Users can measure detection, decision, approval, notification, acknowledgement, containment, and trust-recovery performance from explicit definitions and sources.

- [ ] Define metric name, scope, numerator, denominator, time window, unit, and source.
- [ ] Establish an immutable recovery baseline when incident action begins.
- [ ] Record measurements and derive snapshots without overwriting history.
- [ ] Display definition, source, missing data, uncertainty, and comparison period.
- [ ] Prevent incompatible units, cross-scope aggregation, and undefined percentages.
- [ ] Link restored trust state to evidence and unresolved exposure.
- [ ] Audit manual corrections as successor measurements.
- [ ] Pass formula, window, unknown-denominator, scope, correction-history, and dashboard tests.

**Evidence:** Not started.

### Task 17: CAPA lifecycle and effectiveness verification

**Feature plan:** `docs/superpowers/plans/features/17-capa-effectiveness.md`

**Outcome:** An incident produces corrective or preventive work that cannot close until an authorized effectiveness check provides sufficient evidence.

- [ ] Record problem statement, root cause, method, incident links, and supporting evidence.
- [ ] Create corrective or preventive actions with owner, due date, verification method, and escalation.
- [ ] Move through Proposed, Approved, In Progress, Verification, Effective/Ineffective, and Closed transitions.
- [ ] Prevent action completion from automatically declaring effectiveness.
- [ ] Record immutable effectiveness checks with criteria, result, reviewer, evidence, and time.
- [ ] Return ineffective CAPA to active work without erasing failed verification.
- [ ] Close only effective CAPA under current authorization.
- [ ] Pass state, deadline, escalation, ineffective-loop, evidence, authorization, and browser tests.

**Evidence:** Not started.

### Task 18: End-to-end decision trail and MVP release gate

**Feature plan:** `docs/superpowers/plans/features/18-mvp-decision-trail.md`

**Outcome:** An authorized user can trace every consequential fact, version, decision, workflow action, recovery measurement, and CAPA result from the originating signal, and the complete MVP passes release gates.

- [ ] Provide a permission-filtered timeline from signal ingestion through CAPA effectiveness.
- [ ] Link exact evidence, assessment, option, policy, approval, plan, workflow, notification, measurement, and CAPA versions.
- [ ] Distinguish user, integration, system worker, and advisory AI actions.
- [ ] Export an authorized audit package without exposing restricted evidence.
- [ ] Run the critical Playwright journey from signal to effective CAPA.
- [ ] Run rejection journeys for cross-tenant access, self-approval, stale approval, duplicate notification, AI outage, and worker restart.
- [ ] Run migration-from-clean, backup/restore, license, dependency, secret, and container gates.
- [ ] Prepare MVP changelog, release notes, migration runbook, and recovery checklist.
- [ ] Request explicit owner approval before merging `develop` into `main`.

**Evidence:** Not started.

### Task 19: Post-MVP search, integrations, hardening, and production releases

**Feature plans:**

- `docs/superpowers/plans/features/19-hybrid-search.md`
- `docs/superpowers/plans/features/20-integration-framework.md`
- `docs/superpowers/plans/features/21-signed-webhooks.md`
- `docs/superpowers/plans/features/22-provider-adapters.md`
- `docs/superpowers/plans/features/23-reporting-exports.md`
- `docs/superpowers/plans/features/24-operational-hardening.md`
- `docs/superpowers/plans/features/25-measured-performance.md`

**Outcome:** TraceGuard expands from the verified MVP through measured, independently releasable production capabilities rather than a single hardening batch.

- [ ] Add tenant- and permission-filtered PostgreSQL full-text search.
- [ ] Add pgvector semantic retrieval only after evidence permission and citation behavior are proven.
- [ ] Add a versioned integration registry with secret references, mapping, health, timeout, retry, and circuit protection.
- [ ] Add signed outbound webhooks with replay protection and idempotency.
- [ ] Add provider-specific ERP, WMS, laboratory, carrier, retailer, or regulatory adapters one at a time.
- [ ] Add advanced recall optimization or recovery forecasting only with reproducibility, uncertainty, and human review.
- [ ] Add authorized reports and exports respecting classification, retention, privacy, and legal hold.
- [ ] Add actionable alerts, capacity/cost monitoring, credential rotation, and provider-outage runbooks.
- [ ] Exercise database point-in-time recovery, evidence recovery, and Temporal recovery against recorded objectives.
- [ ] Add query indexes, partitions, caches, or infrastructure only after representative benchmarks identify a need.
- [ ] Run a separate release gate and request explicit approval for every merge from `develop` to `main`.

**Evidence:** Not started.

---

## Master completion record

| Task | Capability               | Status      | Backend evidence | Frontend evidence | Develop integration |
| ---: | ------------------------ | ----------- | ---------------- | ----------------- | ------------------- |
|    0 | Roadmap transition       | Not started | —                | —                 | —                   |
|    1 | Organization access      | Not started | —                | —                 | —                   |
|    2 | Membership authorization | Not started | —                | —                 | —                   |
|    3 | Supply registry          | Not started | —                | —                 | —                   |
|    4 | Traceability import      | Not started | —                | —                 | —                   |
|    5 | Evidence vault           | Not started | —                | —                 | —                   |
|    6 | Signal triage            | Not started | —                | —                 | —                   |
|    7 | Incident investigation   | Not started | —                | —                 | —                   |
|    8 | Impact and trust         | Not started | —                | —                 | —                   |
|    9 | Advisory AI              | Not started | —                | —                 | —                   |
|   10 | Recall options           | Not started | —                | —                 | —                   |
|   11 | Policy approval          | Not started | —                | —                 | —                   |
|   12 | Recall plan workflow     | Not started | —                | —                 | —                   |
|   13 | Recall actions           | Not started | —                | —                 | —                   |
|   14 | Notifications            | Not started | —                | —                 | —                   |
|   15 | Containment completion   | Not started | —                | —                 | —                   |
|   16 | Recovery                 | Not started | —                | —                 | —                   |
|   17 | CAPA effectiveness       | Not started | —                | —                 | —                   |
|   18 | MVP decision trail       | Not started | —                | —                 | —                   |
|   19 | Production expansion     | Not started | —                | —                 | —                   |

Update a row only after its backend, frontend, integration, documentation, and validation gates have objective evidence. A schema, route, mockup, or happy-path demo alone does not complete a capability.
