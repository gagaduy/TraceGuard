<!--
SPDX-FileCopyrightText: 2026 TraceGuard contributors
SPDX-License-Identifier: Apache-2.0
-->

# TraceGuard agent guide

## Start here

Before changing the repository, read:

1. `README.md`.
2. `docs/architecture/system-overview.md`.
3. The accepted RFC relevant to the task.
4. The nearest package README and tests.

For every repository-changing task, follow
`.agents/skills/build-open-source-repository/SKILL.md`. Use accepted RFCs,
roadmaps, and package documentation for domain-specific implementation details.

## Branch ownership

- Keep frontend-only implementation on `frontend`.
- Keep API, workflows, AI service, and database implementation on `backend`.
- Keep cross-cutting documentation, repository governance, and integration on `develop`.
- Merge verified frontend and backend work into `develop` with history preserved.
- Do not merge or push work to `main` without explicit user approval.
- Preserve branch histories with merge commits during integration.
- Stop and report a branch mismatch before editing files.

## Repository rules

- Keep commits atomic and add a matching entry under `[Unreleased]` in `CHANGELOG.md`.
- Add SPDX headers to project-owned files that support comments.
- For database work, never edit a shared migration after it has been committed; add a forward-only migration.
- Never delete or reuse a developer's existing Docker volume while testing migrations.
- Treat PostgreSQL as the authoritative business-state store.
- Validate the exact scope changed before committing or pushing.
