// SPDX-FileCopyrightText: 2026 TraceGuard contributors
// SPDX-License-Identifier: Apache-2.0

import { execFileSync } from "node:child_process";

import { expect, test, type Page } from "@playwright/test";

const fullStack = process.env.TRACEGUARD_E2E_ACCESS === "1";
const keycloakUrl = "http://localhost:8081";
const keycloakAdminPassword = "traceguard-local-idp";
const testPassword = "traceguard-e2e-review";
const postgresContainer =
  process.env.TRACEGUARD_E2E_POSTGRES_CONTAINER ?? "traceguard-postgres-1";

async function getKeycloakAdminToken() {
  const tokenResponse = await fetch(
    `${keycloakUrl}/realms/master/protocol/openid-connect/token`,
    {
      body: new URLSearchParams({
        client_id: "admin-cli",
        grant_type: "password",
        password: keycloakAdminPassword,
        username: "admin",
      }),
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      method: "POST",
    },
  );
  if (!tokenResponse.ok) {
    throw new Error(`Keycloak admin token failed: ${tokenResponse.status}`);
  }
  const { access_token: accessToken } = (await tokenResponse.json()) as {
    access_token: string;
  };
  return accessToken;
}

async function ensureKeycloakUser(username: string, email: string) {
  const accessToken = await getKeycloakAdminToken();
  const headers = {
    Authorization: `Bearer ${accessToken}`,
    "Content-Type": "application/json",
  };
  const usersResponse = await fetch(
    `${keycloakUrl}/admin/realms/traceguard/users?username=${encodeURIComponent(username)}&exact=true`,
    { headers },
  );
  const users = (await usersResponse.json()) as { id: string }[];
  let userId = users[0]?.id;
  if (!userId) {
    const createResponse = await fetch(
      `${keycloakUrl}/admin/realms/traceguard/users`,
      {
        body: JSON.stringify({
          email,
          emailVerified: true,
          enabled: true,
          firstName: "TraceGuard",
          lastName: "E2E Reviewer",
          username,
        }),
        headers,
        method: "POST",
      },
    );
    if (!createResponse.ok) {
      throw new Error(
        `Keycloak user creation failed: ${createResponse.status}`,
      );
    }
    userId = createResponse.headers.get("location")?.split("/").pop();
  }
  if (!userId) throw new Error("Keycloak did not return the test user ID.");
  const passwordResponse = await fetch(
    `${keycloakUrl}/admin/realms/traceguard/users/${userId}/reset-password`,
    {
      body: JSON.stringify({
        temporary: false,
        type: "password",
        value: testPassword,
      }),
      headers,
      method: "PUT",
    },
  );
  if (!passwordResponse.ok) {
    throw new Error(
      `Keycloak password setup failed: ${passwordResponse.status}`,
    );
  }
}

async function deleteKeycloakUser(username: string) {
  const accessToken = await getKeycloakAdminToken();
  const headers = { Authorization: `Bearer ${accessToken}` };
  const usersResponse = await fetch(
    `${keycloakUrl}/admin/realms/traceguard/users?username=${encodeURIComponent(username)}&exact=true`,
    { headers },
  );
  const users = (await usersResponse.json()) as { id: string }[];
  await Promise.all(
    users.map(({ id }) =>
      fetch(`${keycloakUrl}/admin/realms/traceguard/users/${id}`, {
        headers,
        method: "DELETE",
      }),
    ),
  );
}

function seedSecondOrganization(email: string, name: string, slug: string) {
  const escapedEmail = email.replaceAll("'", "''");
  const escapedName = name.replaceAll("'", "''");
  const escapedSlug = slug.replaceAll("'", "''");
  const sql = `
    with selected_identity as (
      select id from identities where email = '${escapedEmail}' limit 1
    ), inserted_organization as (
      insert into organizations (name, slug, time_zone)
      values ('${escapedName}', '${escapedSlug}', 'UTC')
      on conflict (slug) do update set name = excluded.name
      returning id
    ), inserted_membership as (
      insert into organization_memberships (identity_id, organization_id)
      select selected_identity.id, inserted_organization.id
      from selected_identity, inserted_organization
      on conflict (identity_id, organization_id) do update set status = 'active'
      returning id
    )
    insert into membership_roles (membership_id, role)
    select id, 'quality_analyst' from inserted_membership
    on conflict do nothing;
  `;
  runPsql(sql);
}

function runPsql(sql: string) {
  execFileSync(
    "docker",
    [
      "exec",
      "-i",
      postgresContainer,
      "psql",
      "-v",
      "ON_ERROR_STOP=1",
      "-U",
      "traceguard_admin",
      "-d",
      "traceguard",
      "-c",
      sql,
    ],
    { stdio: "pipe" },
  );
}

function cleanupTestAccess(email: string, slugs: string[]) {
  const escapedEmail = email.replaceAll("'", "''");
  const escapedSlugs = slugs
    .map((slug) => `'${slug.replaceAll("'", "''")}'`)
    .join(", ");
  const sql = `
    begin;
    delete from audit_events where organization_id in (
      select id from organizations where slug in (${escapedSlugs})
    );
    delete from membership_roles where membership_id in (
      select id from organization_memberships where organization_id in (
        select id from organizations where slug in (${escapedSlugs})
      )
    );
    delete from organization_memberships where organization_id in (
      select id from organizations where slug in (${escapedSlugs})
    );
    delete from organizations where slug in (${escapedSlugs});
    delete from idempotency_records where identity_id in (
      select id from identities where email = '${escapedEmail}'
    );
    delete from identities where email = '${escapedEmail}';
    commit;
  `;
  runPsql(sql);
}

