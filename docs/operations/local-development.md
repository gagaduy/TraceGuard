<!--
SPDX-FileCopyrightText: 2026 TraceGuard contributors
SPDX-License-Identifier: Apache-2.0
-->

# Local development

Docker Compose is the canonical local infrastructure environment. Application processes are added by their component branches and use the same shared networks and dependencies.

## First run

```bash
just doctor
just env
just install
just infra-up
just tools-up
just observe-up
just ps
```

The checked-in `.env.example` contains explicit local-only credentials. Never reuse them in a shared, staging, or production environment. Production deployments must use independently managed credentials and a secret manager.

## Local URLs

| Service     | Default URL             | Profile         |
| ----------- | ----------------------- | --------------- |
| Keycloak    | <http://localhost:8081> | `core`          |
| Temporal UI | <http://localhost:8082> | `tools`         |
| Mailpit     | <http://localhost:8025> | `tools`         |
| Grafana     | <http://localhost:3001> | `observability` |
| Prometheus  | <http://localhost:9090> | `observability` |

PostgreSQL, Valkey, the MinIO API, Temporal RPC, Loki, and the OpenTelemetry receiver are intentionally not published to the host. Application containers reach them through Compose networks.

## Data persistence

Named volumes preserve local PostgreSQL, evidence objects, mail, metrics, logs, and dashboards across `just down`. No ordinary command deletes those volumes. Database reset or volume deletion must be a separate explicitly confirmed operation.

## Troubleshooting

1. Run `just ps` and inspect the health state.
2. Run `just logs <service>` with a service such as `postgres` or `temporal`.
3. Confirm host port overrides in `.env` if a UI cannot bind.
4. If `just doctor` rejects a tool version, install the documented version rather than weakening the check.
5. When an initialization script changes, remember that PostgreSQL runs it only for a new data volume; preserve or migrate existing data intentionally.
