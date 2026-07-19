// SPDX-FileCopyrightText: 2026 TraceGuard contributors
// SPDX-License-Identifier: Apache-2.0

import type { OrganizationSummary } from "@/lib/access/types";

const preferenceKey = "traceguard.last-organization-slug";

export function readOrganizationPreference(
  organizations: OrganizationSummary[],
): OrganizationSummary | undefined {
  if (typeof window === "undefined") return undefined;
  const slug = window.localStorage.getItem(preferenceKey);
  return organizations.find((organization) => organization.slug === slug);
}

export function rememberOrganizationPreference(slug: string): void {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(preferenceKey, slug);
  }
}

export function clearOrganizationPreference(): void {
  if (typeof window !== "undefined") {
    window.localStorage.removeItem(preferenceKey);
  }
}
