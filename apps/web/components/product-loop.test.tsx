// SPDX-FileCopyrightText: 2026 TraceGuard contributors
// SPDX-License-Identifier: Apache-2.0

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ProductLoop } from "./product-loop";

describe("ProductLoop", () => {
  it("presents the accountable decision stages as an ordered list", () => {
    render(<ProductLoop />);

    expect(screen.getByRole("list")).toBeInTheDocument();
    expect(screen.getAllByRole("listitem")).toHaveLength(6);
    expect(screen.getByText("Human approval")).toBeVisible();
    expect(screen.getByText("Recovery & CAPA")).toBeVisible();
  });
});
