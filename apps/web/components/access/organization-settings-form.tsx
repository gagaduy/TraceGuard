// SPDX-FileCopyrightText: 2026 TraceGuard contributors
// SPDX-License-Identifier: Apache-2.0

"use client";

import { useState, type FormEvent } from "react";

import type {
  OrganizationDetail,
  UpdateOrganizationRequest,
} from "@/lib/access/types";

export function OrganizationSettingsForm({
  error,
  onDirtyChange,
  onSubmit,
  organization,
}: {
  error?: string | undefined;
  onDirtyChange?: (dirty: boolean) => void;
  onSubmit: (value: UpdateOrganizationRequest) => Promise<void> | void;
  organization: OrganizationDetail;
}) {
  const canEdit = organization.roles.includes("admin");
  const [name, setName] = useState(organization.name);
  const [timeZone, setTimeZone] = useState(organization.timeZone);
  const [submitting, setSubmitting] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!canEdit || submitting) return;
    setSubmitting(true);
    try {
      await onSubmit({
        name: name.trim(),
        rowVersion: organization.rowVersion,
        timeZone,
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      className="access-form settings-form"
      onSubmit={(event) => void submit(event)}
    >
      {!canEdit ? (
        <div className="information-banner">
          <strong>Read-only access</strong>
          <span>
            Admin authority is required to update organization settings.
          </span>
        </div>
      ) : null}
      {error ? (
        <div className="form-alert" role="alert">
          {error}
        </div>
      ) : null}
      <label className="field">
        <span>Organization name</span>
        <input
          aria-label="Organization name"
          disabled={!canEdit}
          maxLength={160}
          onChange={(event) => {
            setName(event.target.value);
            onDirtyChange?.(
              event.target.value !== organization.name ||
                timeZone !== organization.timeZone,
            );
          }}
          required
          value={name}
        />
      </label>
      <label className="field">
        <span>Organization slug</span>
        <input
          aria-label="Organization slug"
          disabled
          value={organization.slug}
        />
        <small>
          The slug is permanent in the MVP to preserve operational links.
        </small>
      </label>
      <label className="field">
        <span>Default time zone</span>
        <select
          aria-label="Default time zone"
          disabled={!canEdit}
          onChange={(event) => {
            setTimeZone(event.target.value);
            onDirtyChange?.(
              name !== organization.name ||
                event.target.value !== organization.timeZone,
            );
          }}
          value={timeZone}
        >
          <option value="UTC">UTC</option>
          <option value="Asia/Ho_Chi_Minh">Asia/Ho Chi Minh</option>
          <option value="Asia/Singapore">Asia/Singapore</option>
          <option value="Europe/London">Europe/London</option>
          <option value="America/New_York">America/New York</option>
        </select>
      </label>
      {canEdit ? (
        <button className="primary-action" disabled={submitting} type="submit">
          {submitting ? "Saving changes…" : "Save changes"}
        </button>
      ) : null}
    </form>
  );
}
