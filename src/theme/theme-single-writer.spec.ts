import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const SRC = "src";
const INDEX_HTML = join(SRC, "index.html");
const STORE_PATH = join(SRC, "theme", "theme.store.ts");

const FORBIDDEN_MUTATIONS = [
  "localStorage.setItem",
  "classList.add(",
  "classList.remove(",
  "classList.toggle(",
];

function collectSourceFiles(): string[] {
  const out: string[] = [];
  const walk = (dir: string): void => {
    for (const entry of readdirSync(dir)) {
      const path = join(dir, entry);
      if (statSync(path).isDirectory()) {
        walk(path);
      } else if (/(\.ts|\.html|\.css)$/.test(entry)) {
        out.push(path);
      }
    }
  };
  walk(SRC);
  return out;
}

describe("theme single-writer (feature 003, US3)", () => {
  it("keeps the 002 pre-paint script as the first child of <head>, synchronous", () => {
    const html = readFileSync(INDEX_HTML, "utf8");
    const head = html.match(/<head>([\s\S]*?)<\/head>/i)?.[1] ?? "";
    expect(head.trimStart().startsWith("<script>")).toBe(true);
    expect(head).not.toContain("defer");
    expect(head).not.toContain("async");
    expect(head).not.toContain('type="module"');
    expect(head).toContain("lockr.theme");
  });

  it("declares the store as the single runtime writer home", () => {
    expect(existsSync(STORE_PATH)).toBe(true);
  });

  it("does not write storage or mutate the root class anywhere except index.html and theme.store.ts", () => {
    const allowed = new Set([INDEX_HTML, STORE_PATH]);
    for (const file of collectSourceFiles()) {
      if (allowed.has(file) || file.endsWith(".spec.ts")) {
        continue;
      }
      const content = readFileSync(file, "utf8");
      for (const mutation of FORBIDDEN_MUTATIONS) {
        expect(content, `${file} must not contain ${mutation}`).not.toContain(mutation);
      }
    }
  });

  it("reuses the theme-contract keys instead of re-declaring the storage literal", () => {
    expect(existsSync(STORE_PATH)).toBe(true);
    const store = readFileSync(STORE_PATH, "utf8");
    expect(store).toContain("THEME_STORAGE_KEY");
    expect(store).not.toContain('"lockr.theme"');
    expect(store).not.toContain("'lockr.theme'");
  });

  it("keeps the main app entry free of theme side effects", () => {
    const mainTs = join(SRC, "main.ts");
    expect(readFileSync(mainTs, "utf8")).not.toContain("localStorage");
  });
});
