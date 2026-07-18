// SPDX-FileCopyrightText: 2026 TraceGuard contributors
// SPDX-License-Identifier: Apache-2.0

"use client";

import { useState, type FormEvent } from "react";

import type { BootstrapOrganizationRequest } from "@/lib/access/types";

function toSlug(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 63);
}

export function OrganizationOnboardingForm({
  error,
  onSubmit,
}: {
  error?: string | undefined;
  onSubmit: (value: BootstrapOrganizationRequest) => Promise<void>;
}) {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugEdited, setSlugEdited] = useState(false);
  const [timeZone, setTimeZone] = useState("UTC");
  const [submitting, setSubmitting] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    try {
      await onSubmit({ name: name.trim(), slug, timeZone });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="access-form" onSubmit={(event) => void submit(event)}>
      {error ? (
        <div className="form-alert" role="alert">
          <strong>Organization could not be created.</strong>
          <span>{error}</span>
        </div>
      ) : null}
      <label className="field">
        <span>Organization name</span>
        <input
          aria-label="Organization name"
          autoComplete="organization"
          maxLength={160}
          name="name"
          onChange={(event) => {
            setName(event.target.value);
            if (!slugEdited) setSlug(toSlug(event.target.value));
          }}
          required
          value={name}
        />
        <small>The name your team will recognize.</small>
      </label>
      <label className="field">
        <span>Organization slug</span>
        <div className="slug-field">
          <span aria-hidden="true">traceguard.local/org/</span>
          <input
            aria-label="Organization slug"
            maxLength={63}
            minLength={3}
            name="slug"
            onChange={(event) => {
              setSlugEdited(true);
              setSlug(toSlug(event.target.value));
            }}
            pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
            required
            value={slug}
          />
        </div>
        <small>This route key becomes permanent after creation.</small>
      </label>
      <label className="field">
        <span>Default time zone</span>
        <select
          aria-label="Default time zone"
          name="timeZone"
          onChange={(event) => setTimeZone(event.target.value)}
          value={timeZone}
        >
          <option value="UTC">UTC</option>
          <option value="Asia/Ho_Chi_Minh">Asia/Ho Chi Minh</option>
          <option value="Asia/Singapore">Asia/Singapore</option>
          <option value="Europe/London">Europe/London</option>
          <option value="America/New_York">America/New York</option>
        </select>
        <small>Used when TraceGuard displays operational timestamps.</small>
      </label>
      <button className="primary-action" disabled={submitting} type="submit">
        {submitting ? "Creating organization…" : "Create organization"}
      </button>
    </form>
  );
}
