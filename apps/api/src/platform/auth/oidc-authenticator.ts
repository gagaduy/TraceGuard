// SPDX-FileCopyrightText: 2026 TraceGuard contributors
// SPDX-License-Identifier: Apache-2.0

import { createRemoteJWKSet, jwtVerify, type JWTVerifyGetKey } from "jose";

export interface AuthenticatedIdentity {
  displayName?: string;
  email?: string;
  issuer: string;
  subject: string;
}

export interface OidcAuthenticator {
  authenticate(
    authorizationHeader: string | undefined,
  ): Promise<AuthenticatedIdentity>;
}

export interface OidcAuthenticatorOptions {
  audience: string;
  issuer: string;
  jwksUrl?: string;
  keyResolver?: JWTVerifyGetKey;
}

export class AuthenticationError extends Error {
  readonly code = "invalid_token";
  readonly status = 401;

  constructor() {
    super("Authentication is required.");
    this.name = "AuthenticationError";
  }
}

export function createOidcAuthenticator(
  options: OidcAuthenticatorOptions,
): OidcAuthenticator {
  const keyResolver =
    options.keyResolver ??
    (options.jwksUrl
      ? createRemoteJWKSet(new URL(options.jwksUrl))
      : undefined);

  if (!keyResolver) {
    throw new Error("An OIDC JWKS URL or key resolver is required");
  }

  return {
    async authenticate(authorizationHeader) {
      const match = /^Bearer ([^\s]+)$/.exec(authorizationHeader ?? "");
      if (!match?.[1]) throw new AuthenticationError();

      try {
        const { payload } = await jwtVerify(match[1], keyResolver, {
          algorithms: ["RS256"],
          audience: options.audience,
          issuer: options.issuer,
        });
        if (!payload.iss || !payload.sub) throw new AuthenticationError();

        return {
          ...(typeof payload.name === "string"
            ? { displayName: payload.name }
            : {}),
          ...(typeof payload.email === "string"
            ? { email: payload.email }
            : {}),
          issuer: payload.iss,
          subject: payload.sub,
        };
      } catch {
        throw new AuthenticationError();
      }
    },
  };
}
