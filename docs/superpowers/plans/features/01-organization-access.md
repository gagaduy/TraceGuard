<!--
SPDX-FileCopyrightText: 2026 TraceGuard contributors
SPDX-License-Identifier: Apache-2.0
-->

# Organization Access Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver secure Keycloak authentication, one-time organization bootstrap, explicit tenant context, safe organization switching, organization settings, and a responsive authenticated application shell.

**Architecture:** The browser uses Keycloak Authorization Code with PKCE and keeps tokens in memory. Express validates every access token and resolves current PostgreSQL membership before serving organization-scoped requests; Next.js consumes only the generated API contract and clears tenant-scoped cache before switching organizations.

**Tech Stack:** Next.js 16, React 19, TypeScript 5.9, Keycloak 26, `keycloak-js`, Express 5, `jose`, OpenAPI 3.1, PostgreSQL 18, Drizzle ORM, TanStack Query, React Hook Form, Zod, Vitest, Supertest, Testing Library, Playwright, Docker Compose, pnpm, Turborepo, and `just`.

---

## Execution controls

- The accepted design is [Organization Access Design](../../specs/2026-07-18-organization-access-design.md).
- The owner must review all Task 1 changes before any commit, push, or merge. During the initial execution pass, stop at every planned commit step and leave the reviewed unit uncommitted.
- After explicit approval, use the listed atomic commits and push only `backend`, `frontend`, and `develop` as applicable. Never change `main` without separate release approval.
- Create forward-only migrations. Do not edit `0000_glossy_ogun.sql` or its committed snapshot.
- Add SPDX headers to every new project-owned file that supports comments and update `CHANGELOG.md` in each approved commit.
- Use the existing backend worktree for `backend`. Create or verify a separate `frontend` worktree from the current `develop` baseline before frontend execution.

## Planned file boundaries

### Develop contract and integration

- Modify: `openapi/traceguard.openapi.yaml`
- Regenerate: `packages/api-client/src/generated/schema.d.ts`
- Modify: `docs/superpowers/plans/2026-07-18-feature-first-master-plan.md`
- Modify: `CHANGELOG.md`

### Backend

- Modify: `apps/api/package.json`
- Modify: `apps/api/src/config/env.ts`
- Modify: `apps/api/src/app.ts`
- Modify: `apps/api/src/server.ts`
- Create: `apps/api/src/platform/auth/oidc-authenticator.ts`
- Create: `apps/api/src/platform/auth/authentication-middleware.ts`
- Create: `apps/api/src/types/express.d.ts`
- Create: `apps/api/src/modules/access/domain/access-types.ts`
- Create: `apps/api/src/modules/access/application/access-service.ts`
- Create: `apps/api/src/modules/access/infrastructure/access-repository.ts`
- Create: `apps/api/src/modules/access/http/access-router.ts`
- Create: `apps/api/tests/oidc-authenticator.test.ts`
- Create: `apps/api/tests/access-router.test.ts`
- Create: `apps/api/tests/access.integration.test.ts`
- Modify: `packages/database/src/schema/organizations.ts`
- Create: `packages/database/src/schema/identities.ts`
- Create: `packages/database/src/schema/memberships.ts`
- Create: `packages/database/src/schema/audit-events.ts`
- Create: `packages/database/src/schema/idempotency-records.ts`
- Modify: `packages/database/src/schema/index.ts`
- Create: `packages/database/migrations/0001_organization_access.sql`
- Create: `packages/database/tests/organization-access.integration.test.ts`
- Create: `infrastructure/keycloak/traceguard-realm.json`
- Modify: `compose.yaml`
- Modify: `.env.example`

### Frontend

- Modify: `apps/web/package.json`
- Modify: `apps/web/app/globals.css`
- Modify: `apps/web/app/layout.tsx`
- Modify: `apps/web/app/providers.tsx`
- Modify: `apps/web/app/page.tsx`
- Create: `apps/web/lib/config/public-env.ts`
- Create: `apps/web/lib/auth/keycloak.ts`
- Create: `apps/web/lib/auth/auth-provider.tsx`
- Create: `apps/web/lib/api/traceguard-client.ts`
- Create: `apps/web/lib/access/access-queries.ts`
- Create: `apps/web/lib/access/organization-preference.ts`
- Create: `apps/web/app/auth/callback/page.tsx`
- Create: `apps/web/app/onboarding/organization/page.tsx`
- Create: `apps/web/app/org/[slug]/layout.tsx`
- Create: `apps/web/app/org/[slug]/overview/page.tsx`
- Create: `apps/web/app/org/[slug]/settings/page.tsx`
- Create: `apps/web/app/forbidden/page.tsx`
- Create: `apps/web/app/session-expired/page.tsx`
- Create: `apps/web/components/access/authenticated-shell.tsx`
- Create: `apps/web/components/access/session-boundary.tsx`
- Create: `apps/web/components/access/organization-switcher.tsx`
- Create: `apps/web/components/access/account-menu.tsx`
- Create: `apps/web/components/access/organization-onboarding-form.tsx`
- Create: `apps/web/components/access/organization-settings-form.tsx`
- Create: `apps/web/components/access/unsaved-changes-guard.tsx`
- Create: `apps/web/components/access/access-status.tsx`
- Create: `apps/web/components/access/access.test.tsx`
- Create: `apps/web/tests/e2e/organization-access.spec.ts`
- Create: `packages/ui/src/components/alert.tsx`
- Create: `packages/ui/src/components/dialog.tsx`
- Create: `packages/ui/src/components/field.tsx`
- Create: `packages/ui/src/components/input.tsx`
- Create: `packages/ui/src/components/select.tsx`
- Create: `packages/ui/src/components/skeleton.tsx`
- Modify: `packages/ui/src/index.ts`
- Create: `packages/ui/tests/access-primitives.test.tsx`

