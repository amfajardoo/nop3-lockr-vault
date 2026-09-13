import { Component, inject } from "@angular/core";
import { MatRadioButton, MatRadioGroup } from "@angular/material/radio";

import { ThemeStore } from "@theme/theme.store";
import { CHOICE_DARK, CHOICE_LIGHT, CHOICE_SYSTEM } from "@theme/theme-contract";

interface ThemeOption {
  value: string;
  shortLabel: string;
}

@Component({
  selector: "theme-toggle",
  imports: [MatRadioGroup, MatRadioButton],
  templateUrl: "./theme-toggle.html",
})
export class ThemeToggle {
  protected readonly store = inject(ThemeStore);

  protected readonly options: readonly ThemeOption[] = [
    { value: CHOICE_LIGHT, shortLabel: "Light" },
    { value: CHOICE_DARK, shortLabel: "Dark" },
    { value: CHOICE_SYSTEM, shortLabel: "System" },
  ];

  protected select(value: string): void {
    this.store.setChoice(value);
  }
}
