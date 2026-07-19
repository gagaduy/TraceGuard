// SPDX-FileCopyrightText: 2026 TraceGuard contributors
// SPDX-License-Identifier: Apache-2.0

import type { CurrentIdentity } from "@/lib/access/types";

const returnUrlKey = "traceguard.safe-return-url";
const organizationRoute =
  /^\/org\/([a-z0-9]+(?:-[a-z0-9]+)*)\/(overview|settings)$/;

export function isSafeReturnUrl(value: string): boolean {
  return organizationRoute.test(value);
}

export function rememberSafeReturnUrl(value: string): void {
  if (typeof window !== "undefined" && isSafeReturnUrl(value)) {
    window.sessionStorage.setItem(returnUrlKey, value);
  }
}

export function consumeSafeReturnUrl(): string | undefined {
  if (typeof window === "undefined") return undefined;
  const value = window.sessionStorage.getItem(returnUrlKey);
  window.sessionStorage.removeItem(returnUrlKey);
  return value && isSafeReturnUrl(value) ? value : undefined;
}

export function resolveAuthorizedReturnUrl(
  identity: CurrentIdentity,
  value: string | undefined,
): string | undefined {
  if (!value) return undefined;
  const match = organizationRoute.exec(value);
  if (!match) return undefined;
  return identity.organizations.some(({ slug }) => slug === match[1])
    ? value
    : undefined;
}
