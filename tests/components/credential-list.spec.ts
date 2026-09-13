import { expect, test } from "@playwright/test";
import { emulateColorScheme, injectAxe } from "../../e2e/support/shared";

const LIST_AXE_RULES = [
  "aria-allowed-role",
  "aria-required-attr",
  "aria-required-children",
  "aria-roles",
  "aria-valid-attr-value",
  "aria-valid-attr",
  "button-name",
  "link-name",
  "duplicate-id",
  "focus-order-semantics",
  "heading-order",
  "list",
  "listitem",
  "nested-interactive",
  "region",
];

test.describe("CredentialList component (Playwright gallery)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => localStorage.clear());
  });

  test("Seeded story renders the mock credentials with name, username, domain", async ({
    mount,
  }) => {
    const component = await mount("app/credential-list/credential-list/Seeded");

    const rows = component.locator("[data-credential-row]");
    await expect(rows).toHaveCount(4);

    const firstRow = rows.first();
    await expect(firstRow.locator("[data-credential-name]")).toContainText("GitHub");
    await expect(firstRow).toContainText("ada@lockr.dev");
    await expect(firstRow).toContainText("github.com");

    const favorite = firstRow.locator("[data-favorite]");
    await expect(favorite).toBeTruthy();
    await expect(favorite).toHaveAttribute("aria-label", /favorite/i);
  });

  test("Empty story renders empty state with no rows", async ({ mount }) => {
    const component = await mount("app/credential-list/credential-list/Empty");

    await expect(component.locator("[data-empty-state]")).toBeVisible();
    await expect(component.locator("[data-credential-row]")).toHaveCount(0);
    await expect(component).toContainText("Your vault is empty");
  });

  test("passes AXE scan in light theme", async ({ mount, page }) => {
    const component = await mount("app/credential-list/credential-list/Seeded");
    await injectAxe(page);

    const violations = await component
      .locator("section")
      .first()
      .evaluate(async (el, rules) => {
        const results = await window.axe.run(el, { runOnly: { type: "rule", values: rules } });
        return results.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
      }, LIST_AXE_RULES);

    expect(violations).toEqual([]);
  });

  test("passes AXE scan in dark theme", async ({ mount, page }) => {
    const component = await mount("app/credential-list/credential-list/Empty");
    await emulateColorScheme(page, "dark");
    await injectAxe(page);

    const violations = await component
      .locator("section")
      .first()
      .evaluate(async (el, rules) => {
        const results = await window.axe.run(el, { runOnly: { type: "rule", values: rules } });
        return results.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
      }, LIST_AXE_RULES);

    expect(violations).toEqual([]);
  });
});
