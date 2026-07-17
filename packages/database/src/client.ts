// SPDX-FileCopyrightText: 2026 TraceGuard contributors
// SPDX-License-Identifier: Apache-2.0

import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import * as schema from "./schema/index.js";

export interface DatabaseOptions {
  connectionString: string;
  maxConnections?: number;
}

export function createDatabase(options: DatabaseOptions) {
  const pool = new Pool({
    allowExitOnIdle: true,
    connectionString: options.connectionString,
    connectionTimeoutMillis: 5_000,
    idleTimeoutMillis: 30_000,
    max: options.maxConnections ?? 10,
  });
  const db = drizzle(pool, { schema });

  return {
    checkReady: async () => {
      await pool.query("select 1");
    },
    close: async () => pool.end(),
    db,
    pool,
  };
}

export type TraceGuardDatabase = ReturnType<typeof createDatabase>;
