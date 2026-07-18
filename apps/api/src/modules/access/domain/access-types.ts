// SPDX-FileCopyrightText: 2026 TraceGuard contributors
// SPDX-License-Identifier: Apache-2.0

import type { MembershipRole } from "@traceguard/database/schema";

export interface BootstrapOrganizationInput {
  idempotencyKey: string;
  name: string;
  slug: string;
  timeZone: string;
}

export interface UpdateOrganizationInput {
  name: string;
  rowVersion: number;
  timeZone: string;
}

export interface OrganizationSummary {
  id: string;
  name: string;
  roles: MembershipRole[];
  rowVersion: number;
  slug: string;
  timeZone: string;
}

export interface OrganizationDetail extends OrganizationSummary {
  createdAt: string;
  updatedAt: string;
}

export interface CurrentIdentity {
  displayName?: string;
  email?: string;
  id: string;
  issuer: string;
  organizations: OrganizationSummary[];
  subject: string;
}

export type AccessErrorCode =
  | "idempotency_conflict"
  | "organization_access_denied"
  | "organization_bootstrap_forbidden"
  | "organization_not_found"
  | "organization_slug_conflict"
  | "validation_failed"
  | "version_conflict";

export class AccessError extends Error {
  constructor(
    readonly code: AccessErrorCode,
    readonly status: 403 | 404 | 409 | 422,
    message: string,
  ) {
    super(message);
    this.name = "AccessError";
  }
}
