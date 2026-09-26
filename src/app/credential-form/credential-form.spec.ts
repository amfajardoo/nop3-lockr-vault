import { inject } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import { MatButtonHarness } from "@angular/material/button/testing";
import { MatCardHarness } from "@angular/material/card/testing";
import { MatFormFieldHarness } from "@angular/material/form-field/testing";
import { MatInputHarness } from "@angular/material/input/testing";
import { MatNavListItemHarness } from "@angular/material/list/testing";
import { provideRouter, withComponentInputBinding } from "@angular/router";
import { RouterTestingHarness } from "@angular/router/testing";
import { cleanState } from "@testing/clean-state";
import { routerHarnessLoader, setupModule } from "@testing/setup-module";
import { credentialDraftSchema } from "../../vault/credential.schema";
import { VaultStore, type VaultStoreInstance } from "../../vault/vault.store";
import { CredentialDetail } from "../credential-detail/credential-detail";
import { CredentialList } from "../credential-list/credential-list";
import { CredentialForm } from "./credential-form";

const testRoutes = [
  { path: "credentials/new", component: CredentialForm },
  { path: "credentials/:id/edit", component: CredentialForm },
  { path: "credentials/:id", component: CredentialDetail },
  { path: "", component: CredentialList },
];

const routerProviders = provideRouter(testRoutes, withComponentInputBinding());

function store(): VaultStoreInstance {
  return TestBed.runInInjectionContext(() => inject(VaultStore));
}

const SEED = {
  name: "GitHub",
  username: "octocat",
  domain: "github.com",
  password: "hunter2",
  notes: "team account",
};

type FieldKey = "name" | "username" | "domain" | "password" | "notes";

async function fillFields(
  harness: RouterTestingHarness,
  values: Partial<Record<FieldKey, string>>,
): Promise<void> {
  const inputs = await routerHarnessLoader(harness).getAllHarnesses(MatInputHarness);
  const order: FieldKey[] = ["name", "username", "domain", "password", "notes"];
  for (const [index, key] of order.entries()) {
    const value = values[key];
    if (value !== undefined) {
      await inputs[index].setValue(value);
    }
  }
}

async function activate(harness: RouterTestingHarness, text: string): Promise<void> {
  const button = await routerHarnessLoader(harness).getHarness(MatButtonHarness.with({ text }));
  await button.click();
  await harness.fixture.whenStable();
}

describe("CredentialForm (feature 014, US1): the user creates a new credential", () => {
  const state = cleanState(() => {
    setupModule({ providers: [VaultStore, routerProviders] });

    return { countBefore: store().count() };
  });

  async function openCreate(): Promise<RouterTestingHarness> {
    const harness = await RouterTestingHarness.create("/credentials/new");
    await harness.fixture.whenStable();
    return harness;
  }

  it("adds a credential with the entered values and lands on the list", async () => {
    const harness = await openCreate();

    await fillFields(harness, {
      name: "Bitwarden",
      username: "ana",
      domain: "bitwarden.com",
      password: "s3cret",
      notes: "personal",
    });
    await activate(harness, "Save");

    const entries = store().credentials();
    expect(entries).toHaveLength(1);
    expect(entries[0]).toMatchObject({
      name: "Bitwarden",
      username: "ana",
      domain: "bitwarden.com",
      password: "s3cret",
      notes: "personal",
      favorite: false,
    });
    const rows = await routerHarnessLoader(harness).getAllHarnesses(MatNavListItemHarness);
    expect(rows).toHaveLength(1);
    expect(await rows[0].getText()).toContain("Bitwarden");
  });

  it("blocks an empty required field with an error and no store mutation", async () => {
    const harness = await openCreate();

    await fillFields(harness, {
      username: "ana",
      domain: "bitwarden.com",
      password: "s3cret",
    });
    await activate(harness, "Save");

    expect(store().count()).toBe(state.countBefore);
    const fields = await routerHarnessLoader(harness).getAllHarnesses(MatFormFieldHarness);
    expect(fields).toHaveLength(5);
    const errors = await fields[0].getTextErrors();
    expect(errors.join(" ")).toContain("Name is required.");
  });

  it("cancel navigates back without mutating the store", async () => {
    const harness = await openCreate();

    await fillFields(harness, { name: "Discarded" });
    await activate(harness, "Cancel");

    expect(store().count()).toBe(state.countBefore);
    const cards = await routerHarnessLoader(harness).getAllHarnesses(MatCardHarness);
    const texts = await Promise.all(cards.map((card) => card.getText()));
    expect(texts.join(" ")).toContain("Your vault is empty");
  });
});

