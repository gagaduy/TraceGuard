// SPDX-FileCopyrightText: 2026 TraceGuard contributors
// SPDX-License-Identifier: Apache-2.0

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { AuthenticatedShell } from "./authenticated-shell";
import { OrganizationOnboardingForm } from "./organization-onboarding-form";
import { OrganizationSettingsForm } from "./organization-settings-form";

const organization = {
  createdAt: "2026-07-18T00:00:00.000Z",
  id: "01900000-0000-7000-8000-000000000001",
  name: "Acme Foods",
  roles: ["admin" as const],
  rowVersion: 1,
  slug: "acme-foods",
  timeZone: "Asia/Ho_Chi_Minh",
  updatedAt: "2026-07-18T00:00:00.000Z",
};

describe("organization access UI", () => {
  it("generates an editable slug and submits onboarding values", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(<OrganizationOnboardingForm onSubmit={onSubmit} />);

    await user.type(screen.getByLabelText("Organization name"), "Acme Foods");
    expect(screen.getByLabelText("Organization slug")).toHaveValue(
      "acme-foods",
    );
    await user.selectOptions(
      screen.getByLabelText("Default time zone"),
      "Asia/Ho_Chi_Minh",
    );
    await user.click(
      screen.getByRole("button", { name: "Create organization" }),
    );

    expect(onSubmit).toHaveBeenCalledWith({
      name: "Acme Foods",
      slug: "acme-foods",
      timeZone: "Asia/Ho_Chi_Minh",
    });
  });

  it("shows only working navigation in the authenticated shell", () => {
    render(
      <AuthenticatedShell
        currentOrganization={organization}
        identityName="TraceGuard Reviewer"
        organizations={[organization]}
      >
        <h1>Organization overview</h1>
      </AuthenticatedShell>,
    );

    expect(screen.getByRole("navigation", { name: "Workspace" })).toBeVisible();
    expect(screen.getByRole("link", { name: "Overview" })).toBeVisible();
    expect(
      screen.getByRole("link", { name: "Organization settings" }),
    ).toBeVisible();
    expect(screen.queryByText("Recall")).not.toBeInTheDocument();
  });

  it("renders organization settings read-only without Admin authority", () => {
    render(
      <OrganizationSettingsForm
        organization={{ ...organization, roles: ["quality_analyst"] }}
        onSubmit={vi.fn()}
      />,
    );

    expect(screen.getByLabelText("Organization slug")).toBeDisabled();
    expect(screen.getByLabelText("Organization name")).toBeDisabled();
    expect(
      screen.queryByRole("button", { name: "Save changes" }),
    ).not.toBeInTheDocument();
  });
});
