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
just up
just ps
```

`just up` builds the application, starts the core services, applies every
committed PostgreSQL migration, and starts the API only after migration
success. Use `just dev` instead when foreground Compose logs are useful.

The checked-in `.env.example` contains explicit local-only credentials. Never reuse them in a shared, staging, or production environment. Production deployments must use independently managed credentials and a secret manager.

## Local URLs

| Service     | Default URL             | Profile         |
| ----------- | ----------------------- | --------------- |
| Web         | <http://localhost:3000> | `app`           |
| API         | <http://localhost:4000> | `app`           |
| PostgreSQL  | `localhost:5433`        | `core`          |
| Keycloak    | <http://localhost:8081> | `core`          |
| Temporal UI | <http://localhost:8082> | `tools`         |
| Mailpit     | <http://localhost:8025> | `tools`         |
| Grafana     | <http://localhost:3001> | `observability` |
| Prometheus  | <http://localhost:9090> | `observability` |

PostgreSQL is bound only to `127.0.0.1` so maintainers may inspect the
development database without exposing it on the network. Valkey, the MinIO
API, Temporal RPC, Loki, and the OpenTelemetry receiver remain private to
Compose networks.

Connect a database client with these local-only values:

```text
Host: localhost
Port: 5433
Database: traceguard
Username: traceguard
Password: traceguard-local-app
SSL: disable
```

Run migrations again safely or open `psql` inside the running container with:

```bash
just db-migrate
just db-shell
```

## Data persistence

Named volumes preserve local PostgreSQL, evidence objects, mail, metrics, logs, and dashboards across `just down`. No ordinary command deletes those volumes. Database reset or volume deletion must be a separate explicitly confirmed operation.

The current development database uses the `postgres-development-data`
volume. The earlier `postgres-data` volume is deliberately not attached or
deleted, allowing an owner to inspect or archive legacy prototype data before
explicit removal.

## Troubleshooting

1. Run `just ps` and inspect the health state.
2. Run `just logs <service>` with a service such as `postgres` or `temporal`.
3. Confirm host port overrides in `.env` if a UI cannot bind.
4. If `just doctor` rejects a tool version, install the documented version rather than weakening the check.
5. When an initialization script changes, remember that PostgreSQL runs it only for a new data volume; preserve or migrate existing data intentionally.
