<!--
SPDX-FileCopyrightText: 2026 TraceGuard contributors
SPDX-License-Identifier: Apache-2.0
-->

# TraceGuard database

This package owns PostgreSQL connections, Drizzle schema, and committed migrations. PostgreSQL remains the system of record; application modules must not expose database entities directly as HTTP response types.

Tenant-owned tables must carry `tenant_id`, use application-layer scoping, and add Row-Level Security where appropriate. Cross-tenant isolation and state-machine invariants require database-backed integration tests before domain tables are considered complete.
