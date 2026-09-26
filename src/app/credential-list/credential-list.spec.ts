import { inject } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import { MatButtonHarness } from "@angular/material/button/testing";
import { MatCardHarness } from "@angular/material/card/testing";
import { MatDialogHarness } from "@angular/material/dialog/testing";
import { MatInputHarness } from "@angular/material/input/testing";
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

  it("marks the favorite credential with an accessible favorite toggle", async () => {
    const toggles = await harnessLoader(list.fixture).getAllHarnesses(
      MatButtonHarness.with({ selector: "[data-favorite]" }),
    );

    expect(toggles).toHaveLength(3);
    const pressed = await Promise.all(
      toggles.map((toggle) => toggle.host().then((host) => host.getAttribute("aria-pressed"))),
    );
    expect(pressed).toEqual(["true", "false", "false"]);
    const labels = await Promise.all(
      toggles.map((toggle) => toggle.host().then((host) => host.getAttribute("aria-label"))),
    );
    labels.forEach((label) => {
      expect(label).toMatch(/favorite/i);
    });
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

describe("CredentialList (feature 014): add-credential entry points", () => {
  const populated = cleanState(() => {
    setupModule({ providers: [VaultStore, routerProviders] });
    store().add({ name: "GitHub", username: "octocat", domain: "github.com", password: "h1" });

    return { fixture: createFixture(CredentialList) };
  });

  it("offers Add credential in the header linking to the create route", async () => {
    const buttons = await harnessLoader(populated.fixture).getAllHarnesses(
      MatButtonHarness.with({ text: "Add credential" }),
    );

    expect(buttons).toHaveLength(1);
    expect(await (await buttons[0].host()).getAttribute("href")).toBe("/credentials/new");
  });
});

describe("CredentialList (feature 014): add entry point on the empty state", () => {
  const emptyList = cleanState(() => {
    setupModule({ providers: [VaultStore, routerProviders] });

    return { fixture: createFixture(CredentialList) };
  });

  it("offers Add credential from the empty state as well", async () => {
    const buttons = await harnessLoader(emptyList.fixture).getAllHarnesses(
      MatButtonHarness.with({ text: "Add credential" }),
    );
    const hrefs = await Promise.all(
      buttons.map((button) => button.host().then((host) => host.getAttribute("href"))),
    );

    expect(buttons).toHaveLength(2);
    expect(hrefs).toEqual(["/credentials/new", "/credentials/new"]);
    expect(
      await harnessLoader(emptyList.fixture).getHarness(
        MatCardHarness.with({ selector: "[data-empty-state]" }),
      ),
    ).toBeTruthy();
  });
});

describe("CredentialList (feature 015, US1): search narrows the list", () => {
  const list = cleanState(() => {
    setupModule({ providers: [VaultStore, routerProviders] });
    store().add({ name: "GitHub", username: "octocat", domain: "github.com", password: "h1" });
    store().add({ name: "GitLab", username: "mona", domain: "gitlab.com", password: "h2" });
    store().add({
      name: "npm",
      username: "octocat",
      domain: "registry.npmjs.org",
      password: "h3",
    });

    return { fixture: createFixture(CredentialList) };
  });

  function rows(): Promise<MatNavListItemHarness[]> {
    return harnessLoader(list.fixture).getAllHarnesses(MatNavListItemHarness);
  }

  async function typeQuery(text: string): Promise<void> {
    const input = await harnessLoader(list.fixture).getHarness(
      MatInputHarness.with({ selector: "[data-search]" }),
    );

    await input.setValue(text);
    await list.fixture.whenStable();
  }

  it("matches by name, username and domain", async () => {
    await typeQuery("gitlab");
    let rendered = await rows();

    expect(rendered).toHaveLength(1);
    expect(await rendered[0].getText()).toContain("GitLab");

    await typeQuery("mona");
    rendered = await rows();

    expect(rendered).toHaveLength(1);
    expect(await rendered[0].getText()).toContain("GitLab");

    await typeQuery("npmjs");
    rendered = await rows();

    expect(rendered).toHaveLength(1);
    expect(await rendered[0].getText()).toContain("npm");
  });

  it("matches case-insensitively over the trimmed query, preserving store order", async () => {
    await typeQuery("  GIT  ");

    const rendered = await rows();

    expect(rendered).toHaveLength(2);
    const texts = await Promise.all(rendered.map((row) => row.getText()));
    expect(texts[0]).toContain("GitHub");
    expect(texts[1]).toContain("GitLab");
  });

  it("leaves the store untouched while searching and restores the full list on clear", async () => {
    const snapshot = JSON.parse(JSON.stringify(store().credentials()));

    await typeQuery("octocat");

    expect(await rows()).toHaveLength(2);
    expect(store().credentials()).toEqual(snapshot);

    await typeQuery("");

    expect(await rows()).toHaveLength(3);
    expect(store().credentials()).toEqual(snapshot);
  });

  it("shows a no-results card whose reset clears the query", async () => {
    await typeQuery("zzz");

    expect(await rows()).toHaveLength(0);
    const card = await harnessLoader(list.fixture).getHarness(
      MatCardHarness.with({ selector: "[data-no-results]" }),
    );
    expect(await card.getText()).toContain("No credentials match your search");

    const reset = await harnessLoader(list.fixture).getHarness(
      MatButtonHarness.with({ text: "Clear search and filters" }),
    );

    await reset.click();
    await list.fixture.whenStable();

    expect(await rows()).toHaveLength(3);
    expect(query<HTMLElement>(list.fixture, "[data-no-results]")).toBeNull();
    const input = await harnessLoader(list.fixture).getHarness(
      MatInputHarness.with({ selector: "[data-search]" }),
    );
    expect(await input.getValue()).toBe("");
  });

  it("treats regular-expression characters literally", async () => {
    await typeQuery("*");

    expect(await rows()).toHaveLength(0);
    expect(query<HTMLElement>(list.fixture, "[data-no-results]")).toBeTruthy();

    await typeQuery("g.thub");

    expect(await rows()).toHaveLength(0);
  });
});

describe("CredentialList (feature 015): search with an empty vault", () => {
  const list = cleanState(() => {
    setupModule({ providers: [VaultStore, routerProviders] });

    return { fixture: createFixture(CredentialList) };
  });

  it("keeps the empty-vault state regardless of an active query", async () => {
    const input = await harnessLoader(list.fixture).getHarness(
      MatInputHarness.with({ selector: "[data-search]" }),
    );

    await input.setValue("x");
    await list.fixture.whenStable();

    const cards = await harnessLoader(list.fixture).getAllHarnesses(
      MatCardHarness.with({ selector: "[data-empty-state]" }),
    );
    expect(cards).toHaveLength(1);
    expect(query<HTMLElement>(list.fixture, "[data-no-results]")).toBeNull();
  });
});

describe("CredentialList (feature 015, US2): favorite toggle", () => {
  const list = cleanState(() => {
    setupModule({ providers: [VaultStore, routerProviders] });
    store().add({
      name: "GitHub",
      username: "octocat",
      domain: "github.com",
      password: "h1",
      favorite: false,
    });
    store().add({
      name: "GitLab",
      username: "mona",
      domain: "gitlab.com",
      password: "h2",
      favorite: true,
    });

    return { fixture: createFixture(CredentialList) };
  });

  async function clickToggle(selector: string): Promise<void> {
    const toggle = await harnessLoader(list.fixture).getHarness(
      MatButtonHarness.with({ selector }),
    );

    await toggle.click();
    await list.fixture.whenStable();
  }

  it("marks a credential as favorite through store.update", async () => {
    const before = store()
      .credentials()
      .find((entry) => entry.name === "GitHub");

    await clickToggle('[aria-label="Add GitHub to favorites"]');

    const after = store()
      .credentials()
      .find((entry) => entry.name === "GitHub");
    expect(after?.favorite).toBe(true);
    expect(after?.updated_at).toBeTruthy();
    expect(after?.password).toBe(before?.password);
    expect(after?.username).toBe(before?.username);
    expect(after?.domain).toBe(before?.domain);
    expect(after?.created_at).toBe(before?.created_at);
  });

  it("reflects the new state and allows unmarking", async () => {
    await clickToggle('[aria-label="Add GitHub to favorites"]');

    const marked = await harnessLoader(list.fixture).getHarness(
      MatButtonHarness.with({ selector: '[aria-label="Remove GitHub from favorites"]' }),
    );
    expect(await marked.host().then((host) => host.getAttribute("aria-pressed"))).toBe("true");

    await clickToggle('[aria-label="Remove GitHub from favorites"]');

    expect(
      store()
        .credentials()
        .find((entry) => entry.name === "GitHub")?.favorite,
    ).toBe(false);
  });

  it("names the credential in the accessible label with pressed state", async () => {
    const toggle = await harnessLoader(list.fixture).getHarness(
      MatButtonHarness.with({ selector: '[aria-label="Remove GitLab from favorites"]' }),
    );

    expect(await toggle.host().then((host) => host.getAttribute("aria-pressed"))).toBe("true");
  });

  it("changes only the toggled credential in the store", async () => {
    const snapshot = JSON.parse(JSON.stringify(store().credentials()));

    await clickToggle('[aria-label="Add GitHub to favorites"]');

    const updated = store().credentials();
    expect(updated).toHaveLength(snapshot.length);
    updated.forEach((entry, index) => {
      if (entry.name === "GitHub") {
        expect(entry.favorite).toBe(true);
        expect(entry.updated_at).toBeTruthy();
      } else {
        expect(entry).toEqual(snapshot[index]);
      }
    });
  });
});

describe("CredentialList (feature 015, US3): favorites filter", () => {
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
      username: "mona",
      domain: "gitlab.com",
      password: "h2",
      favorite: false,
    });
    store().add({
      name: "npm",
      username: "octocat",
      domain: "registry.npmjs.org",
      password: "h3",
      favorite: true,
    });

    return { fixture: createFixture(CredentialList) };
  });

  function rows(): Promise<MatNavListItemHarness[]> {
    return harnessLoader(list.fixture).getAllHarnesses(MatNavListItemHarness);
  }

  async function activateFilter(): Promise<void> {
    const filter = await harnessLoader(list.fixture).getHarness(
      MatButtonHarness.with({ selector: "[data-favorites-filter]" }),
    );

    await filter.click();
    await list.fixture.whenStable();
  }

  async function typeQuery(text: string): Promise<void> {
    const input = await harnessLoader(list.fixture).getHarness(
      MatInputHarness.with({ selector: "[data-search]" }),
    );

    await input.setValue(text);
    await list.fixture.whenStable();
  }

  it("shows only favorites when the filter is active", async () => {
    await activateFilter();

    const rendered = await rows();
    const texts = await Promise.all(rendered.map((row) => row.getText()));

    expect(rendered).toHaveLength(2);
    expect(texts[0]).toContain("GitHub");
    expect(texts[1]).toContain("npm");
    const filter = await harnessLoader(list.fixture).getHarness(
      MatButtonHarness.with({ selector: "[data-favorites-filter]" }),
    );
    expect(await filter.host().then((host) => host.getAttribute("aria-pressed"))).toBe("true");
  });

  it("combines query and filter with AND semantics", async () => {
    await activateFilter();

    await typeQuery("mona");

    expect(await rows()).toHaveLength(0);
    expect(query<HTMLElement>(list.fixture, "[data-no-results]")).toBeTruthy();

    await typeQuery("octocat");

    expect(await rows()).toHaveLength(2);
  });

  it("removes a row from the filtered view when unfavorited", async () => {
    await activateFilter();

    await harnessLoader(list.fixture)
      .getHarness(
        MatButtonHarness.with({ selector: '[aria-label="Remove GitHub from favorites"]' }),
      )
      .then((toggle) => toggle.click());
    await list.fixture.whenStable();

    const rendered = await rows();
    expect(rendered).toHaveLength(1);
    expect(await rendered[0].getText()).toContain("npm");
    expect(
      store()
        .credentials()
        .find((entry) => entry.name === "GitHub")?.favorite,
    ).toBe(false);
  });

  it("restores the previous view when the filter is deactivated", async () => {
    await activateFilter();
    await activateFilter();

    expect(await rows()).toHaveLength(3);
    const filter = await harnessLoader(list.fixture).getHarness(
      MatButtonHarness.with({ selector: "[data-favorites-filter]" }),
    );
    expect(await filter.host().then((host) => host.getAttribute("aria-pressed"))).toBe("false");
  });

  it("shows the empty-favorites state when no favorites exist", async () => {
    store()
      .credentials()
      .filter((entry) => entry.favorite)
      .forEach((entry) => {
        store().update(entry.id, { favorite: false });
      });
    list.fixture.detectChanges();

    await activateFilter();

    expect(await rows()).toHaveLength(0);
    const card = await harnessLoader(list.fixture).getHarness(
      MatCardHarness.with({ selector: "[data-no-results]" }),
    );
    expect(await card.getText()).toContain("You have no favorite credentials yet");
  });
});

