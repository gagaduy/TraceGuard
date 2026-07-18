// SPDX-FileCopyrightText: 2026 TraceGuard contributors
// SPDX-License-Identifier: Apache-2.0

import { sql } from "drizzle-orm";
import {
  check,
  integer,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

export const organizations = pgTable(
  "organizations",
  {
    createdAt: timestamp("created_at", { mode: "date", withTimezone: true })
      .notNull()
      .defaultNow(),
    id: uuid("id")
      .primaryKey()
      .default(sql`uuidv7()`),
    name: text("name").notNull(),
    rowVersion: integer("row_version").notNull().default(1),
    slug: text("slug").notNull().unique(),
    timeZone: text("time_zone").notNull().default("UTC"),
    updatedAt: timestamp("updated_at", { mode: "date", withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    check("organizations_name_nonblank", sql`length(trim(${table.name})) > 0`),
    check("organizations_row_version_positive", sql`${table.rowVersion} > 0`),
    check(
      "organizations_slug_normalized",
      sql`${table.slug} ~ '^[a-z0-9]+(-[a-z0-9]+)*$'`,
    ),
    check(
      "organizations_time_zone_nonblank",
      sql`length(trim(${table.timeZone})) > 0`,
    ),
  ],
);
