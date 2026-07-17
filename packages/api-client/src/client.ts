// SPDX-FileCopyrightText: 2026 TraceGuard contributors
// SPDX-License-Identifier: Apache-2.0

import createClient from "openapi-fetch";

import type { paths } from "./generated/schema.js";

export interface TraceGuardClientOptions {
  baseUrl: string;
  fetch?: typeof globalThis.fetch;
}

export function createTraceGuardClient(options: TraceGuardClientOptions) {
  const clientOptions = options.fetch
    ? { baseUrl: options.baseUrl, fetch: options.fetch }
    : { baseUrl: options.baseUrl };

  return createClient<paths>(clientOptions);
}

export type TraceGuardClient = ReturnType<typeof createTraceGuardClient>;
