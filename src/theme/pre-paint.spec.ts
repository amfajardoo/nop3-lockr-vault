import { readFileSync } from "node:fs";
import {
  CHOICE_DARK,
  CHOICE_LIGHT,
  CHOICE_SYSTEM,
  DARK_SCHEME_QUERY,
  resolveEffectiveTheme,
  THEME_STORAGE_KEY,
} from "./theme-contract";

/**
 * Behavior spec for the pre-paint script (feature 002, US1).
 *
 * Runs the ACTUAL inline script extracted from src/index.html inside the test
 * runner's jsdom environment (the same harness Angular uses for app.spec.ts),
 * and asserts the root class for every resolution scenario in the spec.
 *
 * The script must never crash or modify anything but the <html> class list.
 */

const indexHtml = readFileSync("src/index.html", "utf8");

/** Minimal MediaQueryList that satisfies the script contracts (only .matches is used). */
interface PrePaintMediaQueryList {
  readonly matches: boolean;
  readonly media: string;
  readonly onchange: EventListener | null;
  addListener(): void;
  removeListener(): void;
  addEventListener(): void;
  removeEventListener(): void;
  dispatchEvent(): boolean;
}

function createMatchMediaStub(media: string, matches: boolean): PrePaintMediaQueryList {
  return {
    matches,
    media,
    onchange: null,
    addListener() {},
    removeListener() {},
    addEventListener() {},
    removeEventListener() {},
    dispatchEvent() {
      return false;
    },
  };
}

/** Storage mock backed by a Map, independent of the environment's own storage. */
function createLocalStorageStub(entries?: Readonly<Record<string, string>>) {
  const store = new Map<string, string>(Object.entries(entries ?? {}));
  return {
    getItem(key: string): string | null {
      return store.get(key) ?? null;
    },
    setItem(key: string, value: string): void {
      store.set(key, value);
    },
    removeItem(key: string): void {
      store.delete(key);
    },
    clear(): void {
      store.clear();
    },
  };
}

/**
 * Binds a storage mock to the jsdom WINDOW. The browser globals the inline
 * script touches (bare `localStorage`, `window.matchMedia`) resolve on the
 * window of the document jsdom itself evals scripts in, which is NOT the
 * runner's `globalThis`; `vi.stubGlobal` alone would not reach it.
 */
function installWindowLocalStorage(storage: object): void {
  const win = document.defaultView;
  if (!win) {
    throw new Error("jsdom window is unavailable");
  }
  Object.defineProperty(win, "localStorage", {
    configurable: true,
    value: storage,
  });
}

/** Binds a matchMedia stub to the jsdom window (jsdom does not implement it). */
function installWindowMatchMedia(systemDark: boolean): void {
  const win = document.defaultView;
  if (!win) {
    throw new Error("jsdom window is unavailable");
  }
  Object.defineProperty(win, "matchMedia", {
    configurable: true,
    value: () => createMatchMediaStub(DARK_SCHEME_QUERY, systemDark),
  });
}

/**
 * Extracts the pre-paint script from the SOURCE index.html.
 * Throws a descriptive error when the required inline synchronous script is
 * missing (e.g. if it was converted to an external file), with guidance.
 */
function extractPrePaintScript(html: string): string {
  const head = html.match(/<head([^>]*)>([\s\S]*?)<\/head>/i)?.[2];
  const scripts = [...(head ?? "").matchAll(/<script([^>]*)>([\s\S]*?)<\/script>/g)];
  const inline = scripts.filter((match) => !/\bsrc\b/i.test(match[1] ?? ""));

  if (head === undefined || inline.length !== 1) {
    throw new Error(
      `Expected exactly one inline pre-paint <script> in <head> as its first child ` +
        `(synchronous, no defer/async/module, no src) per feature 002 US1; found ` +
        `${inline.length} inline of ${scripts.length} total script tag(s).`,
    );
  }
  return inline[0][2] ?? "";
}

