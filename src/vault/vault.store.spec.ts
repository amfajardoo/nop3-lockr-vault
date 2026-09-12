import { inject } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import { afterEach, beforeEach, expect, it } from "vitest";

import { VaultStore, type VaultStoreInstance } from "./vault.store";

const FIXED_UUID = "10000000-0000-4000-8000-000000000001";

function uuidSequence(start: number): () => string {
  let n = start;
  return () => `10000000-0000-4000-8000-${`${n++}`.padStart(12, "0")}`;
}

function createStore(): VaultStoreInstance {
  return TestBed.runInInjectionContext(() => inject(VaultStore));
}

describe("vault store (feature 008, US2): credential lifecycle in memory", () => {
  const originalRandomUUID = globalThis.crypto.randomUUID;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [VaultStore] });
    globalThis.crypto.randomUUID = uuidSequence(1) as typeof globalThis.crypto.randomUUID;
  });

  afterEach(() => {
    globalThis.crypto.randomUUID = originalRandomUUID;
  });

  it("starts empty and reflects a single seeded credential", () => {
    const store = createStore();

    store.add({ name: "GitHub", username: "octocat", domain: "github.com", password: "hunter2" });

    expect(store.count()).toBe(1);
    expect(store.credentials()[0]?.name).toBe("GitHub");
  });

  it("assigns a stable UUID and created_at on add and omits updated_at", () => {
    const store = createStore();

    store.add({ name: "GitHub", username: "octocat", domain: "github.com", password: "hunter2" });

    const [entry] = store.credentials();
    expect(entry?.id).toBe(FIXED_UUID);
    expect(entry?.created_at).toBeDefined();
    expect(entry?.updated_at).toBeUndefined();
    expect(entry?.favorite).toBe(false);
    expect(entry?.notes).toBe("");
  });

  it("assigns unique ids across sequential adds", () => {
    const store = createStore();

    store.add({ name: "A", username: "u", domain: "a.com", password: "p1" });
    store.add({ name: "B", username: "v", domain: "b.com", password: "p2" });

    const ids = store.credentials().map((credential) => credential.id);
    expect(ids[0]).not.toBe(ids[1]);
  });

  it("rejects an invalid add payload without throwing and without mutating state", () => {
    const store = createStore();
    store.add({ name: "A", username: "u", domain: "a.com", password: "p1" });
    const before = store.credentials();

    const act = (): void => {
      store.add({ name: "" });
    };

    expect(act).not.toThrow();
    expect(store.count()).toBe(1);
    expect(store.credentials()).toEqual(before);
  });

  it("updates provided fields, sets updated_at, preserves created_at", () => {
    const store = createStore();
    store.add({ name: "GitHub", username: "octocat", domain: "github.com", password: "hunter2" });
    const created = store.credentials()[0];

    store.update(FIXED_UUID, { password: "new-pass", name: "GH" });

    const updated = store.credentials()[0];
    expect(updated?.name).toBe("GH");
    expect(updated?.password).toBe("new-pass");
    expect(updated?.username).toBe("octocat");
    expect(updated?.created_at).toBe(created?.created_at);
    expect(updated?.updated_at).toBeDefined();
  });

  it("preserves omitted fields with a patch that only touches a subset", () => {
    const store = createStore();
    store.add({ name: "GitHub", username: "octocat", domain: "github.com", password: "hunter2" });

    store.update(FIXED_UUID, { favorite: true });

    const updated = store.credentials()[0];
    expect(updated?.favorite).toBe(true);
    expect(updated?.name).toBe("GitHub");
    expect(updated?.notes).toBe("");
  });

  it("treats an update with an unknown id as a no-op without throwing", () => {
    const store = createStore();
    store.add({ name: "A", username: "u", domain: "a.com", password: "p1" });
    const before = store.credentials();

    const act = (): void => {
      store.update("00000000-0000-4000-8000-000000000099", { name: "X" });
    };

    expect(act).not.toThrow();
    expect(store.credentials()).toEqual(before);
  });

  it("rejects an invalid update patch without throwing and without mutating state", () => {
    const store = createStore();
    store.add({ name: "A", username: "u", domain: "a.com", password: "p1" });
    const before = store.credentials();

    const act = (): void => {
      store.update(FIXED_UUID, { favorite: "yes" });
    };

    expect(act).not.toThrow();
    expect(store.credentials()).toEqual(before);
  });

  it("deletes a credential by id", () => {
    const store = createStore();
    store.add({ name: "A", username: "u", domain: "a.com", password: "p1" });
    store.add({ name: "B", username: "v", domain: "b.com", password: "p2" });

    store.delete(FIXED_UUID);

    expect(store.count()).toBe(1);
    expect(store.credentials()[0]?.name).toBe("B");
  });

  it("treats a delete with an unknown id as a no-op without throwing", () => {
    const store = createStore();
    store.add({ name: "A", username: "u", domain: "a.com", password: "p1" });
    const before = store.credentials();

    const act = (): void => {
      store.delete("00000000-0000-4000-8000-000000000099");
    };

    expect(act).not.toThrow();
    expect(store.credentials()).toEqual(before);
  });

  it("returns the matching credential via getById, undefined otherwise", () => {
    const store = createStore();
    store.add({ name: "GitHub", username: "octocat", domain: "github.com", password: "hunter2" });

    expect(store.getById(FIXED_UUID)?.name).toBe("GitHub");
    expect(store.getById("00000000-0000-4000-8000-000000000099")).toBeUndefined();
  });

  it("mutating the exposed list does not corrupt the store state", () => {
    const store = createStore();

    const first = store.credentials();
    first.push({
      id: "x",
      name: "Injected",
      username: "u",
      domain: "d.com",
      password: "p",
      favorite: false,
      notes: "",
    });

    expect(store.count()).toBe(0);
    expect(store.getById("x")).toBeUndefined();
  });
});
