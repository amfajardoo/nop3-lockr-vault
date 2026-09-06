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

  const lightPairs = [
    ["#0f172a", "#ffffff", 17.85],
    ["#475569", "#ffffff", 7.58],
    ["#2563eb", "#ffffff", 5.17],
    ["#ffffff", "#2563eb", 5.17],
    ["#15803d", "#ffffff", 5.02],
    ["#b45309", "#ffffff", 5.02],
    ["#b91c1c", "#ffffff", 6.47],
    ["#1d4ed8", "#ffffff", 6.7],
    ["#64748b", "#ffffff", 4.76],
  ] as const;

  it.each(lightPairs)("light palette: %s on %s ≈ %s:1", (a, b, expected) => {
    expect(contrastRatio(a, b)).toBeCloseTo(expected, 2);
  });

  const darkPairs = [
    ["#f1f5f9", "#0f172a", 16.3],
    ["#94a3b8", "#0f172a", 6.96],
    ["#818cf8", "#0f172a", 5.98],
    ["#4ade80", "#0f172a", 10.25],
    ["#fbbf24", "#0f172a", 10.69],
    ["#f87171", "#0f172a", 6.45],
    ["#a5b4fc", "#0f172a", 8.96],
    ["#64748b", "#0f172a", 3.75],
  ] as const;

  it.each(darkPairs)("dark palette: %s on %s ≈ %s:1", (a, b, expected) => {
    expect(contrastRatio(a, b)).toBeCloseTo(expected, 2);
  });

  it("enforces the AA text threshold (≥4.5:1) on every foreground-invariant pair", () => {
    const textPairs = [...lightPairs, ...darkPairs].filter(
      ([a, b]) => !(a === "#64748b" && b === "#0f172a"),
    );
    for (const [a, b] of textPairs) {
      expect(contrastRatio(a, b)).toBeGreaterThanOrEqual(4.5);
    }
  });

  it("enforces the AA non-text threshold (≥3:1) on --line pairs", () => {
    expect(contrastRatio("#64748b", "#ffffff")).toBeGreaterThanOrEqual(3);
    expect(contrastRatio("#64748b", "#0f172a")).toBeGreaterThanOrEqual(3);
  });

  it.each(["#not-a-color", "#12345", "rgb(1, 2, 3)"])(
    "throws a RangeError when %s is malformed",
    (input) => {
      expect(() => contrastRatio(input, "#ffffff")).toThrow(RangeError);
    },
  );
});
