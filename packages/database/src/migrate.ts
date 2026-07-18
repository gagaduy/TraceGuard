// SPDX-FileCopyrightText: 2026 TraceGuard contributors
// SPDX-License-Identifier: Apache-2.0

import { resolve } from "node:path";

import { migrate } from "drizzle-orm/node-postgres/migrator";

import { createDatabase } from "./client.js";

export interface MigrationOptions {
  connectionString: string;
  migrationsFolder?: string;
}

export async function runMigrations(options: MigrationOptions) {
  const database = createDatabase({
    connectionString: options.connectionString,
    maxConnections: 1,
  });

  try {
    await migrate(database.db, {
      migrationsFolder:
        options.migrationsFolder ??
        resolve(import.meta.dirname, "../migrations"),
    });
  } finally {
    await database.close();
  }
}

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is required to run database migrations");
  }
  await runMigrations({ connectionString });
  console.info("TraceGuard database migrations are current");
}

if (import.meta.url === `file://${process.argv[1]}`) {
  await main();
}
