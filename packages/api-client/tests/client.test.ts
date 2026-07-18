// SPDX-FileCopyrightText: 2026 TraceGuard contributors
// SPDX-License-Identifier: Apache-2.0

import { describe, expect, expectTypeOf, it } from "vitest";

import { createTraceGuardClient, type components } from "../src";

type MeResponse = components["schemas"]["CurrentIdentity"];
type BootstrapRequest = components["schemas"]["BootstrapOrganizationRequest"];
type UpdateRequest = components["schemas"]["UpdateOrganizationRequest"];

describe("createTraceGuardClient", () => {
  it("calls the typed liveness endpoint against the configured API", async () => {
    const requests: Request[] = [];
    const fetchMock: typeof fetch = (input, init) => {
      requests.push(
        input instanceof Request ? input : new Request(input, init),
      );
      return Promise.resolve(
        new Response(JSON.stringify({ status: "ok" }), {
          headers: { "content-type": "application/json" },
          status: 200,
        }),
      );
    };
    const client = createTraceGuardClient({
      baseUrl: "https://traceguard.test",
      fetch: fetchMock,
    });

    const result = await client.GET("/health/live");

    expect(result.data).toEqual({ status: "ok" });
    expect(requests).toHaveLength(1);
    expect(requests[0]).toMatchObject({
      method: "GET",
      url: "https://traceguard.test/health/live",
    });
  });

  it("exposes the organization access contract", () => {
    const bootstrap: BootstrapRequest = {
      name: "Acme Foods",
      slug: "acme-foods",
      timeZone: "Asia/Ho_Chi_Minh",
    };
    const update: UpdateRequest = {
      name: "Acme Foods Vietnam",
      rowVersion: 1,
      timeZone: "Asia/Ho_Chi_Minh",
    };

    expectTypeOf<MeResponse>().toHaveProperty("organizations");
    expect(bootstrap.slug).toBe("acme-foods");
    expect(update.rowVersion).toBe(1);
  });
});
