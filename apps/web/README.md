<!--
SPDX-FileCopyrightText: 2026 TraceGuard contributors
SPDX-License-Identifier: Apache-2.0
-->

# TraceGuard web

The Next.js application is the user-facing decision-support surface. It renders server-owned state and calls only the public Express API through `@traceguard/api-client`.

It must not connect to PostgreSQL, call the internal Python service, persist business transitions, or reproduce recall and approval policy in browser code.

```bash
pnpm --filter @traceguard/web dev
pnpm --filter @traceguard/web test
pnpm --filter @traceguard/web build
```

The full organization-access browser journey requires the canonical local stack
and isolated E2E identities. After the current branch has been built by
`just up`, run:

```bash
TRACEGUARD_E2E_ACCESS=1 PLAYWRIGHT_EXTERNAL_SERVER=1 \
  pnpm --filter @traceguard/web test:e2e
```

The test creates project-scoped Keycloak identities and PostgreSQL tenant
fixtures, exercises the real OIDC/API boundary, and removes those fixtures in
its cleanup hook. Override `TRACEGUARD_E2E_POSTGRES_CONTAINER` only when the
Compose project uses a nonstandard PostgreSQL container name.
