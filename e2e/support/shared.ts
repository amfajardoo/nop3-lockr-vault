import { expect, type Page } from "@playwright/test";

declare global {
  interface Window {
    axe: {
      run(context: Element | Document): Promise<{
        violations: Array<{ impact: string | null }>;
      }>;
    };
  }
}

export async function openApp(page: Page): Promise<void> {
  await page.goto("/");
}

export async function reloadPage(page: Page): Promise<void> {
  await page.reload();
}

export async function emulateColorScheme(page: Page, scheme: "light" | "dark"): Promise<void> {
  await page.emulateMedia({ colorScheme: scheme });
}

export async function injectAxe(page: Page): Promise<void> {
  await page.addScriptTag({ path: "node_modules/axe-core/axe.min.js" });
}

export async function expectNoSeriousOrCriticalViolations(page: Page): Promise<void> {
  await expect
    .poll(() =>
      page.evaluate(async () => {
        const results = await window.axe.run(document);
        return results.violations.filter(
          (violation) => violation.impact === "serious" || violation.impact === "critical",
        );
      }),
    )
    .toEqual([]);
}
