import { expect, type Page } from "@playwright/test";
import { registerFlows, type TranslatorRegistry } from "../support/registry";
import {
  emulateColorScheme,
  expectNoSeriousOrCriticalViolations,
  injectAxe,
  openApp,
  reloadPage,
} from "../support/shared";
import { themeToggleFlows } from "./theme.flow";
import { type ThemeStep, themeSteps } from "./theme.steps";

const THEME_KEY = "lockr.theme";

async function clickRadio(page: Page, label: string): Promise<void> {
  await page.locator('label:has(input[type="radio"])', { hasText: label }).click({ force: true });
}

async function expectRadioChecked(page: Page, label: string): Promise<void> {
  await expect(page.getByRole("radio", { name: label })).toBeChecked();
}

async function assertStoredTheme(page: Page, value: string | null): Promise<void> {
  await expect.poll(() => page.evaluate((key) => localStorage.getItem(key), THEME_KEY)).toBe(value);
}

async function clearStoredTheme(page: Page): Promise<void> {
  await page.evaluate((key) => localStorage.removeItem(key), THEME_KEY);
}

async function expectRootDark(page: Page): Promise<void> {
  await expect(page.locator("html")).toHaveClass(/dark/);
}

async function expectRootNotDark(page: Page): Promise<void> {
  await expect(page.locator("html")).not.toHaveClass(/dark/);
}

const translators: TranslatorRegistry<ThemeStep> = {
  [themeSteps.appOpen]: openApp,
  [themeSteps.selectDark]: (page) => clickRadio(page, "Dark"),
  [themeSteps.darkChecked]: (page) => expectRadioChecked(page, "Dark"),
  [themeSteps.rootDark]: expectRootDark,
  [themeSteps.storedDark]: (page) => assertStoredTheme(page, "dark"),
  [themeSteps.reload]: reloadPage,
  [themeSteps.darkPersists]: async (page) => {
    await expectRadioChecked(page, "Dark");
    await expectRootDark(page);
  },
  [themeSteps.noStoredChoice]: async (page) => {
    await openApp(page);
    await clearStoredTheme(page);
    await reloadPage(page);
  },
  [themeSteps.osLight]: (page) => emulateColorScheme(page, "light"),
  [themeSteps.systemLight]: async (page) => {
    await expectRadioChecked(page, "System");
    await expectRootNotDark(page);
  },
  [themeSteps.osDark]: (page) => emulateColorScheme(page, "dark"),
  [themeSteps.systemDark]: async (page) => {
    await expectRootDark(page);
    await expectRadioChecked(page, "System");
  },
  [themeSteps.shellRendered]: openApp,
  [themeSteps.axeRuns]: injectAxe,
  [themeSteps.noViolations]: expectNoSeriousOrCriticalViolations,
};

registerFlows(themeToggleFlows, translators);
