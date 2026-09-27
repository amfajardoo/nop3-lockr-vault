import { inject } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import { MatButtonHarness } from "@angular/material/button/testing";
import { provideRouter, withComponentInputBinding } from "@angular/router";
import { RouterTestingHarness } from "@angular/router/testing";
import { cleanState } from "@testing/clean-state";
import { query, routerHarnessLoader, setupModule } from "@testing/setup-module";
import { VaultStore, type VaultStoreInstance } from "../vault/vault.store";
import { CredentialDetail } from "./credential-detail/credential-detail";
import { CredentialForm } from "./credential-form/credential-form";
import { CredentialList } from "./credential-list/credential-list";

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

interface PageHeader {
  title: HTMLElement;
  lede: HTMLElement;
  actions: HTMLElement | null;
}

function readHeader(harness: RouterTestingHarness): PageHeader {
  const title = query<HTMLElement>(harness.fixture, ".page-header h1");
  const lede = query<HTMLElement>(harness.fixture, ".page-header .page-lede");
  const actions = query<HTMLElement>(harness.fixture, ".page-header .page-header-actions");

  if (!title || !lede) {
    throw new Error("expected a page header with a title and supporting copy");
  }
  return { title, lede, actions };
}

describe("Page header (feature 016, US1): shared pattern on all four views", () => {
  const page = cleanState(() => {
    setupModule({ providers: [VaultStore, routerProviders] });
    store().add({
      name: "GitHub",
      username: "octocat",
      domain: "github.com",
      password: "hunter2",
    });
    return { seededId: store().credentials()[0]?.id ?? "" };
  });

  it("presents the credential list with title, supporting copy and a grouped Add action", async () => {
    const harness = await RouterTestingHarness.create("/");
    const { title, lede, actions } = readHeader(harness);
    const add = query<HTMLAnchorElement>(harness.fixture, ".page-header-actions a");

    expect(title.textContent?.trim()).toBe("Credentials");
    expect(title.getAttribute("id")).toBe("credential-list-heading");
    expect(lede.textContent?.trim()).toBe("Everything saved in your vault, in one place.");
    expect(actions).toBeTruthy();
    expect(add?.getAttribute("href")).toBe("/credentials/new");
  });

  it("presents the detail view with the credential name, supporting copy and a grouped Edit action", async () => {
    const harness = await RouterTestingHarness.create(`/credentials/${page.seededId}`);
    const { title, lede, actions } = readHeader(harness);
    const edit = await routerHarnessLoader(harness).getHarness(
      MatButtonHarness.with({ text: "Edit" }),
    );

    expect(title.textContent?.trim()).toBe("GitHub");
    expect(title.classList.contains("page-title")).toBe(true);
    expect(lede.textContent?.trim()).toBe("Credential details");
    expect(actions?.querySelector("a")?.getAttribute("href")).toBe(
      `/credentials/${page.seededId}/edit`,
    );
    expect(await edit.getText()).toBe("Edit");
  });

  it("presents the create form with title and supporting copy inside the header pattern", async () => {
    const harness = await RouterTestingHarness.create("/credentials/new");
    const { title, lede } = readHeader(harness);
    const save = await routerHarnessLoader(harness).getHarness(
      MatButtonHarness.with({ text: "Save" }),
    );

    expect(title.textContent?.trim()).toBe("New credential");
    expect(lede.textContent?.trim()).toBe("Save a new login to your vault.");
    expect(await save.getText()).toBe("Save");
  });

  it("presents the edit form with title and supporting copy inside the header pattern", async () => {
    const harness = await RouterTestingHarness.create(`/credentials/${page.seededId}/edit`);
    const { title, lede } = readHeader(harness);

    expect(title.textContent?.trim()).toBe("Edit credential");
    expect(lede.textContent?.trim()).toBe("Update the saved details for this entry.");
  });
});
