// SPDX-FileCopyrightText: 2026 TraceGuard contributors
// SPDX-License-Identifier: Apache-2.0

export const publicEnv = {
  apiUrl: process.env.NEXT_PUBLIC_TRACEGUARD_API_URL ?? "http://localhost:4000",
  keycloakClientId:
    process.env.NEXT_PUBLIC_KEYCLOAK_CLIENT_ID ?? "traceguard-web",
  keycloakRealm: process.env.NEXT_PUBLIC_KEYCLOAK_REALM ?? "traceguard",
  keycloakUrl: process.env.NEXT_PUBLIC_KEYCLOAK_URL ?? "http://localhost:8081",
} as const;
