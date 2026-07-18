// SPDX-FileCopyrightText: 2026 TraceGuard contributors
// SPDX-License-Identifier: Apache-2.0

import { describe, expect, it } from "vitest";

import { loadEnvironment } from "../src/config/env.js";

const validEnvironment = {
  DATABASE_URL: "postgresql://traceguard:test@postgres:5432/traceguard",
  OIDC_AUDIENCE: "traceguard-api",
  OIDC_ISSUER: "http://keycloak:8080/realms/traceguard",
  OIDC_JWKS_URL:
    "http://keycloak:8080/realms/traceguard/protocol/openid-connect/certs",
};

describe("API environment", () => {
  it("loads the OIDC verifier configuration", () => {
    expect(loadEnvironment(validEnvironment)).toMatchObject({
      oidcAudience: "traceguard-api",
      oidcIssuer: "http://keycloak:8080/realms/traceguard",
      oidcJwksUrl:
        "http://keycloak:8080/realms/traceguard/protocol/openid-connect/certs",
    });
  });

  it("rejects missing OIDC configuration", () => {
    expect(() =>
      loadEnvironment({ DATABASE_URL: validEnvironment.DATABASE_URL }),
    ).toThrow();
  });

  it("requires HTTPS identity endpoints in production", () => {
    expect(() =>
      loadEnvironment({ ...validEnvironment, NODE_ENV: "production" }),
    ).toThrow("OIDC identity endpoints must use HTTPS in production");
  });
});
