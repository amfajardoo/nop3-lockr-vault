import { Component } from "@angular/core";

import { TestBed } from "@angular/core/testing";

import { Dashboard } from "@app/dashboard/dashboard";
import { ThemeToggle } from "@app/theme-toggle/theme-toggle";

@Component({
  selector: "theme-toggle",
  template: "",
})
export class ThemeToggleStub {}

export function replaceThemeToggleWithStub(): void {
  TestBed.overrideComponent(Dashboard, {
    remove: { imports: [ThemeToggle] },
    add: { imports: [ThemeToggleStub] },
  });
}
