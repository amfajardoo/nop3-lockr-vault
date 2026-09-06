import { windowOf } from "@testing/window-stubs";
import { DARK_SCHEME_QUERY, THEME_STORAGE_KEY } from "@theme/theme-contract";

export interface StorageStub {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
  getState: () => string | null;
  getWrites: () => string[];
}

export interface StorageInstallOptions {
  throwOnGet?: boolean;
}

export function installThemeStorage(
  initial: string | null,
  opts: StorageInstallOptions = {},
): StorageStub {
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

export type MatchMediaListener = (event: { matches: boolean }) => void;

export interface MediaQueryListStub {
  readonly matches: boolean;
  addEventListener: (type: string, listener: MatchMediaListener) => void;
  removeEventListener: (type: string, listener: MatchMediaListener) => void;
}

export interface MediaQueryStub {
  getMatches: () => boolean;
  dispatch: (matches: boolean) => void;
  mql: MediaQueryListStub;
}

export function installMediaQueryStub(initialMatches: boolean): MediaQueryStub {
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
  return {
    getMatches: () => matches,
    dispatch: (next) => {
      matches = next;
      dispatch({ matches: next });
    },
    mql,
  };
}

export interface ThemeMediaQueryStub extends MediaQueryStub {}

export function installThemeMediaQueryStub(initialMatches: boolean): ThemeMediaQueryStub {
  const stub = installMediaQueryStub(initialMatches);
  Object.defineProperty(windowOf(), "matchMedia", {
    configurable: true,
    value: (query: string) => {
      if (query !== DARK_SCHEME_QUERY) throw new Error(`unexpected query: ${query}`);
      return stub.mql;
    },
  });
  return stub;
}
