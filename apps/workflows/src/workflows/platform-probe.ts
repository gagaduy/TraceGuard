// SPDX-FileCopyrightText: 2026 TraceGuard contributors
// SPDX-License-Identifier: Apache-2.0

import { workflowInfo } from "@temporalio/workflow";

export interface PlatformProbeInput {
  correlationId: string;
}

export interface PlatformProbeResult {
  correlationId: string;
  status: "ok";
  workflowId: string;
}

export function createPlatformProbeResult(
  input: PlatformProbeInput,
  workflowId: string,
): PlatformProbeResult {
  return {
    correlationId: input.correlationId,
    status: "ok",
    workflowId,
  };
}

export function platformProbeWorkflow(
  input: PlatformProbeInput,
): PlatformProbeResult {
  return createPlatformProbeResult(input, workflowInfo().workflowId);
}
