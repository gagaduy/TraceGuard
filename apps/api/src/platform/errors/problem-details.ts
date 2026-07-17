// SPDX-FileCopyrightText: 2026 TraceGuard contributors
// SPDX-License-Identifier: Apache-2.0

export interface ProblemDetails {
  correlationId?: string;
  detail?: string;
  instance?: string;
  status: number;
  title: string;
  type: string;
}

export function createProblemDetails(problem: ProblemDetails): ProblemDetails {
  return problem;
}
