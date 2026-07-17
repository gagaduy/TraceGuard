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
