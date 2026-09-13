import { inject } from "@angular/core";
import { type ComponentFixture, TestBed } from "@angular/core/testing";
import { provideRouter } from "@angular/router";
import { setupModule } from "@testing/setup-module";
import { VaultStore, type VaultStoreInstance } from "../../vault/vault.store";
import { CredentialDetail } from "./credential-detail";

function store(): VaultStoreInstance {
  return TestBed.runInInjectionContext(() => inject(VaultStore));
}

describe("CredentialDetail (feature 009, US2): read-only credential details", () => {
  let seededId: string;

  beforeEach(() => {
    setupModule({ providers: [VaultStore, provideRouter([])] });
    store().add({
      name: "GitHub",
      username: "octocat",
      domain: "github.com",
      password: "hunter2",
      notes: "Work account",
    });
    seededId = store().credentials()[0]?.id ?? "";
  });

  function detailFixture(id: string): ComponentFixture<CredentialDetail> {
    const fixture = TestBed.createComponent(CredentialDetail);
    fixture.componentRef.setInput("id", id);
    fixture.detectChanges();
    return fixture;
  }

  function passwordText(root: HTMLElement): string {
    return root.querySelector("[data-password]")?.textContent?.trim() ?? "";
  }

  it("renders name, username, domain and notes for the matched credential", () => {
    const root = detailFixture(seededId).nativeElement as HTMLElement;

    expect(root.textContent).toContain("GitHub");
    expect(root.textContent).toContain("octocat");
    expect(root.textContent).toContain("github.com");
    expect(root.textContent).toContain("Work account");
  });

  it("masks the password by default with no plaintext in the DOM", () => {
    const root = detailFixture(seededId).nativeElement as HTMLElement;

    expect(passwordText(root)).not.toBe("hunter2");
    expect(root.textContent).not.toContain("hunter2");
  });

  it("reveals the password on activation and re-masks on a second activation", () => {
    const fixture = detailFixture(seededId);
    const root = fixture.nativeElement as HTMLElement;
    const reveal = root.querySelector("[data-reveal]") as HTMLButtonElement | null;

    expect(reveal).toBeTruthy();
    expect(reveal?.getAttribute("aria-pressed")).toBe("false");

    reveal?.click();
    fixture.detectChanges();

    expect(passwordText(root)).toBe("hunter2");
    expect(reveal?.getAttribute("aria-pressed")).toBe("true");

    reveal?.click();
    fixture.detectChanges();

    expect(passwordText(root)).not.toBe("hunter2");
    expect(reveal?.getAttribute("aria-pressed")).toBe("false");
  });

  it("shows a friendly not-found state with a back link for an unknown id", () => {
    const root = detailFixture("00000000-0000-4000-8000-000000000099").nativeElement as HTMLElement;

    expect(root.querySelector("[data-not-found]")).toBeTruthy();
    expect(root.textContent).toContain("not found");
    const back = root.querySelector("[data-back-to-list]") as HTMLAnchorElement | null;
    expect(back).toBeTruthy();
    expect(back?.getAttribute("href")).toBe("/");
  });
});
