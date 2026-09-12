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

/** Token suffixes as they appear in Tailwind utility names (after "--color-"). */
const THEME_TOKEN_SUFFIXES = [
  "surface",
  "surface-raised",
  "foreground",
  "muted",
  "accent",
  "on-accent",
  "line",
  "line-subtle",
  "success",
  "warning",
  "error",
  "info",
] as const;

/** Tailwind namespaces that carry the actual color (others are layout-only). */
const COLOR_UTILITY_NAMESPACES = ["bg", "text", "border", "ring"] as const;

const COLOR_UTILITY_PREFIX = new RegExp(`^(?:${COLOR_UTILITY_NAMESPACES.join("|")})-`);

const ALLOWED_COLOR_UTILITIES = new Set(
  COLOR_UTILITY_NAMESPACES.flatMap((namespace) =>
    THEME_TOKEN_SUFFIXES.map((suffix) => `${namespace}-${suffix}`),
  ),
);

/** Every literal hex / CSS color function a scaffold must not contain. */
const LITERAL_COLOR_PATTERN =
  /\b#(?:[0-9a-f]{3,8})\b|oklch\(|rgb\(|rgba\(|hsl\(|hsla\(|color-mix\(/gi;

function classNames(html: string): readonly string[] {
  const names: string[] = [];
  for (const match of html.matchAll(/\bclass="([^"]*)"/g)) {
    for (const name of (match[1] ?? "").split(/\s+/)) {
      if (name.length > 0) {
        names.push(name);
      }
    }
  }
  return names;
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

  it("uses only token color utilities in dashboard.html", () => {
    const offenders = [...classNames(dashboardHtml)].filter(
      (name) => COLOR_UTILITY_PREFIX.test(name) && !ALLOWED_COLOR_UTILITIES.has(name),
    );
    expect(offenders, `non-token color utilities found: ${offenders.join(", ") || "none"}`).toEqual(
      [],
    );
  });

  it("exercises the palette (bg-surface, text-foreground, text-muted, text-accent, border-line)", () => {
    for (const className of [
      "bg-surface",
      "text-foreground",
      "text-muted",
      "text-accent",
      "border-line",
    ]) {
      expect(classNames(dashboardHtml), `missing token utility ${className}`).toContain(className);
    }
  });

  it("keeps the shell wiring (router-outlet and the brand title binding)", () => {
    expect(appHtml).toContain("<router-outlet");
    expect(dashboardHtml).toContain("{{ title }}");
  });
});
