import { inject } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import { provideRouter } from "@angular/router";
import { cleanState } from "@testing/clean-state";
import { createFixture, setupModule } from "@testing/setup-module";
import { VaultStore, type VaultStoreInstance } from "../../vault/vault.store";
import { CredentialList } from "./credential-list";

const routerProviders = provideRouter([]);

if (!HTMLDialogElement.prototype.showModal) {
  HTMLDialogElement.prototype.showModal = function () {
    this.open = true;
  };
  HTMLDialogElement.prototype.close = function () {
    this.open = false;
  };
}

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

  function rows(): HTMLElement[] {
    return [
      ...list.fixture.nativeElement.querySelectorAll("[data-credential-row]"),
    ] as HTMLElement[];
  }

  it("renders every seeded credential with its name, username and domain", () => {
    const rendered = rows();

    expect(rendered).toHaveLength(3);
    const texts = rendered.map((row) => row.textContent?.replace(/\s+/g, " ").trim() ?? "");
    expect(texts[0]).toContain("GitHub");
    expect(texts[0]).toContain("octocat");
    expect(texts[0]).toContain("github.com");
    expect(texts[1]).toContain("GitLab");
    expect(texts[2]).toContain("npm");
    expect(texts[2]).toContain("npmjs.com");
  });

  it("marks the favorite credential with a distinct indicator with an aria-label", () => {
    const first = rows()[0];
    const second = rows()[1];

    const favoriteMark = first?.querySelector("[data-favorite]");
    expect(favoriteMark).toBeTruthy();
    expect(favoriteMark?.getAttribute("aria-label")).toMatch(/favorite/i);
    expect(second?.querySelector("[data-favorite]")).toBeFalsy();
  });

  it("renders the entries in a deterministic insertion order", () => {
    const names = rows().map(
      (row) => row?.querySelector("[data-credential-name]")?.textContent?.trim() ?? "",
    );

    expect(names).toEqual(["GitHub", "GitLab", "npm"]);
  });

  it("links each row to its credential's detail view", () => {
    const credentialIds = store()
      .credentials()
      .map((entry) => entry.id);
    const hrefs = rows().map((row) => row.getAttribute("href") ?? "");

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

  it("renders the empty state with no credential rows", () => {
    const root = list.fixture.nativeElement;
    expect(root.querySelector("[data-empty-state]")).toBeTruthy();
    expect(root.querySelector("[data-credential-row]")).toBeNull();
    expect(root.textContent).toContain("Your vault is empty");
  });

  it("transitions from empty to populated when a credential is added", () => {
    const root = list.fixture.nativeElement;
    expect(root.querySelector("[data-empty-state]")).toBeTruthy();

    store().add({ name: "GitHub", username: "octocat", domain: "github.com", password: "h1" });
    list.fixture.detectChanges();

    expect(root.querySelector("[data-empty-state]")).toBeNull();
    expect(root.querySelector("[data-credential-row]")).toBeTruthy();
  });
});

describe("CredentialList (feature 009, US4): delete requires explicit confirmation", () => {
  const list = cleanState(() => {
    setupModule({ providers: [VaultStore, routerProviders] });
    store().add({ name: "GitHub", username: "octocat", domain: "github.com", password: "h1" });
    store().add({ name: "GitLab", username: "octocat", domain: "gitlab.com", password: "h2" });
    return { fixture: createFixture(CredentialList) };
  });

  function rows(): HTMLElement[] {
    return [
      ...list.fixture.nativeElement.querySelectorAll("[data-credential-row]"),
    ] as HTMLElement[];
  }

  function openDeleteFor(index: number): void {
    const row = rows()[index];
    const li = row?.closest("li") as HTMLLIElement | null;
    const deleteBtn = li?.querySelector("[data-delete]") as HTMLButtonElement | null;
    expect(deleteBtn).toBeTruthy();
    deleteBtn?.click();
    list.fixture.detectChanges();
  }

  function dialog(): HTMLDialogElement | null {
    return list.fixture.nativeElement.querySelector("[data-delete-dialog]");
  }

  function confirmBtn(): HTMLButtonElement | null {
    return list.fixture.nativeElement.querySelector(
      "[data-confirm-delete]",
    ) as HTMLButtonElement | null;
  }

  function cancelBtn(): HTMLButtonElement | null {
    return list.fixture.nativeElement.querySelector(
      "[data-cancel-delete]",
    ) as HTMLButtonElement | null;
  }

  it("opens a confirmation dialog naming the credential, list unchanged", () => {
    openDeleteFor(0);
    const dlg = dialog();
    expect(dlg).toBeTruthy();
    expect(dlg?.hasAttribute("open")).toBe(true);
    expect(dlg?.textContent).toContain("GitHub");
    expect(rows()).toHaveLength(2);
  });

  it("confirm removes the credential from store and list; other rows unaffected", () => {
    openDeleteFor(0);
    confirmBtn()?.click();
    list.fixture.detectChanges();

    expect(rows()).toHaveLength(1);
    expect(rows()[0]?.querySelector("[data-credential-name]")?.textContent?.trim()).toBe("GitLab");
    expect(store().count()).toBe(1);
    expect(dialog()?.open).toBe(false);
  });

  it("cancel keeps the credential; no store mutation", () => {
    openDeleteFor(0);
    cancelBtn()?.click();
    list.fixture.detectChanges();

    expect(rows()).toHaveLength(2);
    expect(store().count()).toBe(2);
  });

  it("Escape key cancels the dialog", () => {
    openDeleteFor(0);
    expect(dialog()?.open).toBe(true);
    list.fixture.nativeElement.dispatchEvent(
      new KeyboardEvent("keydown", { key: "Escape", bubbles: true }),
    );
    list.fixture.detectChanges();

    expect(dialog()?.open).toBe(false);
    expect(rows()).toHaveLength(2);
  });
});
