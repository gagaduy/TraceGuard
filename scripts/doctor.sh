#!/usr/bin/env bash
# SPDX-FileCopyrightText: 2026 TraceGuard contributors
# SPDX-License-Identifier: Apache-2.0

set -euo pipefail

failed=0

require_command() {
  local command_name="$1"
  local install_hint="$2"

  if ! command -v "${command_name}" >/dev/null 2>&1; then
    printf 'missing: %s (%s)\n' "${command_name}" "${install_hint}" >&2
    failed=1
  fi
}

require_command docker "install Docker Engine with Compose"
require_command node "install Node.js 24 LTS"
require_command pnpm "install pnpm 11.13"
require_command python3 "install Python 3.13"
require_command uv "install uv"
require_command just "install just"

if command -v node >/dev/null 2>&1; then
  node_major="$(node --version | sed -E 's/^v([0-9]+).*/\1/')"
  if [[ "${node_major}" != "24" ]]; then
    printf 'unsupported: Node.js %s (expected major 24)\n' "$(node --version)" >&2
    failed=1
  fi
fi

if command -v docker >/dev/null 2>&1 && ! docker compose version >/dev/null 2>&1; then
  printf 'missing: Docker Compose plugin\n' >&2
  failed=1
fi

if ((failed != 0)); then
  exit 1
fi

printf 'Docker: %s\n' "$(docker --version)"
printf 'Compose: %s\n' "$(docker compose version --short)"
printf 'Node: %s\n' "$(node --version)"
printf 'pnpm: %s\n' "$(pnpm --version)"
printf 'Python: %s\n' "$(python3 --version)"
printf 'uv: %s\n' "$(uv --version)"
printf 'just: %s\n' "$(just --version)"