---

### Task 1: Define the organization-access OpenAPI contract

**Branch:** `develop`

**Files:**

- Modify: `openapi/traceguard.openapi.yaml`
- Regenerate: `packages/api-client/src/generated/schema.d.ts`
- Test: `packages/api-client/tests/client.test.ts`
- Modify: `CHANGELOG.md`

- [x] **Step 1: Add failing API-client type assertions**

Add compile-time fixtures to `packages/api-client/tests/client.test.ts` that create typed request objects for these operations:

```ts
type MeResponse = components["schemas"]["CurrentIdentity"];
type BootstrapRequest = components["schemas"]["BootstrapOrganizationRequest"];
type UpdateRequest = components["schemas"]["UpdateOrganizationRequest"];

const bootstrap: BootstrapRequest = {
  name: "Acme Foods",
  slug: "acme-foods",
  timeZone: "Asia/Ho_Chi_Minh",
};
const update: UpdateRequest = {
  name: "Acme Foods Vietnam",
  rowVersion: 1,
  timeZone: "Asia/Ho_Chi_Minh",
};
expectTypeOf<MeResponse>().toHaveProperty("organizations");
expect(bootstrap.slug).toBe("acme-foods");
expect(update.rowVersion).toBe(1);
```

- [x] **Step 2: Verify the generated contract does not yet contain the types**

Run: `pnpm --filter @traceguard/api-client typecheck`

Observed: FAIL with TypeScript errors because `CurrentIdentity`, `BootstrapOrganizationRequest`, and `UpdateOrganizationRequest` were absent. The Vitest runtime suite remained green because type-only assertions require the TypeScript gate.

- [x] **Step 3: Add the complete OpenAPI paths and schemas**

Define these operation IDs and security requirements in `openapi/traceguard.openapi.yaml`:

```yaml
security:
  - bearerAuth: []
paths:
  /v1/me:
    get:
      operationId: getCurrentIdentity
  /v1/organizations:
    post:
      operationId: bootstrapOrganization
      parameters:
        - $ref: "#/components/parameters/IdempotencyKey"
  /v1/organizations/{slug}:
    get:
      operationId: getOrganization
    patch:
      operationId: updateOrganization
components:
  securitySchemes:
    bearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT
```

Define closed schemas for `CurrentIdentity`, `OrganizationSummary`, `OrganizationDetail`, `MembershipRole`, `BootstrapOrganizationRequest`, `UpdateOrganizationRequest`, and each success response. Use the four role strings `admin`, `quality_analyst`, `recall_coordinator`, and `approver`; use IANA time-zone strings; make `rowVersion` an integer of at least one. Keep `/health/live` and `/health/ready` explicitly unauthenticated with `security: []`.

Document `401`, safe `404`, `409`, and `422` Problem Details responses. The bootstrap response is `201`; an idempotent replay returns the same representation and status semantics without creating a second organization.

- [x] **Step 4: Regenerate and verify the typed client**

Run: `pnpm --filter @traceguard/api-client generate`

Run: `pnpm --filter @traceguard/api-client generate:check`

Run: `pnpm --filter @traceguard/api-client test`

Run: `pnpm --filter @traceguard/api-client typecheck`

Expected: generated drift check and client tests PASS.

- [x] **Step 5: Validate the public contract**

Run: `pnpm run openapi:lint`

Run: `git diff --check`

Expected: OpenAPI lint and whitespace checks PASS.

- [ ] **Step 6: Stop for owner review before the planned commit**

Planned commit after approval:

```bash
git add openapi/traceguard.openapi.yaml packages/api-client/src/generated/schema.d.ts packages/api-client/tests/client.test.ts CHANGELOG.md
git commit -m "feat(api): define organization access contract"
```

### Task 2: Add forward-only organization-access schema

**Branch:** `backend`, synchronized from the approved contract on `develop`

**Files:**

- Modify: `packages/database/src/schema/organizations.ts`
- Create: `packages/database/src/schema/identities.ts`
- Create: `packages/database/src/schema/memberships.ts`
- Create: `packages/database/src/schema/audit-events.ts`
- Create: `packages/database/src/schema/idempotency-records.ts`
- Modify: `packages/database/src/schema/index.ts`
- Create: `packages/database/migrations/0001_organization_access.sql`
- Create: `packages/database/tests/organization-access.integration.test.ts`
- Modify: `packages/database/package.json`
- Modify: `CHANGELOG.md`

- [ ] **Step 1: Add a real integration-test command**

Add to `packages/database/package.json`:

```json
"test:integration": "vitest run tests/organization-access.integration.test.ts"
```

- [ ] **Step 2: Write failing database integration tests**

The test must use `TEST_DATABASE_URL`, apply committed migrations to a temporary schema or disposable database, and prove:

```ts
expect(identity.issuer).toBe("http://keycloak.test/realms/traceguard");
expect(identity.subject).toBe("keycloak-subject-1");
expect(adminRole.role).toBe("admin");
expect(organization.rowVersion).toBe(1);
await expect(insertDuplicateIssuerSubject()).rejects.toThrow();
await expect(insertDuplicateMembership()).rejects.toThrow();
await expect(insertDuplicateMembershipRole()).rejects.toThrow();
```

Also verify a transaction rollback leaves no organization, membership, role, audit, or idempotency record after an injected failure.

