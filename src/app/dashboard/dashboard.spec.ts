import { Component } from "@angular/core";
import { provideRouter } from "@angular/router";
import { RouterTestingHarness } from "@angular/router/testing";
import { cleanState } from "@testing/clean-state";
import { createFixture, query, setupModule } from "@testing/setup-module";
import { replaceThemeToggleWithStub } from "@testing/theme-toggle-stub";
import { routes } from "../app.routes";
import { Dashboard } from "./dashboard";

@Component({
  selector: "app-stub-child",
  template: "<p>Stub child content</p>",
})
class StubChild {}

describe("Dashboard (feature 006, US1): chrome renders as a routable screen", () => {
  const dash = cleanState(() => {
    setupModule({ providers: [provideRouter([])] });
    replaceThemeToggleWithStub();
    return { fixture: createFixture(Dashboard) };
  });

  it("renders the header with brand, theme switcher, nav and main workspace", () => {
    const headerEl = query<HTMLElement>(dash.fixture, "header");

    expect(headerEl).toBeTruthy();
    expect(headerEl?.querySelector("a.brand")?.textContent).toContain("Lockr Vault");
    expect(headerEl?.querySelector("theme-toggle")).toBeTruthy();
    expect(query<HTMLElement>(dash.fixture, "nav")).toBeTruthy();
    expect(query<HTMLElement>(dash.fixture, "main[id='main-content']")).toBeTruthy();
  });

  it("places a skip link as the first focusable element targeting main", () => {
    const skip = query<HTMLAnchorElement>(dash.fixture, "a.skip-link");

    expect(skip).toBeTruthy();
    expect(skip?.getAttribute("href")).toBe("#main-content");
    const focusables = [...document.querySelectorAll("a, button, [tabindex]")];
    expect(focusables[0]).toBe(skip);
  });
});

describe("Dashboard (feature 006, US2): navigation is accessible and live", () => {
  it("renders a nav landmark with a labelled list of data-driven items", async () => {
    setupModule({ providers: [provideRouter(routes)] });
    replaceThemeToggleWithStub();
    const harness = await RouterTestingHarness.create("");
    const nav = harness.routeNativeElement?.querySelector("nav[aria-label='Main']");

    expect(nav).toBeTruthy();
    const links = [...(nav?.querySelectorAll("a") ?? [])];
    expect(links.map((a) => a.textContent?.trim())).toEqual(["Overview"]);
    expect(links[0]?.getAttribute("href")).toBe("/");
  });

  it("marks the active section link with aria-current=page and a visible focus ring", async () => {
    setupModule({ providers: [provideRouter(routes)] });
    replaceThemeToggleWithStub();
    const harness = await RouterTestingHarness.create("");
    const link = harness.routeNativeElement?.querySelector("nav a");

    expect(link).toBeTruthy();
    expect(link?.getAttribute("aria-current")).toBe("page");
    expect(link?.className).toContain("focus-visible:outline");
  });
});

describe("Dashboard (feature 009, US1): workspace ready for the credential list", () => {
  it("mounts a child route in the workspace instead of the placeholder copy", async () => {
    setupModule({ providers: [provideRouter(routes)] });
    replaceThemeToggleWithStub();
    const harness = await RouterTestingHarness.create("");
    const main = harness.routeNativeElement?.querySelector("main[id='main-content']");

    expect(main).toBeTruthy();
    expect(main?.textContent).not.toContain("Your credentials will appear here.");
  });

  it("renders a child route inside the dashboard's nested outlet", async () => {
    setupModule({
      providers: [
        provideRouter([
          { path: "", component: Dashboard, children: [{ path: "stub", component: StubChild }] },
        ]),
      ],
    });
    replaceThemeToggleWithStub();
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl("/stub");

    expect(harness.routeNativeElement?.querySelector("app-stub-child")).toBeTruthy();
    expect(harness.routeNativeElement?.textContent).toContain("Stub child content");
    expect(harness.routeNativeElement?.querySelector("header")).toBeTruthy();
  });
});
