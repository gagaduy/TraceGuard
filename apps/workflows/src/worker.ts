// SPDX-FileCopyrightText: 2026 TraceGuard contributors
// SPDX-License-Identifier: Apache-2.0

import { fileURLToPath } from "node:url";

import { NativeConnection, Worker } from "@temporalio/worker";
import pino from "pino";

import { loadWorkerEnvironment } from "./config.js";

const environment = loadWorkerEnvironment();
const logger = pino({ level: environment.logLevel });
const connection = await NativeConnection.connect({
  address: environment.address,
});
const worker = await Worker.create({
  connection,
  namespace: environment.namespace,
  taskQueue: environment.taskQueue,
  workflowsPath: fileURLToPath(
    new URL("./workflows/index.js", import.meta.url),
  ),
});

logger.info(
  {
    namespace: environment.namespace,
    taskQueue: environment.taskQueue,
  },
  "TraceGuard Temporal worker started",
);

try {
  await worker.run();
} finally {
  await connection.close();
}
