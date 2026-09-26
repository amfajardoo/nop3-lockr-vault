import { inject } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import { MatButtonHarness } from "@angular/material/button/testing";
import { MatCardHarness } from "@angular/material/card/testing";
import { MatDialogHarness } from "@angular/material/dialog/testing";
import { MatNavListItemHarness } from "@angular/material/list/testing";
import { provideRouter } from "@angular/router";
import { cleanState } from "@testing/clean-state";
import {
  createFixture,
  documentHarnessLoader,
  harnessLoader,
  query,
  setupModule,
} from "@testing/setup-module";
import { VaultStore, type VaultStoreInstance } from "../../vault/vault.store";
import { CredentialList } from "./credential-list";

const routerProviders = provideRouter([]);

function store(): VaultStoreInstance {
  return TestBed.runInInjectionContext(() => inject(VaultStore));
}

describe("CredentialList (feature 009, US1): every saved credential renders scannably", () => {
  const list = cleanState(() => {
    setupModule({ providers: [VaultStore, routerProviders] });
    store().add({
      name: "GitHub",
      username: "octocat",
      domain: "github.com",
      password: "h1",
      favorite: true,
    });
    store().add({
      name: "GitLab",
      username: "octocat",
      domain: "gitlab.com",
      password: "h2",
      favorite: false,
    });
    store().add({ name: "npm", username: "octocat", domain: "npmjs.com", password: "h3" });

    return { fixture: createFixture(CredentialList) };
  });

  function rows(): Promise<MatNavListItemHarness[]> {
    return harnessLoader(list.fixture).getAllHarnesses(MatNavListItemHarness);
  }

  it("renders every seeded credential with its name, username and domain", async () => {
    const rendered = await rows();

    expect(rendered).toHaveLength(3);
    const texts = await Promise.all(rendered.map((row) => row.getText()));
    expect(texts[0]).toContain("GitHub");
    expect(texts[0]).toContain("octocat");
    expect(texts[0]).toContain("github.com");
    expect(texts[1]).toContain("GitLab");
    expect(texts[2]).toContain("npm");
    expect(texts[2]).toContain("npmjs.com");
  });

  it("marks the favorite credential with a distinct indicator with an aria-label", async () => {
    const rendered = await rows();

    const favoriteMark = query<HTMLElement>(list.fixture, "[data-favorite]");
    expect(favoriteMark).toBeTruthy();
    expect(favoriteMark?.getAttribute("aria-label")).toMatch(/favorite/i);
    expect(await rendered[0].getText()).toContain("★");
    expect(await rendered[1].getText()).not.toContain("★");
  });

  it("renders the entries in a deterministic insertion order", async () => {
    const expectedNames = store()
      .credentials()
      .map((entry) => entry.name);
    const rendered = await rows();
    const texts = await Promise.all(rendered.map((row) => row.getText()));

    expect(rendered).toHaveLength(expectedNames.length);
    expectedNames.forEach((name, index) => {
      expect(texts[index]).toContain(name);
    });
  });

  it("links each row to its credential's detail view", async () => {
    const credentialIds = store()
      .credentials()
      .map((entry) => entry.id);
    const rendered = await rows();
    const hrefs = await Promise.all(rendered.map((row) => row.getHref()));

    expect(hrefs).toHaveLength(3);
    hrefs.forEach((href, index) => {
      expect(href).toContain(`/credentials/${credentialIds[index]}`);
    });
  });
});

describe("CredentialList (feature 009, US3): empty vault shows a helpful empty state", () => {
  const list = cleanState(() => {
    setupModule({ providers: [VaultStore, routerProviders] });

    return { fixture: createFixture(CredentialList) };
  });

  function emptyState(): Promise<MatCardHarness[]> {
    return harnessLoader(list.fixture).getAllHarnesses(
      MatCardHarness.with({ selector: "[data-empty-state]" }),
    );
  }

  function rows(): Promise<MatNavListItemHarness[]> {
    return harnessLoader(list.fixture).getAllHarnesses(MatNavListItemHarness);
  }

  it("renders the empty state with no credential rows", async () => {
    const cards = await emptyState();
    const rendered = await rows();

    expect(cards).toHaveLength(1);
    expect(await cards[0].getText()).toContain("Your vault is empty");
    expect(rendered).toHaveLength(0);
  });

  it("transitions from empty to populated when a credential is added", async () => {
    expect(await emptyState()).toHaveLength(1);

    store().add({ name: "GitHub", username: "octocat", domain: "github.com", password: "h1" });
    list.fixture.detectChanges();

    expect(await emptyState()).toHaveLength(0);
    expect(await rows()).toHaveLength(1);
  });
});

describe("CredentialList (feature 009, US4): delete requires explicit confirmation", () => {
  const list = cleanState(() => {
    setupModule({ providers: [VaultStore, routerProviders] });
    store().add({ name: "GitHub", username: "octocat", domain: "github.com", password: "h1" });
    store().add({ name: "GitLab", username: "octocat", domain: "gitlab.com", password: "h2" });

    return { fixture: createFixture(CredentialList) };
  });

  function rows(): Promise<MatNavListItemHarness[]> {
    return harnessLoader(list.fixture).getAllHarnesses(MatNavListItemHarness);
  }

  function dialogs(): Promise<MatDialogHarness[]> {
    return documentHarnessLoader(list.fixture).getAllHarnesses(MatDialogHarness);
  }

  async function openDialogFor(name: string): Promise<MatDialogHarness> {
    const deleteButton = await harnessLoader(list.fixture).getHarness(
      MatButtonHarness.with({ selector: `[aria-label="Delete ${name}"]` }),
    );

    await deleteButton.click();
    await list.fixture.whenStable();

    return documentHarnessLoader(list.fixture).getHarness(MatDialogHarness);
  }

  it("opens a confirmation dialog naming the credential, list unchanged", async () => {
    const dialog = await openDialogFor("GitHub");

    expect(await dialog.getRole()).toBe("dialog");
    expect(await dialog.getTitleText()).toContain("GitHub");
    expect(await dialog.getContentText()).toContain("cannot be undone");
    expect(await rows()).toHaveLength(2);

    await dialog.close();
  });

  it("confirm removes the credential from store and list; other rows unaffected", async () => {
    const dialog = await openDialogFor("GitHub");

    const confirmButton = await dialog.getHarness(MatButtonHarness.with({ text: "Delete" }));

    await confirmButton.click();

    const rendered = await rows();
    expect(rendered).toHaveLength(1);
    expect(await rendered[0].getText()).toContain("GitLab");
    expect(store().count()).toBe(1);
    expect(await dialogs()).toHaveLength(0);
  });

  it("cancel keeps the credential; no store mutation", async () => {
    const dialog = await openDialogFor("GitHub");

    const cancelButton = await dialog.getHarness(MatButtonHarness.with({ text: "Cancel" }));

    await cancelButton.click();

    expect(await rows()).toHaveLength(2);
    expect(store().count()).toBe(2);
    expect(await dialogs()).toHaveLength(0);
  });

  it("Escape key cancels the dialog", async () => {
    const dialog = await openDialogFor("GitHub");

    await dialog.close();

    expect(await rows()).toHaveLength(2);
    expect(store().count()).toBe(2);
    expect(await dialogs()).toHaveLength(0);
  });
});
