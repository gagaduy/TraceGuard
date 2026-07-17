// SPDX-FileCopyrightText: 2026 TraceGuard contributors
// SPDX-License-Identifier: Apache-2.0

import { describe, expect, it } from "vitest";

import { createDatabase } from "../src/index.js";

describe("createDatabase", () => {
  it("creates a bounded connection pool without opening a connection eagerly", async () => {
    const database = createDatabase({
      connectionString: "postgresql://traceguard:unused@127.0.0.1:1/traceguard",
      maxConnections: 3,
    });

    expect(database.pool.options.max).toBe(3);
    await database.close();
  });
});
