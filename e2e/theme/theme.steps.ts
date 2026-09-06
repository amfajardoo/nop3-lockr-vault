export const themeSteps = {
  appOpen: "the app is open at the root with the shell rendered",
  selectDark: "the user selects the Dark option in the theme switcher",
  darkChecked: "the Dark option is the checked radio in the switcher",
  rootDark: "the document root carries the dark class",
  storedDark: "localStorage lockr.theme equals 'dark'",
  reload: "the page reloads",
  darkPersists: "the Dark option is still checked and the root still carries the dark class",
  noStoredChoice: "the app is open with no stored theme choice",
  osLight: "the OS color scheme is set to light",
  systemLight: "the System option is checked and the root carries no dark class",
  osDark: "the OS color scheme switches to dark",
  systemDark: "the root carries the dark class while the System option stays checked",
  shellRendered: "the app is open at the root with the shell and theme switcher rendered",
  axeRuns: "an AXE scan runs on the visible page",
  noViolations: "no serious or critical violations are reported",
} as const;

export type ThemeStep = (typeof themeSteps)[keyof typeof themeSteps];
