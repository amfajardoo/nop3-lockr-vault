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
  adjustWithKeyboard: {
    id: "theme-toggle-adjust-with-keyboard",
    title: "The user adjusts the theme with the keyboard",
    steps: [
      given(themeSteps.appOpen),
      when(themeSteps.focusSystem),
      when(themeSteps.pressLeft),
      then(themeSteps.darkCheckedAndFocused),
      when(themeSteps.pressHome),
      then(themeSteps.lightCheckedAndFocused),
      when(themeSteps.pressEnd),
      then(themeSteps.systemCheckedAndFocused),
    ],
  },
  explicitSystemFollowsOs: {
    id: "theme-toggle-explicit-system-follows-os",
    title: "An explicit System choice overrides a stored dark choice and follows the OS",
    steps: [
      given(themeSteps.storedDarkChoice),
      when(themeSteps.selectSystem),
      then(themeSteps.systemChecked),
      then(themeSteps.systemStored),
      when(themeSteps.osDark),
      then(themeSteps.systemDark),
      when(themeSteps.osLight),
      then(themeSteps.systemLight),
    ],
  },
} satisfies Record<string, UserFlow>;
