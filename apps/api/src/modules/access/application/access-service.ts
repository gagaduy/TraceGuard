// SPDX-FileCopyrightText: 2026 TraceGuard contributors
// SPDX-License-Identifier: Apache-2.0

import { createHash } from "node:crypto";

import type { AuthenticatedIdentity } from "../../../platform/auth/oidc-authenticator.js";
import {
  AccessError,
  type BootstrapOrganizationInput,
  type CurrentIdentity,
  type OrganizationDetail,
  type UpdateOrganizationInput,
} from "../domain/access-types.js";

export interface AccessRepository {
  bootstrapOrganization(
    identity: AuthenticatedIdentity,
    input: BootstrapOrganizationInput,
    requestHash: string,
    correlationId: string,
  ): Promise<OrganizationDetail>;
  getCurrentIdentity(identity: AuthenticatedIdentity): Promise<CurrentIdentity>;
  getOrganization(
    identity: AuthenticatedIdentity,
    slug: string,
  ): Promise<OrganizationDetail>;
  updateOrganization(
    identity: AuthenticatedIdentity,
    slug: string,
    input: UpdateOrganizationInput,
    correlationId: string,
  ): Promise<OrganizationDetail>;
}

function normalizeName(name: string): string {
  const normalized = name.trim();
  if (!normalized || normalized.length > 160) {
    throw new AccessError(
      "validation_failed",
      422,
      "Organization name is invalid.",
    );
  }
  return normalized;
}

function normalizeSlug(slug: string): string {
  const normalized = slug.trim().toLowerCase();
  if (
    !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(normalized) ||
    normalized.length < 3 ||
    normalized.length > 63
  ) {
    throw new AccessError(
      "validation_failed",
      422,
      "Organization slug is invalid.",
    );
  }
  return normalized;
}

function validateTimeZone(timeZone: string): string {
  if (!timeZone || timeZone.length > 100) {
    throw new AccessError(
      "validation_failed",
      422,
      "Organization time zone is invalid.",
    );
  }
  try {
    new Intl.DateTimeFormat("en", { timeZone }).format();
  } catch {
    throw new AccessError(
      "validation_failed",
      422,
      "Organization time zone is invalid.",
    );
  }
  return timeZone;
}

export function createAccessService(options: { repository: AccessRepository }) {
  return {
    bootstrapOrganization(
      identity: AuthenticatedIdentity,
      input: BootstrapOrganizationInput,
      correlationId: string,
    ) {
      const normalized = {
        idempotencyKey: input.idempotencyKey.trim(),
        name: normalizeName(input.name),
        slug: normalizeSlug(input.slug),
        timeZone: validateTimeZone(input.timeZone),
      };
      if (
        normalized.idempotencyKey.length < 8 ||
        normalized.idempotencyKey.length > 128
      ) {
        throw new AccessError(
          "validation_failed",
          422,
          "Idempotency key is invalid.",
        );
      }
      const requestHash = createHash("sha256")
        .update(
          JSON.stringify({
            name: normalized.name,
            slug: normalized.slug,
            timeZone: normalized.timeZone,
          }),
        )
        .digest("hex");
      return options.repository.bootstrapOrganization(
        identity,
        normalized,
        requestHash,
        correlationId,
      );
    },
    getCurrentIdentity(identity: AuthenticatedIdentity) {
      return options.repository.getCurrentIdentity(identity);
    },
    getOrganization(identity: AuthenticatedIdentity, slug: string) {
      return options.repository.getOrganization(identity, normalizeSlug(slug));
    },
    updateOrganization(
      identity: AuthenticatedIdentity,
      slug: string,
      input: UpdateOrganizationInput,
      correlationId: string,
    ) {
      if (!Number.isInteger(input.rowVersion) || input.rowVersion < 1) {
        throw new AccessError(
          "validation_failed",
          422,
          "Row version is invalid.",
        );
      }
      return options.repository.updateOrganization(
        identity,
        normalizeSlug(slug),
        {
          name: normalizeName(input.name),
          rowVersion: input.rowVersion,
          timeZone: validateTimeZone(input.timeZone),
        },
        correlationId,
      );
    },
  };
}

export type AccessService = ReturnType<typeof createAccessService>;
