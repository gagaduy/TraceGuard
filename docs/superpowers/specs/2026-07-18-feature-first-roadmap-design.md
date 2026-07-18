<!--
SPDX-FileCopyrightText: 2026 TraceGuard contributors
SPDX-License-Identifier: Apache-2.0
-->

# TraceGuard Feature-First Roadmap Design

- **Status:** Accepted by the project owner on 2026-07-18
- **Scope:** Product delivery order, MVP boundary, branch integration, and feature completion gates
- **Reference domain:** Multi-tenant food manufacturing and recall management

## Purpose

TraceGuard will be delivered as end-to-end product capabilities instead of database phases. Each capability begins with a user outcome and adds only the UI, API, data, workflow, authorization, audit, and tests required to make that outcome usable.

The first release is a complete but deliberately narrow MVP. It covers the full loop from weak-signal ingestion through verified CAPA effectiveness. Production expansion follows only after that loop works safely and can be demonstrated through browser and failure-recovery tests.

## Accepted product decisions

- Build an end-to-end MVP before production expansion.
- Use a food manufacturer as the reference scenario without hard-coding the core domain to one industry.
- Support four MVP roles: Admin, Quality Analyst, Recall Coordinator, and Approver.
- Enforce real multi-tenancy from the first feature; the primary demo may use one organization, but tests must use at least two.
- Accept product and supply data through forms and CSV imports.
- Accept weak signals through forms, CSV imports, and an idempotent ingestion API.
- Store evidence as versioned files, structured records, or external references.
- Use bounded advisory AI for evidence extraction, duplicate suggestions, and cited case summaries. Every AI path requires human review and a manual fallback.
- Complete the MVP through recall execution, recovery measurement, CAPA, and effectiveness verification.
- Support in-app and email notifications in the MVP.
- Use a bounded policy rule builder plus approval matrices instead of fixed rules or a general-purpose policy language.
- Coordinate recall work inside TraceGuard without integrating physical ERP or WMS actions in the MVP.
- Use deterministic, versioned recall simulation. AI may explain or compare results but cannot define authoritative scope.

## Delivery model

The master roadmap is organized by business value rather than schema ownership:

```text
User outcome
  -> UX and UI states
  -> OpenAPI and application use case
  -> authorization and tenant boundary
  -> minimum required schema and migration
  -> audit, outbox, and workflow when required
  -> unit, integration, browser, and failure tests
  -> documentation, changelog, and integration evidence
```

A database table is created only when the current capability has all four of the following:

1. A user or system use case that owns its lifecycle.
2. An invariant or relationship that requires a durable boundary.
3. A concrete query used by the capability.
4. A database-backed test proving the required behavior.

There is no independent database implementation phase. Audit, outbox, idempotency, retention, and other platform structures enter the product through the first feature that consumes them.

## Master feature checklist

### Wave 0: Roadmap transition

- [ ] Preserve the unpushed database-first work on a local-only archive branch.
- [ ] Restore `backend` to the last baseline before database-first implementation.
- [ ] Replace database delivery documents with this feature-first roadmap while retaining accepted architectural invariants.
- [ ] Verify the existing web, API, workflow, AI-service, Compose, and CI baseline.

### Wave 1: Access

- [ ] Onboard an organization and establish explicit tenant context.
- [ ] Authenticate through Keycloak and validate issuer, audience, signature, expiry, and relevant MFA claims.
- [ ] Invite, activate, suspend, and revoke organization memberships.
- [ ] Enforce Admin, Quality Analyst, Recall Coordinator, and Approver permissions in the API.
- [ ] Provide an accessible application shell, organization switcher, and permission-aware navigation.
- [ ] Record actor, organization, reason, correlation ID, and before/after state for consequential changes.

### Wave 2: Know the supply network

- [ ] Manage products, variants, lifecycle status, and provenance.
- [ ] Manage suppliers, facilities, and components.
- [ ] Record batches, actual components, production facility, production time, and expiry.
- [ ] Record shipments, shipment items, markets, and privacy-conscious recipient references.
- [ ] Import supply data from CSV with preview, per-row validation, idempotency, and a durable import report.
- [ ] Store evidence as a file, structured record, or external reference.
- [ ] Protect evidence with checksum, version, classification, malware-scan state, retention metadata, and legal hold.

