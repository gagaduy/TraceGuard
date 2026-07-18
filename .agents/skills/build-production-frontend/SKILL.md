---
name: build-production-frontend
description: Build, modify, or review production frontend interfaces without breaking existing behavior. Use for React, Next.js, Vue, or similar frontend work involving pages, components, design systems, responsive layouts, accessibility, visual defects, interaction states, frontend refactors, or UI quality review. Enforce specification-first implementation, impact analysis, typed contracts, complete UI states, local browser verification, regression tests, and self-contained quality gates without requiring Figma, Chromatic, or another external review service.
---

<!--
SPDX-FileCopyrightText: 2026 TraceGuard contributors
SPDX-License-Identifier: Apache-2.0
-->

# Build Production Frontend

Produce a frontend that is correct, coherent, resilient, accessible, and visually verified. Treat appearance, interaction, data states, permissions, and regression safety as one implementation problem.

## Start from evidence

1. Read `AGENTS.md`, repository instructions, product/system analysis, frontend standards, API contracts, and relevant issue acceptance criteria.
2. Inspect the existing application before editing: framework, routes, layouts, design tokens, shared components, state management, data fetching, validation, tests, and validation commands.
3. Resolve the visual source of truth in this order: explicit user requirements, repository design standards, supplied screenshots/mockups, established product patterns, then a documented agent decision.
4. Do not block because Figma or an external design service is absent. Use repository evidence and local screenshots. Ask only when a missing choice would materially change product meaning or brand direction.
5. If the task changes files, use `build-open-source-repository` alongside this skill when available for branch, commit, changelog, and license discipline.

Read [interface-quality-standard.md](references/interface-quality-standard.md) before creating a new screen, design system, shared component, or major visual change. Read [self-verification.md](references/self-verification.md) before declaring frontend work complete. Use [screen-spec-template.md](references/screen-spec-template.md) when the requested screen lacks an adequate specification.

## Classify the task

- **New product surface:** establish information hierarchy, tokens, reusable primitives, screen states, and a vertical slice before expanding.
- **New screen in an existing product:** preserve the application shell and design language; introduce primitives only when existing ones cannot express the requirement.
- **Component change:** find every usage and story/test before changing its contract or visual behavior.
- **Visual bug:** reproduce at the exact viewport and state, fix the root cause, and add a regression check.
- **Frontend refactor:** preserve DOM semantics, interactions, public props, routing, analytics, permissions, and accessibility unless a deliberate contract change is approved.
- **Review only:** inspect and report evidence; do not mutate files unless the user asks for a fix.

## Define the implementation unit

Before writing code, state:

- actor and user outcome;
- route or component boundary;
- authoritative data and API contract;
- permissions and destructive actions;
- required loading, empty, partial, success, error, stale, offline, and restricted states;
- responsive viewports and input methods;
- affected shared components and routes;
- acceptance and visual checks.

Keep one reviewable UI objective per branch. Implement one vertical slice at a time rather than generating the whole application in one pass.

## Protect existing behavior

1. Use `rg` to find every consumer before changing a shared component, hook, schema, token, route, or public export.
2. Preserve unrelated user changes and existing product conventions.
3. Do not upgrade dependencies, replace the design system, rewrite the application shell, or change state management merely to complete a screen.
4. Do not invent backend fields or business rules. Derive types from the API contract. When the backend is unavailable, isolate typed fixtures behind the same interface and keep them out of production paths.
5. Keep authorization enforcement on the server. The UI may hide unavailable actions but must not be the security boundary.
6. Preserve URL behavior, browser history, deep links, focus restoration, analytics hooks, and saved user preferences when relevant.
7. Add a focused regression test before or with every behavior fix.

## Build from stable layers

Implement in this order:

1. semantic design tokens;
2. application shell and layout constraints;
3. accessible primitives;
4. domain components;
5. screen composition;
6. data and mutation integration;
7. all UI states;
8. responsive behavior;
9. interaction, accessibility, and visual tests.

Do not scatter raw colors, spacing, shadows, radii, or z-index values across screens. Add a token only when it represents a reusable semantic decision.

## Keep components honest

- Keep route/page components focused on composition and data boundaries.
- Keep domain decisions outside presentational components.
- Prefer explicit variants and typed props over boolean combinations with unclear outcomes.
- Use semantic HTML before ARIA. Add ARIA only when native semantics are insufficient.
- Provide visible labels, keyboard operation, focus states, error association, and meaningful accessible names.
- Do not use color as the only indicator of status, severity, confidence, selection, or error.
- Avoid premature abstraction. Extract a shared component after a stable repeated pattern appears, not merely because two fragments look similar.
- Never use `any`, `@ts-ignore`, disabled lint rules, or unsafe HTML to silence a design or contract problem without a documented justification.

## Implement every relevant state

For each asynchronous or permission-sensitive surface, implement and verify:

- initial loading or skeleton;
- empty state with a useful next action;
- normal success;
- partial or unknown data;
- recoverable error with retry;
- non-recoverable error with explanation;
- stale or conflicting version;
- permission denied or restricted fields;
- disabled and submitting actions;
- long content, localization expansion, and overflow;
- slow network, duplicate submission, and mutation failure when relevant.

Do not show `0`, `false`, or “safe” when the value is actually unknown. Preserve uncertainty from the domain model.

## Verify locally without third parties

The agent owns the verification loop. Do not require a hosted design or visual-QA service.

1. Start the application locally using the repository command contract.
2. Exercise the real screen or component with deterministic local fixtures or seeded data.
3. Capture local screenshots at the agreed desktop, laptop/tablet, and mobile widths.
4. Inspect hierarchy, alignment, wrapping, overflow, clipping, contrast, focus, hover, disabled, loading, error, and permission states.
5. Exercise keyboard navigation and critical pointer interactions.
6. Compare against supplied references or the established screen itself before the change.
7. Fix visible and behavioral defects, then repeat the same checks.
8. Add local Playwright screenshot assertions for stable critical surfaces. Keep baselines in the repository and review their diffs.
9. Run local accessibility checks and manually verify issues automation cannot judge.

In a monorepo, run the bundled audit from the workspace root so it can inspect every detected frontend and typed browser-client package. Run it against an individual package only for a focused follow-up.

If a browser cannot run, do not claim visual verification passed. Complete available static and component checks and report the missing browser evidence.

## Run quality gates

Run the repository's own commands first. Prefer a stable wrapper such as `just check` or the package-manager scripts already defined by the project.

At minimum, run the applicable subset of:

- format check;
- lint;
- TypeScript or framework typecheck;
- unit and component tests;
- accessibility tests;
- production build;
- critical Playwright interaction tests;
- local screenshot comparisons;
- the bundled structural audit:

```bash
python3 <skill-dir>/scripts/audit_frontend.py <repository-or-frontend-root>
```

Read the audit output. A structural audit does not replace browser, behavior, accessibility, or visual verification.

## Finish one unit cleanly

Before handoff:

1. Review the diff for accidental generated files, unrelated formatting, mock data, secrets, disabled checks, and dependency churn.
2. Confirm every acceptance criterion and relevant UI state.
3. Confirm affected shared-component consumers remain valid.
4. Record the exact viewports, scenarios, commands, and checks actually run.
5. Update tests, documentation, changelog, and file licensing in the same unit.
6. Commit the completed UI unit immediately using the repository's commit standard.
7. Report what changed, visual evidence produced, checks passed, checks not run, and any remaining product decision.

Never claim “pixel perfect,” accessible, responsive, or production-ready without corresponding local evidence.
