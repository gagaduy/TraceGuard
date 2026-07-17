#!/usr/bin/env python3
# SPDX-FileCopyrightText: 2026 TraceGuard contributors
# SPDX-License-Identifier: Apache-2.0
"""Audit open-source repository governance and inline SPDX declarations."""

from __future__ import annotations

import argparse
import subprocess
import sys
from pathlib import Path


REQUIRED_ANY = {
    "license": ("LICENSE", "LICENSE.txt", "LICENSE.md", "COPYING"),
    "pull request template": (
        ".github/PULL_REQUEST_TEMPLATE.md",
        ".github/pull_request_template.md",
    ),
}
REQUIRED_EXACT = (
    "README.md",
    "CHANGELOG.md",
    "CONTRIBUTING.md",
    "CODE_OF_CONDUCT.md",
    "SECURITY.md",
    ".gitignore",
)
HEADER_EXTENSIONS = {
    ".bash", ".c", ".cc", ".cpp", ".cs", ".css", ".dart", ".go",
    ".h", ".hpp", ".html", ".java", ".js", ".jsx", ".kt", ".kts",
    ".md", ".mjs", ".php", ".ps1", ".py", ".rb", ".rs", ".scss",
    ".sh", ".sql", ".svelte", ".swift", ".toml", ".ts", ".tsx",
    ".vue", ".xml", ".yaml", ".yml", ".zsh",
}
EXCLUDED_DIRS = {
    ".git", ".next", ".nuxt", ".pytest_cache", ".tox", ".venv",
    "__pycache__", "build", "coverage", "dist", "generated", "node_modules",
    "third_party", "vendor", "venv",
}
EXCLUDED_NAMES = {
    "LICENSE", "LICENSE.md", "LICENSE.txt", "COPYING",
}
EXCLUDED_SUFFIXES = (
    ".lock", ".min.css", ".min.js", ".map",
)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Check repository health files and SPDX headers."
    )
    parser.add_argument("repo", nargs="?", default=".", help="Repository root")
    parser.add_argument("--spdx-id", help="Require this SPDX identifier")
    parser.add_argument(
        "--strict-headers",
        action="store_true",
        help="Fail when any eligible tracked file lacks inline SPDX tags",
    )
    return parser.parse_args()


def tracked_files(repo: Path) -> list[Path]:
    result = subprocess.run(
        ["git", "-C", str(repo), "ls-files", "-z"],
        check=False,
        capture_output=True,
    )
    if result.returncode == 0:
        return [repo / Path(p.decode()) for p in result.stdout.split(b"\0") if p]
    return [p for p in repo.rglob("*") if p.is_file() and ".git" not in p.parts]


def eligible(path: Path, repo: Path) -> bool:
    relative = path.relative_to(repo)
    if any(part in EXCLUDED_DIRS for part in relative.parts):
        return False
    if path.name in EXCLUDED_NAMES or path.name.startswith("."):
        return False
    if path.name.endswith(EXCLUDED_SUFFIXES):
        return False
    return path.suffix.lower() in HEADER_EXTENSIONS


def first_lines(path: Path, count: int = 35) -> str:
    try:
        with path.open("r", encoding="utf-8") as handle:
            return "".join(next(handle, "") for _ in range(count))
    except (OSError, UnicodeDecodeError):
        return ""


def main() -> int:
    args = parse_args()
    repo = Path(args.repo).resolve()
    errors: list[str] = []
    warnings: list[str] = []

    if not (repo / ".git").exists():
        errors.append(f"not a Git repository root: {repo}")

    for name in REQUIRED_EXACT:
        if not (repo / name).is_file():
            errors.append(f"missing required file: {name}")

    for label, choices in REQUIRED_ANY.items():
        if not any((repo / choice).is_file() for choice in choices):
            errors.append(f"missing {label}: expected one of {', '.join(choices)}")

    issue_dir = repo / ".github" / "ISSUE_TEMPLATE"
    if not issue_dir.is_dir() or not any(p.is_file() for p in issue_dir.iterdir()):
        errors.append("missing issue templates: .github/ISSUE_TEMPLATE/")

    changelog = repo / "CHANGELOG.md"
    if changelog.is_file():
        text = first_lines(changelog, 120)
        if "[Unreleased]" not in text:
            errors.append("CHANGELOG.md has no [Unreleased] section")

    missing_headers: list[str] = []
    wrong_license: list[str] = []
    for path in tracked_files(repo):
        if not path.is_file() or not eligible(path, repo):
            continue
        text = first_lines(path)
        relative = path.relative_to(repo).as_posix()
        has_copyright = "SPDX-FileCopyrightText:" in text
        has_license = "SPDX-License-Identifier:" in text
        if not (has_copyright and has_license):
            missing_headers.append(relative)
        elif args.spdx_id and f"SPDX-License-Identifier: {args.spdx_id}" not in text:
            wrong_license.append(relative)

    if missing_headers:
        message = (
            f"{len(missing_headers)} eligible files lack complete SPDX headers: "
            + ", ".join(missing_headers[:12])
        )
        if len(missing_headers) > 12:
            message += f" ... and {len(missing_headers) - 12} more"
        (errors if args.strict_headers else warnings).append(message)

    if wrong_license:
        message = (
            f"{len(wrong_license)} files do not declare {args.spdx_id}: "
            + ", ".join(wrong_license[:12])
        )
        if len(wrong_license) > 12:
            message += f" ... and {len(wrong_license) - 12} more"
        errors.append(message)

    print(f"Repository audit: {repo}")
    for warning in warnings:
        print(f"WARN: {warning}")
    for error in errors:
        print(f"ERROR: {error}")
    if errors:
        print(f"FAIL: {len(errors)} error(s), {len(warnings)} warning(s)")
        return 1
    print(f"PASS: 0 errors, {len(warnings)} warning(s)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
