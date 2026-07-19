// SPDX-FileCopyrightText: 2026 TraceGuard contributors
// SPDX-License-Identifier: Apache-2.0

import type { QueryClient } from "@tanstack/react-query";

const organizationQuery = {
  predicate: ({ queryKey }: { queryKey: readonly unknown[] }) =>
    queryKey[0] === "organization",
};

export async function clearOrganizationQueryCache(
  queryClient: QueryClient,
): Promise<void> {
  await queryClient.cancelQueries(organizationQuery);
  queryClient.removeQueries(organizationQuery);
}
