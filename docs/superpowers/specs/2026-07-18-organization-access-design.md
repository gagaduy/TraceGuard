<!--
SPDX-FileCopyrightText: 2026 TraceGuard contributors
SPDX-License-Identifier: Apache-2.0
-->

# Organization Access Design

- **Status:** Accepted by the project owner on 2026-07-18
- **Capability:** Task 1 — organization onboarding, authentication, and application shell
- **Reference domain:** Multi-tenant food manufacturing
- **Depends on:** Existing web, API, PostgreSQL, Keycloak, OpenAPI, and repository foundations

## Purpose

Task 1 establishes the access boundary used by every later TraceGuard capability. An authenticated user can enter an organization they are currently authorized to access, bootstrap one organization when they have no membership, switch safely between authorized organizations, and use an accessible application shell. Missing, stale, or unauthorized organization context fails closed.

This capability does not implement the full membership lifecycle. Invitations, suspension, revocation, role assignment, and privileged-role MFA policy belong to Task 2.

## Accepted product decisions

- Keycloak owns authentication, credentials, account recovery, MFA capability, and identity sessions.
- TraceGuard owns organizations, memberships, roles, tenant authorization, audit, and all other business state in PostgreSQL.
- A valid Keycloak user with no TraceGuard membership may create exactly one initial organization and becomes its Admin.
- A user may later belong to multiple organizations through invitations, but MVP users cannot create additional organizations arbitrarily.
- Organization context appears in authenticated URLs as `/org/{organization-slug}/...`.
- Organization onboarding asks only for display name, an editable generated slug, and default time zone.
- The slug becomes immutable after organization creation in the MVP.
- Organization deletion and archival are outside Task 1.
- Public surfaces retain the current dark presentation. The authenticated application is light-first and uses an operational, information-focused visual direction. Dark mode is outside the MVP.
- The shell exposes only working destinations. Task 1 navigation contains Overview and Organization settings rather than placeholders for future capabilities.

## Architecture

```text
Browser
  -> Keycloak: authentication, logout, and session refresh
  -> Express API: token validation and tenant authorization
  -> PostgreSQL: identities, organizations, memberships, roles, and audit
  -> Next.js: session-aware presentation and typed API consumption
```

The browser uses the Keycloak JavaScript adapter with Authorization Code and PKCE. Access and refresh tokens remain in memory and are never stored in `localStorage` or `sessionStorage`. The browser calls only the public Express API for business data through the generated TraceGuard API client.

The Express API independently verifies access-token signature, issuer, audience, expiry, and subject. It resolves the authenticated identity and current membership from PostgreSQL for every organization-scoped request. A token, route slug, hidden UI control, or browser-cached organization is never sufficient proof of authorization.

Next.js remains a presentation boundary. It does not persist business transitions, reproduce authorization rules, connect to PostgreSQL, or become a proxy business backend.

## Identity and tenant model

TraceGuard identifies an external user by the pair of OIDC issuer and subject. Email and display name are synchronized only as display snapshots and are never stable authorization keys.

The minimum durable relationships are:

```text
external identity (issuer + subject)
  -> organization membership
       -> membership role
       -> organization
```

Task 1 creates the minimum role representation needed to grant Admin to the organization bootstrapper and render permission-aware settings. Task 2 consumes and expands this boundary for the complete four-role membership lifecycle.

Every tenant-owned query uses the resolved organization identifier. Slug is a human-readable route key, not the database authorization boundary. Organization uniqueness, identity uniqueness, membership uniqueness, role uniqueness, and bootstrap invariants are enforced in PostgreSQL and covered by database-backed tests.

## User journeys

### First organization bootstrap

```text
Public landing
  -> Sign in
  -> Keycloak authentication
  -> OIDC callback
  -> TraceGuard access-context lookup
  -> No active memberships
  -> Organization onboarding
  -> Atomic organization + Admin membership + audit creation
  -> Organization overview
```

