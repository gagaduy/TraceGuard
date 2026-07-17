<!--
SPDX-FileCopyrightText: 2026 TraceGuard contributors
SPDX-License-Identifier: Apache-2.0
-->

# Repository Standards Reference

## Contents

1. Repository baseline
2. License selection
3. File-level licensing
4. Changelog policy
5. Commit policy
6. Validation and release gates

## 1. Repository baseline

### Core files

| File                 | Minimum useful content                                                                                                   |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `README.md`          | Purpose, status, features, quick start, configuration, usage, architecture link, contribution, security contact, license |
| `LICENSE`            | Exact full license text; no custom edits that invalidate the standard license                                            |
| `CHANGELOG.md`       | Keep a Changelog headings, `[Unreleased]`, dated releases, comparison links when applicable                              |
| `CONTRIBUTING.md`    | Setup, branch/commit rules, tests, style, PR process, DCO/CLA if used                                                    |
| `CODE_OF_CONDUCT.md` | Adopted conduct policy and a real enforcement/contact route                                                              |
| `SECURITY.md`        | Supported versions, private reporting channel, response expectations, disclosure policy                                  |
| `.gitignore`         | Stack-specific generated files, local env files, secrets, build outputs                                                  |
| PR template          | Summary, change type, tests, screenshots, changelog, security and breaking-change checks                                 |
| Issue templates      | Separate bug and feature forms with reproduction/acceptance information                                                  |

Never publish secrets, real credentials, private endpoints, personal data, `.env`, signing keys, or production dumps. Provide `.env.example` with placeholders and comments.

### Recommended structure

Use only what the project needs:

```text
repo/
├── .github/
│   ├── ISSUE_TEMPLATE/
│   ├── workflows/
│   └── PULL_REQUEST_TEMPLATE.md
├── docs/
├── src/
├── tests/
├── CHANGELOG.md
├── CODE_OF_CONDUCT.md
├── CONTRIBUTING.md
├── LICENSE
├── README.md
└── SECURITY.md
```

## 2. License selection

Ask the owner which distribution behavior is intended. Give a short comparison when they are unsure:

| Intent                                         | Common choice                     | Key consequence                                |
| ---------------------------------------------- | --------------------------------- | ---------------------------------------------- |
| Broad permissive reuse                         | MIT                               | Simple conditions; no explicit patent grant    |
| Permissive reuse with patent grant             | Apache-2.0                        | Includes patent license and NOTICE obligations |
| Modifications must remain open                 | GPL-3.0-only / GPL-3.0-or-later   | Strong copyleft on distributed derivatives     |
| Network service modifications must remain open | AGPL-3.0-only / AGPL-3.0-or-later | Extends source obligation to network use       |
| Copyleft limited mainly to modified files      | MPL-2.0                           | File-level copyleft                            |

Do not call source “open source” without an OSI-approved license. Do not combine licenses without checking compatibility. Do not replace an existing license or copyright holder merely because new code is being added.

Record the precise SPDX identifier, including `-only` versus `-or-later` where applicable.

## 3. File-level licensing

Preferred two-line form:

```text
SPDX-FileCopyrightText: <year or range> <copyright holder>
SPDX-License-Identifier: <SPDX ID>
```

Wrap it in valid comments:

```python
# SPDX-FileCopyrightText: 2026 Example Org
# SPDX-License-Identifier: Apache-2.0
```

```typescript
// SPDX-FileCopyrightText: 2026 Example Org
// SPDX-License-Identifier: Apache-2.0
```

```html
<!--
SPDX-FileCopyrightText: 2026 Example Org
SPDX-License-Identifier: Apache-2.0
-->
```

Keep a shebang, XML declaration, or encoding declaration first when the language requires it; place SPDX immediately after.

### Exceptions

- JSON and strict data formats: use a schema-supported field or REUSE mapping.
- Lockfiles, generated code, minified bundles, vendored dependencies: retain their provenance; do not edit merely to add a header.
- Third-party templates or copied policies: keep their original copyright/license and attribution.
- Tiny files with a project-wide REUSE mapping may omit inline tags only when the mapping is committed and audited.

When substantially rewriting an existing file, preserve earlier copyright lines and add the current holder/year rather than deleting history.

## 4. Changelog policy

Follow Keep a Changelog:

```markdown
## [Unreleased]

### Added

- Add API key rotation.

### Changed

- Require atomic Conventional Commits in contribution guidance.

### Fixed

- Reject expired reset tokens.

### Security

- Upgrade the JWT dependency to address a published advisory.
```

Allowed sections: `Added`, `Changed`, `Deprecated`, `Removed`, `Fixed`, `Security`.

Rules:

- Add the entry in the same atomic commit as the change.
- Describe user/maintainer impact, not filenames or implementation trivia.
- Do not duplicate the commit subject mechanically.
- Keep unreleased entries until a release commit assigns a version and date.
- Use SemVer; identify breaking changes before release.

## 5. Commit policy

### Atomicity test

A commit is atomic when:

- It has one reason to exist.
- It can be reviewed independently.
- Its tests and changelog entry describe the same unit.
- Reverting it would revert one coherent behavior or repository change.

Split commits when changes have different purposes, scopes, rollback risk, or validation methods. Do not split a behavior change from the test or changelog entry that proves/documents it.

### Conventional Commit form

```text
type(scope)!: imperative summary

Optional body explaining why and tradeoffs.

BREAKING CHANGE: migration or compatibility details
Refs: #123
```

Suggested type mapping:

| Type       | Use                                             |
| ---------- | ----------------------------------------------- |
| `feat`     | New user-visible capability                     |
| `fix`      | Correct faulty behavior                         |
| `security` | Security hardening or vulnerability remediation |
| `refactor` | Internal restructuring without behavior change  |
| `perf`     | Measurable performance improvement              |
| `test`     | Test-only change                                |
| `docs`     | Documentation-only change                       |
| `build`    | Build/package/dependency mechanics              |
| `ci`       | Automation workflows                            |
| `chore`    | Repository maintenance/governance               |
| `style`    | Formatting-only change                          |

Before committing:

```bash
git status --short
git diff --check
git diff
git diff --cached --stat
git diff --cached
```

After committing:

```bash
git show --stat --oneline HEAD
git status --short
```

Never stage with a broad command until the diff is understood. Prefer explicit paths and `git add -p` when files contain mixed concerns.

## 6. Validation and release gates

### Per-unit gate

- Focused tests pass.
- Format/lint/type checks relevant to touched files pass.
- Changelog entry is present.
- New source files carry correct SPDX metadata.
- No secrets or unrelated changes are staged.
- Commit subject is Conventional Commit compliant.

### Public-release gate

- Full test/build suite passes.
- CI runs the same critical checks.
- Dependencies and licenses are reviewed.
- Secret and vulnerability scans run.
- Security/contact details are real.
- README commands work from a clean checkout.
- Release version, tag, changelog date, artifacts, and provenance agree.
- Generated artifacts are reproducible or documented.
