import { readFileSync } from "node:fs";

/**
 * Scaffold token-purity spec (feature 002, US3) — reconciled 2026-09-11 by
 * feature 006: the chrome moved from `app.*` (now a thin `<router-outlet />`
 * bootstrap) into `src/app/dashboard/*`. Token-purity and palette assertions
 * now target the dashboard shell, which owns the token surface.
 */

const appHtml = readFileSync("src/app/app.html", "utf8");
const dashboardHtml = readFileSync("src/app/dashboard/dashboard.html", "utf8");
const dashboardCss = readFileSync("src/app/dashboard/dashboard.css", "utf8");

/** Material CSS variable prefixes that carry the actual color. */
const MATERIAL_VAR_PREFIXES = ["--mat-sys-", "--mat-"] as const;

const MATERIAL_VAR_PATTERN = new RegExp(`((?:${MATERIAL_VAR_PREFIXES.join("|")})[a-z_-]+)`, "g");

/** Every literal hex / CSS color function a scaffold must not contain. */
const LITERAL_COLOR_PATTERN =
  /\b#(?:[0-9a-f]{3,8})\b|oklch\(|rgb\(|rgba\(|hsl\(|hsla\(|color-mix\(/gi;

function cssVariables(css: string): readonly string[] {
  const vars: string[] = [];
  for (const match of css.matchAll(MATERIAL_VAR_PATTERN)) {
    if (match[1].length > 0) {
      vars.push(match[1]);
    }
  }
  return vars;
}

describe("dashboard token purity (feature 002, US3, reconciled by 006)", () => {
  it("keeps the app bootstrap minimal (router-outlet only)", () => {
    expect(appHtml.trim()).toBe("<router-outlet />");
  });

  it("contains no literal color values in dashboard.html", () => {
    expect(dashboardHtml.match(LITERAL_COLOR_PATTERN)).toBeNull();
  });

  it("contains no literal color values in dashboard.css", () => {
    expect(dashboardCss.match(LITERAL_COLOR_PATTERN)).toBeNull();
  });

  it("uses only Material CSS variables in dashboard.css", () => {
    const vars = cssVariables(dashboardCss);
    const expectedPrefixes = ["--mat-sys-", "--mat-"];
    const unexpected = vars.filter((v) => !expectedPrefixes.some((p) => v.startsWith(p)));
    expect(
      unexpected,
      `unexpected color variables found: ${unexpected.join(", ") || "none"}`,
    ).toEqual([]);
  });

  it("references only theme tokens mat.theme() actually emits", () => {
    const vars = cssVariables(dashboardCss);
    const notEmitted = vars.filter(
      (v) => v.startsWith("--mat-sys-spacing-") || v.startsWith("--mat-sys-monospace-"),
    );
    expect(
      notEmitted,
      `tokens missing from the compiled theme (use rem instead): ${notEmitted.join(", ") || "none"}`,
    ).toEqual([]);
  });

  it("exercises the palette (surface, on-surface, primary, outline-variant)", () => {
    const vars = cssVariables(dashboardCss);
    for (const token of ["surface", "on-surface", "primary", "outline-variant"]) {
      expect(
        vars.some((v) => v.includes(token)),
        `missing token variable ${token}`,
      ).toBe(true);
    }
  });

  it("keeps the shell wiring (router-outlet and the brand title binding)", () => {
    expect(appHtml).toContain("<router-outlet");
    expect(dashboardHtml).toContain("{{ title }}");
  });
});