describe("CredentialForm (feature 014, US2): the user edits an existing credential", () => {
  const state = cleanState(() => {
    setupModule({ providers: [VaultStore, routerProviders] });
    store().add(SEED);
    const id = store().credentials()[0].id;

    return { id };
  });

  async function openEdit(): Promise<RouterTestingHarness> {
    const harness = await RouterTestingHarness.create(`/credentials/${state.id}/edit`);
    await harness.fixture.whenStable();
    return harness;
  }

  it("prefills every field with the credential's current values", async () => {
    const harness = await openEdit();

    const inputs = await routerHarnessLoader(harness).getAllHarnesses(MatInputHarness);
    expect(await inputs[0].getValue()).toBe(SEED.name);
    expect(await inputs[1].getValue()).toBe(SEED.username);
    expect(await inputs[2].getValue()).toBe(SEED.domain);
    expect(await inputs[3].getValue()).toBe(SEED.password);
    expect(await inputs[4].getValue()).toBe(SEED.notes);
  });

  it("saves the change, bumps updated_at and shows it on the detail view", async () => {
    const harness = await openEdit();
    const before = store().credentials()[0];

    await fillFields(harness, { name: "GitHub Work" });
    await activate(harness, "Save");

    const after = store().credentials()[0];
    expect(after.name).toBe("GitHub Work");
    expect(after.username).toBe(SEED.username);
    expect(after.domain).toBe(SEED.domain);
    expect(after.password).toBe(SEED.password);
    expect(after.updated_at).toBeDefined();
    expect(after.created_at).toBe(before.created_at);

    const card = await routerHarnessLoader(harness).getHarness(MatCardHarness);
    expect(await card.getText()).toContain("GitHub Work");
  });

  it("cancel returns to the detail view with the original values", async () => {
    const harness = await openEdit();

    await fillFields(harness, { name: "Discarded" });
    await activate(harness, "Cancel");

    expect(store().credentials()[0].name).toBe(SEED.name);
    const card = await routerHarnessLoader(harness).getHarness(MatCardHarness);
    expect(await card.getText()).toContain(SEED.name);
  });

  it("renders a not-found state for an unknown edit id without crashing", async () => {
    const harness = await RouterTestingHarness.create("/credentials/bogus-id/edit");
    await harness.fixture.whenStable();

    const card = await routerHarnessLoader(harness).getHarness(MatCardHarness);
    expect(await card.getText()).toContain("Credential not found");
    const fields = await routerHarnessLoader(harness).getAllHarnesses(MatFormFieldHarness);
    expect(fields).toHaveLength(0);
  });
});

describe("CredentialForm (feature 014, US3): invalid input is explained accessibly", () => {
  const state = cleanState(() => {
    setupModule({ providers: [VaultStore, routerProviders] });

    return { countBefore: store().count() };
  });

  async function openInvalidCreate(): Promise<RouterTestingHarness> {
    const harness = await RouterTestingHarness.create("/credentials/new");
    await harness.fixture.whenStable();
    await fillFields(harness, { username: "ana", domain: "bitwarden.com", password: "s3cret" });
    await activate(harness, "Save");
    return harness;
  }

  it("shows an associated error on the offending field after a submit attempt", async () => {
    const harness = await openInvalidCreate();

    const nameField = await routerHarnessLoader(harness).getHarness(
      MatFormFieldHarness.with({ floatingLabelText: "Name" }),
    );
    expect(await nameField.getLabel()).toBe("Name");
    expect((await nameField.getTextErrors()).join(" ")).toContain("Name is required.");
    expect(await nameField.hasErrors()).toBe(true);

    const nameInput = await nameField.getControl(MatInputHarness);
    expect(nameInput).toBeTruthy();
    await nameInput?.focus();
    expect(await nameInput?.isFocused()).toBe(true);
    expect(store().count()).toBe(state.countBefore);
  });

  it("clears the error once fixed while sibling values are preserved", async () => {
    const harness = await openInvalidCreate();

    const nameField = await routerHarnessLoader(harness).getHarness(
      MatFormFieldHarness.with({ floatingLabelText: "Name" }),
    );
    expect(await nameField.hasErrors()).toBe(true);

    const inputs = await routerHarnessLoader(harness).getAllHarnesses(MatInputHarness);
    await inputs[0].setValue("Bitwarden");

    expect(await nameField.hasErrors()).toBe(false);
    expect(await inputs[1].getValue()).toBe("ana");
    expect(await inputs[2].getValue()).toBe("bitwarden.com");
    expect(await inputs[3].getValue()).toBe("s3cret");
  });

  it("accepts whitespace-only input exactly like the zod contract does", async () => {
    const harness = await RouterTestingHarness.create("/credentials/new");
    await harness.fixture.whenStable();

    await fillFields(harness, { name: " ", username: "ana", domain: "d.com", password: "p" });
    const schemaAccepts = credentialDraftSchema.safeParse({
      name: " ",
      username: "ana",
      domain: "d.com",
      password: "p",
      notes: "",
    }).success;
    await activate(harness, "Save");

    expect(schemaAccepts).toBe(true);
    expect(store().count()).toBe(1);
    expect(store().credentials()[0].name).toBe(" ");
  });

  it("never produces two entries from repeated save activations", async () => {
    const harness = await RouterTestingHarness.create("/credentials/new");
    await harness.fixture.whenStable();

    await fillFields(harness, { name: "Once", username: "u", domain: "d.com", password: "p" });
    const button = await routerHarnessLoader(harness).getHarness(
      MatButtonHarness.with({ text: "Save" }),
    );
    await button.click();
    await button.click();
    await harness.fixture.whenStable();

    expect(store().count()).toBe(1);
  });
});

describe("CredentialForm (feature 014): route resolution", () => {
  cleanState(() => {
    setupModule({ providers: [VaultStore, routerProviders] });

    return {};
  });

  it("resolves /credentials/new to the create form, not a not-found state", async () => {
    const harness = await RouterTestingHarness.create("/credentials/new");
    await harness.fixture.whenStable();

    const fields = await routerHarnessLoader(harness).getAllHarnesses(MatFormFieldHarness);
    expect(fields).toHaveLength(5);
    const card = await routerHarnessLoader(harness).getHarness(MatCardHarness);
    expect(await card.getText()).toContain("New credential");
    expect(await card.getText()).not.toContain("Credential not found");
  });
});
