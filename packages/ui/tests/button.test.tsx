// SPDX-FileCopyrightText: 2026 TraceGuard contributors
// SPDX-License-Identifier: Apache-2.0

import "@testing-library/jest-dom/vitest";

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Button } from "../src";

describe("Button", () => {
  it("preserves native button semantics and an accessible name", () => {
    render(<Button>Review evidence</Button>);

    expect(
      screen.getByRole("button", { name: "Review evidence" }),
    ).toHaveAttribute("type", "button");
  });
});
