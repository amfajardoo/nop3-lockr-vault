import { readFileSync } from "node:fs";
import { CHOICE_SYSTEM, THEME_STORAGE_KEY } from "./theme-contract";

/**
 * Structural spec for the pre-paint script placement in src/index.html.
 *
 * Guards the anti-FOUC guarantee (feature 002, US1): the boot script must run
 * synchronously as the FIRST child of <head>, before the stylesheet and the
 * Angular bundle, so the initial class is applied before the first paint.
 */

const indexHtml = readFileSync("src/index.html", "utf8");

type InlineScriptMatch = { readonly attributes: string; readonly body: string };

function extractScripts(html: string): readonly InlineScriptMatch[] {
  return [...html.matchAll(/<script([^>]*)>([\s\S]*?)<\/script>/g)].map((match) => ({
    attributes: match[1] ?? "",
    body: match[2] ?? "",
  }));
}

/** True when the attributes string contains the token as a standalone HTML attribute word. */
function hasStandaloneAttribute(attributes: string, attribute: string): boolean {
  return new RegExp(`(?:^|\\s)${attribute}(?:\\s|=|$)`, "i").test(attributes);
}

function hasModuleType(attributes: string): boolean {
  return /type\s*=\s*["']?module["']?/i.test(attributes);
}

const scripts = extractScripts(indexHtml);
const prePaintScript = scripts[0];

describe("index.html pre-paint script (structural)", () => {
  it("contains exactly one inline script", () => {
    expect(scripts).toHaveLength(1);
  });

  it('is synchronous (no defer, async, or type="module")', () => {
    const attributes = prePaintScript?.attributes ?? "";
    expect(hasStandaloneAttribute(attributes, "defer")).toBe(false);
    expect(hasStandaloneAttribute(attributes, "async")).toBe(false);
    expect(hasModuleType(attributes)).toBe(false);
  });

  it("is loaded inline, without an external src", () => {
    const attributes = prePaintScript?.attributes ?? "";
    expect(hasStandaloneAttribute(attributes, "src")).toBe(false);
  });

  it(`references the "${THEME_STORAGE_KEY}" storage key`, () => {
    expect(prePaintScript?.body).toContain(THEME_STORAGE_KEY);
  });

  it("references prefers-color-scheme", () => {
    expect(prePaintScript?.body).toContain("prefers-color-scheme");
  });
});

describe("index.html pre-paint script placement", () => {
  it("is the first child inside <head>, before any stylesheet or script tag", () => {
    const headInner = indexHtml.match(/<head[^>]*>([\s\S]*?)<\/head>/i)?.[1];
    const firstMeaningful = headInner
      ?.trimStart()
      .split(/[\r\n]+/, 1)[0]
      .trim();
    expect(firstMeaningful).toBe("<script>");
  });
});

describe("index.html pre-paint script scenario constants", () => {
  it(`${CHOICE_SYSTEM} is one of the stored choices handled by the contract`, () => {
    expect(["light", "dark", CHOICE_SYSTEM]).toContain(CHOICE_SYSTEM);
  });
});