### Wave 3: Detect and investigate

- [ ] Ingest weak signals through a form, CSV, and an idempotent API.
- [ ] Triage signals using severity, confidence, source reliability, provenance, and deduplication information.
- [ ] Validate, reject, mark duplicate, monitor, or promote a signal without deleting its history.
- [ ] Open an incident, assign an owner, and link the initiating signals.
- [ ] Manage hypotheses, claims, evidence, investigation tasks, assessments, and decision logs.
- [ ] Build typed Evidence Graph relationships among claims, evidence, products, batches, suppliers, facilities, and shipments.
- [ ] Trace affected components through batches, shipments, recipients, and markets.
- [ ] Produce a versioned trust snapshot that exposes explanation, contrary evidence, missing data, and uncertainty.
- [ ] Offer human-reviewed AI extraction, duplicate suggestions, and cited incident summaries with manual fallback.

### Wave 4: Decide with governance

- [ ] Create multiple versioned recall options with scope, assumptions, evidence snapshot, and unresolved uncertainty.
- [ ] Simulate coverage, missed risk, over-recall, time, and cost through deterministic versioned rules.
- [ ] Compare options without hiding unknown data or conflicting evidence.
- [ ] Configure bounded policy rules using severity, exposure, market, category, and risk thresholds.
- [ ] Configure approval matrices with authority scope, quorum, and separation of duties.
- [ ] Approve, reject, request changes, or abstain against an immutable option and policy version.
- [ ] Invalidate approvals when material evidence, scope, option, assessment, or policy data changes.
- [ ] Create an executable recall plan only from the exact option version satisfying current policy and approval requirements.

### Wave 5: Act, recover, and learn

- [ ] Start a durable Temporal recall workflow from an approved plan version.
- [ ] Create dependency-aware action tasks with assignees, deadlines, retry, escalation, and exceptions.
- [ ] Authorize and audit pause, resume, retry, and manual intervention.
- [ ] Deliver permission-aware in-app notifications.
- [ ] Deliver versioned email content idempotently to one recipient per notification record.
- [ ] Track queued, sent, provider-accepted or delivered, acknowledged, failed, bounced, and suppressed states when supported.
- [ ] Track affected, located, contained, returned, and unresolved quantities without inventing unknown denominators.
- [ ] Complete an execution as completed, completed with exceptions, or failed only when its criteria are met.
- [ ] Measure time to detect, decide, approve, and notify plus acknowledgement and containment rates using explicit definitions.
- [ ] Record root cause and corrective or preventive actions with owners, deadlines, evidence, and escalation.
- [ ] Close a CAPA only after an effectiveness check demonstrates the accepted criterion.
- [ ] Trace the complete decision history from the originating signal through CAPA effectiveness.

### Wave 6: Scale and production readiness

- [ ] Add hybrid full-text and semantic search with tenant, classification, and permission filtering.
- [ ] Add a versioned integration framework with credential references, mapping, retry, circuit protection, and health.
- [ ] Add signed webhooks with replay protection and idempotent delivery.
- [ ] Export audit and business reports according to authorization, classification, retention, and legal hold.
- [ ] Add advanced AI optimization or forecasting only with versioned inputs, uncertainty, citations, and safe fallback.
- [ ] Add actionable telemetry, alerts, workflow visibility, and provider-outage procedures.
- [ ] Exercise backup restoration, evidence recovery, and workflow recovery.
- [ ] Run upload, secret, dependency, container, and authorization security checks.
- [ ] Tune queries, indexes, partitions, and capacity only from representative measurements.
- [ ] Complete production migration, forward-fix, release, and recovery runbooks.

## Branch and integration policy

Only four public branches are maintained:

```text
main       <- stable releases only
develop    <- cross-cutting documentation and verified integration
frontend   <- web, shared UI, and generated API-client changes
backend    <- API, database, workflows, AI service, and backend infrastructure
```

Local worktrees do not create GitHub branches. A Git branch contains its full ancestor history, so branch scope is judged by the commits and diff introduced on that branch, not by pretending the branch can physically contain only one directory.

For each capability:

