import { Component, inject } from "@angular/core";
import { MockDataService } from "../../vault/vault.service";
import { VaultStore } from "../../vault/vault.store";
import { CredentialList } from "./credential-list";

@Component({
  selector: "credential-list-story-seeded",
  imports: [CredentialList],
  template: "<credential-list />",
})
class SeededStory {
  constructor() {
    const store = inject(VaultStore);
    if (store.count() === 0) {
      for (const seed of inject(MockDataService).getSeedCredentials()) {
        store.add(seed);
      }
    }
  }
}

@Component({
  selector: "credential-list-story-empty",
  imports: [CredentialList],
  template: "<credential-list />",
})
class EmptyStory {}

export const Seeded = SeededStory;
export const Empty = EmptyStory;
