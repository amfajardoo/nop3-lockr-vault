import { Component, signal } from "@angular/core";
import { RouterOutlet } from "@angular/router";

import { ThemeToggle } from "./theme-toggle/theme-toggle";

@Component({
  selector: "app-root",
  imports: [RouterOutlet, ThemeToggle],
  templateUrl: "./app.html",
  styleUrl: "./app.css",
})
export class App {
  protected readonly title = signal("Lockr Vault");
}