Only an identity with no membership may use the bootstrap endpoint. The request is idempotent so retrying a timed-out response cannot create a second organization. Organization, Admin membership, role, and audit event are committed together or not at all.

### Returning user

After authentication, TraceGuard validates the last-used organization preference against current API results. If access remains valid, the user returns to that organization. Otherwise TraceGuard selects the only valid organization, asks the user to choose among multiple valid organizations, or enters onboarding when none exist.

The last-used slug may be stored as a browser preference because it is not a credential. It is always revalidated and never grants access.

### Organization switching

Switching proceeds only after handling unsaved changes:

1. Continue immediately when no form is dirty.
2. Ask for contextual confirmation when unsaved input would be lost.
3. Cancel active tenant-scoped requests.
4. Remove every tenant-scoped TanStack Query entry.
5. Navigate to the target organization's overview URL.
6. Fetch and authorize the new context from the API.
7. Store the newly validated slug as the last-used preference.

The UI must not display data from the previous tenant while the new context loads.

### Session expiry and return

Before an API request, the Keycloak adapter refreshes a token approaching expiry. If refresh fails, TraceGuard stops unsent mutations, avoids replaying consequential requests, stores only a safe return URL, and presents a session-expired state. Successful reauthentication returns the user to the same authorized route. Invalid or no-longer-authorized return URLs fall back to a valid organization overview.

## Route and screen map

| Route                      | Purpose                                                |
| -------------------------- | ------------------------------------------------------ |
| `/`                        | Public product landing and sign-in entry               |
| `/auth/callback`           | Complete and validate the Keycloak redirect            |
| `/onboarding/organization` | Bootstrap the first organization                       |
| `/org/{slug}/overview`     | Show the active organization and current access status |
| `/org/{slug}/settings`     | View or edit authorized organization settings          |
| `/forbidden`               | Explain a known authenticated authorization failure    |
| `/session-expired`         | Explain expiry and allow safe reauthentication         |

Unknown organizations and forbidden organizations must not reveal sensitive organization details. The response and UI may distinguish a malformed route from an inaccessible resource only when doing so does not create an enumeration leak.

## Application shell

The authenticated shell provides:

- stable desktop sidebar and mobile navigation drawer;
- visible active-organization context;
- organization switcher;
- Overview and Organization settings navigation;
- account and session menu;
- breadcrumb or equivalent route context;
- one consistent main-content landmark and heading hierarchy;
- loading, restricted, expired-session, dependency-error, and success regions.

The shell does not expose Product, Evidence, Incident, Recall, or other future routes until their capabilities are implemented.

### Overview

Overview presents only authoritative data available in Task 1:

- active organization display name;
- current membership and role;
- organization time zone;
- bootstrap/setup status;
- explanatory next-step guidance without dead links or fake calls to action.

It contains no invented metrics, sample charts, fake activity, or inaccessible future-feature controls.

### Organization onboarding

The onboarding form contains:

- organization display name;
- a slug generated from the name and editable before submission;
- an IANA default time-zone selector.

Client validation provides immediate useful feedback, while the server remains authoritative. Recoverable failure preserves input. Duplicate submission is prevented, and a delayed or retried response converges through idempotency.

### Organization settings

Admins may update display name and default time zone. Slug is visible but read-only after creation. Non-Admins receive a read-only view and cannot invoke the mutation. Updates include the current row version; stale writes produce a recoverable conflict state that offers refresh rather than overwriting newer data.

Organization deletion, archival, and lifecycle suspension are not exposed.

## Visual direction

The authenticated interface should feel like a calm operational control system: accountable, precise, restrained, and trustworthy. It uses moderate information density and avoids generic decorative SaaS styling.

