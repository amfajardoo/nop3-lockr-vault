import { Component, computed, inject, input, signal } from "@angular/core";
import { MatButtonModule } from "@angular/material/button";
import { MatCardModule } from "@angular/material/card";
import { MatIconModule } from "@angular/material/icon";
import { RouterLink } from "@angular/router";
import { VaultStore } from "../../vault/vault.store";

@Component({
  selector: "credential-detail",
  imports: [MatButtonModule, MatCardModule, MatIconModule, RouterLink],
  templateUrl: "./credential-detail.html",
  styleUrl: "./credential-detail.css",
})
export class CredentialDetail {
  protected readonly store = inject(VaultStore);
  protected readonly revealed = signal(false);
  protected readonly id = input.required<string>();

  protected readonly credential = computed(() => this.store.getById(this.id()));
}
