import { provideRouter } from "@angular/router";
import { createFixture, query, setupThemeTestBed } from "@testing/setup-theme";
import axe from "axe-core";
import { App } from "./app";

const SHELL_AXE_RULES = [
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

describe("App shell (feature 004, US1): chrome and accessibility", () => {
  let fixture: ReturnType<typeof createFixture<App>>;

  beforeEach(() => {
    setupThemeTestBed({ providers: [provideRouter([])] });
    fixture = createFixture(App);
  });

  it("renders the shell with brand title, theme switcher and the routed outlet", () => {
    const headerEl = query<HTMLElement>(fixture, "header");

    expect(headerEl).toBeTruthy();
    expect(headerEl?.querySelector("a.brand")?.textContent).toContain("Lockr Vault");
    expect(headerEl?.querySelector("theme-toggle")).toBeTruthy();
    expect(query<HTMLElement>(fixture, "main")?.querySelector("router-outlet")).toBeTruthy();
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
      runOnly: { type: "rule", values: SHELL_AXE_RULES },
    });

    const bad = results.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
    expect(bad).toEqual([]);
  });
});
