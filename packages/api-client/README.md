<!--
SPDX-FileCopyrightText: 2026 TraceGuard contributors
SPDX-License-Identifier: Apache-2.0
-->

# TraceGuard API client

This package exposes the typed browser and server transport generated from `openapi/traceguard.openapi.yaml`.

Regenerate the schema after an accepted contract change:

```bash
pnpm --filter @traceguard/api-client generate
pnpm --filter @traceguard/api-client generate:check
```

Application code imports `createTraceGuardClient` from `@traceguard/api-client`; it must not duplicate server response types by hand.
