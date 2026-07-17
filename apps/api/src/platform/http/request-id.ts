// SPDX-FileCopyrightText: 2026 TraceGuard contributors
// SPDX-License-Identifier: Apache-2.0

import type { Request } from "express";

export function getRequestId(request: Request): string {
  if (typeof request.id === "string") return request.id;
  if (typeof request.id === "number") return request.id.toString();
  return "unavailable";
}
