// SPDX-FileCopyrightText: 2026 TraceGuard contributors
// SPDX-License-Identifier: Apache-2.0

"use client";

import type { Route } from "next";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { AccessState } from "@/components/access/access-state";
import { useAuth } from "@/lib/auth/auth-provider";

export default function AuthCallbackPage() {
  const { authenticated, error, identity, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading || !authenticated || !identity) return;
    const organization = identity.organizations[0];
    router.replace(
      (organization
        ? `/org/${organization.slug}/overview`
        : "/onboarding/organization") as Route,
    );
  }, [authenticated, identity, loading, router]);

  return (
    <AccessState
      title={
        error ? "Sign-in could not be completed" : "Opening your workspace"
      }
    >
      <p>
        {error ?? "Your identity and organization access are being verified."}
      </p>
      {error ? (
        <a href="/">Return to TraceGuard</a>
      ) : (
        <span className="loading-line" />
      )}
    </AccessState>
  );
}