describe("CredentialList (feature 015): observable semantics and regressions", () => {
  const list = cleanState(() => {
    setupModule({ providers: [VaultStore, routerProviders] });
    store().add({ name: "GitHub", username: "octocat", domain: "github.com", password: "h1" });
    store().add({ name: "GitLab", username: "mona", domain: "gitlab.com", password: "h2" });

    return { fixture: createFixture(CredentialList) };
  });

  function rows(): Promise<MatNavListItemHarness[]> {
    return harnessLoader(list.fixture).getAllHarnesses(MatNavListItemHarness);
  }

  it("labels the search input for assistive technology", async () => {
    const input = await harnessLoader(list.fixture).getHarness(
      MatInputHarness.with({ selector: "[data-search]" }),
    );
    const host = await input.host();
    const id = await host.getAttribute("id");
    const label = id ? query<HTMLElement>(list.fixture, `label[for="${id}"]`) : null;

    expect(id).toBeTruthy();
    expect(label?.textContent).toContain("Search credentials");
  });

  it("announces result counts in a polite live region", async () => {
    const region = query<HTMLElement>(list.fixture, "[data-result-count]");
    expect(region?.getAttribute("aria-live")).toBe("polite");
    expect(region?.textContent?.trim()).toBe("");

    const input = await harnessLoader(list.fixture).getHarness(
      MatInputHarness.with({ selector: "[data-search]" }),
    );

    await input.setValue("gitlab");
    await list.fixture.whenStable();

    expect(query<HTMLElement>(list.fixture, "[data-result-count]")?.textContent).toContain(
      "1 of 2",
    );
  });

  it("keeps delete working inside a filtered view", async () => {
    const input = await harnessLoader(list.fixture).getHarness(
      MatInputHarness.with({ selector: "[data-search]" }),
    );

    await input.setValue("gitlab");
    await list.fixture.whenStable();
    expect(await rows()).toHaveLength(1);

    const deleteButton = await harnessLoader(list.fixture).getHarness(
      MatButtonHarness.with({ selector: '[aria-label="Delete GitLab"]' }),
    );

    await deleteButton.click();
    await list.fixture.whenStable();
    const dialog = await documentHarnessLoader(list.fixture).getHarness(MatDialogHarness);
    const confirm = await dialog.getHarness(MatButtonHarness.with({ text: "Delete" }));

    await confirm.click();

    expect(await rows()).toHaveLength(0);
    expect(store().count()).toBe(1);
    expect(query<HTMLElement>(list.fixture, "[data-no-results]")).toBeTruthy();
  });
});
