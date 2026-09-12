import { computed } from "@angular/core";
import { patchState, signalStore, withComputed, withMethods, withState } from "@ngrx/signals";

import { safeParse } from "../validation/validation";
import { type Credential, credentialDraftSchema, credentialPatchSchema } from "./credential.schema";

interface VaultState {
  items: Credential[];
}

export const VaultStore = signalStore(
  { providedIn: "root" },
  withState<VaultState>({ items: [] }),
  withComputed(({ items }) => ({
    credentials: computed(() => [...items()]),
    count: computed(() => items().length),
  })),
  withMethods((store) => ({
    add(draft: unknown): void {
      const result = safeParse(credentialDraftSchema, draft);
      if (!result.success) {
        return;
      }
      const validated = result.value;
      const entry: Credential = {
        ...validated,
        id: crypto.randomUUID(),
        created_at: new Date().toISOString(),
      };
      patchState(store, { items: [...store.items(), entry] });
    },

    update(id: string, patch: unknown): void {
      const result = safeParse(credentialPatchSchema, patch);
      if (!result.success) {
        return;
      }
      const validated = result.value;
      const existing = store.items();
      const index = existing.findIndex((item) => item.id === id);
      if (index === -1) {
        return;
      }
      const merged: Credential = {
        ...existing[index],
        ...validated,
        updated_at: new Date().toISOString(),
      };
      const next = [...existing];
      next[index] = merged;
      patchState(store, { items: next });
    },

    delete(id: string): void {
      const existing = store.items();
      if (!existing.some((item) => item.id === id)) {
        return;
      }
      patchState(store, { items: existing.filter((item) => item.id !== id) });
    },

    getById(id: string): Credential | undefined {
      return store.items().find((item) => item.id === id);
    },
  })),
);

export type VaultStoreInstance = InstanceType<typeof VaultStore>;
