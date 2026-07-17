<!--
SPDX-FileCopyrightText: 2026 TraceGuard contributors
SPDX-License-Identifier: Apache-2.0
-->

# Governance

TraceGuard currently uses a maintainer-led governance model while the contributor community forms.

## Responsibilities

Maintainers are responsible for repository access, release integrity, security response, architecture decisions, product meaning, moderation, and final merge decisions. Contributors are responsible for accurate provenance, scoped changes, tests, documentation, respectful review, and disclosure of relevant conflicts or risks.

## Decision process

Routine, reversible changes are decided through issue and pull-request review. Changes affecting architecture, tenant isolation, evidence integrity, authorization, approval, audit, durable execution, data retention, licensing, or public product meaning require a written architecture or product decision record before implementation.

When consensus is not reached, the repository owner makes the final decision and records the rationale. Security-sensitive decisions may be discussed privately until disclosure is safe.

## Releases and access

Only authorized maintainers may publish releases, change protected-branch settings, rotate project credentials, or modify security advisories. A release must pass its documented validation and security gates and align its tag, changelog, artifacts, and provenance.

This model may be revised as active maintainers and contributors grow. Governance changes are themselves reviewed and recorded in the changelog.
