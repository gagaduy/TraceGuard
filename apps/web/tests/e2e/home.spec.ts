// SPDX-FileCopyrightText: 2026 TraceGuard contributors
// SPDX-License-Identifier: Apache-2.0

import { expect, test } from "@playwright/test";

test("explains TraceGuard status and human accountability", async ({
  page,
}) => {
  await page.goto("/");

  await expect(
    page.getByRole("heading", {
      level: 1,
      name: "Turn uncertain signals into accountable action.",
    }),
  ).toBeVisible();
  await expect(
    page.getByText("not production ready", { exact: false }),
  ).toBeVisible();
  await expect(
    page.getByText("AI may analyze and propose", { exact: false }),
  ).toBeVisible();
});
