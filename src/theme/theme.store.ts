import { computed } from "@angular/core";
import {
  patchState,
  signalStore,
  withComputed,
  withHooks,
  withMethods,
  withState,
} from "@ngrx/signals";

import { safeParse } from "../validation/validation";
import { type ThemeChoice, themeChoiceSchema } from "./theme-choice-schema";
import {
  CHOICE_DARK,
  CHOICE_LIGHT,
  CHOICE_SYSTEM,
  DARK_SCHEME_QUERY,
  type ResolvedTheme,
  THEME_STORAGE_KEY,
} from "./theme-contract";

interface ThemeState {
  choice: ThemeChoice;
  systemDark: boolean;
}

function readStoredChoice(): ThemeChoice {
  try {
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
    const result = safeParse(themeChoiceSchema, stored);
    return result.success ? result.value : CHOICE_SYSTEM;
  } catch {
    return CHOICE_SYSTEM;
  }
}

function systemDarkNow(): boolean {
  return window.matchMedia(DARK_SCHEME_QUERY).matches;
}

function persistStoredChoice(choice: ThemeChoice): void {
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, choice);
  } catch {
    // Blocked storage (private mode, quota) must never break a theme change.
  }
}

function applyRootMarker(effective: ResolvedTheme): void {
  document.documentElement.classList.toggle("dark", effective === CHOICE_DARK);
}

let osQuery: MediaQueryList | null = null;
let osHandler: ((event: MediaQueryListEvent) => void) | null = null;

export const ThemeStore = signalStore(
  { providedIn: "root" },
  withState<ThemeState>({ choice: CHOICE_SYSTEM, systemDark: false }),
  withComputed(({ choice, systemDark }) => {
    const effective = computed<ResolvedTheme>(() => {
      const ch = choice();
      if (ch === CHOICE_SYSTEM) {
        return systemDark() ? CHOICE_DARK : CHOICE_LIGHT;
      }
      return ch;
    });
    return { effective };
  }),
  withMethods((store) => ({
    setChoice(candidate: unknown): void {
      const result = safeParse(themeChoiceSchema, candidate);
      if (!result.success) {
        return;
      }
      patchState(store, { choice: result.value });
      persistStoredChoice(result.value);
      applyRootMarker(store.effective());
    },
  })),
  withHooks({
    onInit(store) {
      patchState(store, { choice: readStoredChoice(), systemDark: systemDarkNow() });
      applyRootMarker(store.effective());

      const handler = (event: MediaQueryListEvent): void => {
        patchState(store, { systemDark: event.matches });
        if (store.choice() === CHOICE_SYSTEM) {
          applyRootMarker(store.effective());
        }
      };
      if (osQuery && osHandler) {
        osQuery.removeEventListener("change", osHandler);
      }
      osHandler = handler;
      osQuery = window.matchMedia(DARK_SCHEME_QUERY);
      osQuery.addEventListener("change", handler);
    },
    onDestroy() {
      if (osQuery && osHandler) {
        osQuery.removeEventListener("change", osHandler);
      }
      osQuery = null;
      osHandler = null;
    },
  }),
);

export type ThemeStoreInstance = InstanceType<typeof ThemeStore>;
