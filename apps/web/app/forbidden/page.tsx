// SPDX-FileCopyrightText: 2026 TraceGuard contributors
// SPDX-License-Identifier: Apache-2.0

import { AccessState } from "@/components/access/access-state";

export default function ForbiddenPage() {
  return (
    <AccessState title="You do not have authority for this action">
      <p>
        Your organization membership is valid, but the required role is missing.
      </p>
      <a href="/">Return to TraceGuard</a>
    </AccessState>
  );
}
