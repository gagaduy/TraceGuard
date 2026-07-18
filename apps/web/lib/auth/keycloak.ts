// SPDX-FileCopyrightText: 2026 TraceGuard contributors
// SPDX-License-Identifier: Apache-2.0

import Keycloak from "keycloak-js";

import { publicEnv } from "@/lib/config/public-env";

let keycloak: Keycloak | undefined;

export function getKeycloak() {
  keycloak ??= new Keycloak({
    clientId: publicEnv.keycloakClientId,
    realm: publicEnv.keycloakRealm,
    url: publicEnv.keycloakUrl,
  });
  return keycloak;
}
