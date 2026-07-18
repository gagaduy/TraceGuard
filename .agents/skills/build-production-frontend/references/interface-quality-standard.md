<!--
SPDX-FileCopyrightText: 2026 TraceGuard contributors
SPDX-License-Identifier: Apache-2.0
-->

# Interface Quality Standard

## Contents

1. Product comprehension
2. Visual direction
3. Information architecture
4. Design tokens
5. Component architecture
6. Data and interaction states
7. Responsive behavior
8. Accessibility
9. Forms and destructive actions
10. Data visualization
11. Performance
12. Acceptance checklist

## 1. Product comprehension

Start with the actor, decision, and consequence. A production interface is not a collection of cards; it is a tool that helps a specific user understand state and complete an action safely.

Before choosing a layout, identify:

- the primary decision on the screen;
- the information required for that decision;
- the most costly user mistake;
- which facts are certain, estimated, stale, or unknown;
- which actions are reversible, destructive, privileged, or asynchronous;
- which information is sensitive or permission-scoped.

Keep domain language consistent with product documentation and API contracts. Do not rename concepts merely to make labels shorter.

## 2. Visual direction

Define a small visual brief before a new product surface:

- three to five adjectives describing the product;
- intended information density;
- typography character;
- shape and elevation language;
- motion restraint;
- explicit anti-patterns.

Prefer a clear, product-specific direction over generic “modern SaaS.” Avoid decorative gradients, glass effects, excessive rounded cards, arbitrary icon use, and animation that competes with operational information unless the product brief requires them.

Use hierarchy through typography, spacing, alignment, grouping, and progressive disclosure before adding borders and containers.

## 3. Information architecture

- Organize navigation around user responsibilities and durable product concepts.
- Keep global navigation stable across routes.
- Show location through titles, breadcrumbs, selected navigation, and meaningful URLs.
- Preserve deep links for shareable operational views.
- Keep the primary action obvious without making every action visually primary.
- Place dangerous or rare actions away from frequent safe actions.
- Do not hide critical state only inside hover content, transient toast messages, or color.

## 4. Design tokens

Centralize semantic tokens for:

- background, surface, elevated surface, and overlays;
- foreground, muted text, and disabled text;
- border, focus ring, and separators;
- primary, secondary, destructive, warning, success, and informational intent;
- domain statuses such as severity, confidence, approval, and workflow state;
- type scale, weight, line height, and measure;
- spacing, radius, shadow, motion, breakpoint, and z-index layers.

Token names describe purpose, not literal color. Prefer `--status-critical` over `--red-600`. Ensure light and dark themes preserve meaning and contrast when both are supported.

Do not add a new token for a one-off value until the need is proven. Do not bypass existing tokens with arbitrary utility values unless a documented exception is necessary.

## 5. Component architecture

Use three useful levels:

1. primitives: button, input, dialog, popover, table;
2. domain components: severity badge, approval progress, evidence item;
3. screen composition: route-level layout and data integration.

For a shared component:

- define its semantic purpose and public contract;
- keep controlled and uncontrolled behavior deliberate;
- make variants finite and named;
- support ref forwarding where consumers need it;
- preserve accessible names and focus behavior;
- provide stories or fixtures for every meaningful variant;
- test interaction logic, not implementation details.

Avoid components that accept many unrelated booleans, fetch hidden global data, mutate business state on render, or expose styling internals as their main API.

## 6. Data and interaction states

Every data surface should distinguish:

- not requested;
- loading;
- refreshing with existing data;
- empty;
- complete;
- partial;
- stale;
- failed;
- restricted.

Every mutation should distinguish:

- idle;
- validating;
- submitting;
- succeeded;
- failed;
- conflicting/stale;
- retrying where applicable.

Prevent duplicate submission. Keep user input after recoverable failures. Explain what happened and what the user can do next. Use toast messages for supplemental confirmation, not as the sole record of a consequential outcome.

## 7. Responsive behavior

Design responsive behavior, not merely smaller widths.

- Define the priority of information as width decreases.
- Allow tables to change into a deliberate compact representation when necessary.
- Keep primary actions reachable without covering content.
- Avoid horizontal page scrolling; permit controlled scrolling only for content that genuinely requires it.
- Test long labels, large values, empty values, and localization expansion.
- Verify fixed/sticky elements do not trap content or obscure focus.
- Test pointer, keyboard, and touch target behavior.

Unless the project specifies otherwise, verify at least one wide desktop, one constrained laptop/tablet, and one mobile viewport.

## 8. Accessibility

- Use semantic headings in a logical hierarchy.
- Associate labels, descriptions, hints, and errors with controls.
- Support complete keyboard operation and visible focus.
- Return focus after closing dialogs and preserve focus after mutations where sensible.
- Provide text alternatives for meaningful images and hide decorative images from assistive technology.
- Announce asynchronous errors and consequential status changes appropriately.
- Respect reduced-motion preferences.
- Avoid flashing content and motion-triggered discomfort.
- Maintain adequate contrast in every interactive and status state.
- Test zoom and text reflow, not just fixed viewport width.

Automated accessibility checks are a first gate, not proof of accessibility. Manually verify keyboard order, accessible names, focus management, dialog behavior, and comprehension.

## 9. Forms and destructive actions

- Validate on the server and provide useful client feedback.
- Do not erase entered values after a recoverable failure.
- Place field errors near fields and provide a form-level summary when needed.
- Disable submission only when it prevents a known invalid or duplicate operation; explain unavailable privileged actions.
- For destructive actions, state the target, impact, reversibility, and required authority.
- Require contextual confirmation for high-impact actions; do not rely on a generic “Are you sure?” dialog.
- Preserve audit reasons when the domain requires them.

## 10. Data visualization

- Choose a chart only when it clarifies a relationship better than text or a table.
- Label units, time range, source, numerator, denominator, and update time.
- Distinguish zero, missing, unknown, suppressed, and not applicable.
- Do not truncate an axis or use area/volume effects that distort comparison.
- Provide a table or accessible summary for important chart data.
- Keep status color meanings consistent with the rest of the product.

## 11. Performance

- Keep server and client component boundaries intentional.
- Avoid shipping large libraries for a small visual effect.
- Lazy-load genuinely secondary heavy surfaces.
- Reserve layout space to reduce cumulative layout shift.
- Optimize images with correct intrinsic dimensions and responsive sources.
- Avoid request waterfalls and duplicate client fetches.
- Virtualize only measured large collections; preserve accessibility and keyboard use.
- Measure before introducing memoization or state complexity.

## 12. Acceptance checklist

A production interface is acceptable when:

- it supports the intended actor and decision;
- terminology matches the domain;
- information hierarchy is obvious;
- all relevant data, mutation, permission, and failure states exist;
- responsive behavior is deliberate;
- keyboard and focus behavior work;
- destructive actions communicate impact;
- shared component consumers remain valid;
- data contracts are typed and mocks are isolated;
- local visual and behavior evidence exists;
- relevant tests and production build pass.