- [ ] **Step 3: Run the focused integration test to verify failure**

Run: `pnpm --filter @traceguard/database test:integration`

Expected: FAIL because the new schema exports and migration are absent.

- [ ] **Step 4: Define focused Drizzle schemas**

Use these durable contracts:

```ts
export const membershipRoleValues = [
  "admin",
  "quality_analyst",
  "recall_coordinator",
  "approver",
] as const;

export const identities = pgTable(
  "identities",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`uuidv7()`),
    issuer: text("issuer").notNull(),
    subject: text("subject").notNull(),
    email: text("email"),
    displayName: text("display_name"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    unique("identities_issuer_subject_unique").on(table.issuer, table.subject),
  ],
);
```

Add `timeZone`, `updatedAt`, and `rowVersion` to `organizations`. Add active `organizationMemberships`, composite-unique `membershipRoles`, JSONB `auditEvents`, and identity/operation/key-unique `idempotencyRecords`. Add checks for normalized slug, nonblank names, positive row version, and nonblank correlation and idempotency keys.

- [ ] **Step 5: Generate but do not edit the migration by hand after review**

Run: `pnpm --filter @traceguard/database db:generate`

Inspect the generated SQL and metadata. Confirm it alters `organizations` forward, creates the four new tables, constraints, indexes, and foreign keys, and does not edit migration `0000`.

- [ ] **Step 6: Run database gates**

Run: `pnpm --filter @traceguard/database test:integration`

Run: `pnpm --filter @traceguard/database test`

Run: `pnpm --filter @traceguard/database typecheck`

Expected: all database tests and type checks PASS.

- [ ] **Step 7: Stop for owner review before the planned commit**

Planned commit after approval:

```bash
git add packages/database CHANGELOG.md
git commit -m "feat(database): add organization access schema"
```

### Task 3: Validate Keycloak tokens at the API boundary

**Branch:** `backend`

**Files:**

- Modify: `apps/api/package.json`
- Modify: `apps/api/src/config/env.ts`
- Create: `apps/api/src/platform/auth/oidc-authenticator.ts`
- Create: `apps/api/src/platform/auth/authentication-middleware.ts`
- Create: `apps/api/src/types/express.d.ts`
- Create: `apps/api/tests/oidc-authenticator.test.ts`
- Modify: `CHANGELOG.md`

- [ ] **Step 1: Add `jose` through the workspace package manager**

Run: `pnpm --filter @traceguard/api add jose`

Expected: `apps/api/package.json` and `pnpm-lock.yaml` contain one pinned compatible `jose` version.

- [ ] **Step 2: Write failing issuer, audience, signature, expiry, and subject tests**

Create test keys with `jose` and cover this public interface:

```ts
export interface AuthenticatedIdentity {
  email?: string;
  displayName?: string;
  issuer: string;
  subject: string;
}

export interface OidcAuthenticator {
  authenticate(
    authorizationHeader: string | undefined,
  ): Promise<AuthenticatedIdentity>;
}
```

Assert valid RS256 tokens succeed, while missing bearer scheme, wrong issuer, wrong audience, expired token, altered signature, and missing subject each throw a typed authentication error.

- [ ] **Step 3: Verify authentication tests fail**

Run: `pnpm --filter @traceguard/api test -- oidc-authenticator.test.ts`

Expected: FAIL because the authenticator does not exist.

- [ ] **Step 4: Implement remote-JWKS verification and middleware**

Use `createRemoteJWKSet` and `jwtVerify` with fixed configuration:

```ts
const jwks = createRemoteJWKSet(new URL(options.jwksUrl));
const { payload } = await jwtVerify(token, jwks, {
  algorithms: ["RS256"],
  audience: options.audience,
  issuer: options.issuer,
});
```

Normalize all authentication failures to safe `401` Problem Details. Attach only `{ issuer, subject, email, displayName }` to `request.auth`; never attach the raw token or payload.

- [ ] **Step 5: Add and validate environment variables**

Extend `loadEnvironment` with `OIDC_ISSUER`, `OIDC_AUDIENCE`, and `OIDC_JWKS_URL`. Require HTTPS outside development/test. Test safe startup failure for missing or malformed values.

- [ ] **Step 6: Run focused and package checks**

Run: `pnpm --filter @traceguard/api test -- oidc-authenticator.test.ts`

Run: `pnpm --filter @traceguard/api typecheck`

Run: `pnpm --filter @traceguard/api lint`

Expected: all checks PASS with no token material in snapshots or logs.

- [ ] **Step 7: Stop for owner review before the planned commit**

Planned commit after approval:

```bash
git add apps/api/package.json apps/api/src/config/env.ts apps/api/src/platform/auth apps/api/src/types apps/api/tests/oidc-authenticator.test.ts pnpm-lock.yaml CHANGELOG.md
git commit -m "feat(auth): validate Keycloak access tokens"
```

### Task 4: Implement the organization-access repository and use cases

**Branch:** `backend`

**Files:**

- Create: `apps/api/src/modules/access/domain/access-types.ts`
- Create: `apps/api/src/modules/access/infrastructure/access-repository.ts`
- Create: `apps/api/src/modules/access/application/access-service.ts`
- Create: `apps/api/tests/access.integration.test.ts`
- Modify: `apps/api/package.json`
- Modify: `CHANGELOG.md`

- [ ] **Step 1: Register API integration tests**

Add:

```json
"test:integration": "vitest run tests/access.integration.test.ts"
```

- [ ] **Step 2: Write failing two-tenant and transaction tests**

Seed two identities and two organizations, then prove:

