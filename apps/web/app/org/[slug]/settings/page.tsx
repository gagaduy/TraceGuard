// SPDX-FileCopyrightText: 2026 TraceGuard contributors
// SPDX-License-Identifier: Apache-2.0

"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

import { OrganizationSettingsForm } from "@/components/access/organization-settings-form";
import type {
  OrganizationDetail,
  UpdateOrganizationRequest,
} from "@/lib/access/types";
import { TraceGuardApiError } from "@/lib/api/traceguard-client";
import { useAuth } from "@/lib/auth/auth-provider";

export default function OrganizationSettingsPage() {
  const { api, refreshIdentity } = useAuth();
  const { slug } = useParams<{ slug: string }>();
  const [organization, setOrganization] = useState<OrganizationDetail>();
  const [error, setError] = useState<string>();
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    void api
      .getOrganization(slug)
      .then(setOrganization)
      .catch((cause: unknown) =>
        setError(
          cause instanceof Error
            ? cause.message
            : "Settings could not be loaded.",
        ),
      );
  }, [api, slug]);

  async function updateOrganization(input: UpdateOrganizationRequest) {
    setError(undefined);
    setSaved(false);
    try {
      setOrganization(await api.updateOrganization(slug, input));
      await refreshIdentity();
      setSaved(true);
    } catch (cause) {
      setError(
        cause instanceof TraceGuardApiError
          ? cause.message
          : "Settings could not be saved.",
      );
    }
  }

  return (
    <div className="workspace-page narrow-page">
      <header className="page-heading">
        <div>
          <p className="eyebrow">Administration</p>
          <h1>Organization settings</h1>
          <p>Manage the stable details used across this tenant boundary.</p>
        </div>
      </header>
      <section className="settings-card">
        <div className="settings-card-heading">
          <div>
            <h2>Organization profile</h2>
            <p>Changes are authorized and written to the audit trail.</p>
          </div>
          {saved ? <span className="saved-message">Changes saved</span> : null}
        </div>
        {organization ? (
          <OrganizationSettingsForm
            error={error}
            onSubmit={updateOrganization}
            organization={organization}
          />
        ) : (
          <div className="settings-loading">
            <span className="loading-line" />
            {error ? <p role="alert">{error}</p> : null}
          </div>
        )}
      </section>
    </div>
  );
}
