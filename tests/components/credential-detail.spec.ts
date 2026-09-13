import { expect, test } from "@playwright/test";
import { emulateColorScheme, injectAxe } from "../../e2e/support/shared";

const DETAIL_AXE_RULES = [
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
  "label",
  "nested-interactive",
  "region",
];

test.describe("CredentialDetail component (Playwright gallery)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => localStorage.clear());
  });

  test("Valid story renders credential fields and masked password", async ({ mount }) => {
    const component = await mount("app/credential-detail/credential-detail/Valid");

    await expect(component).toContainText("GitHub");
    await expect(component).toContainText("ada@lockr.dev");
    await expect(component).toContainText("github.com");
    await expect(component.locator("[data-password]")).toContainText("••••••••");
  });

  test("reveal toggle shows and hides password", async ({ mount }) => {
    const component = await mount("app/credential-detail/credential-detail/Valid");

    const reveal = component.locator("[data-reveal]");
    await expect(reveal).toHaveAttribute("aria-pressed", "false");
    await expect(component.locator("[data-password]")).toContainText("••••••••");

    await reveal.click();
    await expect(component.locator("[data-password]")).toContainText("gh-seed-password");
    await expect(reveal).toHaveAttribute("aria-pressed", "true");

    await reveal.click();
    await expect(component.locator("[data-password]")).toContainText("••••••••");
    await expect(reveal).toHaveAttribute("aria-pressed", "false");
  });

  test("Unknown story renders not-found with back link", async ({ mount }) => {
    const component = await mount("app/credential-detail/credential-detail/Unknown");

    await expect(component.locator("[data-not-found]")).toBeVisible();
    await expect(component).toContainText("not found");
    await expect(component.locator("[data-back-to-list]")).toHaveAttribute("href", /\/$/);
  });

  test("passes AXE scan in light theme", async ({ mount, page }) => {
    const component = await mount("app/credential-detail/credential-detail/Valid");
    await injectAxe(page);

    const violations = await component
      .locator("article, [data-not-found]")
      .first()
      .evaluate(async (el, rules) => {
        const results = await window.axe.run(el, { runOnly: { type: "rule", values: rules } });
        return results.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
      }, DETAIL_AXE_RULES);

    expect(violations).toEqual([]);
  });

  test("passes AXE scan in dark theme", async ({ mount, page }) => {
    const component = await mount("app/credential-detail/credential-detail/Unknown");
    await emulateColorScheme(page, "dark");
    await injectAxe(page);

    const violations = await component
      .locator("[data-not-found]")
      .first()
      .evaluate(async (el, rules) => {
        const results = await window.axe.run(el, { runOnly: { type: "rule", values: rules } });
        return results.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
      }, DETAIL_AXE_RULES);

    expect(violations).toEqual([]);
  });
});
