<!--
SPDX-FileCopyrightText: 2026 TraceGuard contributors
SPDX-License-Identifier: Apache-2.0
-->

# TraceGuard workflows

The Temporal worker coordinates durable, long-running work. Workflow code must remain deterministic; database access, network calls, random values, external side effects, and AI requests belong in idempotent activities.

Temporal does not own business authorization or authoritative state. Consequential transitions return through Express use cases, policy evaluation, and configured human approval.

The platform probe exists only to verify worker deployment and correlation. It does not represent a recall or domain decision.
