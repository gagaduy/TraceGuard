// SPDX-FileCopyrightText: 2026 TraceGuard contributors
// SPDX-License-Identifier: Apache-2.0

import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? "dot" : [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000",
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "wide-desktop",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { height: 900, width: 1440 },
      },
    },
    {
      name: "constrained",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { height: 768, width: 1024 },
      },
    },
    {
      name: "mobile",
      use: { ...devices["Pixel 5"], viewport: { height: 844, width: 390 } },
    },
  ],
  ...(process.env.PLAYWRIGHT_EXTERNAL_SERVER
    ? {}
    : {
        webServer: {
          command: "pnpm dev",
          reuseExistingServer: false,
          timeout: 120_000,
          url: "http://localhost:3000",
        },
      }),
});
