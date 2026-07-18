<!--
SPDX-FileCopyrightText: 2026 TraceGuard contributors
SPDX-License-Identifier: Apache-2.0
-->

# Self-Verification Without External Services

## Contents

1. Verification rule
2. Static gate
3. Component gate
4. Browser gate
5. Visual gate
6. Accessibility gate
7. Regression gate
8. Evidence and handoff

## 1. Verification rule

The implementing agent also performs the first verification pass. Do not require Figma, Chromatic, Percy, BrowserStack, or another hosted review service. A human review may still follow, but it is not a substitute for the agent's own checks.

Use only repository tools and local execution unless the user explicitly requests an external service.

## 2. Static gate

Run the repository equivalents of:

```text
format check
lint
typecheck
production build
```

Treat warnings introduced by the change as defects. Do not suppress them to obtain a green command.

Run `audit_frontend.py` for structural signals. Investigate warnings instead of treating the script as an infallible judge.

## 3. Component gate

For each new or changed shared/domain component, exercise:

- normal content;
- empty or missing optional content;
- long content;
- disabled and busy actions;
- error and restricted variants;
- keyboard interaction;
- narrow container behavior.

Use the repository's existing component harness. If none exists and the component is sufficiently reusable or risky, add a local Storybook/story fixture or focused test rather than a hosted service.

## 4. Browser gate

Start the application locally and use deterministic fixtures, seeded data, or intercepted local API responses. Verify:

- route entry and direct reload;
- browser back/forward behavior;
- primary action and cancellation;
- validation and mutation failure;
- focus after navigation, dialog close, and error;
- permission-restricted behavior;
- slow loading and empty data;
- no console error or failed required request.

## 5. Visual gate

Capture screenshots locally at named viewports. Unless the project specifies its own matrix, use:

```text
1440 x 900   wide desktop
1024 x 768   constrained desktop/tablet
390 x 844    mobile
```

Inspect each screenshot for:

- visual hierarchy;
- grid and alignment;
- spacing rhythm;
- text wrapping and truncation;
- overflow and clipping;
- sticky/fixed overlap;
- status clarity without color;
- loading and error stability;
- touch target spacing;
- unexpected layout shift.

Use Playwright `toHaveScreenshot()` for stable critical pages. Generate baselines in the same local/container environment used by CI, keep them in the repository, and review changed pixels deliberately. Do not update baselines merely to make a failure disappear.

## 6. Accessibility gate

Run the local accessibility library already used by the repository. If none exists, prefer an in-repository axe-based check and manual verification.

Manually verify:

- keyboard-only completion of the critical path;
- visible focus and sensible tab order;
- dialog focus trap and return;
- input labels, descriptions, and errors;
- meaningful button/link names;
- headings and landmarks;
- zoom/reflow;
- reduced motion;
- status not conveyed only by color.

## 7. Regression gate

Run focused tests first, then the cheapest relevant wider suite. For a shared component change, test every affected route or representative consumer discovered during impact analysis.

Regression evidence may include:

- unit/component tests;
- interaction tests;
- API contract tests;
- Playwright critical journey;
- local screenshot comparison;
- before/after reproduction of a visual defect.

## 8. Evidence and handoff

Report facts, not confidence language:

- commands and exact results;
- routes and states exercised;
- screenshot viewport names and locations;
- accessibility checks run;
- browsers used;
- checks that could not run and why;
- remaining design or product decisions.

Do not claim visual verification from source inspection alone.
