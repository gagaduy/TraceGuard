// SPDX-FileCopyrightText: 2026 TraceGuard contributors
// SPDX-License-Identifier: Apache-2.0

import type * as databaseSchema from "@traceguard/database/schema";
import {
  auditEvents,
  identities,
  idempotencyRecords,
  membershipRoles,
  organizationMemberships,
  organizations,
  type MembershipRole,
} from "@traceguard/database/schema";
import { and, asc, eq, sql } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";

import type { AuthenticatedIdentity } from "../../../platform/auth/oidc-authenticator.js";
import type { AccessRepository } from "../application/access-service.js";
import {
  AccessError,
  type CurrentIdentity,
  type OrganizationDetail,
  type OrganizationSummary,
} from "../domain/access-types.js";

type Database = NodePgDatabase<typeof databaseSchema>;
type Transaction = Parameters<Parameters<Database["transaction"]>[0]>[0];

function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "23505"
  );
}

function mapOrganization(
  row: typeof organizations.$inferSelect,
  roles: MembershipRole[],
): OrganizationDetail {
  return {
    createdAt: row.createdAt.toISOString(),
    id: row.id,
    name: row.name,
    roles,
    rowVersion: row.rowVersion,
    slug: row.slug,
    timeZone: row.timeZone,
    updatedAt: row.updatedAt.toISOString(),
  };
}

function asStoredOrganization(
  value: Record<string, unknown>,
): OrganizationDetail {
  return value as unknown as OrganizationDetail;
}

