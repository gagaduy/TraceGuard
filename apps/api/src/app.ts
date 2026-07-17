// SPDX-FileCopyrightText: 2026 TraceGuard contributors
// SPDX-License-Identifier: Apache-2.0

import { randomUUID } from "node:crypto";
import type { IncomingMessage, ServerResponse } from "node:http";

import cors from "cors";
import express, { type ErrorRequestHandler } from "express";
import { rateLimit } from "express-rate-limit";
import helmet from "helmet";
import pino, { type Logger } from "pino";
import { pinoHttp } from "pino-http";

import {
  createHealthRouter,
  type HealthRouterDependencies,
} from "./modules/platform/http/health-router.js";
import { createProblemDetails } from "./platform/errors/problem-details.js";
import { getRequestId } from "./platform/http/request-id.js";

export interface AppOptions extends HealthRouterDependencies {
  corsOrigins: string[];
  logger?: Logger;
  trustProxy?: boolean | number | string;
}

export function createApp(options: AppOptions) {
  const app = express();
  const logger = options.logger ?? pino({ level: "info" });

  app.disable("x-powered-by");
  app.set("trust proxy", options.trustProxy ?? false);
  app.use(
    pinoHttp({
      genReqId(request: IncomingMessage, response: ServerResponse) {
        const incoming = request.headers["x-request-id"];
        const requestId =
          typeof incoming === "string" && incoming.length <= 128
            ? incoming
            : randomUUID();
        response.setHeader("x-request-id", requestId);
        return requestId;
      },
      logger,
    }),
  );
  app.use(helmet());
  app.use(
    cors({
      credentials: true,
      origin(origin, callback) {
        if (!origin || options.corsOrigins.includes(origin)) {
          callback(null, true);
          return;
        }
        callback(new Error("Origin is not allowed"));
      },
    }),
  );
  app.use(express.json({ limit: "1mb" }));
  app.use(
    rateLimit({
      legacyHeaders: false,
      limit: 300,
      standardHeaders: "draft-8",
      windowMs: 60_000,
    }),
  );
  app.use(createHealthRouter({ readiness: options.readiness }));

  app.use((request, response) => {
    response
      .status(404)
      .type("application/problem+json")
      .json(
        createProblemDetails({
          correlationId: getRequestId(request),
          instance: request.originalUrl,
          status: 404,
          title: "Not found",
          type: "https://traceguard.dev/problems/not-found",
        }),
      );
  });

  const errorHandler: ErrorRequestHandler = (
    error,
    request,
    response,
    _next,
  ) => {
    void _next;
    request.log.error({ error }, "request failed");
    response
      .status(500)
      .type("application/problem+json")
      .json(
        createProblemDetails({
          correlationId: getRequestId(request),
          status: 500,
          title: "Internal server error",
          type: "https://traceguard.dev/problems/internal-error",
        }),
      );
  };
  app.use(errorHandler);

  return app;
}
