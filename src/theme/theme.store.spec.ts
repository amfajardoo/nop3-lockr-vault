import { inject } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import { setupThemeTestBed } from "@testing/setup-theme";
import {
  installThemeMediaQueryStub,
  installThemeStorage,
  type MediaQueryStub,
  type StorageStub,
} from "@testing/theme-stubs";
import { ThemeStore, type ThemeStoreInstance } from "@theme/theme.store";
import { CHOICE_DARK, CHOICE_LIGHT, CHOICE_SYSTEM } from "./theme-contract";

function rootHasDark(): boolean {
  return document.documentElement.classList.contains("dark");
}

function createStore(): ThemeStoreInstance {
  return TestBed.runInInjectionContext(() => inject(ThemeStore));
}

describe("theme store (feature 003, US1): init & persistence", () => {
  let storage: StorageStub;

  beforeEach(() => {
    const handles = setupThemeTestBed();
    storage = handles.storage;
  });

  it("initializes to system and writes nothing when no stored value exists", () => {
    const store = createStore();

    expect(store.choice()).toBe(CHOICE_SYSTEM);
    expect(store.effective()).toBe("light");
    expect(storage.getWrites()).toHaveLength(0);
  });

  it("initializes to the stored explicit dark choice", () => {
    storage = installThemeStorage(CHOICE_DARK);

    const store = createStore();

    expect(store.choice()).toBe(CHOICE_DARK);
    expect(store.effective()).toBe("dark");
    expect(rootHasDark()).toBe(true);
  });

  it("initializes to the stored explicit light choice", () => {
    storage = installThemeStorage(CHOICE_LIGHT);

    const store = createStore();

    expect(store.choice()).toBe(CHOICE_LIGHT);
    expect(store.effective()).toBe("light");
    expect(rootHasDark()).toBe(false);
  });

  it("honors system when stored system and OS is dark", () => {
    installThemeMediaQueryStub(true);
    storage = installThemeStorage(CHOICE_SYSTEM);

    const store = createStore();

    expect(store.choice()).toBe(CHOICE_SYSTEM);
    expect(store.effective()).toBe("dark");
    expect(rootHasDark()).toBe(true);
  });

  it("falls back to system for corrupt values without overwriting them", () => {
    storage = installThemeStorage("bogus");

    const store = createStore();

    expect(store.choice()).toBe(CHOICE_SYSTEM);
    expect(store.effective()).toBe("light");
    expect(storage.getWrites()).toHaveLength(0);
    expect(storage.getState()).toBe("bogus");
  });

  it("falls back to system for empty and JSON-wrapped values", () => {
    for (const corrupt of ["", '"dark"', "{}", "null"]) {
      storage = installThemeStorage(corrupt);

      const store = createStore();

      expect(store.choice(), `input ${corrupt}`).toBe(CHOICE_SYSTEM);
      expect(storage.getWrites()).toHaveLength(0);
      expect(storage.getState(), `input ${corrupt}`).toBe(corrupt);
    }
  });

  it("never throws when storage access is blocked", () => {
    storage = installThemeStorage(null, { throwOnGet: true });

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
  let media: MediaQueryStub;
  let storage: StorageStub;

  beforeEach(() => {
    const handles = setupThemeTestBed();
    media = handles.media;
    storage = handles.storage;
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
    media = installThemeMediaQueryStub(true);

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
