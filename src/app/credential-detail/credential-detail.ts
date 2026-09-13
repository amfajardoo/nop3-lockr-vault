import { Component, inject, signal } from "@angular/core";
import { ActivatedRoute, RouterLink } from "@angular/router";
import { VaultStore } from "../../vault/vault.store";

@Component({
  selector: "credential-detail",
  imports: [RouterLink],
  templateUrl: "./credential-detail.html",
  styleUrl: "./credential-detail.css",
})
export class CredentialDetail {
  protected readonly store = inject(VaultStore);
  protected readonly revealed = signal(false);
  private readonly route = inject(ActivatedRoute);

  protected get credential() {
    const id = this.route.snapshot.paramMap.get("id") ?? "";
    return this.store.getById(id);
  }
}