export function createAccessRepository(options: {
  database: Database;
}): AccessRepository {
  async function reconcileIdentity(
    identity: AuthenticatedIdentity,
    database: Database | Transaction = options.database,
  ) {
    const [record] = await database
      .insert(identities)
      .values({
        displayName: identity.displayName ?? null,
        email: identity.email ?? null,
        issuer: identity.issuer,
        subject: identity.subject,
      })
      .onConflictDoUpdate({
        set: {
          displayName: identity.displayName ?? null,
          email: identity.email ?? null,
          updatedAt: new Date(),
        },
        target: [identities.issuer, identities.subject],
      })
      .returning();
    return record!;
  }

  async function organizationRows(identityId: string, slug?: string) {
    return options.database
      .select({ organization: organizations, role: membershipRoles.role })
      .from(organizationMemberships)
      .innerJoin(
        organizations,
        eq(organizationMemberships.organizationId, organizations.id),
      )
      .innerJoin(
        membershipRoles,
        eq(membershipRoles.membershipId, organizationMemberships.id),
      )
      .where(
        and(
          eq(organizationMemberships.identityId, identityId),
          eq(organizationMemberships.status, "active"),
          ...(slug ? [eq(organizations.slug, slug)] : []),
        ),
      )
      .orderBy(asc(organizations.name), asc(membershipRoles.role));
  }

  async function getAuthorizedOrganization(
    identity: AuthenticatedIdentity,
    slug: string,
  ) {
    const identityRecord = await reconcileIdentity(identity);
    const rows = await organizationRows(identityRecord.id, slug);
    if (!rows[0]) {
      throw new AccessError(
        "organization_not_found",
        404,
        "The organization was not found.",
      );
    }
    return {
      identityRecord,
      organization: rows[0].organization,
      roles: rows.map((row) => row.role),
    };
  }

  return {
    async bootstrapOrganization(identity, input, requestHash, correlationId) {
      try {
        return await options.database.transaction(async (transaction) => {
          const identityRecord = await reconcileIdentity(identity, transaction);
          await transaction.execute(
            sql`select ${identities.id} from ${identities} where ${identities.id} = ${identityRecord.id} for update`,
          );

          const [existingRequest] = await transaction
            .select()
            .from(idempotencyRecords)
            .where(
              and(
                eq(idempotencyRecords.identityId, identityRecord.id),
                eq(idempotencyRecords.operation, "organization.bootstrap"),
                eq(idempotencyRecords.key, input.idempotencyKey),
              ),
            )
            .limit(1);
          if (existingRequest) {
            if (existingRequest.requestHash !== requestHash) {
              throw new AccessError(
                "idempotency_conflict",
                409,
                "The idempotency key was used for different input.",
              );
            }
            return asStoredOrganization(existingRequest.responseBody);
          }

          const [existingMembership] = await transaction
            .select({ id: organizationMemberships.id })
            .from(organizationMemberships)
            .where(eq(organizationMemberships.identityId, identityRecord.id))
            .limit(1);
          if (existingMembership) {
            throw new AccessError(
              "organization_bootstrap_forbidden",
              409,
              "The identity already belongs to an organization.",
            );
          }

          const [organization] = await transaction
            .insert(organizations)
            .values({
              name: input.name,
              slug: input.slug,
              timeZone: input.timeZone,
            })
            .returning();
          const [membership] = await transaction
            .insert(organizationMemberships)
            .values({
              identityId: identityRecord.id,
              organizationId: organization!.id,
            })
            .returning();
          await transaction.insert(membershipRoles).values({
            membershipId: membership!.id,
            role: "admin",
          });
          const response = mapOrganization(organization!, ["admin"]);
          await transaction.insert(auditEvents).values({
            action: "organization.bootstrapped",
            actorIdentityId: identityRecord.id,
            after: {
              name: response.name,
              slug: response.slug,
              timeZone: response.timeZone,
            },
            correlationId,
            organizationId: response.id,
          });
          await transaction.insert(idempotencyRecords).values({
            identityId: identityRecord.id,
            key: input.idempotencyKey,
            operation: "organization.bootstrap",
            requestHash,
            responseBody: { ...response },
            responseStatus: 201,
          });
          return response;
        });
      } catch (error) {
        if (error instanceof AccessError) throw error;
        if (isUniqueViolation(error)) {
          throw new AccessError(
            "organization_slug_conflict",
            409,
            "The organization slug is unavailable.",
          );
        }
        throw error;
      }
    },

    async getCurrentIdentity(identity): Promise<CurrentIdentity> {
      const identityRecord = await reconcileIdentity(identity);
      const rows = await organizationRows(identityRecord.id);
      const grouped = new Map<string, OrganizationSummary>();
      for (const row of rows) {
        const existing = grouped.get(row.organization.id);
        if (existing) {
          existing.roles.push(row.role);
        } else {
          const detail = mapOrganization(row.organization, [row.role]);
          grouped.set(row.organization.id, {
            id: detail.id,
            name: detail.name,
            roles: detail.roles,
            rowVersion: detail.rowVersion,
            slug: detail.slug,
            timeZone: detail.timeZone,
          });
        }
      }
      return {
        ...(identityRecord.displayName
          ? { displayName: identityRecord.displayName }
          : {}),
        ...(identityRecord.email ? { email: identityRecord.email } : {}),
        id: identityRecord.id,
        issuer: identityRecord.issuer,
        organizations: [...grouped.values()],
        subject: identityRecord.subject,
      };
    },

    async getOrganization(identity, slug) {
      const authorized = await getAuthorizedOrganization(identity, slug);
      return mapOrganization(authorized.organization, authorized.roles);
    },

    async updateOrganization(identity, slug, input, correlationId) {
      const authorized = await getAuthorizedOrganization(identity, slug);
      if (!authorized.roles.includes("admin")) {
        throw new AccessError(
          "organization_access_denied",
          403,
          "Admin authority is required.",
        );
      }
      return options.database.transaction(async (transaction) => {
        const [updated] = await transaction
          .update(organizations)
          .set({
            name: input.name,
            rowVersion: sql`${organizations.rowVersion} + 1`,
            timeZone: input.timeZone,
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(organizations.id, authorized.organization.id),
              eq(organizations.rowVersion, input.rowVersion),
            ),
          )
          .returning();
        if (!updated) {
          throw new AccessError(
            "version_conflict",
            409,
            "The organization has a newer version.",
          );
        }
        const response = mapOrganization(updated, authorized.roles);
        await transaction.insert(auditEvents).values({
          action: "organization.settings_updated",
          actorIdentityId: authorized.identityRecord.id,
          after: { name: response.name, timeZone: response.timeZone },
          before: {
            name: authorized.organization.name,
            timeZone: authorized.organization.timeZone,
          },
          correlationId,
          organizationId: response.id,
        });
        return response;
      });
    },
  };
}
