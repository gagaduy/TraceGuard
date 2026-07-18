// SPDX-FileCopyrightText: 2026 TraceGuard contributors
// SPDX-License-Identifier: Apache-2.0

import { sql } from "drizzle-orm";
import {
  check,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";

import { identities } from "./identities.js";

export const idempotencyRecords = pgTable(
  "idempotency_records",
  {
    createdAt: timestamp("created_at", { mode: "date", withTimezone: true })
      .notNull()
      .defaultNow(),
    id: uuid("id")
      .primaryKey()
      .default(sql`uuidv7()`),
    identityId: uuid("identity_id")
      .notNull()
      .references(() => identities.id, { onDelete: "restrict" }),
    key: text("key").notNull(),
    operation: text("operation").notNull(),
    requestHash: text("request_hash").notNull(),
    responseBody: jsonb("response_body")
      .$type<Record<string, unknown>>()
      .notNull(),
    responseStatus: integer("response_status").notNull(),
  },
  (table) => [
    unique("idempotency_records_identity_operation_key_unique").on(
      table.identityId,
      table.operation,
      table.key,
    ),
    check(
      "idempotency_records_key_nonblank",
      sql`length(trim(${table.key})) > 0`,
    ),
    check(
      "idempotency_records_operation_nonblank",
      sql`length(trim(${table.operation})) > 0`,
    ),
    check(
      "idempotency_records_request_hash_nonblank",
      sql`length(trim(${table.requestHash})) > 0`,
    ),
    check(
      "idempotency_records_response_status_valid",
      sql`${table.responseStatus} between 200 and 599`,
    ),
  ],
);
