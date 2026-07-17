<!--
SPDX-FileCopyrightText: 2026 TraceGuard contributors
SPDX-License-Identifier: Apache-2.0
-->

# TraceGuard

TraceGuard is an open-source TrustOps and recall-resilience operating system for small and medium-sized enterprises. It turns weak risk signals into evidence-backed, policy-checked, human-approved actions that remain durable and auditable through recovery and corrective action.

> [!IMPORTANT]
> TraceGuard is in its architecture-foundation stage and is not ready for production use. It does not make autonomous recall decisions or replace legal, regulatory, or quality professionals.

## Product loop

```text
Weak Signal
  -> Validation
  -> Evidence Graph
  -> Product Trust Digital Twin
  -> Recall Options
  -> Policy Check and Human Approval
  -> Orchestration
  -> Recovery Metrics
  -> CAPA Learning
```

## Design commitments

- Evidence and provenance precede consequential action.
- Humans remain accountable for approvals and recall decisions.
- Tenant isolation is a system invariant.
- Long-running workflows survive retry, restart, and provider failure.
- Important state changes are versioned, explained, and audited.
- AI output is advisory and has a safe manual fallback.

## Architecture

The accepted system shape is a modular monolith with specialized workflow and compute processes:

- Next.js and TypeScript for the web application;
- Express and TypeScript as the only public business API;
- PostgreSQL as the business system of record;
- Temporal TypeScript workflows for durable coordination;
- an internal Python and FastAPI service for bounded AI and analytical compute.

See the [system architecture overview](docs/architecture/system-overview.md) for boundaries and ownership rules.

## Branch model

| Branch     | Purpose                                                              |
| ---------- | -------------------------------------------------------------------- |
| `main`     | Stable open-source baseline and accepted repository documentation    |
| `develop`  | Shared integration base, monorepo tooling, and local infrastructure  |
| `frontend` | Web application, shared UI, and generated API client work            |
| `backend`  | API, workflow, database, observability, testing, and AI-service work |

Feature branches are reviewed into their intended base. The long-lived `frontend` and `backend` branches remain scoped to their system boundary until an explicit integration step is approved.

## Development prerequisites

- Node.js 24 LTS
- pnpm 11.13
- Python 3.13 and `uv`
- Docker Engine with Docker Compose
- `just`

Run the diagnostics before installing dependencies:

```bash
just doctor
just env
just install
just check
```

Start the shared infrastructure and optional development tools:

```bash
just infra-up
just tools-up
just observe-up
just ps
```

The command surface is intentionally stable; use `just --list` rather than memorizing package-manager or Compose commands. See the [local development guide](docs/operations/local-development.md) for service URLs, data persistence, and troubleshooting.

## Contributing

Read [CONTRIBUTING.md](CONTRIBUTING.md) before opening a change. Contributions must preserve tenant isolation, evidence history, human approval, durable execution, and audit integrity.

## Security

Do not report vulnerabilities in public issues. Follow the private process in [SECURITY.md](SECURITY.md).

## Support and governance

- Use [SUPPORT.md](SUPPORT.md) to choose the correct help channel.
- See [GOVERNANCE.md](GOVERNANCE.md) for decision ownership and change control.
- Review [CHANGELOG.md](CHANGELOG.md) for unreleased and released changes.

## License

TraceGuard is licensed under the [Apache License 2.0](LICENSE).
