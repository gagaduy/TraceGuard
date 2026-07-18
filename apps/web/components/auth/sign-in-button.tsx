// SPDX-FileCopyrightText: 2026 TraceGuard contributors
// SPDX-License-Identifier: Apache-2.0

"use client";

import { buttonVariants } from "@traceguard/ui";

import { useAuth } from "@/lib/auth/auth-provider";

export function SignInButton() {
  const { authenticated, identity, loading, login } = useAuth();
  const destination = identity?.organizations[0]
    ? `/org/${identity.organizations[0].slug}/overview`
    : "/onboarding/organization";

  if (authenticated) {
    return (
      <a
        className={buttonVariants({ size: "compact", variant: "primary" })}
        href={destination}
      >
        Open workspace
      </a>
    );
  }

  return (
    <button
      className={buttonVariants({ size: "compact", variant: "primary" })}
      disabled={loading}
      onClick={() => void login()}
      type="button"
    >
      {loading ? "Checking session…" : "Sign in"}
    </button>
  );
}
