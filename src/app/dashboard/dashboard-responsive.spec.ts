import { MatButtonHarness } from "@angular/material/button/testing";
import { MatSidenavHarness } from "@angular/material/sidenav/testing";
import { provideRouter } from "@angular/router";
import { RouterTestingHarness } from "@angular/router/testing";
import { cleanState } from "@testing/clean-state";
import { createWidthMediaMatcher } from "@testing/media-matcher-stub";
import { query, routerHarnessLoader, setupModule } from "@testing/setup-module";
import { replaceThemeToggleWithStub } from "@testing/theme-toggle-stub";
import { routes } from "../app.routes";

function mountResponsive(initialWide: boolean) {
  const width = createWidthMediaMatcher(initialWide);
  setupModule({ providers: [provideRouter(routes), width.provider] });
  replaceThemeToggleWithStub();
  return { width };
}

describe("Dashboard responsive shell (feature 016, US3): wide viewport", () => {
  const wide = cleanState(() => mountResponsive(true));

  it("shows an open side rail without a menu button", async () => {
    const harness = await RouterTestingHarness.create("");
    const drawer = await routerHarnessLoader(harness).getHarness(MatSidenavHarness);

    expect(await drawer.getMode()).toBe("side");
    expect(await drawer.isOpen()).toBe(true);
    expect(query<HTMLElement>(harness.fixture, "[data-menu-toggle]")).toBeNull();
  });

  it("flips to a closed over drawer with a menu button after crossing the breakpoint", async () => {
    const harness = await RouterTestingHarness.create("");
    const drawer = await routerHarnessLoader(harness).getHarness(MatSidenavHarness);

    wide.width.setWide(false);
    harness.fixture.detectChanges();

    expect(await drawer.getMode()).toBe("over");
    expect(await drawer.isOpen()).toBe(false);
    expect(query<HTMLElement>(harness.fixture, "[data-menu-toggle]")).toBeTruthy();
  });

  it("registers the breakpoint listener once and removes it on destroy", async () => {
    const harness = await RouterTestingHarness.create("");

    expect(wide.width.listenerCount("(min-width")).toBe(1);

    harness.fixture.destroy();

    expect(wide.width.listenerCount("(min-width")).toBe(0);
  });
});

describe("Dashboard responsive shell (feature 016, US3): narrow viewport", () => {
  cleanState(() => mountResponsive(false));

  it("collapses to an over drawer behind an accessible menu button", async () => {
    const harness = await RouterTestingHarness.create("");
    const drawer = await routerHarnessLoader(harness).getHarness(MatSidenavHarness);
    const menu = await routerHarnessLoader(harness).getHarness(
      MatButtonHarness.with({ selector: "[data-menu-toggle]" }),
    );
    const host = await menu.host();

    expect(await drawer.getMode()).toBe("over");
    expect(await drawer.isOpen()).toBe(false);
    expect(await host.getAttribute("aria-label")).toBe("Toggle navigation");
    expect(await host.getAttribute("aria-expanded")).toBe("false");
  });

  it("opens the drawer on activation and reports the expanded state", async () => {
    const harness = await RouterTestingHarness.create("");
    const drawer = await routerHarnessLoader(harness).getHarness(MatSidenavHarness);
    const menu = await routerHarnessLoader(harness).getHarness(
      MatButtonHarness.with({ selector: "[data-menu-toggle]" }),
    );

    await menu.click();
    harness.fixture.detectChanges();

    expect(await drawer.isOpen()).toBe(true);
    expect(await (await menu.host()).getAttribute("aria-expanded")).toBe("true");
  });
});
