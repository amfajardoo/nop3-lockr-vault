import { Component } from "@angular/core";
import { MatButtonModule } from "@angular/material/button";
import { MatListModule } from "@angular/material/list";
import { MatSidenavModule } from "@angular/material/sidenav";
import { MatToolbarModule } from "@angular/material/toolbar";
import { RouterLink, RouterLinkActive, RouterOutlet } from "@angular/router";

import { ThemeToggle } from "../theme-toggle/theme-toggle";
import { NAV_ITEMS } from "./nav-items";

@Component({
  selector: "app-dashboard",
  imports: [
    RouterLink,
    RouterLinkActive,
    RouterOutlet,
    MatButtonModule,
    MatListModule,
    MatSidenavModule,
    MatToolbarModule,
    ThemeToggle,
  ],
  templateUrl: "./dashboard.html",
  styleUrl: "./dashboard.css",
})
export class Dashboard {
  protected readonly navItems = NAV_ITEMS;
  protected readonly title = "Lockr Vault";
}