/**
 * Runs the real pre-paint script inside the test runner's jsdom window realm.
 *
 * Executing the extracted source with `window.eval` guarantees the script runs
 * against the SAME window object the stubs are installed on. Appending a real
 * <script> element instead lets jsdom run the source in its own internal vm
 * context where window-bound stubs are invisible — see the harness probe test
 * for proof that jsdom executes real inline scripts at all.
 */
function runPrePaintScript(): void {
  const win = document.defaultView;
  if (!win) {
    throw new Error("jsdom window is unavailable");
  }
  win.eval(extractPrePaintScript(indexHtml));
}

interface PrePaintScenario {
  label: string;
  stored?: string | null;
  systemDark: boolean;
  storageThrows?: boolean;
}

const scenarios: readonly PrePaintScenario[] = [
  { label: `stored "${CHOICE_DARK}" + system light`, stored: CHOICE_DARK, systemDark: false },
  { label: `stored "${CHOICE_LIGHT}" + system dark`, stored: CHOICE_LIGHT, systemDark: true },
  { label: "missing choice + system dark", stored: null, systemDark: true },
  { label: `stored "${CHOICE_SYSTEM}" + system dark`, stored: CHOICE_SYSTEM, systemDark: true },
  { label: `stored "${CHOICE_SYSTEM}" + system light`, stored: CHOICE_SYSTEM, systemDark: false },
  { label: "malformed stored value + system dark", stored: "purple", systemDark: true },
  { label: "malformed stored value + system light", stored: "purple", systemDark: false },
  { label: "storage throws + system dark", systemDark: true, storageThrows: true },
  { label: "storage throws + system light", systemDark: false, storageThrows: true },
];

/** Resets the shared document to a clean pre-boot state. */
function resetDocument(): void {
  document.documentElement.removeAttribute("class");
}

beforeEach(() => {
  resetDocument();
  installWindowLocalStorage(createLocalStorageStub());
});

afterEach(() => {
  resetDocument();
});

describe("pre-paint script harness", () => {
  it("executes inline scripts appended to <head>", () => {
    const probe = document.createElement("script");
    probe.textContent = 'document.documentElement.setAttribute("data-probe", "ran")';
    document.head.appendChild(probe);
    expect(document.documentElement.getAttribute("data-probe")).toBe("ran");
    document.documentElement.removeAttribute("data-probe");
  });
});

describe("pre-paint script (behavior)", () => {
  it.each(scenarios)("applies $label per contract", (scenario) => {
    installWindowMatchMedia(scenario.systemDark);
    if (scenario.storageThrows) {
      installWindowLocalStorage({
        getItem(): never {
          throw new Error("Storage access denied");
        },
      });
    } else if (scenario.stored !== undefined && scenario.stored !== null) {
      window.localStorage.setItem(THEME_STORAGE_KEY, scenario.stored);
    }

    runPrePaintScript();

    const expected = resolveEffectiveTheme(scenario.stored, scenario.systemDark) === CHOICE_DARK;
    expect(document.documentElement.classList.contains("dark")).toBe(expected);
  });
});

describe("pre-paint script (integration with real index.html)", () => {
  it("leaves <html> clean before the script runs", () => {
    expect(document.documentElement.tagName).toBe("HTML");
    expect(document.documentElement.hasAttribute("class")).toBe(false);
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBeNull();
  });

  it('adds nothing but class="dark" when the system prefers dark and nothing is stored', () => {
    installWindowMatchMedia(true);
    runPrePaintScript();
    expect(document.documentElement.getAttribute("class")).toBe("dark");
    expect(document.body.hasAttribute("class")).toBe(false);
  });

  it("touches nothing when the resolved theme is light", () => {
    installWindowMatchMedia(false);
    runPrePaintScript();
    expect(document.documentElement.hasAttribute("class")).toBe(false);
    expect(document.body.hasAttribute("class")).toBe(false);
  });
});
