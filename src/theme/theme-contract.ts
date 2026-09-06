/**
 * Theme resolution contract (feature 002, US1/US2).
 *
 * The persisted key and its allowed values are fixed by the cross-feature
 * contract (contracts/theme-choice.schema.json); feature 003 owns the writer.
 */

/** Storage key that holds the user's theme choice (schema: light | dark | system). */
export const THEME_STORAGE_KEY = "lockr.theme";

export const CHOICE_LIGHT = "light";
export const CHOICE_DARK = "dark";
export const CHOICE_SYSTEM = "system";

/** Media query consulted when no explicit choice is stored / honoured. */
export const DARK_SCHEME_QUERY = "(prefers-color-scheme: dark)";

export type ResolvedTheme = "light" | "dark";

/**
 * Resolves the effective theme from a stored value and the OS preference.
 * Only an explicit "light"/"dark" choice wins; everything else (missing,
 * "system", malformed, unreadable storage) falls back to the OS preference.
 */
export function resolveEffectiveTheme(
  stored: string | null | undefined,
  systemDark: boolean,
): ResolvedTheme {
  if (stored === CHOICE_LIGHT) {
    return CHOICE_LIGHT;
  }
  if (stored === CHOICE_DARK) {
    return CHOICE_DARK;
  }
  return systemDark ? CHOICE_DARK : CHOICE_LIGHT;
}
