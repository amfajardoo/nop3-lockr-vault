import { inject } from "@angular/core";
import { TestBed } from "@angular/core/testing";

import { ThemeStore, type ThemeStoreInstance } from "./theme.store";
import {
  CHOICE_DARK,
  CHOICE_LIGHT,
  CHOICE_SYSTEM,
  DARK_SCHEME_QUERY,
  THEME_STORAGE_KEY,
} from "./theme-contract";

type SameAsWindow = typeof window;

function windowOf(): SameAsWindow {
  const win = document.defaultView;
  if (!win) throw new Error("jsdom window unavailable");
  return win as unknown as SameAsWindow;
}

interface StorageStub {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
  getState: () => string | null;
  getWrites: () => string[];
}

function installStorage(initial: string | null, opts: { throwOnGet?: boolean } = {}): StorageStub {
  let state = initial;
  const writes: string[] = [];
  const stub: StorageStub = {
    getItem: (key) => {
      if (opts.throwOnGet) throw new Error("storage blocked");
      return key === THEME_STORAGE_KEY ? state : null;
    },
    setItem: (key, value) => {
      if (key === THEME_STORAGE_KEY) {
        state = value;
        writes.push(value);
      }
    },
    getState: () => state,
    getWrites: () => writes,
  };
  Object.defineProperty(windowOf(), "localStorage", { configurable: true, value: stub });
  return stub;
}

type MatchMediaListener = (event: { matches: boolean }) => void;

interface MatchMediaStub {
  getMatches: () => boolean;
  dispatch: (matches: boolean) => void;
}

function installMatchMedia(initialMatches: boolean): MatchMediaStub {
  let matches = initialMatches;
  const listeners = new Set<MatchMediaListener>();
  const dispatch: MatchMediaListener = (event) => {
    for (const listener of [...listeners]) {
      listener(event);
    }
  };
  const mql = {
    get matches(): boolean {
      return matches;
    },
    addEventListener: (_type: string, listener: MatchMediaListener) => {
      listeners.add(listener);
    },
    removeEventListener: (_type: string, listener: MatchMediaListener) => {
      listeners.delete(listener);
    },
  };
  Object.defineProperty(windowOf(), "matchMedia", {
    configurable: true,
    value: (query: string) => {
      if (query !== DARK_SCHEME_QUERY) throw new Error(`unexpected query: ${query}`);
      return mql;
    },
  });
  return {
    getMatches: () => matches,
    dispatch: (next) => {
      matches = next;
      dispatch({ matches: next });
    },
  };
}

function restoreWindowPrimitives(): void {
  const win = windowOf();
  delete (win as Partial<SameAsWindow>).matchMedia;
  delete (win as Partial<SameAsWindow>).localStorage;
}

function rootHasDark(): boolean {
  return document.documentElement.classList.contains("dark");
}

function createStore(): ThemeStoreInstance {
  return TestBed.runInInjectionContext(() => inject(ThemeStore));
}

