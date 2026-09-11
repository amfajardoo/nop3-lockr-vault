import { Component } from "@angular/core";
import { RouterLink, RouterLinkActive, RouterOutlet } from "@angular/router";

import { ThemeToggle } from "../theme-toggle/theme-toggle";
import { NAV_ITEMS } from "./nav-items";

@Component({
  selector: "app-dashboard",
  imports: [RouterLink, RouterLinkActive, RouterOutlet, ThemeToggle],
  templateUrl: "./dashboard.html",
  styleUrl: "./dashboard.css",
})
export class Dashboard {
  protected readonly navItems = NAV_ITEMS;
  protected readonly title = "Lockr Vault";
}
