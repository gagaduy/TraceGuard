// SPDX-FileCopyrightText: 2026 TraceGuard contributors
// SPDX-License-Identifier: Apache-2.0

"use client";

import type { Route } from "next";
import { useParams, useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";

import { AccessState } from "@/components/access/access-state";
import { AuthenticatedShell } from "@/components/access/authenticated-shell";
import { useAuth } from "@/lib/auth/auth-provider";

export default function OrganizationLayout({
  children,
}: {
  children: ReactNode;
}) {
  const { authenticated, identity, loading, login, logout } = useAuth();
  const params = useParams<{ slug: string }>();
  const router = useRouter();
  const currentOrganization = identity?.organizations.find(
    ({ slug }) => slug === params.slug,
  );

  useEffect(() => {
    if (!loading && authenticated && identity && !currentOrganization) {
      router.replace(
        (identity.organizations[0]
          ? `/org/${identity.organizations[0].slug}/overview`
          : "/onboarding/organization") as Route,
      );
    }
  }, [authenticated, currentOrganization, identity, loading, router]);

  if (loading)
    return (
      <AccessState title="Loading your workspace">
        <span className="loading-line" />
      </AccessState>
    );
  if (!authenticated) {
    return (
      <AccessState title="Your session is required">
        <p>Sign in again to open this organization.</p>
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
  if (!identity || !currentOrganization)
    return (
      <AccessState title="Checking organization access">
        <span className="loading-line" />
      </AccessState>
    );

  return (
    <AuthenticatedShell
      currentOrganization={currentOrganization}
      identityName={identity.displayName ?? identity.email ?? "TraceGuard user"}
      onSignOut={() => void logout()}
      onSwitchOrganization={(slug) =>
        router.push(`/org/${slug}/overview` as Route)
      }
      organizations={identity.organizations}
    >
      {children}
    </AuthenticatedShell>
  );
}
