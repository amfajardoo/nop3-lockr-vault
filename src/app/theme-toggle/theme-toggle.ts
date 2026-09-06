import { Component, inject } from "@angular/core";

import { ThemeStore } from "@theme/theme.store";
import { CHOICE_DARK, CHOICE_LIGHT, CHOICE_SYSTEM } from "@theme/theme-contract";

interface ThemeOption {
  value: string;
  label: string;
  shortLabel: string;
}

@Component({
  selector: "theme-toggle",
  templateUrl: "./theme-toggle.html",
})
export class ThemeToggle {
  protected readonly store = inject(ThemeStore);

  protected readonly options: readonly ThemeOption[] = [
    { value: CHOICE_LIGHT, label: "Light theme", shortLabel: "Light" },
    { value: CHOICE_DARK, label: "Dark theme", shortLabel: "Dark" },
    { value: CHOICE_SYSTEM, label: "System theme", shortLabel: "System" },
  ];

  protected isSelected(value: string): boolean {
    return this.store.choice() === value;
  }

  protected tabIndexOf(value: string): number {
    return this.isSelected(value) ? 0 : -1;
  }

  protected select(value: string): void {
    this.store.setChoice(value);
  }

  protected onKeydown(event: KeyboardEvent): void {
    const order = this.options.map((option) => option.value);
    const current = order.indexOf(this.store.choice());
    let next = current;
    switch (event.key) {
      case "ArrowRight":
      case "ArrowDown":
        next = (current + 1) % order.length;
        break;
      case "ArrowLeft":
      case "ArrowUp":
        next = (current - 1 + order.length) % order.length;
        break;
      case "Home":
        next = 0;
        break;
      case "End":
        next = order.length - 1;
        break;
      default:
        return;
    }
    event.preventDefault();
    const value = order[next] as string;
    this.select(value);
    this.focusOption(value);
  }

  protected focusOption(value: string): void {
    const option = document.querySelector<HTMLInputElement>(`[data-theme-option="${value}"]`);
    option?.focus();
  }
}
