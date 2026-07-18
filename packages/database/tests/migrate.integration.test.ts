// SPDX-FileCopyrightText: 2026 TraceGuard contributors
// SPDX-License-Identifier: Apache-2.0

import { randomUUID } from "node:crypto";
import { resolve } from "node:path";

import { Pool } from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { runMigrations } from "../src/migrate.js";

const databaseUrl = process.env.TEST_DATABASE_URL;
const describeWithDatabase = databaseUrl ? describe : describe.skip;
const databaseName = `traceguard_migrate_${randomUUID().replaceAll("-", "")}`;
let adminPool: Pool;
let migratedPool: Pool;
let migratedUrl: string;

describeWithDatabase("runtime migration boundary", () => {
  beforeAll(async () => {
    adminPool = new Pool({ connectionString: databaseUrl });
    await adminPool.query(`create database "${databaseName}"`);
    const url = new URL(databaseUrl!);
    url.pathname = `/${databaseName}`;
    migratedUrl = url.toString();
    migratedPool = new Pool({ connectionString: migratedUrl });
  });

  afterAll(async () => {
    await migratedPool?.end();
    await adminPool?.query(`drop database if exists "${databaseName}"`);
    await adminPool?.end();
  });

  it("applies every committed migration and can run again safely", async () => {
    const migrationsFolder = resolve(import.meta.dirname, "../migrations");

    await runMigrations({ connectionString: migratedUrl, migrationsFolder });
    await runMigrations({ connectionString: migratedUrl, migrationsFolder });

    const result = await migratedPool.query<{ tablename: string }>(
      "select tablename from pg_tables where schemaname = 'public' order by tablename",
    );
    expect(result.rows.map(({ tablename }) => tablename)).toEqual([
      "audit_events",
      "idempotency_records",
      "identities",
      "membership_roles",
      "organization_memberships",
      "organizations",
    ]);
  });
});