- Neutral light background and white working surfaces.
- Teal for primary action, focus, and trust intent.
- Slate for secondary content and structural hierarchy.
- Amber for uncertainty and warning.
- Red only for errors and destructive intent.
- Text or icons accompany every status; color is never the sole signal.
- Typography prioritizes sustained reading. Monospace is reserved for slugs and technical identifiers.
- Spacing, typography, colors, borders, radii, shadows, motion, breakpoints, focus, and z-index use semantic tokens.
- Avoid glass effects, decorative gradients, excessive rounded cards, arbitrary icons, and motion that competes with operational information.

The public dark landing remains visually separate from the light authenticated shell.

## Component boundaries

Shared primitives enter `packages/ui` only when they have a stable reusable contract:

- button;
- text input and select;
- form field and error summary;
- alert/status message;
- dialog and dropdown menu;
- navigation item;
- skeleton/loading indicator;
- empty state;
- organization avatar or identifier.

Task 1 domain components remain close to the web feature until reuse is proven:

- `AuthenticatedShell`;
- `SessionBoundary`;
- `PermissionBoundary`;
- `OrganizationSwitcher`;
- `AccountMenu`;
- `AccessStatus`;
- `OrganizationOnboardingForm`;
- `OrganizationSettingsForm`.

Page components compose route data and screen boundaries. Presentational components do not fetch hidden global data or decide business permissions.

## Responsive and accessible behavior

- Wide desktop uses a stable sidebar and compact header.
- Constrained laptop or tablet reduces navigation width without hiding active organization context.
- Mobile uses a keyboard- and touch-accessible navigation drawer.
- Forms keep a readable measure instead of stretching across the viewport.
- Primary actions remain reachable without obscuring content.
- Pages do not introduce horizontal scrolling; controlled component overflow requires a deliberate accessible representation.
- Long organization names, slugs, translated labels, validation messages, and large text reflow without clipping.
- Navigation, switcher, dialogs, and forms support complete keyboard operation, visible focus, logical tab order, and focus return.
- Async errors and consequential status changes are announced appropriately.
- Motion respects reduced-motion preferences.

Required visual verification viewports are `1440x900`, `1024x768`, and `390x844`.

## API contract

The initial public contract contains:

```text
GET    /v1/me
POST   /v1/organizations
GET    /v1/organizations/{slug}
PATCH  /v1/organizations/{slug}
```

`GET /v1/me` returns the current identity display data and only the organizations the user may currently access. Its organization summaries contain the identifiers and permission information required by routing, the shell, and the switcher.

`POST /v1/organizations` requires authentication and an idempotency key. It accepts display name, requested slug, and IANA time zone. It rejects identities that already have membership and atomically creates the first organization context.

`GET /v1/organizations/{slug}` resolves an authorized organization context. It does not reveal inaccessible organization details.

`PATCH /v1/organizations/{slug}` accepts mutable fields and the current row version. It requires current Admin authority and returns the successor version.

All errors use RFC 9457 Problem Details. Stable problem types include:

- `authentication_required`;
- `invalid_token`;
- `organization_context_required`;
- `organization_access_denied`;
- `organization_not_found`;
- `organization_slug_conflict`;
- `organization_bootstrap_forbidden`;
- `version_conflict`.

The OpenAPI contract is authoritative for the generated browser client. Frontend fixtures, when needed, implement the same generated interfaces and remain outside production paths.

## Error and resilience behavior

Every affected surface distinguishes the applicable states:

- session not checked;
- session restoration in progress;
- authentication required;
- access context loading or refreshing;
- no organization membership;
- normal success;
- partial or restricted fields;
- recoverable dependency error;
- non-recoverable authentication or authorization error;
- stale organization version;
- disabled, validating, submitting, and mutation-failed actions.

Recoverable form failures retain user input. Consequential success is visible in stable page state rather than only in a transient toast. Duplicate submission and unsafe automatic replay are prevented.

Logs, telemetry, audit, browser storage, and rendered errors must not contain access tokens, refresh tokens, authorization headers, Keycloak secrets, stack traces, SQL errors, or internal infrastructure paths.