async function signIn(page: Page, username: string) {
  await page.goto("/");
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.getByLabel("Username or email").fill(username);
  await page.locator("input#password").fill(testPassword);
  await page.getByRole("button", { name: "Sign In" }).click();
}

async function openOrganizationPicker(page: Page) {
  const visiblePicker = page.locator(
    'select[aria-label="Organization"]:visible',
  );
  if (await visiblePicker.count()) return visiblePicker;
  await page.getByRole("button", { name: "Open navigation" }).click();
  return page.locator('select[aria-label="Organization"]:visible');
}

test.describe("organization access full-stack journey", () => {
  test.skip(
    !fullStack,
    "Set TRACEGUARD_E2E_ACCESS=1 with the local stack running.",
  );

  let cleanupTarget:
    | {
        email: string;
        slugs: [admin: string, analyst: string];
        username: string;
      }
    | undefined;

  test.afterEach(async ({ page }) => {
    if (cleanupTarget) {
      await page.close();
      cleanupTestAccess(cleanupTarget.email, cleanupTarget.slugs);
      await deleteKeycloakUser(cleanupTarget.username);
      cleanupTarget = undefined;
    }
  });

  test("isolates tenants, protects dirty work, and expires safely", async ({
    page,
  }, testInfo) => {
    test.setTimeout(90_000);
    const suffix = testInfo.project.name.replace(/[^a-z0-9]+/g, "-");
    const username = `e2e-${suffix}`;
    const email = `${username}@example.test`;
    const adminSlug = `${username}-admin`;
    const analystSlug = `${username}-analyst`;
    const adminName = `E2E ${testInfo.project.name} Admin`;
    const analystName = `E2E ${testInfo.project.name} Analyst`;

    await ensureKeycloakUser(username, email);
    cleanupTarget = { email, slugs: [adminSlug, analystSlug], username };
    cleanupTestAccess(email, [adminSlug, analystSlug]);
    await signIn(page, username);
    await expect(page).toHaveURL(/\/onboarding\/organization$/);

    await page.getByLabel("Organization name").fill(adminName);
    await page.getByLabel("Organization slug").fill(adminSlug);
    await page.getByRole("button", { name: "Create organization" }).click();
    await expect(page).toHaveURL(new RegExp(`/org/${adminSlug}/overview$`));
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(adminName);

    seedSecondOrganization(email, analystName, analystSlug);
    await page.reload();
    await expect(page.getByRole("heading", { name: adminName })).toBeVisible();

    let picker = await openOrganizationPicker(page);
    await picker.selectOption(analystSlug);
    await expect(page).toHaveURL(new RegExp(`/org/${analystSlug}/overview$`));
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      analystName,
    );
    await expect(
      page.getByRole("heading", { name: adminName }),
    ).not.toBeVisible();

    picker = await openOrganizationPicker(page);
    await picker.selectOption(adminSlug);
    await expect(page).toHaveURL(new RegExp(`/org/${adminSlug}/overview$`));
    await page.goto(`/org/${adminSlug}/settings`);
    await page.getByLabel("Organization name").fill(`${adminName} Edited`);
    await openOrganizationPicker(page);
    const overviewLink = page.locator('a[href$="/overview"]:visible').first();
    await overviewLink.click();
    let dialog = page.getByRole("alertdialog", {
      name: "Leave without saving?",
    });
    await expect(dialog).toContainText("Continue to Overview?");
    await dialog.getByRole("button", { name: "Keep editing" }).click();
    await expect(page).toHaveURL(new RegExp(`/org/${adminSlug}/settings$`));

    picker = await openOrganizationPicker(page);
    await picker.selectOption(analystSlug);
    dialog = page.getByRole("alertdialog", {
      name: "Leave without saving?",
    });
    await expect(dialog).toBeVisible();
    await expect(dialog).toContainText(`Continue to ${analystName}?`);
    await expect(
      dialog.getByRole("button", { name: "Keep editing" }),
    ).toBeFocused();
    await dialog.getByRole("button", { name: "Discard and switch" }).click();
    await expect(page).toHaveURL(new RegExp(`/org/${analystSlug}/overview$`));

    await page.goto(`/org/${analystSlug}/settings`);
    await expect(page.getByLabel("Organization name")).toBeDisabled();
    await expect(page.getByText("Read-only access")).toBeVisible();

    await page.goto(`/org/${username}-outside/settings`);
    await expect(page).toHaveURL(/\/forbidden$/);

    await page.route(`**/v1/organizations/${analystSlug}`, (route) =>
      route.fulfill({
        body: JSON.stringify({ detail: "The session expired.", status: 401 }),
        contentType: "application/problem+json",
        status: 401,
      }),
    );
    await page.goto(`/org/${analystSlug}/settings`);
    await expect(page).toHaveURL(/\/session-expired$/);
    await expect(
      page.getByRole("heading", { name: "Your session expired" }),
    ).toBeVisible();

    await page.screenshot({
      fullPage: true,
      path: testInfo.outputPath("session-expired.png"),
    });
  });
});
