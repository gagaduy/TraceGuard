// SPDX-FileCopyrightText: 2026 TraceGuard contributors
// SPDX-License-Identifier: Apache-2.0

import { sql } from "drizzle-orm";
import {
  check,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";

export const identities = pgTable(
  "identities",
  {
    createdAt: timestamp("created_at", { mode: "date", withTimezone: true })
      .notNull()
      .defaultNow(),
    displayName: text("display_name"),
    email: text("email"),
    id: uuid("id")
      .primaryKey()
      .default(sql`uuidv7()`),
    issuer: text("issuer").notNull(),
    subject: text("subject").notNull(),
    updatedAt: timestamp("updated_at", { mode: "date", withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    unique("identities_issuer_subject_unique").on(table.issuer, table.subject),
    check("identities_issuer_nonblank", sql`length(trim(${table.issuer})) > 0`),
    check(
      "identities_subject_nonblank",
      sql`length(trim(${table.subject})) > 0`,
    ),
  ],
);