describe("theme store (feature 003, US1): init & persistence", () => {
  let storage: StorageStub;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [ThemeStore] });
    restoreWindowPrimitives();
    document.documentElement.classList.remove("dark");
    installMatchMedia(false);
    storage = installStorage(null);
  });

  it("initializes to system and writes nothing when no stored value exists", () => {
    const store = createStore();
    expect(store.choice()).toBe(CHOICE_SYSTEM);
    expect(store.effective()).toBe("light");
    expect(storage.getWrites()).toHaveLength(0);
  });

  it("initializes to the stored explicit dark choice", () => {
    installStorage(CHOICE_DARK);
    const store = createStore();
    expect(store.choice()).toBe(CHOICE_DARK);
    expect(store.effective()).toBe("dark");
    expect(rootHasDark()).toBe(true);
  });

  it("initializes to the stored explicit light choice", () => {
    installStorage(CHOICE_LIGHT);
    const store = createStore();
    expect(store.choice()).toBe(CHOICE_LIGHT);
    expect(store.effective()).toBe("light");
    expect(rootHasDark()).toBe(false);
  });

  it("honors system when stored system and OS is dark", () => {
    installMatchMedia(true);
    installStorage(CHOICE_SYSTEM);
    const store = createStore();
    expect(store.choice()).toBe(CHOICE_SYSTEM);
    expect(store.effective()).toBe("dark");
    expect(rootHasDark()).toBe(true);
  });

  it("falls back to system for corrupt values without overwriting them", () => {
    storage = installStorage("bogus");
    const store = createStore();
    expect(store.choice()).toBe(CHOICE_SYSTEM);
    expect(store.effective()).toBe("light");
    expect(storage.getWrites()).toHaveLength(0);
    expect(storage.getState()).toBe("bogus");
  });

  it("falls back to system for empty and JSON-wrapped values", () => {
    for (const corrupt of ["", '"dark"', "{}", "null"]) {
      storage = installStorage(corrupt);
      const store = createStore();
      expect(store.choice(), `input ${corrupt}`).toBe(CHOICE_SYSTEM);
      expect(storage.getWrites()).toHaveLength(0);
      expect(storage.getState(), `input ${corrupt}`).toBe(corrupt);
    }
  });

  it("never throws when storage access is blocked", () => {
    restoreWindowPrimitives();
    installMatchMedia(false);
    installStorage(null, { throwOnGet: true });
    const store = createStore();
    expect(store.choice()).toBe(CHOICE_SYSTEM);
    expect(store.effective()).toBe("light");
  });

  it("setChoice(light) persists, applies and updates effective", () => {
    const store = createStore();
    store.setChoice(CHOICE_LIGHT);
    expect(storage.getState()).toBe(CHOICE_LIGHT);
    expect(store.choice()).toBe(CHOICE_LIGHT);
    expect(store.effective()).toBe("light");
    expect(rootHasDark()).toBe(false);
  });

  it("setChoice(dark) persists, applies and updates effective", () => {
    const store = createStore();
    store.setChoice(CHOICE_DARK);
    expect(storage.getState()).toBe(CHOICE_DARK);
    expect(store.choice()).toBe(CHOICE_DARK);
    expect(store.effective()).toBe("dark");
    expect(rootHasDark()).toBe(true);
  });

  it("setChoice(system) persists and resolves to the OS preference", () => {
    const store = createStore();
    store.setChoice(CHOICE_SYSTEM);
    expect(storage.getState()).toBe(CHOICE_SYSTEM);
    expect(store.choice()).toBe(CHOICE_SYSTEM);
    expect(store.effective()).toBe("light");
    expect(rootHasDark()).toBe(false);
  });

  it("setChoice with an out-of-enum value is a no-op without writes", () => {
    const store = createStore();
    store.setChoice("neon" as never);
    expect(store.choice()).toBe(CHOICE_SYSTEM);
    expect(storage.getWrites()).toHaveLength(0);
    expect(storage.getState()).toBeNull();
  });
});

describe("theme store (feature 003, US2): OS-following", () => {
  let media: MatchMediaStub;
  let storage: StorageStub;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [ThemeStore] });
    restoreWindowPrimitives();
    document.documentElement.classList.remove("dark");
    media = installMatchMedia(false);
    storage = installStorage(null);
  });

  it("tracks the OS live while choice is system", () => {
    const store = createStore();
    store.setChoice(CHOICE_SYSTEM);
    expect(store.effective()).toBe("light");
    expect(rootHasDark()).toBe(false);

    media.dispatch(true);
    expect(store.effective()).toBe("dark");
    expect(rootHasDark()).toBe(true);
    expect(storage.getWrites()).toEqual([CHOICE_SYSTEM]);

    media.dispatch(false);
    expect(store.effective()).toBe("light");
    expect(rootHasDark()).toBe(false);
  });

  it("initializes from a dark OS when in system mode", () => {
    media = installMatchMedia(true);
    const store = createStore();
    store.setChoice(CHOICE_SYSTEM);
    expect(store.effective()).toBe("dark");
    expect(rootHasDark()).toBe(true);
  });

  it("ignores OS changes for an explicit choice without writes", () => {
    const store = createStore();
    store.setChoice(CHOICE_DARK);
    const writesAfterChoice = storage.getWrites().length;

    media.dispatch(false);
    expect(store.effective()).toBe("dark");
    expect(rootHasDark()).toBe(true);
    expect(store.choice()).toBe(CHOICE_DARK);
    expect(storage.getWrites()).toHaveLength(writesAfterChoice);
  });

  it("switches from explicit to system and back without leaving stale listeners", () => {
    const store = createStore();
    store.setChoice(CHOICE_DARK);
    store.setChoice(CHOICE_SYSTEM);

    media.dispatch(true);
    expect(store.effective()).toBe("dark");

    media.dispatch(false);
    expect(store.effective()).toBe("light");

    store.setChoice(CHOICE_DARK);
    media.dispatch(true);
    expect(store.effective()).toBe("dark");
  });
});
