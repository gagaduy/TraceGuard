// SPDX-FileCopyrightText: 2026 TraceGuard contributors
// SPDX-License-Identifier: Apache-2.0

import {
  createLocalJWKSet,
  exportJWK,
  generateKeyPair,
  SignJWT,
  type JWTVerifyGetKey,
} from "jose";
import { beforeAll, describe, expect, it } from "vitest";

import {
  AuthenticationError,
  createOidcAuthenticator,
} from "../src/platform/auth/oidc-authenticator.js";

const issuer = "https://identity.traceguard.test/realms/traceguard";
const audience = "traceguard-api";
let privateKey: Awaited<ReturnType<typeof generateKeyPair>>["privateKey"];
let keyResolver: JWTVerifyGetKey;

async function token(
  overrides: {
    audience?: string;
    expiresIn?: string;
    issuer?: string;
    subject?: string | null;
  } = {},
) {
  const builder = new SignJWT({
    email: "analyst@example.test",
    name: "Quality Analyst",
  })
    .setProtectedHeader({ alg: "RS256", kid: "test-key" })
    .setAudience(overrides.audience ?? audience)
    .setIssuer(overrides.issuer ?? issuer)
    .setIssuedAt()
    .setExpirationTime(overrides.expiresIn ?? "5m");

  if (overrides.subject !== null) {
    builder.setSubject(overrides.subject ?? "keycloak-subject-1");
  }

  return builder.sign(privateKey);
}

describe("OIDC authenticator", () => {
  beforeAll(async () => {
    const keys = await generateKeyPair("RS256", { extractable: true });
    privateKey = keys.privateKey;
    const publicJwk = await exportJWK(keys.publicKey);
    keyResolver = createLocalJWKSet({
      keys: [{ ...publicJwk, alg: "RS256", kid: "test-key", use: "sig" }],
    });
  });

  it("returns only the normalized authenticated identity", async () => {
    const authenticator = createOidcAuthenticator({
      audience,
      issuer,
      keyResolver,
    });

    await expect(
      authenticator.authenticate(`Bearer ${await token()}`),
    ).resolves.toEqual({
      displayName: "Quality Analyst",
      email: "analyst@example.test",
      issuer,
      subject: "keycloak-subject-1",
    });
  });

  it.each([
    ["missing header", undefined],
    ["wrong scheme", "Basic abc"],
    ["empty bearer", "Bearer "],
  ])("rejects %s", async (_case, authorizationHeader) => {
    const authenticator = createOidcAuthenticator({
      audience,
      issuer,
      keyResolver,
    });

    await expect(
      authenticator.authenticate(authorizationHeader),
    ).rejects.toBeInstanceOf(AuthenticationError);
  });

  it("rejects wrong issuer, audience, expiry, signature, and missing subject", async () => {
    const authenticator = createOidcAuthenticator({
      audience,
      issuer,
      keyResolver,
    });
    const invalidTokens = [
      await token({ issuer: "https://attacker.test/realms/traceguard" }),
      await token({ audience: "another-api" }),
      await token({ expiresIn: "-1s" }),
      `${await token()}altered`,
      await token({ subject: null }),
    ];

    for (const invalidToken of invalidTokens) {
      await expect(
        authenticator.authenticate(`Bearer ${invalidToken}`),
      ).rejects.toMatchObject({ code: "invalid_token", status: 401 });
    }
  });
});
