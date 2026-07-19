// SPDX-FileCopyrightText: 2026 TraceGuard contributors
// SPDX-License-Identifier: Apache-2.0

"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import type { CurrentIdentity } from "@/lib/access/types";
import { TraceGuardClient } from "@/lib/api/traceguard-client";
import { getKeycloak } from "@/lib/auth/keycloak";
import { rememberSafeReturnUrl } from "@/lib/auth/safe-return-url";

type AuthState = {
  api: TraceGuardClient;
  authenticated: boolean;
  error: string | undefined;
  identity: CurrentIdentity | undefined;
  loading: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  refreshIdentity: () => Promise<CurrentIdentity | undefined>;
};

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authenticated, setAuthenticated] = useState(false);
  const [identity, setIdentity] = useState<CurrentIdentity>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();

  const expireSession = useCallback(() => {
    if (typeof window === "undefined") return;
    rememberSafeReturnUrl(window.location.pathname);
    if (window.location.pathname !== "/session-expired") {
      window.location.assign("/session-expired");
    }
  }, []);

  const api = useMemo(
    () =>
      new TraceGuardClient(async () => {
        const keycloak = getKeycloak();
        if (keycloak.authenticated) {
          try {
            await keycloak.updateToken(30);
          } catch (cause) {
            expireSession();
            throw cause;
          }
        }
        return keycloak.token;
      }, expireSession),
    [expireSession],
  );

  const refreshIdentity = useCallback(async () => {
    if (!getKeycloak().authenticated) return undefined;
    const current = await api.getCurrentIdentity();
    setIdentity(current);
    return current;
  }, [api]);

  useEffect(() => {
    let active = true;
    const keycloak = getKeycloak();
    void keycloak
      .init({
        checkLoginIframe: false,
        onLoad: "check-sso",
        pkceMethod: "S256",
        silentCheckSsoRedirectUri: `${window.location.origin}/silent-check-sso.html`,
      })
      .then(async (isAuthenticated) => {
        if (!active) return;
        setAuthenticated(isAuthenticated);
        if (isAuthenticated) await refreshIdentity();
      })
      .catch((cause: unknown) => {
        if (active)
          setError(
            cause instanceof Error
              ? cause.message
              : "Sign-in initialization failed.",
          );
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [refreshIdentity]);

  const value = useMemo<AuthState>(
    () => ({
      api,
      authenticated,
      error,
      identity,
      loading,
      login: async () => {
        await getKeycloak().login({
          redirectUri: `${window.location.origin}/auth/callback`,
        });
      },
      logout: async () => {
        await getKeycloak().logout({ redirectUri: window.location.origin });
      },
      refreshIdentity,
    }),
    [api, authenticated, error, identity, loading, refreshIdentity],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used within AuthProvider");
  return value;
}
