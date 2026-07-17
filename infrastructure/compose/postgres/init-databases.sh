#!/usr/bin/env bash
# SPDX-FileCopyrightText: 2026 TraceGuard contributors
# SPDX-License-Identifier: Apache-2.0

set -euo pipefail

psql --set ON_ERROR_STOP=1 \
  --username "${POSTGRES_USER}" \
  --dbname postgres \
  --set traceguard_password="${TRACEGUARD_DATABASE_PASSWORD}" \
  --set temporal_password="${TEMPORAL_DATABASE_PASSWORD}" \
  --set keycloak_password="${KEYCLOAK_DATABASE_PASSWORD}" <<'SQL'
CREATE ROLE traceguard LOGIN PASSWORD :'traceguard_password';
CREATE DATABASE traceguard OWNER traceguard;

CREATE ROLE temporal LOGIN PASSWORD :'temporal_password';
CREATE DATABASE temporal OWNER temporal;
CREATE DATABASE temporal_visibility OWNER temporal;

CREATE ROLE keycloak LOGIN PASSWORD :'keycloak_password';
CREATE DATABASE keycloak OWNER keycloak;
SQL
