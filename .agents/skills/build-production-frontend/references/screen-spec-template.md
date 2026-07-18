<!--
SPDX-FileCopyrightText: 2026 TraceGuard contributors
SPDX-License-Identifier: Apache-2.0
-->

# Screen Specification Template

Use this template when the repository lacks an adequate screen contract. Fill only relevant sections, but never omit permissions, failure states, or acceptance criteria for a consequential screen.

```markdown
# <Screen name>

## Purpose

- Actor:
- User outcome:
- Primary decision:
- Costliest user mistake:

## Boundary

- Route:
- Parent layout:
- Entry points:
- Exit/deep links:

## Data contract

- Queries:
- Mutations:
- Source of truth:
- Freshness/stale behavior:
- Sensitive or restricted fields:

## Information hierarchy

1. Primary:
2. Secondary:
3. Supporting:

## Actions

| Action | Permission | Reversible | Confirmation | Success result |
| ------ | ---------- | ---------- | ------------ | -------------- |
|        |            |            |              |                |

## Required states

- Loading:
- Refreshing:
- Empty:
- Success:
- Partial/unknown:
- Recoverable error:
- Fatal error:
- Stale/conflict:
- Restricted/permission denied:
- Submitting/duplicate prevention:

## Components

- Existing components to reuse:
- New domain components:
- Shared components affected:

## Responsive behavior

- Wide desktop:
- Constrained laptop/tablet:
- Mobile:
- Long content/localization:

## Accessibility

- Heading and landmark structure:
- Keyboard order:
- Focus entry/return:
- Accessible names and announcements:
- Non-color status indicators:

## Verification

- Deterministic fixture/seed:
- Interaction scenarios:
- Screenshot viewports:
- Accessibility checks:
- Regression tests:

## Acceptance criteria

- [ ]
```
