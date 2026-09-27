import { inject } from "@angular/core";
import { type ComponentFixture, TestBed } from "@angular/core/testing";
import { MatInputHarness } from "@angular/material/input/testing";
import { provideRouter, withComponentInputBinding } from "@angular/router";
import { RouterTestingHarness } from "@angular/router/testing";
import { cleanState } from "@testing/clean-state";
import { createFixture, harnessLoader, setupModule } from "@testing/setup-module";
import { replaceThemeToggleWithStub } from "@testing/theme-toggle-stub";
import { VaultStore, type VaultStoreInstance } from "../vault/vault.store";
import { routes } from "./app.routes";
import { CredentialDetail } from "./credential-detail/credential-detail";
import { CredentialForm } from "./credential-form/credential-form";
import { CredentialList } from "./credential-list/credential-list";
import { Dashboard } from "./dashboard/dashboard";

function store(): VaultStoreInstance {
  return TestBed.runInInjectionContext(() => inject(VaultStore));
}

function iconText(
  fixture: ComponentFixture<unknown>,
  selector: string,
): { text: string; hidden: string | null } {
  const icon = fixture.nativeElement.querySelector(selector);

  if (!icon) {
    throw new Error(`expected an icon at ${selector}`);
  }
  return { text: icon.textContent?.trim() ?? "", hidden: icon.getAttribute("aria-hidden") };
}

describe("Iconography (feature 016, US5): shell icons render as decorative ligatures", () => {
  const shell = cleanState(() => {
    setupModule({ providers: [provideRouter(routes)] });
    replaceThemeToggleWithStub();
    return { fixture: createFixture(Dashboard) };
  });

  it("renders the vault icon in the nav item and the lock icon in the brand", () => {
    const nav = iconText(shell.fixture, "[aria-label='Main'] a mat-icon");
    const brand = iconText(shell.fixture, ".brand mat-icon");

    expect(nav.text).toBe("vault");
    expect(nav.hidden).toBe("true");
    expect(brand.text).toBe("lock");
    expect(brand.hidden).toBe("true");
  });
});

describe("Iconography (feature 016, US5): list toolbar and row icons", () => {
  const list = cleanState(() => {
    setupModule({ providers: [VaultStore, provideRouter([])] });
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
    return { fixture: createFixture(CredentialList) };
  });

  it("renders the search icon as a field prefix and the star icon on the favorites filter", () => {
    const search = iconText(list.fixture, "mat-form-field mat-icon");
    const filter = iconText(list.fixture, "[data-favorites-filter] mat-icon");

    expect(search.text).toBe("search");
    expect(search.hidden).toBe("true");
    expect(filter.text).toBe("star_border");
    expect(filter.hidden).toBe("true");
  });

  it("renders filled and outline star icons that follow the favorite state", () => {
    const filled = iconText(list.fixture, '[data-favorite][aria-pressed="true"] mat-icon');
    const outline = iconText(list.fixture, '[data-favorite][aria-pressed="false"] mat-icon');

    expect(filled.text).toBe("star");
    expect(filled.hidden).toBe("true");
    expect(outline.text).toBe("star_border");
    expect(outline.hidden).toBe("true");
  });

  it("replaces the inline delete glyph with a decorative delete icon", () => {
    const remove = iconText(list.fixture, '[aria-label="Delete GitHub"] mat-icon');

    expect(remove.text).toBe("delete");
    expect(remove.hidden).toBe("true");
  });

  it("renders a search-off icon in the no-results state", async () => {
    const input = await harnessLoader(list.fixture).getHarness(
      MatInputHarness.with({ selector: "[data-search]" }),
    );

    await input.setValue("does-not-exist");
    await list.fixture.whenStable();

    const state = iconText(list.fixture, "[data-no-results] mat-icon");

    expect(state.text).toBe("search_off");
    expect(state.hidden).toBe("true");
  });
});

describe("Iconography (feature 016, US5): empty state", () => {
  const empty = cleanState(() => {
    setupModule({ providers: [VaultStore, provideRouter([])] });
    return { fixture: createFixture(CredentialList) };
  });

  it("renders a lock icon in the empty state", () => {
    const state = iconText(empty.fixture, "[data-empty-state] mat-icon");

    expect(state.text).toBe("lock");
    expect(state.hidden).toBe("true");
  });
});

describe("Iconography (feature 016, US5): detail not-found card", () => {
  const detail = cleanState(() => {
    setupModule({ providers: [VaultStore, provideRouter([])] });
    const fixture = TestBed.createComponent(CredentialDetail);
    fixture.componentRef.setInput("id", "00000000-0000-4000-8000-000000000099");
    fixture.detectChanges();
    return { fixture };
  });

  it("renders a help icon in the detail not-found card", () => {
    const help = iconText(detail.fixture, "[data-not-found] mat-icon");

    expect(help.text).toBe("help");
    expect(help.hidden).toBe("true");
  });
});

describe("Iconography (feature 016, US5): form not-found card", () => {
  const formRoutes = [{ path: "credentials/:id/edit", component: CredentialForm }];

  const form = cleanState(async () => {
    setupModule({
      providers: [VaultStore, provideRouter(formRoutes, withComponentInputBinding())],
    });
    const harness = await RouterTestingHarness.create("/credentials/bogus-id/edit");
    await harness.fixture.whenStable();
    harness.fixture.detectChanges();
    return { harness };
  });

  it("renders a help icon in the form not-found card", () => {
    const help = iconText(form.harness.fixture, "[data-not-found] mat-icon");

    expect(help.text).toBe("help");
    expect(help.hidden).toBe("true");
  });
});
