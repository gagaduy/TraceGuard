#!/usr/bin/env python3
# SPDX-FileCopyrightText: 2026 TraceGuard contributors
# SPDX-License-Identifier: Apache-2.0

"""Audit structural production-readiness signals in a frontend package."""

from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path


IGNORED_DIRS = {
    ".git",
    ".next",
    ".nuxt",
    ".output",
    "build",
    "coverage",
    "dist",
    "node_modules",
    "public",
    "vendor",
}
FRONTEND_DEPENDENCIES = {
    "@angular/core",
    "@sveltejs/kit",
    "astro",
    "next",
    "nuxt",
    "react",
    "solid-js",
    "svelte",
    "vue",
}
BROWSER_CLIENT_DEPENDENCIES = {
    "openapi-fetch",
}
LOCKFILES = {
    "bun.lock",
    "bun.lockb",
    "npm-shrinkwrap.json",
    "package-lock.json",
    "pnpm-lock.yaml",
    "yarn.lock",
}
REQUIRED_SCRIPT_GROUPS = {
    "build": ("build",),
    "lint": ("lint",),
    "typecheck": ("typecheck", "type-check", "check-types"),
    "test": ("test", "test:unit", "test:component"),
}
SOURCE_SUFFIXES = {".js", ".jsx", ".ts", ".tsx", ".vue", ".svelte"}
RISK_PATTERNS = {
    "unsafe HTML": re.compile(r"dangerouslySetInnerHTML|\bv-html\b|\{@html\b"),
    "TypeScript suppression": re.compile(r"@ts-ignore|@ts-nocheck"),
    "lint suppression": re.compile(r"eslint-disable"),
    "blocking browser dialog": re.compile(
        r"\b(?:window\.)?(?:alert|confirm|prompt)\s*\("
    ),
}


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Audit frontend package structure without installing dependencies."
    )
    parser.add_argument("root", type=Path, help="Repository or frontend package root")
    parser.add_argument(
        "--strict",
        action="store_true",
        help="Treat risk-pattern findings as failures instead of warnings",
    )
    return parser.parse_args()


def read_json(path: Path) -> dict:
    try:
        value = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        raise ValueError(f"cannot read valid JSON: {exc}") from exc
    if not isinstance(value, dict):
        raise ValueError("top-level JSON value must be an object")
    return value


def iter_files(root: Path, suffixes: set[str]):
    for path in root.rglob("*"):
        if any(part in IGNORED_DIRS for part in path.parts):
            continue
        if path.is_file() and path.suffix in suffixes:
            yield path


def is_frontend_package(package: dict) -> bool:
    dependencies = {
        **package.get("dependencies", {}),
        **package.get("devDependencies", {}),
        **package.get("peerDependencies", {}),
    }
    return bool(
        FRONTEND_DEPENDENCIES.intersection(dependencies)
        or BROWSER_CLIENT_DEPENDENCIES.intersection(dependencies)
    )


def find_package_roots(root: Path) -> list[tuple[Path, dict]]:
    direct = root / "package.json"
    candidates = [direct] if direct.is_file() else []
    candidates.extend(
        path
        for path in root.rglob("package.json")
        if path != direct and not any(part in IGNORED_DIRS for part in path.parts)
    )

    packages: list[tuple[Path, dict]] = []
    for package_path in candidates:
        package = read_json(package_path)
        if is_frontend_package(package):
            packages.append((package_path.parent, package))

    if packages:
        return packages
    if direct.is_file():
        return [(root, read_json(direct))]
    raise ValueError("no frontend or browser-client package.json was found")


def find_lockfile(start: Path) -> Path | None:
    current = start
    while True:
        for name in LOCKFILES:
            candidate = current / name
            if candidate.is_file():
                return candidate
        if current.parent == current:
            return None
        current = current.parent


def resolve_extended_tsconfig(tsconfig_path: Path, reference: str) -> Path | None:
    if not reference.startswith(".") and not reference.startswith("/"):
        return None
    candidate = (
        Path(reference)
        if reference.startswith("/")
        else tsconfig_path.parent / reference
    )
    if candidate.suffix != ".json":
        candidate = candidate.with_suffix(".json")
    return candidate.resolve()


