import { given, then, type UserFlow, when } from "../support/flow";
import { themeSteps } from "./theme.steps";

export const themeToggleFlows = {
  switchToDark: {
    id: "theme-toggle-switch-to-dark",
    title: "The user switches the theme to dark and the choice persists across reloads",
    steps: [
      given(themeSteps.appOpen),
      when(themeSteps.selectDark),
      then(themeSteps.darkChecked),
      then(themeSteps.rootDark),
      then(themeSteps.storedDark),
      when(themeSteps.reload),
      then(themeSteps.darkPersists),
    ],
  },
  systemFollowsOs: {
    id: "theme-toggle-system-follows-os",
    title: "With choice system, the theme follows the OS preference",
    steps: [
      given(themeSteps.noStoredChoice),
      when(themeSteps.osLight),
      then(themeSteps.systemLight),
      when(themeSteps.osDark),
      then(themeSteps.systemDark),
    ],
  },
  axeScan: {
    id: "theme-toggle-axe-scan",
    title: "The rendered shell and theme switcher pass a real-browser AXE scan",
    steps: [
      given(themeSteps.shellRendered),
      when(themeSteps.axeRuns),
      then(themeSteps.noViolations),
    ],
  },
} satisfies Record<string, UserFlow>;
