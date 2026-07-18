// SPDX-FileCopyrightText: 2026 TraceGuard contributors
// SPDX-License-Identifier: Apache-2.0

import { randomUUID } from "node:crypto";
import { readFile, readdir } from "node:fs/promises";
import { resolve } from "node:path";

import * as databaseSchema from "@traceguard/database/schema";
import {
  identities,
  membershipRoles,
  organizationMemberships,
} from "@traceguard/database/schema";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { createAccessService } from "../src/modules/access/application/access-service.js";
import { createAccessRepository } from "../src/modules/access/infrastructure/access-repository.js";
import type { AuthenticatedIdentity } from "../src/platform/auth/oidc-authenticator.js";

const databaseUrl = process.env.TEST_DATABASE_URL;
const describeWithDatabase = databaseUrl ? describe : describe.skip;
const databaseName = `traceguard_api_access_${randomUUID().replaceAll("-", "")}`;
let adminPool: Pool;
let testPool: Pool;

const admin: AuthenticatedIdentity = {
  displayName: "Admin User",
  email: "admin@example.test",
  issuer: "http://keycloak.test/realms/traceguard",
  subject: "admin-subject",
};

async function applyMigrations(pool: Pool) {
  const migrationsDirectory = resolve(
    import.meta.dirname,
    "../../../packages/database/migrations",
  );
  const migrationNames = (await readdir(migrationsDirectory))
    .filter((name) => name.endsWith(".sql"))
    .sort();
  for (const migrationName of migrationNames) {
    await pool.query(
      await readFile(resolve(migrationsDirectory, migrationName), "utf8"),
    );
  }
}

describeWithDatabase("organization access use cases", () => {
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

  it("bootstraps once and replays only the same idempotent intent", async () => {
    const service = createAccessService({
      repository: createAccessRepository({
        database: drizzle(testPool, { schema: databaseSchema }),
      }),
    });
    const input = {
      idempotencyKey: "bootstrap-admin-1",
      name: "Acme Foods",
      slug: "acme-foods",
      timeZone: "Asia/Ho_Chi_Minh",
    };

    const created = await service.bootstrapOrganization(
      admin,
      input,
      "correlation-1",
    );
    const replayed = await service.bootstrapOrganization(
      admin,
      input,
      "correlation-2",
    );

    expect(replayed).toEqual(created);
    expect(created).toMatchObject({
      name: "Acme Foods",
      roles: ["admin"],
      rowVersion: 1,
      slug: "acme-foods",
      timeZone: "Asia/Ho_Chi_Minh",
    });
    await expect(
      service.bootstrapOrganization(
        admin,
        { ...input, name: "Different", slug: "different-foods" },
        "correlation-3",
      ),
    ).rejects.toMatchObject({ code: "idempotency_conflict", status: 409 });
    await expect(
      service.bootstrapOrganization(
        admin,
        { ...input, idempotencyKey: "bootstrap-admin-2" },
        "correlation-4",
      ),
    ).rejects.toMatchObject({
      code: "organization_bootstrap_forbidden",
      status: 409,
    });
  });

  it("isolates tenants and protects Admin updates with row versions", async () => {
    const database = drizzle(testPool, { schema: databaseSchema });
    const service = createAccessService({
      repository: createAccessRepository({ database }),
    });
    const other: AuthenticatedIdentity = {
      issuer: admin.issuer,
      subject: "other-subject",
    };
    const analyst: AuthenticatedIdentity = {
      issuer: admin.issuer,
      subject: "analyst-subject",
    };
    await service.bootstrapOrganization(
      other,
      {
        idempotencyKey: "bootstrap-other-1",
        name: "Other Foods",
        slug: "other-foods",
        timeZone: "UTC",
      },
      "correlation-other",
    );

    await expect(
      service.getOrganization(admin, "other-foods"),
    ).rejects.toMatchObject({
      code: "organization_not_found",
      status: 404,
    });

    const currentAdmin = await service.getCurrentIdentity(admin);
    const currentAnalyst = await service.getCurrentIdentity(analyst);
    const adminOrganization = currentAdmin.organizations[0]!;
    const [analystIdentity] = await database
      .select()
      .from(identities)
      .where(eq(identities.subject, analyst.subject));
    void currentAnalyst;
    const [membership] = await database
      .insert(organizationMemberships)
      .values({
        identityId: analystIdentity!.id,
        organizationId: adminOrganization.id,
      })
      .returning();
    await database.insert(membershipRoles).values({
      membershipId: membership!.id,
      role: "quality_analyst",
    });

    await expect(
      service.updateOrganization(
        analyst,
        "acme-foods",
        { name: "Blocked", rowVersion: 1, timeZone: "UTC" },
        "correlation-analyst",
      ),
    ).rejects.toMatchObject({
      code: "organization_access_denied",
      status: 403,
    });

    const updated = await service.updateOrganization(
      admin,
      "acme-foods",
      {
        name: "Acme Foods Vietnam",
        rowVersion: 1,
        timeZone: "Asia/Ho_Chi_Minh",
      },
      "correlation-update",
    );
    expect(updated).toMatchObject({
      name: "Acme Foods Vietnam",
      rowVersion: 2,
    });
    await expect(
      service.updateOrganization(
        admin,
        "acme-foods",
        { name: "Stale", rowVersion: 1, timeZone: "UTC" },
        "correlation-stale",
      ),
    ).rejects.toMatchObject({ code: "version_conflict", status: 409 });
  });
});
