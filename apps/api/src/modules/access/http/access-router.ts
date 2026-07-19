// SPDX-FileCopyrightText: 2026 TraceGuard contributors
// SPDX-License-Identifier: Apache-2.0

import { Router, type Request, type Response } from "express";
import { z } from "zod";

import { createProblemDetails } from "../../../platform/errors/problem-details.js";
import { getRequestId } from "../../../platform/http/request-id.js";
import type { AccessService } from "../application/access-service.js";
import { AccessError } from "../domain/access-types.js";

const slugSchema = z
  .string()
  .min(3)
  .max(63)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
const timeZoneSchema = z
  .string()
  .min(1)
  .max(100)
  .refine((timeZone) => {
    try {
      new Intl.DateTimeFormat("en", { timeZone }).format();
      return true;
    } catch {
      return false;
    }
  }, "Invalid IANA time zone");
const bootstrapSchema = z.object({
  name: z.string().trim().min(1).max(160),
  slug: slugSchema,
  timeZone: timeZoneSchema,
});
const updateSchema = z.object({
  name: z.string().trim().min(1).max(160),
  rowVersion: z.number().int().min(1),
  timeZone: timeZoneSchema,
});

function validationProblem(request: Request, response: Response) {
  response
    .status(422)
    .type("application/problem+json")
    .json(
      createProblemDetails({
        correlationId: getRequestId(request),
        detail: "The request did not satisfy the organization-access contract.",
        instance: request.originalUrl,
        status: 422,
        title: "Validation failed",
        type: "https://traceguard.dev/problems/validation-failed",
      }),
    );
}

function accessProblem(
  error: AccessError,
  request: Request,
  response: Response,
) {
  response
    .status(error.status)
    .type("application/problem+json")
    .json(
      createProblemDetails({
        correlationId: getRequestId(request),
        detail: error.message,
        instance: request.originalUrl,
        status: error.status,
        title: error.code
          .split("_")
          .map((word) => word[0]!.toUpperCase() + word.slice(1))
          .join(" "),
        type: `https://traceguard.dev/problems/${error.code.replaceAll("_", "-")}`,
      }),
    );
}

async function handle(
  request: Request,
  response: Response,
  operation: () => Promise<unknown>,
  successStatus = 200,
) {
  try {
    response.status(successStatus).json(await operation());
  } catch (error) {
    if (error instanceof AccessError) {
      accessProblem(error, request, response);
      return;
    }
    throw error;
  }
}

export function createAccessRouter(accessService: AccessService) {
  const router = Router();

  router.get("/me", (request, response) =>
    handle(request, response, () =>
      accessService.getCurrentIdentity(request.auth),
    ),
  );

  router.post("/organizations", (request, response) => {
    const body = bootstrapSchema.safeParse(request.body);
    const idempotencyKey = z
      .string()
      .min(8)
      .max(128)
      .safeParse(request.headers["idempotency-key"]);
    if (!body.success || !idempotencyKey.success) {
      validationProblem(request, response);
      return;
    }
    return handle(
      request,
      response,
      () =>
        accessService.bootstrapOrganization(
          request.auth,
          { ...body.data, idempotencyKey: idempotencyKey.data },
          getRequestId(request),
        ),
      201,
    );
  });

  router.get("/organizations/:slug", (request, response) => {
    const slug = slugSchema.safeParse(request.params.slug);
    if (!slug.success) {
      validationProblem(request, response);
      return;
    }
    return handle(request, response, () =>
      accessService.getOrganization(
        request.auth,
        slug.data,
        getRequestId(request),
      ),
    );
  });

  router.patch("/organizations/:slug", (request, response) => {
    const slug = slugSchema.safeParse(request.params.slug);
    const body = updateSchema.safeParse(request.body);
    if (!slug.success || !body.success) {
      validationProblem(request, response);
      return;
    }
    return handle(request, response, () =>
      accessService.updateOrganization(
        request.auth,
        slug.data,
        body.data,
        getRequestId(request),
      ),
    );
  });

  return router;
}
