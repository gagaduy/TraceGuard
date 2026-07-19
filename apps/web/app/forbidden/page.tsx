// SPDX-FileCopyrightText: 2026 TraceGuard contributors
// SPDX-License-Identifier: Apache-2.0

import { AccessState } from "@/components/access/access-state";

export default function ForbiddenPage() {
  return (
    <AccessState title="This workspace is not available">
      <p>
        The requested organization could not be opened. It may not exist, or
        your current account may not have access.
      </p>
      <a href="/">Return to TraceGuard</a>
    </AccessState>
  );
}
