// SPDX-FileCopyrightText: 2026 TraceGuard contributors
// SPDX-License-Identifier: Apache-2.0

import { sql } from "drizzle-orm";
import {
  check,
  pgTable,
  primaryKey,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";

import { identities } from "./identities.js";
import { organizations } from "./organizations.js";

export const membershipRoleValues = [
  "admin",
  "quality_analyst",
  "recall_coordinator",
  "approver",
] as const;

export type MembershipRole = (typeof membershipRoleValues)[number];

export const organizationMemberships = pgTable(
  "organization_memberships",
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
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "restrict" }),
    status: text("status").notNull().default("active"),
  },
  (table) => [
    unique("organization_memberships_identity_org_unique").on(
      table.identityId,
      table.organizationId,
    ),
    check(
      "organization_memberships_status_valid",
      sql`${table.status} = 'active'`,
    ),
  ],
);

export const membershipRoles = pgTable(
  "membership_roles",
  {
    createdAt: timestamp("created_at", { mode: "date", withTimezone: true })
      .notNull()
      .defaultNow(),
    membershipId: uuid("membership_id")
      .notNull()
      .references(() => organizationMemberships.id, { onDelete: "cascade" }),
    role: text("role").$type<MembershipRole>().notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.membershipId, table.role] }),
    check(
      "membership_roles_role_valid",
      sql`${table.role} in ('admin', 'quality_analyst', 'recall_coordinator', 'approver')`,
    ),
  ],
);
