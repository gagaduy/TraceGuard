// SPDX-FileCopyrightText: 2026 TraceGuard contributors
// SPDX-License-Identifier: Apache-2.0

import type {
  BootstrapOrganizationRequest,
  CurrentIdentity,
  OrganizationDetail,
  ProblemDetails,
  UpdateOrganizationRequest,
} from "@/lib/access/types";
import { publicEnv } from "@/lib/config/public-env";

export class TraceGuardApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly problem?: ProblemDetails,
  ) {
    super(message);
  }
}

type TokenProvider = () => Promise<string | undefined>;

export class TraceGuardClient {
  constructor(private readonly tokenProvider: TokenProvider) {}

  private async request<T>(path: string, init?: RequestInit): Promise<T> {
    const token = await this.tokenProvider();
    const response = await fetch(`${publicEnv.apiUrl}/v1${path}`, {
      ...init,
      headers: {
        Accept: "application/json",
        ...(init?.body ? { "Content-Type": "application/json" } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...init?.headers,
      },
    });
    if (!response.ok) {
      const problem = (await response.json().catch(() => undefined)) as
        ProblemDetails | undefined;
      throw new TraceGuardApiError(
        problem?.detail ?? `TraceGuard API returned ${response.status}.`,
        response.status,
        problem,
      );
    }
    return response.json() as Promise<T>;
  }

  getCurrentIdentity() {
    return this.request<CurrentIdentity>("/me");
  }

  bootstrapOrganization(input: BootstrapOrganizationRequest) {
    return this.request<OrganizationDetail>("/organizations", {
      body: JSON.stringify(input),
      headers: { "Idempotency-Key": crypto.randomUUID() },
      method: "POST",
    });
  }

  getOrganization(slug: string) {
    return this.request<OrganizationDetail>(`/organizations/${slug}`);
  }

  updateOrganization(slug: string, input: UpdateOrganizationRequest) {
    return this.request<OrganizationDetail>(`/organizations/${slug}`, {
      body: JSON.stringify(input),
      method: "PATCH",
    });
  }
}