## Audit behavior

At minimum, Task 1 records:

- initial organization bootstrap;
- initial Admin membership and role grant;
- organization settings changes with relevant before/after values;
- denied organization-context access with safe actor and correlation information.

Organization switching may be captured as operational telemetry rather than a consequential business audit event unless it changes durable server state. Authentication events remain authoritative in Keycloak; TraceGuard does not duplicate credential or raw token data.

## Testing strategy

### Backend and database

- Accept valid issuer, audience, signature, expiry, and subject combinations.
- Reject missing, malformed, expired, incorrectly issued, incorrectly addressed, or invalidly signed tokens.
- Reconcile identity by issuer and subject rather than email.
- Create organization, membership, Admin role, idempotency result, and audit atomically.
- Make duplicate bootstrap requests converge on one result.
- Reject bootstrap after any membership exists.
- Reject absent context and cross-tenant organization access.
- Reject settings changes without current Admin authority.
- Return version conflict for concurrent updates.
- Prevent organization, membership, and role uniqueness races.
- Return safe Problem Details without internal leakage.

### Frontend components

- Render the shell and responsive navigation with correct landmarks.
- Validate onboarding and preserve input after recoverable failure.
- Exercise organization switching with and without dirty forms.
- Render read-only and editable settings from current permission data.
- Cover loading, empty, restricted, forbidden, expired-session, dependency-error, and conflict variants.
- Verify keyboard behavior, accessible names, error associations, announcements, dialog focus, and focus return.

### Browser journeys

- A new identity signs in, bootstraps an organization, and enters its overview.
- A returning identity enters the last still-authorized organization.
- A multi-organization identity switches tenants without stale UI or cached data leakage.
- An identity cannot enter an organization outside its membership.
- An expired session reauthenticates and returns only to a still-authorized route.
- A non-Admin cannot edit organization settings.
- Dirty settings require confirmation before organization switching or navigation that loses input.
- Direct reload, back, and forward navigation preserve safe route behavior.

Local browser verification covers desktop, constrained desktop/tablet, and mobile viewports. Source inspection alone is not visual verification.

## Branch and review boundaries

- Shared design, OpenAPI integration, and final evidence belong on `develop`.
- API, PostgreSQL, authentication enforcement, audit, and backend tests belong on `backend`.
- Next.js, shared UI, generated client consumption, component tests, and browser tests belong on `frontend`.
- Verified histories merge into `develop` only after explicit owner approval.
- `main` is not changed without a separate release approval.
- During owner review of Task 1, all spec, plan, and implementation changes remain uncommitted, unpushed, and unmerged.

## Non-goals

- Full invitation and membership lifecycle.
- Role assignment and revocation UI.
- Privileged-action MFA policy beyond accepting relevant future identity claims.
- Organization deletion, archival, suspension, billing, or subscription management.
- Product, supply, evidence, signal, incident, recall, recovery, or CAPA features.
- Dark mode for the authenticated application.
- A Next.js business BFF or direct browser access to PostgreSQL.

## Acceptance criteria

- An authenticated identity with no membership can create one organization and becomes its Admin.
- An authenticated identity can enter only organizations for which current PostgreSQL membership permits access.
- Missing and unauthorized tenant context fails closed at the API boundary.
- Switching organization clears tenant-scoped browser state before loading the new context.
- Admins can update display name and time zone without stale overwrites; non-Admins cannot mutate them.
- The authenticated shell is responsive, keyboard-operable, permission-aware, and complete for relevant loading, empty, error, conflict, restricted, and session states.
- Keycloak tokens are never persisted in browser storage or leaked through logs and errors.
- OpenAPI, generated client, database behavior, API behavior, and UI behavior agree.
- Two-tenant backend and browser tests prove isolation.
- Focused checks, production build, browser journeys, accessibility checks, repository audit, and applicable CI gates pass before capability completion.