1. Define the actor, outcome, rejection cases, state transition, and contract.
2. Synchronize `backend` from the current `develop` baseline.
3. Add failing backend tests, implement the minimum backend slice, validate, commit atomically, and push `backend`.
4. Merge `backend` into `develop` with history preserved.
5. Synchronize `frontend` from the updated `develop` baseline.
6. Add failing component or browser tests, implement the UI slice, validate, commit atomically, and push `frontend`.
7. Merge `frontend` into `develop` with history preserved.
8. Run integration, browser, license, and security gates on `develop`.
9. Record commit and command evidence, then push `develop`.

No work is merged or pushed to `main` without explicit owner approval at a release gate.

## Error and resilience design

Every feature must provide loading, empty, validation, forbidden, partial-result, stale-version, dependency-error, and success states where applicable. Dangerous actions require contextual confirmation, a description of consequences, and a reason.

The API returns RFC 9457 Problem Details and never exposes stack traces, SQL errors, secrets, or internal object-storage paths. Missing tenant context fails closed. Consequential transitions use explicit transactions, server-side authorization, audit records, and optimistic concurrency or row locking where decisions can race.

Retryable mutations and external effects use idempotency. Database changes that trigger workflows or external events write an outbox record in the same transaction. Temporary provider failures receive bounded retry; permanent failures or exhausted retry become visible exceptions requiring escalation. AI downtime or schema-invalid output activates a manual path and cannot block access to evidence, approval, or recall execution.

## Testing strategy

Each capability selects tests from its risks and must include all applicable gates:

- Domain rule and state-machine unit tests.
- Request validation and Problem Details API tests.
- Role, authority-scope, and separation-of-duties tests.
- Two-organization cross-tenant tests.
- Forward migration, constraint, transaction, concurrency, and stale-version tests.
- Duplicate request, duplicate event, idempotency, and retry tests.
- Temporal replay, timeout, retry, restart, and compensation tests.
- Node-to-Python schema validation and manual-fallback tests.
- Accessible component tests for loading, empty, error, partial, conflict, and permission states.
- Playwright success, rejection, invalidation, and failure-recovery journeys.
- Repository CI, licensing, security, formatting, and diff checks.

## Release boundaries

### Walking Skeleton

A user can authenticate, select an organization, exercise a permission, create the minimum product or batch record, and see an audited mutation through the generated API client. Two-tenant tests prove isolation.

### Traceability Foundation

Users can import and manage the product and supply network, attach safe versioned evidence, and trace a batch to its source and distribution markets.

### Investigation

Users can ingest and triage a signal, open an incident, manage evidence-backed investigation, determine affected scope, and review bounded advisory AI outputs.

### Decision Governance

Users can create and deterministically simulate recall options, evaluate bounded policies, collect valid human approvals, invalidate stale approvals, and produce an executable plan.

### MVP Release

Users can durably execute the approved plan, communicate and collect acknowledgements, track containment and exceptions, measure recovery, verify CAPA effectiveness, and retrieve the complete decision trail. The critical browser journey and its failure-recovery counterpart must pass before release.

The project owner explicitly approves the merge from `develop` to `main` for the MVP release.

### Production Expansion

Provider-specific integrations, advanced search and AI, report export, measured scale work, restore drills, security hardening, deployment procedures, and later channels or roles follow the MVP as independently reviewable capabilities.

## MVP non-goals

- A provider-specific ERP or WMS integration.
- SMS and regulatory-feed adapters.
- A general-purpose policy language.
- Autonomous AI conclusions, approvals, notifications, or recall actions.
- A separate graph database, Elasticsearch, Kafka, or business microservices.
- Replacing warehouse, CRM, ERP, WMS, or QMS systems.

## Feature Definition of Done

A checklist item is complete only when its business acceptance criteria pass; tenant isolation and server authorization are proven; state transitions, audit, transactions, versions, retry, and idempotency are correct; OpenAPI, generated client, and UI agree; required migrations and recovery strategy are reviewed; loading, empty, error, partial, conflict, and permission UI states exist; relevant unit, integration, workflow, AI-contract, and browser tests pass; observability, security, privacy, and retention impacts are addressed; documentation, changelog, and SPDX metadata are current; and the atomic commits plus validation commands are recorded on `develop`.
