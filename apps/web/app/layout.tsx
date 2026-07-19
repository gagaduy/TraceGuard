// SPDX-FileCopyrightText: 2026 TraceGuard contributors
// SPDX-License-Identifier: Apache-2.0

import type { Metadata } from "next";
import type { ReactNode } from "react";

import "./globals.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "TraceGuard — Evidence-backed recall resilience",
  description:
    "Open-source TrustOps for evidence-backed, policy-checked, human-approved recall resilience.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html data-scroll-behavior="smooth" lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
