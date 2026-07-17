// SPDX-FileCopyrightText: 2026 TraceGuard contributors
// SPDX-License-Identifier: Apache-2.0

import { createServer } from "node:http";

import { createDatabase } from "@traceguard/database";
import pino from "pino";

import { createApp } from "./app.js";
import { loadEnvironment } from "./config/env.js";

const environment = loadEnvironment();
const logger = pino({ level: environment.logLevel });
const database = createDatabase({ connectionString: environment.databaseUrl });
const app = createApp({
  corsOrigins: environment.corsOrigins,
  logger,
  readiness: async () => {
    await database.checkReady();
    return { postgres: "ok" };
  },
  trustProxy: environment.nodeEnv === "production" ? 1 : false,
});
const server = createServer(app);

server.listen(environment.port, () => {
  logger.info({ port: environment.port }, "TraceGuard API listening");
});

let shuttingDown = false;

function shutdown(signal: string) {
  if (shuttingDown) return;
  shuttingDown = true;
  logger.info({ signal }, "shutting down API");

  server.closeIdleConnections();
  server.close((error) => {
    void database.close().then(() => {
      if (error) {
        logger.error({ error }, "API shutdown failed");
        process.exitCode = 1;
      }
    });
  });
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