```ts
await expect(service.getOrganization(identityA, "org-b")).rejects.toMatchObject(
  {
    code: "organization_not_found",
  },
);
await expect(
  service.updateOrganization(analystA, "org-a", update),
).rejects.toMatchObject({
  code: "organization_access_denied",
});
```

Also test bootstrap idempotency, same-key/different-payload rejection, bootstrap after membership rejection, Admin update, non-Admin rejection, row-version conflict, and audit before/after values.

- [ ] **Step 3: Verify integration tests fail**

Run: `pnpm --filter @traceguard/api test:integration`

Expected: FAIL because repository and service are absent.

- [ ] **Step 4: Define application inputs and outputs**

Use explicit types rather than Drizzle rows outside infrastructure:

```ts
export interface BootstrapOrganizationInput {
  idempotencyKey: string;
  name: string;
  slug: string;
  timeZone: string;
}

export interface UpdateOrganizationInput {
  name: string;
  rowVersion: number;
  timeZone: string;
}
```

Define `CurrentIdentity`, `OrganizationSummary`, and `OrganizationDetail` to match OpenAPI names and field semantics exactly.

- [ ] **Step 5: Implement transactional repository methods**

Expose one repository contract with methods for identity reconciliation, current-access listing, authorized lookup, bootstrap, and versioned update. Bootstrap must hash the canonical request body, lock or serialize the identity bootstrap boundary, and write organization, membership, Admin role, audit, and idempotency response in one transaction.

Authorized organization lookup must join membership and roles in one tenant-scoped query. Return safe not-found behavior for both nonexistent and inaccessible slugs.

- [ ] **Step 6: Implement use-case validation and authority checks**

Normalize slugs to lowercase ASCII hyphen form, validate IANA time zones with `Intl.DateTimeFormat`, reject blank display names, and require current `admin` role for update. The service supplies actor identity and request correlation ID to every consequential repository call.

- [ ] **Step 7: Run integration and static gates**

Run: `pnpm --filter @traceguard/api test:integration`

Run: `pnpm --filter @traceguard/api test`

Run: `pnpm --filter @traceguard/api typecheck`

Expected: transaction, tenant, authority, idempotency, and static checks PASS.

- [ ] **Step 8: Stop for owner review before the planned commit**

Planned commit after approval:

```bash
git add apps/api/src/modules/access apps/api/tests/access.integration.test.ts apps/api/package.json CHANGELOG.md
git commit -m "feat(access): add organization access use cases"
```

### Task 5: Expose authenticated access routes

**Branch:** `backend`

**Files:**

- Create: `apps/api/src/modules/access/http/access-router.ts`
- Modify: `apps/api/src/app.ts`
- Modify: `apps/api/src/server.ts`
- Create: `apps/api/tests/access-router.test.ts`
- Modify: `CHANGELOG.md`

- [ ] **Step 1: Write failing Supertest contract tests**

Inject fake authenticator and service dependencies, then cover:

```ts
await request(app).get("/v1/me").expect(401);
await request(app)
  .get("/v1/me")
  .set("authorization", "Bearer valid")
  .expect(200);
await request(app)
  .post("/v1/organizations")
  .set("authorization", "Bearer valid")
  .set("idempotency-key", "bootstrap-1")
  .send({
    name: "Acme Foods",
    slug: "acme-foods",
    timeZone: "Asia/Ho_Chi_Minh",
  })
  .expect(201);
```

Add exact response-body assertions for GET organization, PATCH organization, validation error, access denial, slug conflict, bootstrap forbidden, and version conflict.

- [ ] **Step 2: Verify route tests fail**

Run: `pnpm --filter @traceguard/api test -- access-router.test.ts`

Expected: FAIL because routes are not registered.

- [ ] **Step 3: Implement thin validated HTTP handlers**

Create Zod request schemas and map typed application errors to the stable Problem Details types from the OpenAPI contract. Route handlers pass `request.auth`, the `idempotency-key`, route slug, validated body, and `getRequestId(request)` to the service. They contain no SQL or authorization decisions.

- [ ] **Step 4: Wire production dependencies**

Extend `AppOptions` with `authenticator` and `accessService`, mount authentication only under `/v1`, and keep health routes public. In `server.ts`, create the OIDC authenticator and access repository from validated environment and the existing database connection.

- [ ] **Step 5: Run API gates**

Run: `pnpm --filter @traceguard/api test`

Run: `pnpm --filter @traceguard/api typecheck`

Run: `pnpm --filter @traceguard/api lint`

Run: `pnpm run openapi:lint`

Expected: route behavior matches OpenAPI and health tests remain green.

- [ ] **Step 6: Stop for owner review before the planned commit**

Planned commit after approval:

```bash
git add apps/api/src/app.ts apps/api/src/server.ts apps/api/src/modules/access/http apps/api/tests/access-router.test.ts CHANGELOG.md
git commit -m "feat(api): expose organization access routes"
```

### Task 6: Provide reproducible local Keycloak configuration

**Branch:** `backend`

**Files:**

- Create: `infrastructure/keycloak/traceguard-realm.json`
- Modify: `compose.yaml`
- Modify: `.env.example`
- Modify: `docs/operations/local-development.md`
- Modify: `CHANGELOG.md`

- [ ] **Step 1: Add local identity configuration values**

Add non-secret local settings:

