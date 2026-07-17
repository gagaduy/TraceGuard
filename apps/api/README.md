<!--
SPDX-FileCopyrightText: 2026 TraceGuard contributors
SPDX-License-Identifier: Apache-2.0
-->

# TraceGuard API

The Express application is the only public business backend. It authorizes and persists business-state transitions, while route handlers remain thin and delegate domain behavior to use cases.

The current foundation implements the shared liveness and PostgreSQL readiness contract. Business routers are intentionally absent until their actor, tenant boundary, authorization, state transition, audit event, idempotency, and failure behavior are specified and tested.
