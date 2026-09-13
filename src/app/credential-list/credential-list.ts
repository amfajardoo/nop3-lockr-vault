import { Component, computed, type ElementRef, inject, signal, viewChild } from "@angular/core";
import { RouterLink } from "@angular/router";
import type { Credential } from "../../vault/credential.schema";
import { VaultStore } from "../../vault/vault.store";

@Component({
  selector: "credential-list",
  imports: [RouterLink],
  templateUrl: "./credential-list.html",
  styleUrl: "./credential-list.css",
  host: { "(keydown.escape)": "cancelDelete()" },
})
export class CredentialList {
  protected readonly store = inject(VaultStore);
  protected readonly pendingDelete = signal<Credential | null>(null);
  private readonly dialogRef = viewChild.required<ElementRef<HTMLDialogElement>>("deleteDialog");

  protected readonly credentials = computed(() => this.store.credentials());
  protected readonly count = computed(() => this.store.count());

  protected requestDelete(credential: Credential): void {
    this.pendingDelete.set(credential);
    this.dialogRef().nativeElement.showModal();
  }

  protected confirmDelete(): void {
    const credential = this.pendingDelete();
    if (credential) {
      this.store.delete(credential.id);
    }
    this.closeDialog();
  }

  protected cancelDelete(): void {
    this.closeDialog();
  }

  protected onDialogClose(): void {
    if (this.pendingDelete()) {
      this.pendingDelete.set(null);
    }
  }

  private closeDialog(): void {
    this.dialogRef().nativeElement.close();
    this.pendingDelete.set(null);
  }
}