```dotenv
KEYCLOAK_REALM=traceguard
KEYCLOAK_WEB_CLIENT_ID=traceguard-web
OIDC_ISSUER=http://localhost:8081/realms/traceguard
OIDC_AUDIENCE=traceguard-api
OIDC_JWKS_URL=http://keycloak:8080/realms/traceguard/protocol/openid-connect/certs
NEXT_PUBLIC_KEYCLOAK_URL=http://localhost:8081
NEXT_PUBLIC_KEYCLOAK_REALM=traceguard
NEXT_PUBLIC_KEYCLOAK_CLIENT_ID=traceguard-web
```

- [ ] **Step 2: Create an importable development realm**

Configure a public `traceguard-web` client with standard flow and PKCE S256, exact redirect URIs for `http://localhost:3000/auth/callback`, exact web origin, an API audience mapper for `traceguard-api`, and short development access-token lifetime. Include only documented local test identities with clearly non-production credentials; never include production secrets.

- [ ] **Step 3: Mount and import the realm**

Change the Keycloak command to include `--import-realm` and mount `./infrastructure/keycloak/traceguard-realm.json:/opt/keycloak/data/import/traceguard-realm.json:ro`. Pass OIDC variables to the API and browser-visible Keycloak variables to the web service.

- [ ] **Step 4: Validate local configuration**

Run: `docker compose --profile core --profile app config --quiet`

Run: `just infra-up`

Verify: `curl --fail http://127.0.0.1:8081/realms/traceguard/.well-known/openid-configuration`

Expected: Compose resolves, Keycloak is healthy, and discovery metadata reports the expected issuer.

- [ ] **Step 5: Stop for owner review before the planned commit**

Planned commit after approval:

```bash
git add infrastructure/keycloak/traceguard-realm.json compose.yaml .env.example docs/operations/local-development.md CHANGELOG.md
git commit -m "build(auth): add local Keycloak realm"
```

### Task 7: Integrate and verify backend on develop

**Branch:** `develop`

**Files:**

- Merge: approved `backend` history with a merge commit
- Modify: `docs/superpowers/plans/2026-07-18-feature-first-master-plan.md`

- [ ] **Step 1: Review backend history and branch scope**

Run: `git log --oneline develop..backend`

Run: `git diff --stat develop...backend`

Expected: only API, database, Keycloak/backend infrastructure, tests, docs, lockfile, and changelog changes belonging to Task 1.

- [ ] **Step 2: Stop for explicit merge approval**

Do not merge during the initial uncommitted review. After approval, merge with history preserved:

```bash
git merge --no-ff backend -m "merge: integrate organization access backend"
```

- [ ] **Step 3: Run backend integration gates on develop**

Run: `pnpm --filter @traceguard/database test:integration`

Run: `pnpm --filter @traceguard/api test:integration`

Run: `pnpm --filter @traceguard/api test`

Run: `pnpm run openapi:lint`

Expected: all backend and contract checks PASS before frontend synchronization.

### Task 8: Add authenticated design tokens and accessible primitives

**Branch:** `frontend`, synchronized from backend-integrated `develop`

**Files:**

- Modify: `apps/web/app/globals.css`
- Create: `packages/ui/src/components/alert.tsx`
- Create: `packages/ui/src/components/dialog.tsx`
- Create: `packages/ui/src/components/field.tsx`
- Create: `packages/ui/src/components/input.tsx`
- Create: `packages/ui/src/components/select.tsx`
- Create: `packages/ui/src/components/skeleton.tsx`
- Modify: `packages/ui/src/index.ts`
- Create: `packages/ui/tests/access-primitives.test.tsx`
- Modify: `CHANGELOG.md`

- [ ] **Step 1: Write failing accessibility and interaction tests**

Cover visible labels, `aria-describedby` error association, alert role, dialog focus return, select labeling, skeleton status text, disabled button behavior, and keyboard activation. Example:

```tsx
render(
  <Field label="Organization name" error="Name is required">
    <Input name="name" />
  </Field>,
);
expect(screen.getByLabelText("Organization name")).toHaveAccessibleDescription(
  "Name is required",
);
expect(screen.getByText("Name is required")).toHaveAttribute("role", "alert");
```

- [ ] **Step 2: Verify component tests fail**

Run: `pnpm --filter @traceguard/ui test -- access-primitives.test.tsx`

Expected: FAIL because the primitives are absent.

- [ ] **Step 3: Implement semantic light-application tokens**

Keep the public landing variables intact and add an `.app-theme` token scope for background, surface, foreground, muted, border, focus, primary, warning, destructive, success, radius, shadow, and navigation layers. Components consume semantic variables rather than raw one-off colors.

- [ ] **Step 4: Implement the minimum primitives**

Use native semantics first, finite variants, `forwardRef` where consumers need it, visible focus, and no business state. Export every new primitive from `packages/ui/src/index.ts`.

- [ ] **Step 5: Run UI package gates**

Run: `pnpm --filter @traceguard/ui test`

Run: `pnpm --filter @traceguard/ui typecheck`

Run: `pnpm --filter @traceguard/ui lint`

Expected: interaction and accessibility tests PASS.

- [ ] **Step 6: Stop for owner review before the planned commit**

Planned commit after approval:

```bash
git add apps/web/app/globals.css packages/ui CHANGELOG.md
git commit -m "feat(ui): add authenticated interface primitives"
```

### Task 9: Establish the in-memory Keycloak session boundary

**Branch:** `frontend`

**Files:**

- Modify: `apps/web/package.json`
- Create: `apps/web/lib/config/public-env.ts`
- Create: `apps/web/lib/auth/keycloak.ts`
- Create: `apps/web/lib/auth/auth-provider.tsx`
- Create: `apps/web/components/access/session-boundary.tsx`
- Create: `apps/web/app/auth/callback/page.tsx`
- Create: `apps/web/app/session-expired/page.tsx`
- Modify: `apps/web/app/providers.tsx`
- Create: `apps/web/components/access/access.test.tsx`
- Modify: `CHANGELOG.md`

