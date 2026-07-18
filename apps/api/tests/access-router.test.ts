// SPDX-FileCopyrightText: 2026 TraceGuard contributors
// SPDX-License-Identifier: Apache-2.0

import pino from "pino";
import request from "supertest";
import { describe, expect, it } from "vitest";

import { createApp } from "../src/app.js";
import type { AccessService } from "../src/modules/access/application/access-service.js";
import {
  AuthenticationError,
  type OidcAuthenticator,
} from "../src/platform/auth/oidc-authenticator.js";

const logger = pino({ level: "silent" });
const identity = {
  issuer: "https://identity.test/realms/traceguard",
  subject: "subject-1",
};
const organization = {
  createdAt: "2026-07-18T00:00:00.000Z",
  id: "01900000-0000-7000-8000-000000000001",
  name: "Acme Foods",
  roles: ["admin" as const],
  rowVersion: 1,
  slug: "acme-foods",
  timeZone: "Asia/Ho_Chi_Minh",
  updatedAt: "2026-07-18T00:00:00.000Z",
};

function createTestApp() {
  const authenticator: OidcAuthenticator = {
    authenticate(header) {
      return header === "Bearer valid"
        ? Promise.resolve(identity)
        : Promise.reject(new AuthenticationError());
    },
  };
  const accessService: AccessService = {
    bootstrapOrganization: () => Promise.resolve(organization),
    getCurrentIdentity: () =>
      Promise.resolve({
        id: "01900000-0000-7000-8000-000000000010",
        issuer: identity.issuer,
        organizations: [organization],
        subject: identity.subject,
      }),
    getOrganization: () => Promise.resolve(organization),
    updateOrganization: (_identity, _slug, input) =>
      Promise.resolve({
        ...organization,
        ...input,
        rowVersion: input.rowVersion + 1,
      }),
  };
  return createApp({
    accessService,
    authenticator,
    corsOrigins: [],
    logger,
    readiness: () => Promise.resolve({ postgres: "ok" }),
  });
}

describe("organization access routes", () => {
  it("requires authentication", async () => {
    const response = await request(createTestApp())
      .get("/v1/me")
      .expect("content-type", /application\/problem\+json/)
      .expect(401);

    const body = response.body as { status: number; type: string };
    expect(body.status).toBe(401);
    expect(body.type).toContain("invalid-token");
  });

  it("returns the current authorized identity", async () => {
    const response = await request(createTestApp())
      .get("/v1/me")
      .set("authorization", "Bearer valid")
      .expect(200);

    expect((response.body as { organizations: unknown }).organizations).toEqual(
      [organization],
    );
  });

  it("bootstraps an organization with an idempotency key", async () => {
    const response = await request(createTestApp())
      .post("/v1/organizations")
      .set("authorization", "Bearer valid")
      .set("idempotency-key", "bootstrap-1")
      .send({
        name: "Acme Foods",
        slug: "acme-foods",
        timeZone: "Asia/Ho_Chi_Minh",
      })
      .expect(201);

    expect(response.body as unknown).toEqual(organization);
  });

  it("validates updates and returns the successor version", async () => {
    await request(createTestApp())
      .patch("/v1/organizations/acme-foods")
      .set("authorization", "Bearer valid")
      .send({ name: "", rowVersion: 1, timeZone: "UTC" })
      .expect(422);

    const response = await request(createTestApp())
      .patch("/v1/organizations/acme-foods")
      .set("authorization", "Bearer valid")
      .send({ name: "Acme Vietnam", rowVersion: 1, timeZone: "UTC" })
      .expect(200);

    expect(response.body as unknown).toMatchObject({
      name: "Acme Vietnam",
      rowVersion: 2,
    });
  });
});
