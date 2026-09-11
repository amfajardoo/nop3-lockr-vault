import { provideRouter } from "@angular/router";
import { RouterTestingHarness } from "@angular/router/testing";
import { createFixture, setupThemeTestBed } from "@testing/setup-theme";
import axe from "axe-core";
import { App } from "./app";
import { routes } from "./app.routes";

const APP_AXE_RULES = [
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

describe("App bootstrap (feature 006, US1): thin root over a routable dashboard", () => {
  let fixture: ReturnType<typeof createFixture<App>>;

  beforeEach(() => {
    setupThemeTestBed({ providers: [provideRouter(routes)] });
    fixture = createFixture(App);
  });

  it("renders only the router outlet — no chrome at the root", () => {
    expect(fixture.nativeElement.querySelector("router-outlet")).toBeTruthy();
    expect(fixture.nativeElement.querySelector("header")).toBeNull();
    expect(fixture.nativeElement.querySelector("nav")).toBeNull();
    expect(fixture.nativeElement.querySelector("a.brand")).toBeNull();
  });

  it("lazy-loads the dashboard on the empty path and exposes it", async () => {
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl("");

    expect(harness.routeDebugElement?.nativeElement.tagName).toBe("APP-DASHBOARD");
    const brand = harness.routeNativeElement?.querySelector("a.brand");
    expect(brand?.textContent).toContain("Lockr Vault");
  });

  it("redirects unknown URLs to the dashboard", async () => {
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl("/does-not-exist");

    expect(harness.routeDebugElement?.nativeElement.tagName).toBe("APP-DASHBOARD");
  });

  it("passes an AXE scan on the routed dashboard without serious or critical violations", async () => {
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl("");
    expect(harness.routeNativeElement).toBeTruthy();
    const root = harness.routeNativeElement as HTMLElement;

    const results = await axe.run(root, { runOnly: { type: "rule", values: APP_AXE_RULES } });
    const bad = results.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
    expect(bad).toEqual([]);
  });
});
