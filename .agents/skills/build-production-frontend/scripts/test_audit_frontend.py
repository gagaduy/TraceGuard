#!/usr/bin/env python3
# SPDX-FileCopyrightText: 2026 TraceGuard contributors
# SPDX-License-Identifier: Apache-2.0

"""Self-tests for audit_frontend.py."""

from __future__ import annotations

import json
import subprocess
import sys
import tempfile
from pathlib import Path


SCRIPT = Path(__file__).with_name("audit_frontend.py")


def write_json(path: Path, value: dict) -> None:
    path.write_text(json.dumps(value), encoding="utf-8")


def run_audit(root: Path, *args: str) -> subprocess.CompletedProcess[str]:
    return subprocess.run(
        [sys.executable, str(SCRIPT), str(root), *args],
        check=False,
        capture_output=True,
        text=True,
    )


def make_valid_project(root: Path, *, inherited_strict: bool = False) -> None:
    write_json(
        root / "package.json",
        {
            "scripts": {
                "build": "next build",
                "lint": "eslint .",
                "typecheck": "tsc --noEmit",
                "test": "vitest run",
            },
            "dependencies": {"next": "16.0.0", "react": "19.0.0"},
            "devDependencies": {"typescript": "6.0.0"},
        },
    )
    if inherited_strict:
        write_json(root / "tsconfig.json", {"extends": "../../tsconfig.base.json"})
    else:
        write_json(root / "tsconfig.json", {"compilerOptions": {"strict": True}})
    (root / "pnpm-lock.yaml").write_text("lockfileVersion: '9.0'\n", encoding="utf-8")
    source = root / "src"
    source.mkdir()
    (source / "page.tsx").write_text(
        "export default function Page() { return <main /> }\n"
    )


def main() -> int:
    with tempfile.TemporaryDirectory() as temp:
        valid_root = Path(temp) / "valid"
        valid_root.mkdir()
        make_valid_project(valid_root)
        valid = run_audit(valid_root)
        assert valid.returncode == 0, valid.stdout + valid.stderr
        assert "RESULT: PASS" in valid.stdout

        risky = valid_root / "src" / "risky.tsx"
        risky.write_text("export const risky = () => alert('stop')\n", encoding="utf-8")
        warning = run_audit(valid_root)
        assert warning.returncode == 0, warning.stdout + warning.stderr
        assert "WARN: blocking browser dialog" in warning.stdout
        strict = run_audit(valid_root, "--strict")
        assert strict.returncode == 1, strict.stdout + strict.stderr

        invalid_root = Path(temp) / "invalid"
        invalid_root.mkdir()
        write_json(
            invalid_root / "package.json",
            {
                "scripts": {"build": "next build"},
                "dependencies": {"next": "16.0.0"},
                "devDependencies": {"typescript": "6.0.0"},
            },
        )
        write_json(
            invalid_root / "tsconfig.json",
            {"compilerOptions": {"strict": False}},
        )
        (invalid_root / "src").mkdir()
        (invalid_root / "src" / "page.tsx").write_text("export default 1\n")
        invalid = run_audit(invalid_root)
        assert invalid.returncode == 1, invalid.stdout + invalid.stderr
        assert "missing lint script" in invalid.stdout
        assert "strict mode is disabled" in invalid.stdout

        monorepo_root = Path(temp) / "monorepo"
        monorepo_root.mkdir()
        write_json(monorepo_root / "package.json", {"private": True})
        write_json(
            monorepo_root / "tsconfig.base.json",
            {"compilerOptions": {"strict": True}},
        )
        (monorepo_root / "pnpm-lock.yaml").write_text(
            "lockfileVersion: '9.0'\n", encoding="utf-8"
        )
        web_root = monorepo_root / "apps" / "web"
        web_root.mkdir(parents=True)
        make_valid_project(web_root, inherited_strict=True)
        (web_root / "pnpm-lock.yaml").unlink()
        ui_root = monorepo_root / "packages" / "ui"
        ui_root.mkdir(parents=True)
        make_valid_project(ui_root, inherited_strict=True)
        (ui_root / "pnpm-lock.yaml").unlink()

        monorepo = run_audit(monorepo_root)
        assert monorepo.returncode == 0, monorepo.stdout + monorepo.stderr
        assert monorepo.stdout.count("Frontend package:") == 2, monorepo.stdout
        assert "2 package(s)" in monorepo.stdout

        direct_package = run_audit(web_root)
        assert direct_package.returncode == 0, (
            direct_package.stdout + direct_package.stderr
        )
        assert str(monorepo_root / "pnpm-lock.yaml") in direct_package.stdout

    print("audit_frontend self-tests passed")
    return 0


if __name__ == "__main__":
    sys.exit(main())
