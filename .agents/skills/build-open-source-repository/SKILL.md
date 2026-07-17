---
name: build-open-source-repository
description: Use when creating, restructuring, maintaining, publishing, or handing off a GitHub/open-source repository, or when branch strategy, commits, changelog, licensing, community health, validation, release, or repository consistency matters.
---

<!--
SPDX-FileCopyrightText: 2026 TraceGuard contributors
SPDX-License-Identifier: Apache-2.0
-->

# Build Open-Source Repository

Treat repository quality as part of implementation, not final cleanup.

## Start safely

1. Read `AGENTS.md` and repository-specific instructions.
2. Inspect `git status`, current branch, recent commit style, existing license, changelog, CI, and community files.
3. Preserve unrelated user changes. Stage only files belonging to the completed unit.
4. Resolve the license, copyright holder, and start year before adding new source files. Never relicense existing work without explicit authorization.
5. Read [repository-standards.md](references/repository-standards.md) before scaffolding governance, choosing a license, writing headers, or composing commits.
6. Divide the request into independently testable units. Each unit ends in its own commit.

## Work on branches safely

For a write task, determine the intended base branch and whether the current branch is already dedicated to the same objective. Reuse a task-scoped branch when it is safe; otherwise create a new branch before implementation. Do not create or switch branches for read-only analysis.

- Do not implement directly on `main`, `master`, or another protected/default branch unless the user explicitly requires it.
- Create the task branch from the repository's intended base, not from an unrelated feature branch. Inspect tracking and divergence first; refresh remote refs when permitted and needed to avoid a stale base.
- Never switch branches while overlapping uncommitted changes make ownership ambiguous. Preserve unrelated user changes and ask when they cannot be separated safely.
- Keep one reviewable objective per branch. A branch may contain several atomic commits only when every commit advances that same objective.
- Put independent tasks on separate branches. For dependent tasks, prefer one branch when they form one reviewable outcome; use stacked branches only when the user or repository workflow explicitly calls for them, and record the dependency in the handoff.
- Do not merge, rebase, squash, force-push, delete branches, or rewrite published history unless the user requested that operation. Never force-push a shared or protected branch.
- Use hotfix and release branches only for an explicit production fix or release-preparation request.

Name new task branches with a lowercase type and a short hyphenated slug:

```text
<type>/<issue>-<short-name>
```

Use `feat`, `fix`, `docs`, `refactor`, `test`, `build`, `ci`, `security`, `hotfix`, or `release`. Omit `<issue>-` when no issue exists. Keep names concise, ASCII, and free of spaces, underscores, personal names, or vague labels such as `work`, `changes`, and `wip`.

Examples:

```text
feat/42-incident-workflow
fix/57-tenant-isolation
docs/system-architecture
build/docker-compose
security/61-token-validation
hotfix/84-refresh-token-reuse
release/0.2.0
```

## Work in atomic units

For every unit, follow this exact loop:

1. State the unit and its acceptance check.
2. Implement only that unit.
3. Add or update tests and documentation needed by that unit.
4. Add the change to `CHANGELOG.md` under `[Unreleased]` in the same unit.
5. Apply the correct SPDX copyright and license header to every new or materially rewritten license-capable file.
6. Run focused validation, then the cheapest relevant wider check.
7. Inspect `git diff` and `git diff --check`.
8. Stage only the unit's files or hunks.
9. Inspect `git diff --cached --stat` and `git diff --cached`.
10. Commit immediately with a Conventional Commit message.
11. Confirm the commit hash and that remaining changes are expected before starting the next unit.

Do not wait for several completed tasks before committing. Do not mix scaffolding, features, fixes, refactors, formatting, and unrelated documentation in one commit. Do not amend, squash, rebase, push, or create a PR unless the user requested that action.

If pre-existing changes overlap the same lines and cannot be staged safely, stop and ask instead of absorbing them into the commit.

## Commit correctly

Use:

```text
<type>(<scope>): <imperative summary>
```

Use lowercase types: `feat`, `fix`, `docs`, `test`, `refactor`, `perf`, `build`, `ci`, `chore`, `style`, `security`, `revert`.

- Keep one purpose per commit.
- Use an imperative, specific summary; no period; target 72 characters or fewer.
- Add `!` and a `BREAKING CHANGE:` footer for breaking behavior.
- Explain motivation and non-obvious tradeoffs in the body.
- Reference issues in footers when known.
- Never use vague messages such as `update`, `changes`, `fix stuff`, `final`, or `WIP` for completed units.

Examples:

```text
chore(repo): add community health files
feat(auth): add refresh-token rotation
fix(api): reject expired reset tokens
docs(api): document pagination contract
security(deps): upgrade vulnerable jwt library
```

## Maintain repository governance continuously

Create or repair the core files early, normally as the first independent unit:

- `README.md`
- `LICENSE` or `LICENSE.txt`
- `CHANGELOG.md`
- `CONTRIBUTING.md`
- `CODE_OF_CONDUCT.md`
- `SECURITY.md`
- `.gitignore`
- `.github/PULL_REQUEST_TEMPLATE.md`
- `.github/ISSUE_TEMPLATE/` templates

Add `SUPPORT.md`, `GOVERNANCE.md`, `CITATION.cff`, dependency policy, release automation, and CI when the project needs them. Do not create empty ceremonial files; every file must contain usable project-specific instructions.

Use Keep a Changelog structure and Semantic Versioning. Record every repository-changing unit under `[Unreleased]`, including meaningful documentation, configuration, governance, security, and dependency changes. Move entries to a dated version only during a release unit.

## Enforce licensing

- Choose a license from the owner's distribution intent; do not silently default.
- Preserve third-party and generated-file licensing.
- Prefer SPDX headers for file-level declarations.
- Use the comment syntax appropriate to the language.
- For formats that cannot contain comments, use a schema-supported license field or a REUSE mapping; never create invalid JSON or lockfiles merely to insert a header.
- Exclude vendored, generated, minified, and dependency files from project copyright claims unless they are genuinely owned by the project.

Run the bundled audit before governance commits and final handoff:

```bash
python3 <skill-dir>/scripts/audit_repo.py <repo> --spdx-id <ID>
```

Use `--strict-headers` once legacy files have been brought into compliance. Read the audit output; do not weaken exclusions just to make it pass.

## Validate before each commit

Select checks proportional to the unit:

- Syntax/type checks for changed code.
- Focused tests for changed behavior.
- Lint/format checks for changed files.
- Build or package verification for configuration/build changes.
- Link/schema/manifest checks for docs and repository metadata.
- Secret scan and dependency/security checks before public release.
- `git diff --check` for every commit.

Never claim a check passed unless it ran successfully. If a required check cannot run, state why in the handoff and keep the commit scoped so the uncertainty is visible.

## Finish cleanly

Before handoff:

1. Run the repository audit and project validation suite.
2. Confirm `CHANGELOG.md` accounts for every commit made in the task.
3. Review `git log --oneline` for atomicity and valid messages.
4. Confirm the worktree contains no accidental generated files, secrets, or unrelated staged changes.
5. Confirm the branch name, intended base, upstream/divergence state, and that no protected branch was modified unintentionally.
6. Report the branch and base, completed units, commit hashes/messages, tests run, audit status, branch dependencies, and any intentional remaining work.
