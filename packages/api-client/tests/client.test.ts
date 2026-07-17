// SPDX-FileCopyrightText: 2026 TraceGuard contributors
// SPDX-License-Identifier: Apache-2.0

import { describe, expect, it } from "vitest";

import { createTraceGuardClient } from "../src";

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
});
