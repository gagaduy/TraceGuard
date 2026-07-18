// SPDX-FileCopyrightText: 2026 TraceGuard contributors
// SPDX-License-Identifier: Apache-2.0

"use client";

import type { ReactNode } from "react";

export function AccessState({
  children,
  title,
}: {
  children?: ReactNode;
  title: string;
}) {
  return (
    <main className="access-state-page app-theme">
      <section className="access-state-card">
        <span className="state-mark" aria-hidden="true">
          TG
        </span>
        <h1>{title}</h1>
        {children}
      </section>
    </main>
  );
}
