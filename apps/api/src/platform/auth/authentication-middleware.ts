// SPDX-FileCopyrightText: 2026 TraceGuard contributors
// SPDX-License-Identifier: Apache-2.0

import type { RequestHandler } from "express";

import { createProblemDetails } from "../errors/problem-details.js";
import { getRequestId } from "../http/request-id.js";
import type { OidcAuthenticator } from "./oidc-authenticator.js";

export function createAuthenticationMiddleware(
  authenticator: OidcAuthenticator,
): RequestHandler {
  return async (request, response, next) => {
    try {
      request.auth = await authenticator.authenticate(
        request.headers.authorization,
      );
      next();
    } catch {
      response
        .status(401)
        .type("application/problem+json")
        .json(
          createProblemDetails({
            correlationId: getRequestId(request),
            detail: "A valid access token is required.",
            instance: request.originalUrl,
            status: 401,
            title: "Authentication required",
            type: "https://traceguard.dev/problems/invalid-token",
          }),
        );
    }
  };
}
