import { expect, test } from "@playwright/test";

import { injectAxe } from "../../e2e/support/shared";
import { THEME_STORAGE_KEY } from "../../src/theme/theme-contract";

const TOGGLE_AXE_RULES = [
  "aria-allowed-role",
  "aria-required-attr",
  "aria-required-children",
  "aria-roles",
  "aria-valid-attr-value",
  "aria-valid-attr",
  "duplicate-id",
  "focus-order-semantics",
  "label",
  "tabindex",
];

const DARK = "dark";
const LIGHT = "light";
const SYSTEM = "system";

test.describe("ThemeToggle component (Playwright gallery)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => localStorage.clear());
  });

  test("renders the three contract options with System selected by default", async ({ mount }) => {
    const component = await mount("app/theme-toggle/theme-toggle/Primary");

    const labels = component.locator("label");
    await expect(labels).toHaveCount(3);
    await expect(component.locator("input:checked")).toHaveAttribute("data-theme-option", SYSTEM);
    await expect(component.locator("label").nth(0)).toContainText("Light");
    await expect(component.locator("label").nth(1)).toContainText("Dark");
    await expect(component.locator("label").nth(2)).toContainText("System");
  });

  test("persists a dark choice to storage and marks the document", async ({ mount, page }) => {
    const component = await mount("app/theme-toggle/theme-toggle/Primary");

    await component.locator("label", { hasText: "Dark" }).locator("input").check();

    await expect(component.locator("input:checked")).toHaveAttribute("data-theme-option", DARK);
    await expect
      .poll(() => page.evaluate(() => document.documentElement.classList.contains("dark")))
      .toBe(true);
    await expect
      .poll(() => page.evaluate((key) => localStorage.getItem(key), THEME_STORAGE_KEY))
      .toBe(DARK);
  });

  test("restores the stored choice after a gallery reload", async ({ mount, page }) => {
    const component = await mount("app/theme-toggle/theme-toggle/Primary");
    await component.locator("label", { hasText: "Dark" }).locator("input").check();

    await page.reload();

    const reloaded = await mount("app/theme-toggle/theme-toggle/Primary");
    await expect(reloaded.locator("input:checked")).toHaveAttribute("data-theme-option", DARK);
    await expect
      .poll(() => page.evaluate(() => document.documentElement.classList.contains("dark")))
      .toBe(true);
  });

  test("moves selection with arrow keys and wraps past the last option", async ({
    mount,
    page,
  }) => {
    const component = await mount("app/theme-toggle/theme-toggle/Primary");

    await component.locator("label", { hasText: "Light" }).locator("input").check();
    await expect(component.locator("input:checked")).toHaveAttribute("data-theme-option", LIGHT);

    await component.locator(`input[data-theme-option="${LIGHT}"]`).focus();
    await page.keyboard.press("ArrowRight");

    await expect(component.locator("input:checked")).toHaveAttribute("data-theme-option", DARK);
    await expect(component.locator(`input[data-theme-option="${DARK}"]`)).toBeFocused();

    await page.keyboard.press("ArrowRight");
    await page.keyboard.press("ArrowRight");

    await expect(component.locator("input:checked")).toHaveAttribute("data-theme-option", LIGHT);
    await expect(component.locator(`input[data-theme-option="${LIGHT}"]`)).toBeFocused();
  });

  test("Dark story renders the persisted dark presentation", async ({ mount, page }) => {
    const component = await mount("app/theme-toggle/theme-toggle/Dark");

    await expect(component.locator("input:checked")).toHaveAttribute("data-theme-option", DARK);
    await expect
      .poll(() => page.evaluate((key) => localStorage.getItem(key), THEME_STORAGE_KEY))
      .toBe(DARK);
    await expect
      .poll(() => page.evaluate(() => document.documentElement.classList.contains("dark")))
      .toBe(true);
  });

  test("passes an AXE scan without serious or critical violations", async ({ mount, page }) => {
    const component = await mount("app/theme-toggle/theme-toggle/Primary");
    await injectAxe(page);

    const violations = await page.evaluate(async (rules) => {
      const group = document.querySelector("[role='radiogroup']");
      if (!group) {
        throw new Error("radiogroup element not found");
      }
      const results = await window.axe.run(group, { runOnly: { type: "rule", values: rules } });
      return results.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
    }, TOGGLE_AXE_RULES);

    expect(violations).toEqual([]);
    expect(component).toBeVisible();
  });
});
