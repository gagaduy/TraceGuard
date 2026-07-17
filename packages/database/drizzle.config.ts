// SPDX-FileCopyrightText: 2026 TraceGuard contributors
// SPDX-License-Identifier: Apache-2.0

import { defineConfig } from "drizzle-kit";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is required for database commands");
}

export default defineConfig({
  dbCredentials: { url: databaseUrl },
  dialect: "postgresql",
  out: "./migrations",
  schema: "./src/schema/index.ts",
  strict: true,
  verbose: true,
});
