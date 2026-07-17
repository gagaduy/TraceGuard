<!--
SPDX-FileCopyrightText: 2026 TraceGuard contributors
SPDX-License-Identifier: Apache-2.0
-->

# TraceGuard private compute service

This FastAPI process is an internal-only boundary for bounded document, embedding, graph, scoring, forecasting, and optimization tasks when Python provides a concrete ecosystem advantage.

It does not authenticate end users, expose public routes, write authoritative business state, send recall notices, or approve consequential action. Every future compute endpoint requires a versioned request/response schema, model or method version, evidence references, limitations, and a safe manual fallback.

```bash
uv sync --frozen
uv run ruff check .
uv run pyright
uv run pytest
```
