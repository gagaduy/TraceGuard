#!/usr/bin/env bash
# SPDX-FileCopyrightText: 2026 TraceGuard contributors
# SPDX-License-Identifier: Apache-2.0

set -euo pipefail

failed=0

while IFS= read -r path; do
  case "${path}" in
    LICENSE|pnpm-lock.yaml|*.json|*.lock|*.cff|*/generated/*|*/next-env.d.ts)
      continue
      ;;
    *.md|*.ts|*.tsx|*.js|*.mjs|*.cjs|*.py|*.sh|*.css|*.html|*.sql|*.toml|*.yaml|*.yml|.editorconfig|.env.example|.gitignore|justfile|Dockerfile*)
      ;;
    *)
      continue
      ;;
  esac

  if ! head -n 12 "${path}" | grep -q 'SPDX-FileCopyrightText:' ||
    ! head -n 12 "${path}" | grep -q 'SPDX-License-Identifier: Apache-2.0'; then
    printf 'missing or invalid SPDX header: %s\n' "${path}" >&2
    failed=1
  fi
done < <(git ls-files --cached --others --exclude-standard)

exit "${failed}"