def inherited_strict_value(
    tsconfig_path: Path, seen: set[Path] | None = None
) -> tuple[bool | None, str]:
    resolved_path = tsconfig_path.resolve()
    visited = set() if seen is None else seen
    if resolved_path in visited:
        return None, f"cyclic tsconfig extends chain at {resolved_path}"
    visited.add(resolved_path)

    try:
        tsconfig = read_json(resolved_path)
    except ValueError as exc:
        return None, str(exc)

    options = tsconfig.get("compilerOptions", {})
    if not isinstance(options, dict):
        return None, "compilerOptions must be an object"
    if "strict" in options:
        value = options["strict"]
        if isinstance(value, bool):
            return value, f"resolved from {resolved_path}"
        return None, f"strict must be boolean in {resolved_path}"

    references = tsconfig.get("extends", [])
    if isinstance(references, str):
        references = [references]
    if not isinstance(references, list) or not all(
        isinstance(reference, str) for reference in references
    ):
        return None, f"extends must be a string or string array in {resolved_path}"

    for reference in reversed(references):
        extended_path = resolve_extended_tsconfig(resolved_path, reference)
        if extended_path is None:
            continue
        value, reason = inherited_strict_value(extended_path, visited.copy())
        if value is not None:
            return value, reason

    return (
        None,
        f"strict is not declared in the local extends chain for {resolved_path}",
    )


def tsconfig_is_strict(package_root: Path) -> tuple[bool | None, str]:
    tsconfig_path = package_root / "tsconfig.json"
    if not tsconfig_path.is_file():
        return None, "no tsconfig.json"
    return inherited_strict_value(tsconfig_path)


def audit_package(
    package_root: Path, package: dict, strict_risks: bool
) -> tuple[list[str], list[str], Path | None, list[str]]:
    failures: list[str] = []
    warnings: list[str] = []

    scripts = package.get("scripts", {})
    if not isinstance(scripts, dict):
        failures.append("package.json scripts must be an object")
        scripts = {}

    for label, accepted_names in REQUIRED_SCRIPT_GROUPS.items():
        if not any(name in scripts for name in accepted_names):
            failures.append(
                f"missing {label} script; expected one of {', '.join(accepted_names)}"
            )

    lockfile = find_lockfile(package_root)
    if lockfile is None:
        failures.append(
            "no supported dependency lockfile found at or above package root"
        )

    dependencies = {
        **package.get("dependencies", {}),
        **package.get("devDependencies", {}),
        **package.get("peerDependencies", {}),
    }
    uses_typescript = "typescript" in dependencies or any(
        iter_files(package_root, {".ts", ".tsx"})
    )
    if uses_typescript:
        strict, reason = tsconfig_is_strict(package_root)
        if strict is False:
            failures.append(f"TypeScript strict mode is disabled: {reason}")
        elif strict is None:
            failures.append(f"TypeScript strict mode could not be confirmed: {reason}")

    findings = {name: [] for name in RISK_PATTERNS}
    for source_path in iter_files(package_root, SOURCE_SUFFIXES):
        try:
            content = source_path.read_text(encoding="utf-8")
        except (OSError, UnicodeDecodeError):
            warnings.append(
                f"could not inspect {source_path.relative_to(package_root)}"
            )
            continue
        for name, pattern in RISK_PATTERNS.items():
            for match in pattern.finditer(content):
                line = content.count("\n", 0, match.start()) + 1
                findings[name].append(f"{source_path.relative_to(package_root)}:{line}")

    for name, locations in findings.items():
        if not locations:
            continue
        message = f"{name} found at " + ", ".join(locations[:10])
        if len(locations) > 10:
            message += f" and {len(locations) - 10} more"
        (failures if strict_risks else warnings).append(message)

    return failures, warnings, lockfile, sorted(scripts)


def main() -> int:
    args = parse_args()
    root = args.root.resolve()
    if not root.is_dir():
        print(f"FAIL: directory does not exist: {root}")
        return 2

    try:
        packages = find_package_roots(root)
    except ValueError as exc:
        print(f"FAIL: {exc}")
        return 2

    total_failures = 0
    total_warnings = 0
    for package_root, package in packages:
        failures, warnings, lockfile, scripts = audit_package(
            package_root, package, args.strict
        )
        print(f"Frontend package: {package_root}")
        print(f"Lockfile: {lockfile if lockfile else 'missing'}")
        print("Scripts: " + ", ".join(scripts) if scripts else "Scripts: none")
        for warning in warnings:
            print(f"WARN: {warning}")
        for failure in failures:
            print(f"FAIL: {failure}")
        total_failures += len(failures)
        total_warnings += len(warnings)

    if total_failures:
        print(
            f"RESULT: FAIL ({total_failures} failure(s), "
            f"{total_warnings} warning(s), {len(packages)} package(s))"
        )
        return 1
    print(f"RESULT: PASS ({total_warnings} warning(s), {len(packages)} package(s))")
    return 0


if __name__ == "__main__":
    sys.exit(main())