- [ ] **Step 1: Add Keycloak through the workspace package manager**

Run: `pnpm --filter @traceguard/web add keycloak-js`

- [ ] **Step 2: Write failing session-state tests**

Test this explicit context:

```ts
export type SessionState =
  | { status: "checking" }
  | {
      status: "authenticated";
      getAccessToken: () => Promise<string>;
      profile: IdentityProfile;
    }
  | { status: "anonymous"; signIn: (returnTo?: string) => Promise<void> }
  | { status: "expired"; signIn: (returnTo?: string) => Promise<void> };
```

Prove checking, anonymous, authenticated, refresh failure, safe return URL, logout, and absence of token persistence. Mock the adapter boundary rather than Keycloak internals.

- [ ] **Step 3: Verify session tests fail**

Run: `pnpm --filter @traceguard/web test -- access.test.tsx`

Expected: FAIL because auth provider and boundary are absent.

- [ ] **Step 4: Implement validated public configuration and adapter factory**

Validate `NEXT_PUBLIC_KEYCLOAK_URL`, `NEXT_PUBLIC_KEYCLOAK_REALM`, `NEXT_PUBLIC_KEYCLOAK_CLIENT_ID`, and `NEXT_PUBLIC_TRACEGUARD_API_URL` with Zod. Create one browser-only Keycloak instance with PKCE S256, `check-sso`, and callback redirect. Keep token access behind `getAccessToken()` and never write tokens to Web Storage.

- [ ] **Step 5: Implement provider and session screens**

The provider owns adapter initialization, refresh-before-use, sign-in, logout, safe return-path validation, and normalized state. `SessionBoundary` renders stable checking and expired states. The callback page waits for session establishment and replaces history with the validated return route.

- [ ] **Step 6: Run frontend session gates**

Run: `pnpm --filter @traceguard/web test -- access.test.tsx`

Run: `pnpm --filter @traceguard/web typecheck`

Expected: all session-state tests and types PASS.

- [ ] **Step 7: Stop for owner review before the planned commit**

Planned commit after approval:

```bash
git add apps/web/package.json apps/web/lib/config apps/web/lib/auth apps/web/components/access/session-boundary.tsx apps/web/app/auth apps/web/app/session-expired apps/web/app/providers.tsx apps/web/components/access/access.test.tsx pnpm-lock.yaml CHANGELOG.md
git commit -m "feat(web): add Keycloak session boundary"
```

### Task 10: Connect the authenticated typed API client

**Branch:** `frontend`

**Files:**

- Create: `apps/web/lib/api/traceguard-client.ts`
- Create: `apps/web/lib/access/access-queries.ts`
- Create: `apps/web/lib/access/organization-preference.ts`
- Modify: `apps/web/app/providers.tsx`
- Modify: `apps/web/components/access/access.test.tsx`
- Modify: `CHANGELOG.md`

- [ ] **Step 1: Write failing bearer, query-key, and cache-isolation tests**

Prove the client injects a freshly obtained bearer token, never logs it, and uses keys shaped as:

```ts
export const accessKeys = {
  me: ["access", "me"] as const,
  organization: (slug: string) => ["organization", slug] as const,
};
```

Test that `switchOrganization(queryClient, targetSlug)` cancels and removes every query whose first key is `organization` before returning `/org/${targetSlug}/overview`.

- [ ] **Step 2: Verify API integration tests fail**

Run: `pnpm --filter @traceguard/web test -- access.test.tsx`

Expected: FAIL because client and access queries are absent.

- [ ] **Step 3: Implement the client factory and typed operations**

Create the generated client once per session boundary, add an async authentication middleware, and expose functions for `getCurrentIdentity`, `bootstrapOrganization`, `getOrganization`, and `updateOrganization`. Convert non-2xx responses into a typed frontend Problem Details error without discarding correlation ID.

- [ ] **Step 4: Implement safe organization preference and switching**

Store only the last validated slug under a namespaced key. Reject values that do not match the slug grammar. Cache removal uses query-key predicates and occurs before navigation.

- [ ] **Step 5: Run focused tests and generated-client drift check**

Run: `pnpm --filter @traceguard/web test -- access.test.tsx`

Run: `pnpm --filter @traceguard/api-client generate:check`

Expected: bearer, error, preference, and cache-isolation tests PASS with no generated drift.

- [ ] **Step 6: Stop for owner review before the planned commit**

Planned commit after approval:

```bash
git add apps/web/lib/api apps/web/lib/access apps/web/app/providers.tsx apps/web/components/access/access.test.tsx CHANGELOG.md
git commit -m "feat(web): connect organization access client"
```

### Task 11: Build organization onboarding

**Branch:** `frontend`

**Files:**

- Create: `apps/web/app/onboarding/organization/page.tsx`
- Create: `apps/web/components/access/organization-onboarding-form.tsx`
- Modify: `apps/web/components/access/access.test.tsx`
- Modify: `CHANGELOG.md`

- [ ] **Step 1: Write failing onboarding tests**

Cover generated editable slug, required name, normalized slug, IANA time-zone selection, duplicate prevention, preserved input after Problem Details, slug conflict, idempotency key stability across retry, and redirect to the created overview.

```tsx
await user.type(screen.getByLabelText("Organization name"), "Acme Foods");
expect(screen.getByLabelText("Organization slug")).toHaveValue("acme-foods");
await user.selectOptions(
  screen.getByLabelText("Default time zone"),
  "Asia/Ho_Chi_Minh",
);
```

