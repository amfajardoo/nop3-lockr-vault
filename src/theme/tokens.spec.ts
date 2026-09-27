import { readFileSync } from "node:fs";

/**
 * Token CSS spec (feature 002, US2; reconciled 2026-09-13 by feature 013 —
 * Tailwind removal; reconciled 2026-09-26 by feature 016 — design refresh).
 *
 * 016 replaced the parallel slate palette that used to live in styles.css with
 * a single source of truth (FR-003): colors come exclusively from mat.theme()'s
 * --mat-sys-* tokens (light-dark() in both schemes), so styles.css declares no
 * color values at all. Consequently:
 *   - the former ":root/.dark palette parity + #rrggbb" invariants became
 *     "styles.css declares no colors" + ".dark only flips color-scheme";
 *   - the FR-005 AA ratios moved to contrast.spec.ts, asserted against the
 *     documented token pairs of the unified layer (FR-004).
 * styles.css now carries only the spacing scale, the display-font overrides
 * and the color-scheme wiring asserted below.
 */

const styles = readFileSync("src/styles.css", "utf8");
const themeScss = readFileSync("src/material-theme.scss", "utf8");

const VIEW_STYLESHEETS = [
  ["credential-list.css", readFileSync("src/app/credential-list/credential-list.css", "utf8")],
  [
    "credential-detail.css",
    readFileSync("src/app/credential-detail/credential-detail.css", "utf8"),
  ],
  ["credential-form.css", readFileSync("src/app/credential-form/credential-form.css", "utf8")],
] as const;

const LITERAL_COLOR_PATTERN =
  /\b#(?:[0-9a-f]{3,8})\b|oklch\(|rgb\(|rgba\(|hsl\(|hsla\(|color-mix\(/gi;

const CSS_VAR_PATTERN = /(--[a-z0-9-]+)\s*:/gi;

const SPACING_SCALE = {
  "--space-1": "0.25rem",
  "--space-2": "0.5rem",
  "--space-3": "0.75rem",
  "--space-4": "1rem",
  "--space-5": "1.5rem",
  "--space-6": "2rem",
  "--space-7": "3rem",
} as const;

/** Roles that carry the brand font (shorthand + family variants). */
const DISPLAY_TOKENS = [
  "display-large",
  "display-medium",
  "display-small",
  "headline-large",
  "headline-medium",
  "headline-small",
] as const;

/** Roles that must keep the theme's Roboto (never overridden in styles.css). */
const BODY_TOKENS = [
  "body-large",
  "body-medium",
  "body-small",
  "title-large",
  "title-medium",
  "title-small",
  "label-large",
  "label-medium",
  "label-small",
] as const;

/** Extracts a CSS rule body for `selectorPattern` (e.g. ":root", "\\.dark"). */
function extractBlock(css: string, selectorPattern: string): string {
  return css.match(new RegExp(`${selectorPattern}\\s*\\{([^}]*)\\}`))?.[1] ?? "";
}

/** Parses `--token: value;` declarations out of a rule body. */
function parseDeclarations(block: string): Readonly<Record<string, string>> {
  const tokens: Record<string, string> = {};
  for (const match of block.matchAll(/(--[a-z0-9-]+)\s*:\s*([^;}]+)/gi)) {
    tokens[match[1]] = (match[2] ?? "").trim();
  }
  return tokens;
}

const rootTokens = parseDeclarations(extractBlock(styles, ":root"));
const darkTokens = parseDeclarations(extractBlock(styles, "\\.dark"));

describe("single-source color layer (016, FR-003)", () => {
  it("declares no literal color values anywhere in styles.css", () => {
    expect(styles.match(/\b#(?:[0-9a-f]{3,8})\b|oklch\(|rgb\(|rgba\(|hsl\(|hsla\(/gi)).toBeNull();
  });

  it("paints the body from Material system tokens", () => {
    const body = extractBlock(styles, "body");

    expect(body).toContain("var(--mat-sys-background)");
    expect(body).toContain("var(--mat-sys-on-surface)");
  });

  it(".dark only flips color-scheme (light-dark() carries the palette)", () => {
    const block = extractBlock(styles, "\\.dark").replace(/\s+/g, " ").trim();

    expect(Object.keys(darkTokens)).toEqual([]);
    expect(block).toBe("color-scheme: dark;");
  });

  it("keeps typography: Roboto for the non-display roles in the theme", () => {
    expect(themeScss).toMatch(/typography:\s*Roboto/);
  });
});

describe("spacing scale (016, FR-009)", () => {
  it.each(Object.entries(SPACING_SCALE))("defines %s as %s", (token, value) => {
    expect(rootTokens[token]).toBe(value);
  });
});

describe("display font overrides (016, FR-008)", () => {
  it("defines --font-display with a fallback stack", () => {
    expect(rootTokens["--font-display"]).toMatch(/Space Grotesk.*Roboto/);
  });

  it.each([...DISPLAY_TOKENS])("redeclares --mat-sys-%s with the display font", (token) => {
    const value = rootTokens[`--mat-sys-${token}`];

    expect(value, `missing --mat-sys-${token}`).toMatch(/^400 .+ var\(--font-display\)$/);
  });

  it.each([...DISPLAY_TOKENS])("redeclares --mat-sys-%s-font with the display font", (token) => {
    expect(rootTokens[`--mat-sys-${token}-font`]).toBe("var(--font-display)");
  });

  it.each([...BODY_TOKENS])("leaves --mat-sys-%s untouched (stays Roboto)", (token) => {
    expect(rootTokens[`--mat-sys-${token}`]).toBeUndefined();
    expect(rootTokens[`--mat-sys-${token}-font`]).toBeUndefined();
  });
});

describe("view stylesheets stay token-driven (016, FR-003/FR-009)", () => {
  it.each(VIEW_STYLESHEETS)("declares no literal color values in %s", (_name, css) => {
    expect(css.match(LITERAL_COLOR_PATTERN)).toBeNull();
  });

  it.each(VIEW_STYLESHEETS)("uses only the documented token families in %s", (_name, css) => {
    const vars = [...css.matchAll(CSS_VAR_PATTERN)].map((match) => match[1]);
    const unexpected = vars.filter(
      (name) => !name.startsWith("--mat-sys-") && !name.startsWith("--space-"),
    );

    expect(unexpected).toEqual([]);
  });

  it("styles the page title with the display role token", () => {
    expect(styles).toMatch(/\.page-header \.page-title\s*\{[^}]*var\(--mat-sys-display-small\)/);
  });

  it("styles the page lede with body-medium on on-surface-variant", () => {
    expect(styles).toMatch(/\.page-header \.page-lede\s*\{[^}]*var\(--mat-sys-body-medium\)/);
    expect(styles).toMatch(
      /\.page-header \.page-lede\s*\{[^}]*var\(--mat-sys-on-surface-variant\)/,
    );
  });
});

describe("color-scheme wiring", () => {
  it("sets color-scheme: light on :root", () => {
    expect(extractBlock(styles, ":root")).toMatch(/color-scheme:\s*light/);
  });

  it("sets color-scheme: dark on .dark", () => {
    expect(extractBlock(styles, "\\.dark")).toMatch(/color-scheme:\s*dark/);
  });
});
