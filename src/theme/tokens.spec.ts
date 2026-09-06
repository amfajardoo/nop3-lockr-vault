import { readFileSync } from "node:fs";
import { contrastRatio } from "./contrast";

/**
 * Token CSS spec (feature 002, US2).
 *
 * Reads the ACTUAL src/styles.css and asserts the class-driven dark-mode
 * wiring: dark-variant placement, token parity between `:root` and `.dark`,
 * the `@theme inline` utility mapping, `color-scheme`, and the FR-005 AA
 * invariants recomputed from the parsed token values (text >= 4.5:1,
 * non-text >= 3:1) in BOTH palettes.
 */

const styles = readFileSync("src/styles.css", "utf8");

const THEME_TOKENS = [
  "--surface",
  "--surface-raised",
  "--foreground",
  "--muted",
  "--accent",
  "--on-accent",
  "--line",
  "--line-subtle",
  "--success",
  "--warning",
  "--error",
  "--info",
] as const;

const SURFACE = "--surface";
const SURFACE_RAISED = "--surface-raised";
const FOREGROUND = "--foreground";
const MUTED = "--muted";
const ACCENT = "--accent";
const ON_ACCENT = "--on-accent";
const LINE = "--line";
const SUCCESS = "--success";
const WARNING = "--warning";
const ERROR = "--error";
const INFO = "--info";

const MIN_TEXT_RATIO = 4.5;
const MIN_NON_TEXT_RATIO = 3;

/** Extracts a CSS rule body for `selectorPattern` (e.g. ":root", "\\.dark", "@theme inline"). */
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

function singleLine(input: string): string {
  return input.replace(/\s+/g, " ");
}

const rootTokens = parseDeclarations(extractBlock(styles, ":root"));
const darkTokens = parseDeclarations(extractBlock(styles, "\\.dark"));
const paletteBlocks = [
  { palette: "light", tokens: rootTokens },
  { palette: "dark", tokens: darkTokens },
] as const;

interface InvariantCase {
  readonly palette: string;
  readonly kind: "text" | "non-text";
  readonly label: string;
  readonly background: string;
  readonly foreground: string;
  readonly minimum: number;
}

/** Builds one AA case per palette per invariant pair from the parsed CSS values. */
function buildInvariantCases(): readonly InvariantCase[] {
  const textPairs: readonly (readonly [string, string])[] = [
    [SURFACE, FOREGROUND],
    [SURFACE, MUTED],
    [SURFACE, ACCENT],
    [SURFACE, SUCCESS],
    [SURFACE, WARNING],
    [SURFACE, ERROR],
    [SURFACE, INFO],
    [SURFACE_RAISED, FOREGROUND],
    [SURFACE_RAISED, MUTED],
    [ACCENT, ON_ACCENT],
  ];

  const cases: InvariantCase[] = [];
  for (const { palette, tokens } of paletteBlocks) {
    for (const [background, foreground] of textPairs) {
      cases.push({
        palette,
        kind: "text",
        label: `${foreground} on ${background}`,
        background: tokens[background],
        foreground: tokens[foreground],
        minimum: MIN_TEXT_RATIO,
      });
    }
    cases.push({
      palette,
      kind: "non-text",
      label: `${LINE} on ${SURFACE}`,
      background: tokens[SURFACE],
      foreground: tokens[LINE],
      minimum: MIN_NON_TEXT_RATIO,
    });
  }
  return cases;
}

describe("src/styles.css dark variant wiring", () => {
  const importStatement = '@import "tailwindcss";';
  const variant = "@custom-variant dark (&:where(.dark, .dark *));";

  it("imports Tailwind first", () => {
    expect(styles).toContain(importStatement);
  });

  it("declares the dark variant immediately after the Tailwind import", () => {
    const importIndex = styles.indexOf(importStatement);
    const variantIndex = styles.indexOf(variant);
    expect(variantIndex).toBeGreaterThan(importIndex);
    expect(styles.slice(importIndex + importStatement.length, variantIndex).trim()).toBe("");
  });

  it("declares the dark variant exactly once", () => {
    expect(styles.split(variant)).toHaveLength(2);
  });
});

describe("token parity between :root and .dark", () => {
  it(`:root defines every semantic token (${THEME_TOKENS.length})`, () => {
    for (const token of THEME_TOKENS) {
      expect(rootTokens[token], `missing ${token} in :root`).toBeDefined();
    }
  });

  it(".dark overrides the same token set as :root", () => {
    expect(Object.keys(darkTokens).sort()).toEqual(Object.keys(rootTokens).sort());
  });

  it.each([...THEME_TOKENS])("has a #rrggbb value for %s in both palettes", (token) => {
    for (const { palette, tokens } of paletteBlocks) {
      expect(tokens[token], `${palette} ${token}`).toMatch(/^#[0-9a-f]{6}$/i);
    }
  });
});

describe("@theme inline utility mapping", () => {
  const themeBlock = singleLine(extractBlock(styles, "@theme inline"));

  it("defines the @theme inline block", () => {
    expect(themeBlock).toContain("--color-");
  });

  it.each(THEME_TOKENS.map((token) => [token, token.slice("--".length)] as const))(
    "maps %s to a --color-%s Tailwind utility",
    (token, suffix) => {
      expect(themeBlock).toMatch(new RegExp(`--color-${suffix}\\s*:\\s*var\\(${token}\\)`));
    },
  );
});

describe("color-scheme wiring", () => {
  it("sets color-scheme: light on :root", () => {
    expect(singleLine(extractBlock(styles, ":root"))).toMatch(/color-scheme:\s*light/);
  });

  it("sets color-scheme: dark on .dark", () => {
    expect(singleLine(extractBlock(styles, "\\.dark"))).toMatch(/color-scheme:\s*dark/);
  });
});

describe("FR-005 contrast invariants recomputed from the CSS", () => {
  it.each(buildInvariantCases())(
    "$kind $palette: $label is >= $minimum:1",
    ({ background, foreground, minimum, palette, label }) => {
      const ratio = contrastRatio(background, foreground);
      expect(
        ratio,
        `${palette} ${label}: computed ${ratio.toFixed(2)}:1 does not meet the ${minimum}:1 minimum`,
      ).toBeGreaterThanOrEqual(minimum);
    },
  );
});