- [ ] **Step 2: Verify onboarding tests fail**

Run: `pnpm --filter @traceguard/web test -- access.test.tsx`

Expected: FAIL because the onboarding route and form are absent.

- [ ] **Step 3: Implement the onboarding route guard**

Load `GET /v1/me`. Redirect a user with one valid organization to its overview, present a choice for multiple organizations, and render onboarding only when membership is empty. Never infer eligibility solely from browser preference.

- [ ] **Step 4: Implement the accessible form**

Use React Hook Form with Zod, generate slug until the user edits it manually, create one idempotency key per submission intent, keep the same key for safe retries, and create a new key only after the input intent changes. Render field errors and a form-level Problem Details summary with correlation ID.

- [ ] **Step 5: Run onboarding gates**

Run: `pnpm --filter @traceguard/web test -- access.test.tsx`

Run: `pnpm --filter @traceguard/web typecheck`

Expected: validation, retry, and routing tests PASS.

- [ ] **Step 6: Stop for owner review before the planned commit**

Planned commit after approval:

```bash
git add apps/web/app/onboarding apps/web/components/access/organization-onboarding-form.tsx apps/web/components/access/access.test.tsx CHANGELOG.md
git commit -m "feat(web): add organization onboarding"
```

### Task 12: Build the authenticated shell and organization switcher

**Branch:** `frontend`

**Files:**

- Create: `apps/web/app/org/[slug]/layout.tsx`
- Create: `apps/web/app/org/[slug]/overview/page.tsx`
- Create: `apps/web/app/forbidden/page.tsx`
- Create: `apps/web/components/access/authenticated-shell.tsx`
- Create: `apps/web/components/access/organization-switcher.tsx`
- Create: `apps/web/components/access/account-menu.tsx`
- Create: `apps/web/components/access/access-status.tsx`
- Create: `apps/web/components/access/unsaved-changes-guard.tsx`
- Modify: `apps/web/components/access/access.test.tsx`
- Modify: `CHANGELOG.md`

- [ ] **Step 1: Write failing shell and switching tests**

Cover desktop navigation, mobile drawer, active organization text, Overview and Settings only, account menu, logout, safe organization lookup, dirty-form confirmation, request cancellation, cache removal before navigation, forbidden state, long names, and keyboard focus return.

- [ ] **Step 2: Verify shell tests fail**

Run: `pnpm --filter @traceguard/web test -- access.test.tsx`

Expected: FAIL because shell components and routes are absent.

- [ ] **Step 3: Implement organization route authorization**

The organization layout waits for an authenticated session, loads the requested organization through the API, maps safe not-found/access-denied responses to the forbidden surface, and passes authoritative organization and role data into the shell.

- [ ] **Step 4: Implement responsive shell and overview**

Render one `main` landmark, stable headings, active-route state, desktop sidebar, mobile dialog drawer, visible organization context, and account menu. Overview shows only organization name, current role, time zone, and setup guidance without fake metrics or dead links.

- [ ] **Step 5: Implement safe switching and dirty-state coordination**

Use a shared dirty-state registry scoped to the authenticated shell. When dirty, the switcher names the destination and the consequence before confirmation. On acceptance, clear the registry, cancel/remove tenant queries, update validated preference, navigate, and return focus appropriately.

- [ ] **Step 6: Run shell gates**

Run: `pnpm --filter @traceguard/web test -- access.test.tsx`

Run: `pnpm --filter @traceguard/web lint`

Run: `pnpm --filter @traceguard/web typecheck`

Expected: shell, accessibility, and cache-order tests PASS.

- [ ] **Step 7: Stop for owner review before the planned commit**

Planned commit after approval:

```bash
git add apps/web/app/org apps/web/app/forbidden apps/web/components/access apps/web/components/access/access.test.tsx CHANGELOG.md
git commit -m "feat(web): add authenticated organization shell"
```

### Task 13: Build version-safe organization settings

**Branch:** `frontend`

**Files:**

- Create: `apps/web/app/org/[slug]/settings/page.tsx`
- Create: `apps/web/components/access/organization-settings-form.tsx`
- Modify: `apps/web/components/access/access.test.tsx`
- Modify: `CHANGELOG.md`

- [ ] **Step 1: Write failing permission and conflict tests**

Test read-only non-Admin view, editable Admin fields, immutable slug, dirty-state registration, recoverable mutation error, version conflict, refresh-to-successor data, and stable success confirmation.

```tsx
expect(screen.getByLabelText("Organization slug")).toBeDisabled();
expect(
  screen.queryByRole("button", { name: "Save changes" }),
).not.toBeInTheDocument();
```

- [ ] **Step 2: Verify settings tests fail**

Run: `pnpm --filter @traceguard/web test -- access.test.tsx`

Expected: FAIL because the settings route and form are absent.

- [ ] **Step 3: Implement permission-aware settings**

Admins edit name and IANA time zone and submit the loaded row version. Non-Admins see the same authoritative values without mutable controls. Slug is always read-only after bootstrap.

- [ ] **Step 4: Implement conflict recovery**

On `version_conflict`, retain the user's attempted values, present that newer server data exists, and offer an explicit refresh action. Refresh replaces the form only after confirmation when local input differs; it never silently retries the stale mutation.

- [ ] **Step 5: Run settings gates**

Run: `pnpm --filter @traceguard/web test -- access.test.tsx`

Run: `pnpm --filter @traceguard/web typecheck`

Expected: authority, dirty-state, error, and conflict tests PASS.

- [ ] **Step 6: Stop for owner review before the planned commit**

