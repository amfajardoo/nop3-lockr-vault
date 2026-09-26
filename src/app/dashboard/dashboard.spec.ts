import { Component } from "@angular/core";
import { MatNavListHarness } from "@angular/material/list/testing";
import { MatToolbarHarness } from "@angular/material/toolbar/testing";
import { provideRouter } from "@angular/router";
import { RouterTestingHarness } from "@angular/router/testing";
import { cleanState } from "@testing/clean-state";
import {
  createFixture,
  harnessLoader,
  query,
  routerHarnessLoader,
  setupModule,
} from "@testing/setup-module";
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

  it("renders the toolbar with brand, theme switcher, nav list and main workspace", async () => {
    const loader = harnessLoader(dash.fixture);
    const toolbar = await loader.getHarness(MatToolbarHarness);
    const navList = await loader.getHarness(
      MatNavListHarness.with({ selector: "[aria-label='Main']" }),
    );

    expect(toolbar).toBeTruthy();
    expect(query<HTMLElement>(dash.fixture, "theme-toggle")).toBeTruthy();
    expect(await navList.getItems()).toBeTruthy();
    expect(query<HTMLElement>(dash.fixture, "main#main-content")).toBeTruthy();
  });

  it("places a skip link targeting main content", () => {
    const skip = query<HTMLAnchorElement>(dash.fixture, "a.skip-link");

    expect(skip).toBeTruthy();
    expect(skip?.getAttribute("href")).toBe("#main-content");
  });
});

describe("Dashboard (feature 006, US2): navigation is accessible and live", () => {
  const nav = cleanState(async () => {
    setupModule({ providers: [provideRouter(routes)] });
    replaceThemeToggleWithStub();
    const harness = await RouterTestingHarness.create("");
    const navList = await routerHarnessLoader(harness).getHarness(
      MatNavListHarness.with({ selector: "[aria-label='Main']" }),
    );
    return { harness, navList };
  });

  it("renders a nav list with a labelled list of data-driven items", async () => {
    const items = await nav.navList.getItems();

    const labels = await Promise.all(items.map((item) => item.getText()));
    expect(labels).toEqual(["Overview"]);
    const host = await items[0].host();
    expect(await host.getAttribute("href")).toBe("/");
  });

  it("marks the active section link with aria-current=page", async () => {
    const items = await nav.navList.getItems();

    const host = await items[0].host();
    expect(await host.getAttribute("aria-current")).toBe("page");
  });
});

describe("Dashboard (feature 009, US1): workspace ready for the credential list", () => {
  const workspace = cleanState(async () => {
    setupModule({ providers: [provideRouter(routes)] });
    replaceThemeToggleWithStub();
    const harness = await RouterTestingHarness.create("");
    return { harness };
  });

  it("mounts a child route in the workspace instead of the placeholder copy", async () => {
    const main = workspace.harness.routeNativeElement?.querySelector("main#main-content");

    expect(main).toBeTruthy();
    expect(main?.textContent).not.toContain("Your credentials will appear here.");
  });
});

describe("Dashboard (feature 009, US1): nested outlet renders child routes", () => {
  const nestedWorkspace = cleanState(async () => {
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
    return { harness };
  });

  it("renders a child route inside the dashboard's nested outlet", async () => {
    const harness = nestedWorkspace.harness;
    expect(harness.routeNativeElement?.querySelector("app-stub-child")).toBeTruthy();
    expect(harness.routeNativeElement?.textContent).toContain("Stub child content");
    const toolbar = await routerHarnessLoader(harness).getHarness(MatToolbarHarness);
    expect(toolbar).toBeTruthy();
  });
});
