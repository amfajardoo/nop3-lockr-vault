import { contrastRatio, relativeLuminance } from "./contrast";

describe("relativeLuminance", () => {
  it.each([
    ["#ffffff", 1],
    ["#000000", 0],
    ["#ff0000", 0.2126],
    ["#00ff00", 0.7152],
    ["#0000ff", 0.0722],
  ])("computes the WCAG relative luminance of %s", (hex, expected) => {
    expect(relativeLuminance(hex)).toBeCloseTo(expected, 6);
  });

  it("treats #rgb shorthand identically to #rrggbb", () => {
    expect(relativeLuminance("#fff")).toBeCloseTo(relativeLuminance("#ffffff"), 6);
    expect(relativeLuminance("#0fa")).toBeCloseTo(relativeLuminance("#00ffaa"), 6);
  });

  it.each(["", "#", "#ff", "#ffff", "#fffff", "#fffffff", "ffffff", "red", "oklch(1 0 0)"])(
    "throws a RangeError for malformed input %s",
    (input) => {
      expect(() => relativeLuminance(input)).toThrow(RangeError);
    },
  );
});

describe("contrastRatio", () => {
  it("returns 21:1 for black on white", () => {
    expect(contrastRatio("#000000", "#ffffff")).toBeCloseTo(21, 6);
  });

  it("is commutative", () => {
    expect(contrastRatio("#000000", "#ffffff")).toBeCloseTo(contrastRatio("#ffffff", "#000000"), 6);
  });

  /**
   * Documented token pairs for the unified color layer (feature 016, FR-004).
   * Values mirror what mat.theme() emits for light/dark (research D2).
   * Text pairs must clear WCAG AA 4.5:1; control-boundary pairs clear 3:1 (1.4.11).
   * `--mat-sys-outline-variant` is decorative (dividers/surfaces), never the sole
   * boundary of a control, so it is deliberately not a documented non-text pair.
   */
  const lightTextPairs = [
    ["#191b23", "#faf8ff"], // on-surface / surface
    ["#191b23", "#ededf9"], // on-surface / surface-container (toolbar, sidenav)
    ["#191b23", "#e7e7f3"], // on-surface / surface-container-high (cards, hover rows)
    ["#434655", "#faf8ff"], // on-surface-variant / surface
    ["#434655", "#ededf9"], // on-surface-variant / surface-container
    ["#434655", "#e7e7f3"], // on-surface-variant / surface-container-high
    ["#ffffff", "#0053db"], // on-primary / primary
    ["#ffffff", "#922fae"], // on-tertiary / tertiary
    ["#0053db", "#faf8ff"], // primary (links, icons) / surface
    ["#0053db", "#ededf9"], // primary / surface-container (brand in toolbar)
    ["#0053db", "#e7e7f3"], // primary / surface-container-high (icons in cards)
    ["#003ea8", "#dbe1ff"], // on-primary-container / primary-container (active nav)
  ] as const;

  const darkTextPairs = [
    ["#e1e2ed", "#11131b"], // on-surface / surface
    ["#e1e2ed", "#1d1f27"], // on-surface / surface-container (toolbar, sidenav)
    ["#e1e2ed", "#282a32"], // on-surface / surface-container-high (cards, hover rows)
    ["#dfe1f4", "#11131b"], // on-surface-variant / surface
    ["#dfe1f4", "#1d1f27"], // on-surface-variant / surface-container
    ["#dfe1f4", "#282a32"], // on-surface-variant / surface-container-high
    ["#002a78", "#b4c5ff"], // on-primary / primary
    ["#55006c", "#f2afff"], // on-tertiary / tertiary
    ["#b4c5ff", "#11131b"], // primary (links, icons) / surface
    ["#b4c5ff", "#1d1f27"], // primary / surface-container (brand in toolbar)
    ["#b4c5ff", "#282a32"], // primary / surface-container-high (icons in cards)
    ["#dbe1ff", "#003ea8"], // on-primary-container / primary-container (active nav)
  ] as const;

  const nonTextPairs = [
    ["#737686", "#faf8ff"], // outline / surface (light)
    ["#8d90a0", "#11131b"], // outline / surface (dark)
  ] as const;

  it.each([...lightTextPairs, ...darkTextPairs])("AA text threshold (≥4.5:1): %s on %s", (a, b) => {
    expect(contrastRatio(a, b)).toBeGreaterThanOrEqual(4.5);
  });

  it.each(nonTextPairs)("AA non-text threshold (≥3:1): %s on %s", (a, b) => {
    expect(contrastRatio(a, b)).toBeGreaterThanOrEqual(3);
  });

  it("keeps dark surface levels distinguishable", () => {
    expect(contrastRatio("#11131b", "#1d1f27")).toBeGreaterThan(1);
    expect(contrastRatio("#1d1f27", "#282a32")).toBeGreaterThan(1);
  });

  it.each(["#not-a-color", "#12345", "rgb(1, 2, 3)"])(
    "throws a RangeError when %s is malformed",
    (input) => {
      expect(() => contrastRatio(input, "#ffffff")).toThrow(RangeError);
    },
  );
});
