// SPDX-FileCopyrightText: 2026 TraceGuard contributors
// SPDX-License-Identifier: Apache-2.0

import { describe, expect, it } from "vitest";

import { loadWorkerEnvironment } from "../src/config.js";
import { createPlatformProbeResult } from "../src/workflows/platform-probe.js";

describe("workflow worker foundation", () => {
  it("loads an explicit Temporal boundary", () => {
    expect(
      loadWorkerEnvironment({
        TEMPORAL_ADDRESS: "temporal.test:7233",
        TEMPORAL_NAMESPACE: "traceguard-test",
        TEMPORAL_TASK_QUEUE: "traceguard-test-queue",
      }),
    ).toMatchObject({
      address: "temporal.test:7233",
      namespace: "traceguard-test",
      taskQueue: "traceguard-test-queue",
    });
  });

  it("preserves correlation in the deterministic probe result", () => {
    expect(
      createPlatformProbeResult({ correlationId: "corr-123" }, "workflow-456"),
    ).toEqual({
      correlationId: "corr-123",
      status: "ok",
      workflowId: "workflow-456",
    });
  });
});
