// SPDX-FileCopyrightText: 2026 TraceGuard contributors
// SPDX-License-Identifier: Apache-2.0

import type { AuthenticatedIdentity } from "../platform/auth/oidc-authenticator.js";

declare global {
  namespace Express {
    interface Request {
      auth: AuthenticatedIdentity;
    }
  }
}

export {};
