import { inject } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import { provideRouter } from "@angular/router";
import { RouterTestingHarness } from "@angular/router/testing";
import { setupThemeTestBed } from "@testing/setup-theme";
import axe from "axe-core";
import { VaultStore, type VaultStoreInstance } from "../../vault/vault.store";
import { routes } from "../app.routes";
import { CredentialDetail } from "./credential-detail";

const DETAIL_AXE_RULES = [
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
  "label",
  "nested-interactive",
  "region",
];

function store(): VaultStoreInstance {
  return TestBed.runInInjectionContext(() => inject(VaultStore));
}

describe("CredentialDetail (feature 009, US2): read-only credential details", () => {
  let seededId: string;

  beforeEach(() => {
    setupThemeTestBed({ providers: [VaultStore, provideRouter(routes)] });
    store().add({
      name: "GitHub",
      username: "octocat",
      domain: "github.com",
      password: "hunter2",
      notes: "Work account",
    });
    seededId = store().credentials()[0]?.id ?? "";
  });

  async function detailFixture(): Promise<RouterTestingHarness> {
    const harness = await RouterTestingHarness.create("/");
    await harness.navigateByUrl(`/credentials/${seededId}`);
    return harness;
  }

  function passwordText(root: HTMLElement): string {
    return root.querySelector("[data-password]")?.textContent?.trim() ?? "";
  }

  it("renders name, username, domain and notes for the matched credential", async () => {
    const harness = await detailFixture();
    const root = harness.routeNativeElement as HTMLElement;

    expect(root.textContent).toContain("GitHub");
    expect(root.textContent).toContain("octocat");
    expect(root.textContent).toContain("github.com");
    expect(root.textContent).toContain("Work account");
  });

  it("masks the password by default with no plaintext in the DOM", async () => {
    const harness = await detailFixture();
    const root = harness.routeNativeElement as HTMLElement;

    expect(passwordText(root)).not.toBe("hunter2");
    expect(root.textContent).not.toContain("hunter2");
  });

  it("reveals the password on activation and re-masks on a second activation", async () => {
    const harness = await detailFixture();
    const root = harness.routeNativeElement as HTMLElement;
    const reveal = root.querySelector("[data-reveal]") as HTMLButtonElement | null;

    expect(reveal).toBeTruthy();
    expect(reveal?.getAttribute("aria-pressed")).toBe("false");

    reveal?.click();
    harness.detectChanges();

    expect(passwordText(root)).toBe("hunter2");
    expect(reveal?.getAttribute("aria-pressed")).toBe("true");

    reveal?.click();
    harness.detectChanges();

    expect(passwordText(root)).not.toBe("hunter2");
    expect(reveal?.getAttribute("aria-pressed")).toBe("false");
  });

  it("shows a friendly not-found state with a back link for an unknown id", async () => {
    const harness = await RouterTestingHarness.create("/");
    await harness.navigateByUrl("/credentials/00000000-0000-4000-8000-000000000099");
    const root = harness.routeNativeElement as HTMLElement;

    expect(root.querySelector("[data-not-found]")).toBeTruthy();
    expect(root.textContent).toContain("not found");
    const back = root.querySelector("[data-back-to-list]") as HTMLAnchorElement | null;
    expect(back).toBeTruthy();
    expect(back?.getAttribute("href")).toBe("/");
  });

  it("passes an AXE scan without serious or critical violations", async () => {
    const harness = await detailFixture();
    const results = await axe.run(harness.routeNativeElement as HTMLElement, {
      runOnly: { type: "rule", values: DETAIL_AXE_RULES },
    });

    const bad = results.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
    expect(bad).toEqual([]);
  });
});
