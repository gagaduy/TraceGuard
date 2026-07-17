// SPDX-FileCopyrightText: 2026 TraceGuard contributors
// SPDX-License-Identifier: Apache-2.0

import { Router } from "express";

import { createProblemDetails } from "../../../platform/errors/problem-details.js";
import { getRequestId } from "../../../platform/http/request-id.js";

export interface HealthRouterDependencies {
  readiness: () => Promise<Record<string, "ok">>;
}

export function createHealthRouter(dependencies: HealthRouterDependencies) {
  const router = Router();

  router.get("/health/live", (_request, response) => {
    response.status(200).json({ status: "ok" });
  });

  router.get("/health/ready", async (request, response) => {
    try {
      const checks = await dependencies.readiness();
      response.status(200).json({ checks, status: "ok" });
    } catch {
      response
        .status(503)
        .type("application/problem+json")
        .json(
          createProblemDetails({
            correlationId: getRequestId(request),
            detail: "A required API dependency is unavailable.",
            instance: request.originalUrl,
            status: 503,
            title: "Service unavailable",
            type: "https://traceguard.dev/problems/dependency-unavailable",
          }),
        );
    }
  });

  return router;
}
