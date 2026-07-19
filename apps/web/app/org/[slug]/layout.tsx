// SPDX-FileCopyrightText: 2026 TraceGuard contributors
// SPDX-License-Identifier: Apache-2.0

"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState, type MouseEvent, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { AccessState } from "@/components/access/access-state";
import { AuthenticatedShell } from "@/components/access/authenticated-shell";
import {
  UnsavedChangesDialog,
  UnsavedChangesProvider,
  useUnsavedChanges,
} from "@/components/access/unsaved-changes";
import {
  clearOrganizationPreference,
  rememberOrganizationPreference,
} from "@/lib/access/organization-preference";
import { clearOrganizationQueryCache } from "@/lib/access/organization-query-cache";
import { useAuth } from "@/lib/auth/auth-provider";
import {
  isSafeReturnUrl,
  type SafeOrganizationRoute,
} from "@/lib/auth/safe-return-url";

export default function OrganizationLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <UnsavedChangesProvider>
      <OrganizationWorkspace>{children}</OrganizationWorkspace>
    </UnsavedChangesProvider>
  );
}

function OrganizationWorkspace({ children }: { children: ReactNode }) {
  const { api, authenticated, identity, loading, login, logout } = useAuth();
  const { dirty, setDirty } = useUnsavedChanges();
  const params = useParams<{ slug: string }>();
  const queryClient = useQueryClient();
  const router = useRouter();
  const [pendingNavigation, setPendingNavigation] = useState<{
    destination: string;
    path: SafeOrganizationRoute;
  }>();
  const currentOrganization = identity?.organizations.find(
    ({ slug }) => slug === params.slug,
  );

  useEffect(() => {
    if (!loading && authenticated && identity && !currentOrganization) {
      clearOrganizationPreference();
      router.replace(
        identity.organizations.length > 0
          ? "/forbidden"
          : "/onboarding/organization",
      );
    }
  }, [authenticated, currentOrganization, identity, loading, router]);

  useEffect(() => {
    if (currentOrganization) {
      rememberOrganizationPreference(currentOrganization.slug);
    }
  }, [currentOrganization]);

  useEffect(() => {
    if (!dirty) return;
    function guardUnload(event: BeforeUnloadEvent) {
      event.preventDefault();
      event.returnValue = "";
    }
    window.addEventListener("beforeunload", guardUnload);
    return () => window.removeEventListener("beforeunload", guardUnload);
  }, [dirty]);

  function switchOrganization(slug: string) {
    if (slug === currentOrganization?.slug) return;
    if (dirty) {
      const destination =
        identity?.organizations.find(
          (organization) => organization.slug === slug,
        )?.name ?? "the selected organization";
      setPendingNavigation({
        destination,
        path: `/org/${slug}/overview`,
      });
      return;
    }
    void completeNavigation(`/org/${slug}/overview`);
  }

  async function completeNavigation(path: SafeOrganizationRoute) {
    const targetSlug = /^\/org\/([^/]+)\//.exec(path)?.[1];
    if (targetSlug && targetSlug !== currentOrganization?.slug) {
      api.resetTenantContext();
      await clearOrganizationQueryCache(queryClient);
      rememberOrganizationPreference(targetSlug);
    }
    setDirty(false);
    setPendingNavigation(undefined);
    router.push(path);
  }

  function guardNavigation(event: MouseEvent<HTMLDivElement>) {
    if (!dirty || event.defaultPrevented || event.button !== 0) return;
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey)
      return;
    const anchor = (event.target as HTMLElement).closest<HTMLAnchorElement>(
      "a[href]",
    );
    if (!anchor) return;
    const target = new URL(anchor.href, window.location.href);
    if (target.origin !== window.location.origin) return;
    const path = `${target.pathname}${target.search}${target.hash}`;
    const current = `${window.location.pathname}${window.location.search}${window.location.hash}`;
    if (path === current || !isSafeReturnUrl(path)) return;
    event.preventDefault();
    setPendingNavigation({
      destination: anchor.textContent?.trim() || "the selected page",
      path,
    });
  }

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
    <div onClickCapture={guardNavigation}>
      <AuthenticatedShell
        currentOrganization={currentOrganization}
        identityName={
          identity.displayName ?? identity.email ?? "TraceGuard user"
        }
        onSignOut={() => void logout()}
        onSwitchOrganization={switchOrganization}
        organizations={identity.organizations}
      >
        {children}
      </AuthenticatedShell>
      {pendingNavigation ? (
        <UnsavedChangesDialog
          destination={pendingNavigation.destination}
          onCancel={() => setPendingNavigation(undefined)}
          onConfirm={() => void completeNavigation(pendingNavigation.path)}
        />
      ) : null}
    </div>
  );
}
