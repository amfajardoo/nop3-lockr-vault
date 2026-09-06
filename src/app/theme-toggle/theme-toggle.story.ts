import { Component, inject } from "@angular/core";
import { ThemeStore } from "@theme/theme.store";
import { CHOICE_DARK } from "@theme/theme-contract";

import { ThemeToggle } from "./theme-toggle";

@Component({
  selector: "theme-toggle-story-dark",
  imports: [ThemeToggle],
  template: "<theme-toggle />",
})
class DarkStory {
  constructor() {
    inject(ThemeStore).setChoice(CHOICE_DARK);
  }
}

export const Primary = ThemeToggle;
export const Dark = DarkStory;
