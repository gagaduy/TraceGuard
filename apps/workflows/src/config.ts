// SPDX-FileCopyrightText: 2026 TraceGuard contributors
// SPDX-License-Identifier: Apache-2.0

import { z } from "zod";

const workerEnvironmentSchema = z.object({
  LOG_LEVEL: z
    .enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"])
    .default("info"),
  TEMPORAL_ADDRESS: z.string().min(1).default("temporal:7233"),
  TEMPORAL_NAMESPACE: z.string().min(1).default("default"),
  TEMPORAL_TASK_QUEUE: z.string().min(1).default("traceguard-platform"),
});

export function loadWorkerEnvironment(
  environment: NodeJS.ProcessEnv = process.env,
) {
  const parsed = workerEnvironmentSchema.parse(environment);

  return {
    address: parsed.TEMPORAL_ADDRESS,
    logLevel: parsed.LOG_LEVEL,
    namespace: parsed.TEMPORAL_NAMESPACE,
    taskQueue: parsed.TEMPORAL_TASK_QUEUE,
  };
}
