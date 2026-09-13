import { inject } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import { provideRouter } from "@angular/router";
import { RouterTestingHarness } from "@angular/router/testing";
import { createFixture, query, setupThemeTestBed } from "@testing/setup-theme";
import axe from "axe-core";
import { VaultStore, type VaultStoreInstance } from "../../vault/vault.store";
import { routes } from "../app.routes";
import { CredentialList } from "./credential-list";

if (!HTMLDialogElement.prototype.showModal) {
  HTMLDialogElement.prototype.showModal = function () {
    this.open = true;
  };
  HTMLDialogElement.prototype.close = function () {
    this.open = false;
  };
}

const LIST_AXE_RULES = [
  "aria-allowed-role",
  "aria-required-attr",
  "aria-required-children",
  "aria-roles",
  "aria-valid-attr-value",
  "aria-valid-attr",
  "button-name",
  "link-name",
  "duplicate-id",
  "focus-order-semantics",
  "heading-order",
  "list",
  "listitem",
  "nested-interactive",
  "region",
];

function store(): VaultStoreInstance {
  return TestBed.runInInjectionContext(() => inject(VaultStore));
}

describe("CredentialList (feature 009, US1): every saved credential renders scannably", () => {
  let fixture: ReturnType<typeof createFixture<CredentialList>>;

  beforeEach(() => {
    setupThemeTestBed({ providers: [VaultStore, provideRouter(routes)] });
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
    fixture = createFixture(CredentialList);
  });

  function rows(): HTMLElement[] {
    return [...fixture.nativeElement.querySelectorAll("[data-credential-row]")] as HTMLElement[];
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

  it("navigates to the detail view when a row is activated", async () => {
    const harness = await RouterTestingHarness.create("/");
    const row = harness.routeNativeElement?.querySelector("[data-credential-row]") as
      | HTMLAnchorElement
      | undefined;

    expect(row).toBeTruthy();
    expect(row?.getAttribute("href")).toContain("/credentials/");
    await harness.navigateByUrl(row?.getAttribute("href") ?? "/");

    expect(harness.routeNativeElement?.textContent).toContain("octocat");
  });

  it("passes an AXE scan without serious or critical violations", async () => {
    const results = await axe.run(fixture.nativeElement, {
      runOnly: { type: "rule", values: LIST_AXE_RULES },
    });

    const bad = results.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
    expect(bad).toEqual([]);
  });
});

describe("CredentialList (feature 009, US3): empty vault shows a helpful empty state", () => {
  let fixture: ReturnType<typeof createFixture<CredentialList>>;

  beforeEach(() => {
    setupThemeTestBed({ providers: [VaultStore, provideRouter(routes)] });
    // store starts empty (no seeding)
    fixture = createFixture(CredentialList);
  });

  it("renders the empty state with no credential rows", () => {
    const root = fixture.nativeElement;
    expect(root.querySelector("[data-empty-state]")).toBeTruthy();
    expect(root.querySelector("[data-credential-row]")).toBeNull();
    expect(root.textContent).toContain("Your vault is empty");
  });

  it("passes AXE scan on empty state", async () => {
    const results = await axe.run(fixture.nativeElement, {
      runOnly: { type: "rule", values: LIST_AXE_RULES },
    });
    const bad = results.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
    expect(bad).toEqual([]);
  });

  it("transitions from empty to populated when a credential is added", () => {
    const root = fixture.nativeElement;
    expect(root.querySelector("[data-empty-state]")).toBeTruthy();

    store().add({ name: "GitHub", username: "octocat", domain: "github.com", password: "h1" });
    fixture.detectChanges();

    expect(root.querySelector("[data-empty-state]")).toBeNull();
    expect(root.querySelector("[data-credential-row]")).toBeTruthy();
  });
});

describe("CredentialList (feature 009, US4): delete requires explicit confirmation", () => {
  let fixture: ReturnType<typeof createFixture<CredentialList>>;

  beforeEach(() => {
    setupThemeTestBed({ providers: [VaultStore, provideRouter(routes)] });
    store().add({ name: "GitHub", username: "octocat", domain: "github.com", password: "h1" });
    store().add({ name: "GitLab", username: "octocat", domain: "gitlab.com", password: "h2" });
    fixture = createFixture(CredentialList);
  });

  function rows(): HTMLElement[] {
    return [...fixture.nativeElement.querySelectorAll("[data-credential-row]")] as HTMLElement[];
  }

  function openDeleteFor(index: number): void {
    const row = rows()[index];
    const li = row?.closest("li") as HTMLLIElement | null;
    const deleteBtn = li?.querySelector("[data-delete]") as HTMLButtonElement | null;
    expect(deleteBtn).toBeTruthy();
    deleteBtn?.click();
    fixture.detectChanges();
  }

  function dialog(): HTMLDialogElement | null {
    return fixture.nativeElement.querySelector("[data-delete-dialog]");
  }

  function confirmBtn(): HTMLButtonElement | null {
    return fixture.nativeElement.querySelector("[data-confirm-delete]") as HTMLButtonElement | null;
  }

  function cancelBtn(): HTMLButtonElement | null {
    return fixture.nativeElement.querySelector("[data-cancel-delete]") as HTMLButtonElement | null;
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
    fixture.detectChanges();

    expect(rows()).toHaveLength(1);
    expect(rows()[0]?.querySelector("[data-credential-name]")?.textContent?.trim()).toBe("GitLab");
    expect(store().count()).toBe(1);
    expect(dialog()?.open).toBe(false);
  });

  it("cancel keeps the credential; no store mutation", () => {
    openDeleteFor(0);
    cancelBtn()?.click();
    fixture.detectChanges();

    expect(rows()).toHaveLength(2);
    expect(store().count()).toBe(2);
  });

  it("Escape key cancels the dialog", () => {
    openDeleteFor(0);
    expect(dialog()?.open).toBe(true);
    fixture.nativeElement.dispatchEvent(
      new KeyboardEvent("keydown", { key: "Escape", bubbles: true }),
    );
    fixture.detectChanges();

    expect(dialog()?.open).toBe(false);
    expect(rows()).toHaveLength(2);
  });

  it("passes AXE scan with dialog open", async () => {
    openDeleteFor(0);
    const results = await axe.run(fixture.nativeElement, {
      runOnly: { type: "rule", values: LIST_AXE_RULES },
    });
    const bad = results.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
    expect(bad).toEqual([]);
  });
});
