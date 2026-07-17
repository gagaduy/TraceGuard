// SPDX-FileCopyrightText: 2026 TraceGuard contributors
// SPDX-License-Identifier: Apache-2.0

import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

import { cn } from "../lib/utils";

export const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-full text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary: "bg-cyan-300 px-5 py-2.5 text-slate-950 hover:bg-cyan-200",
        secondary:
          "border border-white/15 bg-white/5 px-5 py-2.5 text-white hover:bg-white/10",
        ghost: "px-4 py-2 text-slate-300 hover:bg-white/5 hover:text-white",
      },
      size: {
        default: "h-11",
        compact: "h-9",
      },
    },
    defaultVariants: {
      size: "default",
      variant: "primary",
    },
  },
);

export interface ButtonProps
  extends
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, size, variant, type = "button", ...props }, ref) => (
    <button
      ref={ref}
      type={type}
      className={cn(buttonVariants({ className, size, variant }))}
      {...props}
    />
  ),
);

Button.displayName = "Button";
