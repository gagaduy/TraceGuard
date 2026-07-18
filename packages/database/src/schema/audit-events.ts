// SPDX-FileCopyrightText: 2026 TraceGuard contributors
// SPDX-License-Identifier: Apache-2.0

import { sql } from "drizzle-orm";
import {
  check,
  index,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

import { identities } from "./identities.js";
import { organizations } from "./organizations.js";

export const auditEvents = pgTable(
  "audit_events",
  {
    action: text("action").notNull(),
    actorIdentityId: uuid("actor_identity_id")
      .notNull()
      .references(() => identities.id, { onDelete: "restrict" }),
    after: jsonb("after_state").$type<Record<string, unknown>>(),
    before: jsonb("before_state").$type<Record<string, unknown>>(),
    correlationId: text("correlation_id").notNull(),
    id: uuid("id")
      .primaryKey()
      .default(sql`uuidv7()`),
    occurredAt: timestamp("occurred_at", { mode: "date", withTimezone: true })
      .notNull()
      .defaultNow(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "restrict" }),
  },
  (table) => [
    index("audit_events_organization_occurred_idx").on(
      table.organizationId,
      table.occurredAt,
    ),
    check(
      "audit_events_action_nonblank",
      sql`length(trim(${table.action})) > 0`,
    ),
    check(
      "audit_events_correlation_nonblank",
      sql`length(trim(${table.correlationId})) > 0`,
    ),
  ],
);
