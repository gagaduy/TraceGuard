// SPDX-FileCopyrightText: 2026 TraceGuard contributors
// SPDX-License-Identifier: Apache-2.0

"use client";

import { AccessState } from "@/components/access/access-state";
import { useAuth } from "@/lib/auth/auth-provider";

export default function SessionExpiredPage() {
  const { login } = useAuth();

  return (
    <AccessState title="Your session expired">
      <p>
        TraceGuard stopped pending requests. Sign in again to return only if
        your organization access is still active.
      </p>
      <div className="access-state-actions">
        <button
          className="primary-action"
          onClick={() => void login()}
          type="button"
        >
          Sign in again
        </button>
        <a href="/">Return to the public site</a>
      </div>
    </AccessState>
  );
}
