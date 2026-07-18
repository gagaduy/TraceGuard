// SPDX-FileCopyrightText: 2026 TraceGuard contributors
// SPDX-License-Identifier: Apache-2.0

"use client";

import { useParams } from "next/navigation";

import { useAuth } from "@/lib/auth/auth-provider";

export default function OrganizationOverviewPage() {
  const { identity } = useAuth();
  const { slug } = useParams<{ slug: string }>();
  const organization = identity?.organizations.find(
    (candidate) => candidate.slug === slug,
  );

  return (
    <div className="workspace-page">
      <header className="page-heading">
        <div>
          <p className="eyebrow">Organization overview</p>
          <h1>{organization?.name ?? "Organization"}</h1>
          <p>
            Your access boundary is active and ready for the next TraceGuard
            capability.
          </p>
        </div>
        <span className="status-pill">
          <i />
          Access active
        </span>
      </header>
      <section className="overview-grid">
        <article className="overview-card primary-card">
          <p className="card-label">Workspace status</p>
          <h2>Foundation is ready</h2>
          <p>
            Identity, tenant membership, role authority, and organization
            settings are connected.
          </p>
          <div className="readiness-list">
            <span>
              <i>1</i>Verified identity
            </span>
            <span>
              <i>2</i>Tenant-scoped access
            </span>
            <span>
              <i>3</i>Audited administration
            </span>
          </div>
        </article>
        <article className="overview-card">
          <p className="card-label">Your authority</p>
          <strong className="metric">{organization?.roles.length ?? 0}</strong>
          <p>
            {organization?.roles
              .map((role) => role.replaceAll("_", " "))
              .join(", ")}
          </p>
        </article>
        <article className="overview-card">
          <p className="card-label">Default time zone</p>
          <strong className="timezone-value">{organization?.timeZone}</strong>
          <p>Operational timestamps use this organization default.</p>
        </article>
      </section>
      <section className="next-capability">
        <span>Next capability</span>
        <div>
          <h2>Invite the operational team</h2>
          <p>Invitations and membership management arrive in Task 2.</p>
        </div>
        <span className="planned-badge">Planned</span>
      </section>
    </div>
  );
}
