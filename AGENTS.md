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

For database work, follow `.agents/skills/traceguard-database/SKILL.md`.

## Branch ownership

- Implement database changes on `backend`.
- Keep cross-cutting documentation, roadmaps, and integration on `develop`.
- Do not place database-only work on `frontend`.
- Do not merge or push database roadmap work to `main` without explicit user approval.
- Preserve branch histories with merge commits when integrating `backend` into `develop`.
- Stop and report a branch mismatch before editing files.

## Repository rules

- Keep commits atomic and add a matching entry under `[Unreleased]` in `CHANGELOG.md`.
- Add SPDX headers to project-owned files that support comments.
- Never edit a shared migration after it has been committed; add a forward-only migration.
- Never delete or reuse an existing Docker volume while testing migrations.
- Treat PostgreSQL as the authoritative business-state store.
- Validate the exact scope changed before committing or pushing.
