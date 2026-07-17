// SPDX-FileCopyrightText: 2026 TraceGuard contributors
// SPDX-License-Identifier: Apache-2.0

import { createDatabase } from "./client.js";
import { organizations } from "./schema/index.js";

const databaseUrl = process.env.DATABASE_URL;
const traceGuardEnvironment = process.env.TRACEGUARD_ENV ?? "development";

if (!databaseUrl) {
  throw new Error("DATABASE_URL is required to seed development data");
}

if (traceGuardEnvironment === "production") {
  throw new Error(
    "The deterministic development seed cannot run in production",
  );
}

const database = createDatabase({ connectionString: databaseUrl });

try {
  await database.db
    .insert(organizations)
    .values({ name: "TraceGuard Local", slug: "traceguard-local" })
    .onConflictDoNothing({ target: organizations.slug });
} finally {
  await database.close();
}
