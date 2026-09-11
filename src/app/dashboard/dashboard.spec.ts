import { Component } from "@angular/core";
import { provideRouter } from "@angular/router";
import { RouterTestingHarness } from "@angular/router/testing";
import { createFixture, query, setupThemeTestBed } from "@testing/setup-theme";
import axe from "axe-core";
import { routes } from "../app.routes";
import { Dashboard } from "./dashboard";

const DASHBOARD_AXE_RULES = [
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
  "landmark-banner-is-top-level",
  "landmark-main-is-top-level",
  "landmark-no-duplicate-banner",
  "landmark-no-duplicate-main",
  "landmark-one-main",
  "nested-interactive",
  "region",
];

const NAV_AXE_RULES = [
  "aria-required-attr",
  "aria-roles",
  "aria-valid-attr-value",
  "aria-valid-attr",
  "link-name",
  "nested-interactive",
  "region",
];

@Component({
  selector: "app-stub-child",
  template: "<p>Stub child content</p>",
})
class StubChild {}

describe("Dashboard (feature 006, US1): chrome renders as a routable screen", () => {
  let fixture: ReturnType<typeof createFixture<Dashboard>>;

  beforeEach(() => {
    setupThemeTestBed({ providers: [provideRouter([])] });
    fixture = createFixture(Dashboard);
  });

  it("renders the header with brand, theme switcher, nav and main workspace", () => {
    const headerEl = query<HTMLElement>(fixture, "header");

    expect(headerEl).toBeTruthy();
    expect(headerEl?.querySelector("a.brand")?.textContent).toContain("Lockr Vault");
    expect(headerEl?.querySelector("theme-toggle")).toBeTruthy();
    expect(query<HTMLElement>(fixture, "nav")).toBeTruthy();
    expect(query<HTMLElement>(fixture, "main[id='main-content']")).toBeTruthy();
  });

  it("places a skip link as the first focusable element targeting main", () => {
    const skip = query<HTMLAnchorElement>(fixture, "a.skip-link");

    expect(skip).toBeTruthy();
    expect(skip?.getAttribute("href")).toBe("#main-content");
    const focusables = [...document.querySelectorAll("a, button, [tabindex]")];
    expect(focusables[0]).toBe(skip);
  });

  it("passes an AXE scan without serious or critical violations", async () => {
    const results = await axe.run(fixture.nativeElement, {
      runOnly: { type: "rule", values: DASHBOARD_AXE_RULES },
    });

    const bad = results.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
    expect(bad).toEqual([]);
  });
});

describe("Dashboard (feature 006, US2): navigation is accessible and live", () => {
  beforeEach(() => {
    setupThemeTestBed({ providers: [provideRouter(routes)] });
  });

  it("renders a nav landmark with a labelled list of data-driven items", async () => {
    const harness = await RouterTestingHarness.create("");
    const nav = harness.routeNativeElement?.querySelector("nav[aria-label='Main']");

    expect(nav).toBeTruthy();
    const links = [...(nav?.querySelectorAll("a") ?? [])];
    expect(links.map((a) => a.textContent?.trim())).toEqual(["Overview"]);
    expect(links[0]?.getAttribute("href")).toBe("/");
  });

  it("marks the active section link with aria-current=page and a visible focus ring", async () => {
    const harness = await RouterTestingHarness.create("");
    const link = harness.routeNativeElement?.querySelector("nav a");

    expect(link).toBeTruthy();
    expect(link?.getAttribute("aria-current")).toBe("page");
    expect(link?.className).toContain("focus-visible:outline");
  });

  it("passes an AXE scan scoped to the nav without serious or critical violations", async () => {
    const harness = await RouterTestingHarness.create("");
    const nav = harness.routeNativeElement?.querySelector("nav");

    expect(nav).toBeTruthy();
    const results = await axe.run(nav as HTMLElement, {
      runOnly: { type: "rule", values: NAV_AXE_RULES },
    });
    const bad = results.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
    expect(bad).toEqual([]);
  });
});

describe("Dashboard (feature 006, US3): workspace ready for vault features", () => {
  it("renders a titled section heading and an empty-state hint", async () => {
    setupThemeTestBed({ providers: [provideRouter(routes)] });
    const harness = await RouterTestingHarness.create("");
    const main = harness.routeNativeElement?.querySelector("main[id='main-content']");

    expect(main?.querySelector("h1")?.textContent).toBe("Dashboard");
    expect(main?.textContent).toContain("Your credentials will appear here.");
  });

  it("renders a child route inside the dashboard's nested outlet", async () => {
    setupThemeTestBed({
      providers: [
        provideRouter([
          { path: "", component: Dashboard, children: [{ path: "stub", component: StubChild }] },
        ]),
      ],
    });
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl("/stub");

    expect(harness.routeNativeElement?.querySelector("app-stub-child")).toBeTruthy();
    expect(harness.routeNativeElement?.textContent).toContain("Stub child content");
    expect(harness.routeNativeElement?.querySelector("header")).toBeTruthy();
  });
});
