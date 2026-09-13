import { Component, inject } from "@angular/core";
import { RouterOutlet } from "@angular/router";
import { MockDataService } from "../vault/vault.service";
import { VaultStore } from "../vault/vault.store";

@Component({
  selector: "app-root",
  imports: [RouterOutlet],
  templateUrl: "./app.html",
  styleUrl: "./app.css",
})
export class App {
  constructor() {
    const store = inject(VaultStore);
    const seeds = inject(MockDataService).getSeedCredentials();
    if (store.count() === 0) {
      for (const seed of seeds) {
        store.add(seed);
      }
    }
  }
}
