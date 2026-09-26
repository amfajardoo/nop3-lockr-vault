import { inject } from "@angular/core";
import { type ComponentFixture, TestBed } from "@angular/core/testing";
import { MatButtonHarness } from "@angular/material/button/testing";
import { MatCardHarness } from "@angular/material/card/testing";
import { provideRouter } from "@angular/router";
import { cleanState } from "@testing/clean-state";
import { getHarness, harnessLoader, query, setupModule } from "@testing/setup-module";
import { VaultStore, type VaultStoreInstance } from "../../vault/vault.store";
import { CredentialDetail } from "./credential-detail";

function store(): VaultStoreInstance {
  return TestBed.runInInjectionContext(() => inject(VaultStore));
}

function detailFixture(id: string): ComponentFixture<CredentialDetail> {
  const fixture = TestBed.createComponent(CredentialDetail);
  fixture.componentRef.setInput("id", id);
  fixture.detectChanges();
  return fixture;
}

describe("CredentialDetail (feature 009, US2): read-only credential details", () => {
  const detail = cleanState(() => {
    setupModule({ providers: [VaultStore, provideRouter([])] });
    store().add({
      name: "GitHub",
      username: "octocat",
      domain: "github.com",
      password: "hunter2",
      notes: "Work account",
    });
    return { seededId: store().credentials()[0]?.id ?? "" };
  });

  it("renders name, username, domain and notes for the matched credential", async () => {
    const fixture = detailFixture(detail.seededId);
    const card = await getHarness(fixture, MatCardHarness);
    const heading = query<HTMLHeadingElement>(fixture, "h1");
    const text = await card.getText();

    expect(await card.getTitleText()).toBe("GitHub");
    expect(heading?.textContent?.trim()).toBe("GitHub");
    expect(text).toContain("octocat");
    expect(text).toContain("github.com");
    expect(text).toContain("Work account");
  });

  it("masks the password by default with no plaintext in the DOM", async () => {
    const fixture = detailFixture(detail.seededId);
    const card = await getHarness(fixture, MatCardHarness);
    const text = await card.getText();

    expect(text).not.toContain("hunter2");
    expect(text).toContain("••••••••");
  });

  it("reveals the password on activation and re-masks on a second activation", async () => {
    const fixture = detailFixture(detail.seededId);
    const loader = harnessLoader(fixture);
    const reveal = await loader.getHarness(MatButtonHarness.with({ text: "Show" }));

    expect(await (await reveal.host()).getAttribute("aria-pressed")).toBe("false");
    expect(await (await reveal.host()).getAttribute("aria-label")).toBe("Show password");

    await reveal.click();
    fixture.detectChanges();

    const revealed = await getHarness(fixture, MatCardHarness);
    const hide = await loader.getHarness(MatButtonHarness.with({ text: "Hide" }));

    expect(await revealed.getText()).toContain("hunter2");
    expect(await (await hide.host()).getAttribute("aria-pressed")).toBe("true");
    expect(await (await hide.host()).getAttribute("aria-label")).toBe("Hide password");

    await hide.click();
    fixture.detectChanges();

    const masked = await getHarness(fixture, MatCardHarness);
    const showAgain = await loader.getHarness(MatButtonHarness.with({ text: "Show" }));

    expect(await masked.getText()).not.toContain("hunter2");
    expect(await (await showAgain.host()).getAttribute("aria-pressed")).toBe("false");
  });

  it("shows a friendly not-found state with a back link for an unknown id", async () => {
    const fixture = detailFixture("00000000-0000-4000-8000-000000000099");
    const loader = harnessLoader(fixture);
    const card = await loader.getHarness(MatCardHarness.with({ title: "Credential not found" }));
    const back = await loader.getHarness(MatButtonHarness.with({ text: "Back to credentials" }));
    const heading = query<HTMLHeadingElement>(fixture, "h1");

    expect(heading?.textContent?.trim()).toBe("Credential not found");
    expect(await card.getText()).toContain("not found");
    expect(await (await back.host()).getAttribute("href")).toBe("/");
  });
});

describe("CredentialDetail (feature 014): edit entry point", () => {
  const detail = cleanState(() => {
    setupModule({ providers: [VaultStore, provideRouter([])] });
    store().add({
      name: "GitHub",
      username: "octocat",
      domain: "github.com",
      password: "hunter2",
    });
    return { seededId: store().credentials()[0]?.id ?? "" };
  });

  it("links to the edit route of the displayed credential", async () => {
    const fixture = detailFixture(detail.seededId);
    const edit = await harnessLoader(fixture).getHarness(MatButtonHarness.with({ text: "Edit" }));

    expect(await (await edit.host()).getAttribute("href")).toBe(
      `/credentials/${detail.seededId}/edit`,
    );
  });
});
