// SPDX-FileCopyrightText: 2026 TraceGuard contributors
// SPDX-License-Identifier: Apache-2.0

import { randomUUID } from "node:crypto";
import { readFile, readdir } from "node:fs/promises";
import { resolve } from "node:path";

import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import {
  auditEvents,
  identities,
  idempotencyRecords,
  membershipRoles,
  organizationMemberships,
  organizations,
} from "../src/schema/index.js";

const databaseUrl = process.env.TEST_DATABASE_URL;
const describeWithDatabase = databaseUrl ? describe : describe.skip;
const databaseName = `traceguard_access_${randomUUID().replaceAll("-", "")}`;
let adminPool: Pool;
let testPool: Pool;

async function applyMigrations(pool: Pool) {
  const migrationsDirectory = resolve(import.meta.dirname, "../migrations");
  const migrationNames = (await readdir(migrationsDirectory))
    .filter((name) => name.endsWith(".sql"))
    .sort();

  for (const migrationName of migrationNames) {
    const sql = await readFile(
      resolve(migrationsDirectory, migrationName),
      "utf8",
    );
    await pool.query(sql);
  }
}

describeWithDatabase("organization access schema", () => {
  beforeAll(async () => {
    adminPool = new Pool({ connectionString: databaseUrl });
    await adminPool.query(`create database "${databaseName}"`);
    const url = new URL(databaseUrl!);
    url.pathname = `/${databaseName}`;
    testPool = new Pool({ connectionString: url.toString() });
    await applyMigrations(testPool);
  });

  afterAll(async () => {
    await testPool?.end();
    await adminPool?.query(`drop database if exists "${databaseName}"`);
    await adminPool?.end();
  });

  it("enforces identity, membership, and role uniqueness", async () => {
    const database = drizzle(testPool);
    const [identity] = await database
      .insert(identities)
      .values({
        issuer: "http://keycloak.test/realms/traceguard",
        subject: "keycloak-subject-1",
      })
      .returning();
    const [organization] = await database
      .insert(organizations)
      .values({ name: "Acme Foods", slug: "acme-foods", timeZone: "UTC" })
      .returning();
    const [membership] = await database
      .insert(organizationMemberships)
      .values({ identityId: identity!.id, organizationId: organization!.id })
      .returning();
    const [adminRole] = await database
      .insert(membershipRoles)
      .values({ membershipId: membership!.id, role: "admin" })
      .returning();

    expect(identity).toMatchObject({
      issuer: "http://keycloak.test/realms/traceguard",
      subject: "keycloak-subject-1",
    });
    expect(organization).toMatchObject({ rowVersion: 1, timeZone: "UTC" });
    expect(adminRole?.role).toBe("admin");

    await expect(
      database.insert(identities).values({
        issuer: identity!.issuer,
        subject: identity!.subject,
      }),
    ).rejects.toThrow();
    await expect(
      database.insert(organizationMemberships).values({
        identityId: identity!.id,
        organizationId: organization!.id,
      }),
    ).rejects.toThrow();
    await expect(
      database.insert(membershipRoles).values({
        membershipId: membership!.id,
        role: "admin",
      }),
    ).rejects.toThrow();
  });

  it("rolls back the complete bootstrap unit after a failure", async () => {
    const database = drizzle(testPool);
    const subject = "rollback-subject";

    await expect(
      database.transaction(async (transaction) => {
        const [identity] = await transaction
          .insert(identities)
          .values({ issuer: "http://keycloak.test/realms/traceguard", subject })
          .returning();
        const [organization] = await transaction
          .insert(organizations)
          .values({
            name: "Rollback Foods",
            slug: "rollback-foods",
            timeZone: "UTC",
          })
          .returning();
        const [membership] = await transaction
          .insert(organizationMemberships)
          .values({
            identityId: identity!.id,
            organizationId: organization!.id,
          })
          .returning();
        await transaction.insert(membershipRoles).values({
          membershipId: membership!.id,
          role: "admin",
        });
        await transaction.insert(auditEvents).values({
          action: "organization.bootstrapped",
          actorIdentityId: identity!.id,
          after: { slug: organization!.slug },
          correlationId: "rollback-correlation",
          organizationId: organization!.id,
        });
        await transaction.insert(idempotencyRecords).values({
          identityId: identity!.id,
          key: "rollback-key",
          operation: "organization.bootstrap",
          requestHash: "sha256:rollback",
          responseBody: { id: organization!.id },
          responseStatus: 201,
        });
        throw new Error("injected failure");
      }),
    ).rejects.toThrow("injected failure");

    expect(
      await database
        .select()
        .from(identities)
        .where(eq(identities.subject, subject)),
    ).toHaveLength(0);
    expect(
      await database
        .select()
        .from(organizations)
        .where(eq(organizations.slug, "rollback-foods")),
    ).toHaveLength(0);
  });
});
