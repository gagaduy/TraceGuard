<!--
SPDX-FileCopyrightText: 2026 TraceGuard contributors
SPDX-License-Identifier: Apache-2.0
-->

# Contributing to TraceGuard

Thank you for helping build TraceGuard. Contributions are welcome when they strengthen a safe, evidence-backed, tenant-isolated, and auditable recall-resilience system.

## Before starting

1. Search existing issues and discussions before proposing duplicate work.
2. Open an issue for changes that affect product meaning, architecture, security boundaries, data retention, approval rules, or public contracts.
3. Never include personal data, production data, credentials, private endpoints, or proprietary evidence in an issue, fixture, log, or commit.
4. Read the architecture overview and identify the actor, business outcome, owning context, tenant boundary, authorization rule, state transition, audit event, failure mode, and required tests.

## Branches

- Branch from the intended base after confirming it is current.
- Use `main` for stable repository documentation and accepted releases.
- Use `develop` as the shared integration base.
- Keep frontend-only work based on `frontend` and backend-only work based on `backend` until the maintainers approve integration.
- Use a short task branch named `<type>/<issue>-<short-name>`, such as `feat/42-incident-triage` or `fix/57-tenant-scope`.
- Do not mix independent objectives on one branch.

## Atomic change loop

For each independently testable unit:

1. state its acceptance check;
2. implement the unit with its tests and documentation;
3. update `CHANGELOG.md` under `[Unreleased]`;
4. add valid SPDX declarations to eligible project-owned files;
5. run focused validation and the relevant wider check;
6. inspect both unstaged and staged diffs;
7. commit the unit immediately.

Use Conventional Commits:

```text
<type>(<scope>): <imperative summary>
```

Keep the summary specific, imperative, and no longer than 72 characters. Use `!` and a `BREAKING CHANGE:` footer for incompatible changes.

## Pull requests

A pull request must:

- explain the user or maintainer outcome and relevant tradeoffs;
- identify tenant, authorization, security, privacy, and migration impact;
- include tests proportional to risk;
- keep OpenAPI and generated clients synchronized when contracts change;
- include its changelog entry;
- contain no unrelated formatting or generated artifacts;
- pass the branch's documented validation commands.

Review is not approval to bypass policy, evidence, audit, or human-accountability invariants. Material changes to those invariants require an accepted architecture or product decision record.

## Licensing contributions

By contributing, you agree that your contribution is provided under Apache-2.0. Preserve third-party notices and provenance. Do not copy code, assets, policies, or datasets without compatible permission and attribution.
