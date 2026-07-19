// SPDX-FileCopyrightText: 2026 TraceGuard contributors
// SPDX-License-Identifier: Apache-2.0

import { beforeEach, describe, expect, it, vi } from "vitest";
import { QueryClient } from "@tanstack/react-query";

import {
  readOrganizationPreference,
  rememberOrganizationPreference,
} from "@/lib/access/organization-preference";
import { clearOrganizationQueryCache } from "@/lib/access/organization-query-cache";
import { TraceGuardClient } from "@/lib/api/traceguard-client";
import {
  consumeSafeReturnUrl,
  isSafeReturnUrl,
  rememberSafeReturnUrl,
  resolveAuthorizedReturnUrl,
} from "@/lib/auth/safe-return-url";

const organizations = [
  {
    id: "01900000-0000-7000-8000-000000000001",
    name: "Acme Foods",
    roles: ["admin" as const],
    rowVersion: 1,
    slug: "acme-foods",
    timeZone: "UTC",
  },
  {
    id: "01900000-0000-7000-8000-000000000002",
    name: "Other Foods",
    roles: ["quality_analyst" as const],
    rowVersion: 1,
    slug: "other-foods",
    timeZone: "UTC",
  },
];

describe("organization access browser boundaries", () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    vi.restoreAllMocks();
  });

  it("uses a stored organization only while it remains authorized", () => {
    rememberOrganizationPreference("other-foods");
    expect(readOrganizationPreference(organizations)?.slug).toBe("other-foods");
    expect(
      readOrganizationPreference([organizations[0]!])?.slug,
    ).toBeUndefined();
  });

  it("stores and consumes only safe organization return URLs", () => {
    expect(isSafeReturnUrl("/org/acme-foods/settings")).toBe(true);
    expect(isSafeReturnUrl("https://attacker.test")).toBe(false);
    expect(isSafeReturnUrl("//attacker.test")).toBe(false);

    rememberSafeReturnUrl("/org/acme-foods/settings");
    expect(consumeSafeReturnUrl()).toBe("/org/acme-foods/settings");
    expect(consumeSafeReturnUrl()).toBeUndefined();
  });

  it("returns to an organization route only while membership remains active", () => {
    const identity = {
      id: "01900000-0000-7000-8000-000000000010",
      issuer: "http://keycloak.test/realms/traceguard",
      organizations,
      subject: "subject-1",
    };
    expect(
      resolveAuthorizedReturnUrl(identity, "/org/acme-foods/overview"),
    ).toBe("/org/acme-foods/overview");
    expect(
      resolveAuthorizedReturnUrl(
        { ...identity, organizations: [organizations[1]!] },
        "/org/acme-foods/overview",
      ),
    ).toBeUndefined();
  });

  it("aborts an in-flight tenant request before a tenant switch", async () => {
    let requestSignal: AbortSignal | undefined;
    vi.stubGlobal(
      "fetch",
      vi.fn((_url: string, init?: RequestInit) => {
        requestSignal = init?.signal ?? undefined;
        return new Promise<Response>((_resolve, reject) => {
          requestSignal?.addEventListener("abort", () =>
            reject(new DOMException("Aborted", "AbortError")),
          );
        });
      }),
    );
    const client = new TraceGuardClient(() => Promise.resolve("access-token"));
    const request = client.getOrganization("acme-foods");
    await Promise.resolve();

    client.resetTenantContext();

    expect(requestSignal?.aborted).toBe(true);
    await expect(request).rejects.toMatchObject({ name: "AbortError" });
  });

  it("removes only organization-scoped query data before navigation", async () => {
    const queryClient = new QueryClient();
    queryClient.setQueryData(["organization", "acme-foods"], {
      name: "Acme Foods",
    });
    queryClient.setQueryData(["public", "status"], { ready: true });

    await clearOrganizationQueryCache(queryClient);

    expect(
      queryClient.getQueryData(["organization", "acme-foods"]),
    ).toBeUndefined();
    expect(queryClient.getQueryData(["public", "status"])).toEqual({
      ready: true,
    });
  });

  it("signals session expiry when the API rejects authentication", async () => {
    const onSessionExpired = vi.fn();
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ detail: "Expired" }), {
          headers: { "Content-Type": "application/problem+json" },
          status: 401,
        }),
      ),
    );
    const client = new TraceGuardClient(
      () => Promise.resolve("expired-token"),
      onSessionExpired,
    );

    await expect(client.getCurrentIdentity()).rejects.toMatchObject({
      status: 401,
    });
    expect(onSessionExpired).toHaveBeenCalledOnce();
  });
});
