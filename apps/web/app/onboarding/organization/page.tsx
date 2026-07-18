// SPDX-FileCopyrightText: 2026 TraceGuard contributors
// SPDX-License-Identifier: Apache-2.0

"use client";

import type { Route } from "next";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { AccessState } from "@/components/access/access-state";
import { OrganizationOnboardingForm } from "@/components/access/organization-onboarding-form";
import type { BootstrapOrganizationRequest } from "@/lib/access/types";
import { TraceGuardApiError } from "@/lib/api/traceguard-client";
import { useAuth } from "@/lib/auth/auth-provider";

export default function OrganizationOnboardingPage() {
  const {
    api,
    authenticated,
    identity,
    loading,
    login,
    logout,
    refreshIdentity,
  } = useAuth();
  const [error, setError] = useState<string>();
  const router = useRouter();

  useEffect(() => {
    const existing = identity?.organizations[0];
    if (existing) router.replace(`/org/${existing.slug}/overview` as Route);
  }, [identity, router]);

  if (loading)
    return (
      <AccessState title="Preparing organization setup">
        <span className="loading-line" />
      </AccessState>
    );
  if (!authenticated) {
    return (
      <AccessState title="Sign in to create your workspace">
        <p>
          Your verified identity becomes the first administrator of the
          organization.
        </p>
        <button
          className="primary-action"
          onClick={() => void login()}
          type="button"
        >
          Sign in
        </button>
      </AccessState>
    );
  }

  async function createOrganization(input: BootstrapOrganizationRequest) {
    setError(undefined);
    try {
      const organization = await api.bootstrapOrganization(input);
      await refreshIdentity();
      router.replace(`/org/${organization.slug}/overview` as Route);
    } catch (cause) {
      setError(
        cause instanceof TraceGuardApiError
          ? cause.message
          : "TraceGuard could not create the organization. Try again.",
      );
    }
  }

  return (
    <main className="onboarding-page app-theme">
      <section className="onboarding-copy">
        <a className="onboarding-brand" href="/">
          <span>TG</span>TraceGuard
        </a>
        <p className="eyebrow">Workspace setup</p>
        <h1>Create the organization that owns operational truth.</h1>
        <p>
          Organization boundaries keep evidence, authority, and audit history
          isolated from day one.
        </p>
        <ul>
          <li>
            <strong>Tenant isolation</strong>
            <span>Every business query is scoped to membership.</span>
          </li>
          <li>
            <strong>Explicit authority</strong>
            <span>You begin as the organization administrator.</span>
          </li>
          <li>
            <strong>Auditable setup</strong>
            <span>Bootstrap is idempotent and recorded once.</span>
          </li>
        </ul>
      </section>
      <section className="onboarding-panel">
        <div>
          <p className="step-label">Step 1 of 1</p>
          <h2>Organization details</h2>
          <p>Use stable details your team will recognize later.</p>
        </div>
        <OrganizationOnboardingForm
          error={error}
          onSubmit={createOrganization}
        />
        <button
          className="text-action"
          onClick={() => void logout()}
          type="button"
        >
          Sign in with another account
        </button>
      </section>
    </main>
  );
}
