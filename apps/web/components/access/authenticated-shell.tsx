// SPDX-FileCopyrightText: 2026 TraceGuard contributors
// SPDX-License-Identifier: Apache-2.0

"use client";

import Link from "next/link";
import type { Route } from "next";
import {
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from "react";

import type { OrganizationSummary } from "@/lib/access/types";

export function AuthenticatedShell({
  children,
  currentOrganization,
  identityName,
  onSignOut,
  onSwitchOrganization,
  organizations,
}: {
  children: ReactNode;
  currentOrganization: OrganizationSummary;
  identityName: string;
  onSignOut?: () => void;
  onSwitchOrganization?: (slug: string) => Promise<void> | void;
  organizations: OrganizationSummary[];
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const menuButton = useRef<HTMLButtonElement>(null);
  const mobileNavigation = useRef<HTMLDivElement>(null);
  const base = `/org/${currentOrganization.slug}`;

  useEffect(() => {
    if (!mobileOpen) return;
    const closeButton = mobileNavigation.current?.querySelector("button");
    closeButton?.focus();
  }, [mobileOpen]);

  function closeMobileNavigation() {
    setMobileOpen(false);
    requestAnimationFrame(() => menuButton.current?.focus());
  }

  function handleMobileNavigationKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "Escape") {
      closeMobileNavigation();
      return;
    }
    if (event.key !== "Tab") return;
    const controls = mobileNavigation.current?.querySelectorAll<HTMLElement>(
      "button, select, a[href]",
    );
    if (!controls?.length) return;
    const first = controls[0];
    const last = controls[controls.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last?.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first?.focus();
    }
  }

  function navigation() {
    return (
      <>
        <div className="workspace-brand">
          <span aria-hidden="true">TG</span>
          <div>
            <strong>TraceGuard</strong>
            <small>Operational trust workspace</small>
          </div>
        </div>
        <label className="organization-picker">
          <span>Organization</span>
          <select
            aria-label="Organization"
            onChange={(event) => {
              const slug = event.target.value;
              if (onSwitchOrganization) void onSwitchOrganization(slug);
              else window.location.assign(`/org/${slug}/overview`);
            }}
            value={currentOrganization.slug}
          >
            {organizations.map((organization) => (
              <option key={organization.id} value={organization.slug}>
                {organization.name}
              </option>
            ))}
          </select>
        </label>
        <nav aria-label="Workspace" className="workspace-nav">
          <Link href={`${base}/overview` as Route}>Overview</Link>
          <Link href={`${base}/settings` as Route}>Organization settings</Link>
        </nav>
        <div className="workspace-account">
          <span className="account-avatar" aria-hidden="true">
            {identityName.slice(0, 1).toUpperCase()}
          </span>
          <div>
            <strong>{identityName}</strong>
            <small>
              {currentOrganization.roles.join(", ").replaceAll("_", " ")}
            </small>
          </div>
          {onSignOut ? (
            <button className="text-action" onClick={onSignOut} type="button">
              Sign out
            </button>
          ) : null}
        </div>
      </>
    );
  }

  return (
    <div className="app-theme authenticated-layout">
      <aside className="workspace-sidebar">{navigation()}</aside>
      <header className="mobile-header">
        <button
          aria-expanded={mobileOpen}
          aria-label="Open navigation"
          className="menu-button"
          onClick={() => setMobileOpen(true)}
          ref={menuButton}
          type="button"
        >
          ☰
        </button>
        <strong>{currentOrganization.name}</strong>
      </header>
      {mobileOpen ? (
        <div
          className="mobile-navigation"
          onKeyDown={handleMobileNavigationKeyDown}
          ref={mobileNavigation}
          role="dialog"
          aria-label="Workspace navigation"
        >
          <button
            aria-label="Close navigation"
            className="menu-button close-button"
            onClick={closeMobileNavigation}
            type="button"
          >
            ×
          </button>
          {navigation()}
        </div>
      ) : null}
      <main className="workspace-main">{children}</main>
    </div>
  );
}