Planned commit after approval:

```bash
git add apps/web/app/org/[slug]/settings apps/web/components/access/organization-settings-form.tsx apps/web/components/access/access.test.tsx CHANGELOG.md
git commit -m "feat(web): add organization settings"
```

### Task 14: Add browser journeys and visual verification

**Branch:** `frontend`

**Files:**

- Create: `apps/web/tests/e2e/organization-access.spec.ts`
- Modify: `apps/web/playwright.config.ts`
- Modify: `apps/web/app/page.tsx`
- Modify: `CHANGELOG.md`

- [ ] **Step 1: Add deterministic Keycloak and API test setup**

Use the local imported realm and dedicated test identities. Reset only Task 1 test records through a test-owned setup boundary; do not delete developer volumes. Keep credentials local and documented, never production-derived.

- [ ] **Step 2: Write failing critical journeys**

Create Playwright tests for new-user bootstrap, returning-user routing, two-organization switching, forbidden cross-tenant URL, expired-session return, non-Admin read-only settings, and dirty-form switching confirmation.

- [ ] **Step 3: Add named viewport projects**

Configure stable projects for:

```ts
{ name: "desktop", use: { viewport: { width: 1440, height: 900 } } },
{ name: "tablet", use: { viewport: { width: 1024, height: 768 } } },
{ name: "mobile", use: { viewport: { width: 390, height: 844 } } },
```

Add `toHaveScreenshot()` only for stable shell, onboarding, forbidden, and settings states. Review baseline pixels deliberately in the same Linux/container environment used by CI.

- [ ] **Step 4: Run browser tests and inspect the real application**

Run: `pnpm --filter @traceguard/web test:e2e`

Expected: all success and rejection journeys PASS with no console errors or failed required requests.

Manually verify keyboard-only completion, dialog focus/return, zoom/reflow, reduced motion, long organization names, loading, conflict, forbidden, and session-expired states. The owner will inspect the running web application separately; screenshots do not replace that review.

- [ ] **Step 5: Run the production frontend audit**

Run: `python3 .agents/skills/build-production-frontend/scripts/audit_frontend.py . --strict`

Expected: PASS for web, UI, and API client with no new risk findings.

- [ ] **Step 6: Stop for owner review before the planned commit**

Planned commit after approval:

```bash
git add apps/web/tests/e2e/organization-access.spec.ts apps/web/playwright.config.ts apps/web/app/page.tsx apps/web/tests/e2e/*.spec.ts-snapshots CHANGELOG.md
git commit -m "test(web): cover organization access journeys"
```

### Task 15: Integrate frontend and close the capability on develop

**Branch:** `develop`

**Files:**

- Merge: approved `frontend` history with a merge commit
- Modify: `docs/superpowers/plans/2026-07-18-feature-first-master-plan.md`
- Modify: `CHANGELOG.md` only if integration produces a distinct maintainer-visible change

- [ ] **Step 1: Review frontend history and branch scope**

Run: `git log --oneline develop..frontend`

Run: `git diff --stat develop...frontend`

Expected: only web, shared UI, generated client consumption, browser tests, lockfile, and matching changelog changes for Task 1.

- [ ] **Step 2: Stop for explicit merge approval**

After approval, merge with history preserved:

```bash
git merge --no-ff frontend -m "merge: integrate organization access frontend"
```

- [ ] **Step 3: Run the full capability gate**

Run: `just ci`

Run: `python3 .agents/skills/build-production-frontend/scripts/audit_frontend.py . --strict`

Run: `python3 .agents/skills/build-open-source-repository/scripts/audit_repo.py . --spdx-id Apache-2.0`

Run: `docker compose --profile core --profile app config --quiet`

Expected: CI, strict frontend audit, repository audit, and Compose validation PASS. Existing generated/lock SPDX warnings may remain documented; no new error or warning is accepted without owner review.

- [ ] **Step 4: Record objective evidence**

Update Task 1 in the master plan with backend commit SHAs, frontend commit SHAs, develop merge SHAs, exact validation commands, browser project results, and the review date. Mark Task 1 complete only when backend, frontend, integration, documentation, and validation evidence all exist.

- [ ] **Step 5: Review the final develop diff before push**

Run: `git status --short --branch`

Run: `git log --oneline --decorate -20`

Run: `git diff origin/develop...develop --stat`

Expected: clean worktree and only approved Task 1 history ahead of `origin/develop`.

- [ ] **Step 6: Stop for explicit push approval**

Push `develop` only after owner review. Do not merge or push `main`.

---

## Capability review checklist

- [ ] The OpenAPI contract and generated browser types agree.
- [ ] Keycloak tokens remain in memory and never appear in storage, logs, audit, or errors.
- [ ] Express validates issuer, audience, signature, expiry, and subject.
- [ ] PostgreSQL membership is checked for every organization-scoped request.
- [ ] Bootstrap is atomic and idempotent and grants exactly one Admin role.
- [ ] Two-tenant tests prove safe not-found behavior and isolation.
- [ ] Organization switching cancels and removes tenant-scoped cache before navigation.
- [ ] Admin settings updates use row versions; non-Admins cannot mutate.
- [ ] Loading, empty, restricted, error, conflict, and session-expired UI states exist.
- [ ] Desktop, tablet, and mobile browser journeys pass with keyboard and focus evidence.
- [ ] No dead navigation or fake dashboard data was introduced.
- [ ] Changelog and SPDX requirements are satisfied for every approved unit.
- [ ] Backend and frontend were reviewed before commit, merge, and push.
- [ ] `main` remains unchanged.
