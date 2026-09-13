import { provideRouter } from "@angular/router";
import { RouterTestingHarness } from "@angular/router/testing";
import { cleanState } from "@testing/clean-state";
import { setupModule } from "@testing/setup-module";
import { createFixture } from "@testing/setup-theme";
import { installThemeMediaQueryStub, installThemeStorage } from "@testing/theme-stubs";
import { restoreWindowStubs } from "@testing/window-stubs";
import { ThemeStore } from "@theme/theme.store";
import { App } from "./app";
import { routes } from "./app.routes";

describe("App bootstrap (feature 006, US1): thin root over a routable dashboard", () => {
  const app = cleanState(() => {
    setupModule({ providers: [ThemeStore, provideRouter(routes)] });
    restoreWindowStubs();
    installThemeMediaQueryStub(false);
    installThemeStorage(null);
    return { fixture: createFixture(App) };
  });

  it("renders only the router outlet — no chrome at the root", () => {
    expect(app.fixture.nativeElement.querySelector("router-outlet")).toBeTruthy();
    expect(app.fixture.nativeElement.querySelector("header")).toBeNull();
    expect(app.fixture.nativeElement.querySelector("nav")).toBeNull();
    expect(app.fixture.nativeElement.querySelector("a.brand")).toBeNull();
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
});
