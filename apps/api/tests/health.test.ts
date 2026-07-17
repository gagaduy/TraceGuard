// SPDX-FileCopyrightText: 2026 TraceGuard contributors
// SPDX-License-Identifier: Apache-2.0

import pino from "pino";
import request from "supertest";
import { describe, expect, it } from "vitest";

import { createApp } from "../src/app.js";

const logger = pino({ level: "silent" });

describe("platform health", () => {
  it("reports liveness without checking dependencies", async () => {
    const app = createApp({
      corsOrigins: [],
      logger,
      readiness: async () => Promise.reject(new Error("database unavailable")),
    });

    const response = await request(app).get("/health/live").expect(200);

    expect(response.body).toEqual({ status: "ok" });
    expect(response.headers["x-request-id"]).toBeTypeOf("string");
  });

  it("reports successful dependency readiness", async () => {
    const app = createApp({
      corsOrigins: [],
      logger,
      readiness: async () => Promise.resolve({ postgres: "ok" }),
    });

    const response = await request(app).get("/health/ready").expect(200);

    expect(response.body).toEqual({ checks: { postgres: "ok" }, status: "ok" });
  });

  it("returns Problem Details when a dependency is unavailable", async () => {
    const app = createApp({
      corsOrigins: [],
      logger,
      readiness: async () => Promise.reject(new Error("database unavailable")),
    });

    const response = await request(app)
      .get("/health/ready")
      .set("x-request-id", "test-correlation")
      .expect("content-type", /application\/problem\+json/)
      .expect(503);

    expect(response.body).toMatchObject({
      correlationId: "test-correlation",
      status: 503,
      title: "Service unavailable",
    });
  });

  it("returns Problem Details for unknown routes", async () => {
    const app = createApp({
      corsOrigins: [],
      logger,
      readiness: async () => Promise.resolve({ postgres: "ok" }),
    });

    const response = await request(app)
      .get("/does-not-exist")
      .expect("content-type", /application\/problem\+json/)
      .expect(404);

    expect(response.body).toMatchObject({ status: 404, title: "Not found" });
  });
});
