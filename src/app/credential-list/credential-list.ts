import { Component, computed, inject } from "@angular/core";
import { MatButtonModule } from "@angular/material/button";
import { MatCardModule } from "@angular/material/card";
import { MatDialog } from "@angular/material/dialog";
import { MatListModule } from "@angular/material/list";
import { RouterLink } from "@angular/router";
import type { Credential } from "../../vault/credential.schema";
import { VaultStore } from "../../vault/vault.store";
import { CredentialDeleteDialog } from "./credential-delete-dialog";

@Component({
  selector: "credential-list",
  imports: [MatButtonModule, MatCardModule, MatListModule, RouterLink],
  templateUrl: "./credential-list.html",
  styleUrl: "./credential-list.css",
})
export class CredentialList {
  private readonly dialog = inject(MatDialog);
  protected readonly store = inject(VaultStore);
  protected readonly credentials = computed(() => this.store.credentials());
  protected readonly count = computed(() => this.store.count());

  protected requestDelete(credential: Credential): void {
    this.dialog
      .open(CredentialDeleteDialog, { data: { name: credential.name } })
      .afterClosed()
      .subscribe((confirmed) => {
        if (confirmed === true) {
          this.store.delete(credential.id);
        }
      });
  }
}
