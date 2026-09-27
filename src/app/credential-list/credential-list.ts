import { Component, computed, inject, signal } from "@angular/core";
import { MatButtonModule } from "@angular/material/button";
import { MatCardModule } from "@angular/material/card";
import { MatDialog } from "@angular/material/dialog";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatIconModule } from "@angular/material/icon";
import { MatInputModule } from "@angular/material/input";
import { MatListModule } from "@angular/material/list";
import { RouterLink } from "@angular/router";
import type { Credential } from "../../vault/credential.schema";
import { VaultStore } from "../../vault/vault.store";
import { CredentialDeleteDialog } from "./credential-delete-dialog";

export function matchesQuery(credential: Credential, query: string): boolean {
  const normalized = query.trim().toLowerCase();
  if (normalized === "") {
    return true;
  }
  return [credential.name, credential.username, credential.domain].some((field) =>
    field.toLowerCase().includes(normalized),
  );
}

@Component({
  selector: "credential-list",
  imports: [
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatListModule,
    RouterLink,
  ],
  templateUrl: "./credential-list.html",
  styleUrl: "./credential-list.css",
})
export class CredentialList {
  private readonly dialog = inject(MatDialog);
  protected readonly store = inject(VaultStore);
  protected readonly query = signal("");
  protected readonly favoritesOnly = signal(false);

  protected readonly credentials = computed(() => this.store.credentials());
  protected readonly count = computed(() => this.store.count());

  protected readonly visibleCredentials = computed(() => {
    const query = this.query();
    const onlyFavorites = this.favoritesOnly();
    return this.credentials().filter(
      (credential) => (!onlyFavorites || credential.favorite) && matchesQuery(credential, query),
    );
  });

  protected readonly visibleCount = computed(() => this.visibleCredentials().length);

  protected readonly hasActiveView = computed(
    () => this.query().trim() !== "" || this.favoritesOnly(),
  );

  protected updateQuery(value: string): void {
    this.query.set(value);
  }

  protected toggleFavoritesOnly(): void {
    this.favoritesOnly.update((current) => !current);
  }

  protected toggleFavorite(credential: Credential): void {
    this.store.update(credential.id, { favorite: !credential.favorite });
  }

  protected resetView(): void {
    this.query.set("");
    this.favoritesOnly.set(false);
  }

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
