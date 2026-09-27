import { MediaMatcher } from "@angular/cdk/layout";
import { Component, DestroyRef, inject, signal } from "@angular/core";
import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";
import { MatListModule } from "@angular/material/list";
import { MatSidenavModule } from "@angular/material/sidenav";
import { MatToolbarModule } from "@angular/material/toolbar";
import { RouterLink, RouterLinkActive, RouterOutlet } from "@angular/router";

import { ThemeToggle } from "../theme-toggle/theme-toggle";
import { NAV_ITEMS } from "./nav-items";

const WIDE_QUERY = "(min-width: 960px)";

@Component({
  selector: "app-dashboard",
  imports: [
    RouterLink,
    RouterLinkActive,
    RouterOutlet,
    MatButtonModule,
    MatIconModule,
    MatListModule,
    MatSidenavModule,
    MatToolbarModule,
    ThemeToggle,
  ],
  templateUrl: "./dashboard.html",
  styleUrl: "./dashboard.css",
})
export class Dashboard {
  private readonly mediaMatcher = inject(MediaMatcher);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly navItems = NAV_ITEMS;
  protected readonly title = "Lockr Vault";
  protected readonly wide = signal(false);

  constructor() {
    const wideQuery = this.mediaMatcher.matchMedia(WIDE_QUERY);
    this.wide.set(wideQuery.matches);
    const onChange = (event: { matches: boolean }) => {
      this.wide.set(event.matches);
    };
    wideQuery.addEventListener("change", onChange);
    this.destroyRef.onDestroy(() => wideQuery.removeEventListener("change", onChange));
  }
}
