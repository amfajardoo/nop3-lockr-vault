import { TestbedHarnessEnvironment } from "@angular/cdk/testing/testbed";
import { inject } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import { MatRadioGroupHarness } from "@angular/material/radio/testing";

import { cleanState } from "@testing/clean-state";
import { createFixture, setupModule } from "@testing/setup-module";
import { installThemeStorage } from "@testing/theme-stubs";
import { ThemeStore, type ThemeStoreInstance } from "@theme/theme.store";
import { CHOICE_DARK, CHOICE_LIGHT, CHOICE_SYSTEM } from "@theme/theme-contract";

import { ThemeToggle } from "./theme-toggle";

function store(): ThemeStoreInstance {
  return TestBed.runInInjectionContext(() => inject(ThemeStore));
}

describe("ThemeToggle (feature 004, US2): accessible switcher", () => {
  const toggle = cleanState(() => {
    const handles = setupModule({ theme: {} });
    return {
      fixture: createFixture(ThemeToggle),
      media: handles.media,
      storage: handles.storage,
    };
  });

  function groupHarness(): Promise<MatRadioGroupHarness> {
    return TestbedHarnessEnvironment.loader(toggle.fixture).getHarness(MatRadioGroupHarness);
  }

  function radioInputs(): HTMLInputElement[] {
    return [
      ...toggle.fixture.nativeElement.querySelectorAll("input[type='radio']"),
    ] as HTMLInputElement[];
  }

  function inputFor(label: string): HTMLInputElement {
    const found = radioInputs().find(
      (input) => input.closest("mat-radio-button")?.textContent?.includes(label) ?? false,
    );
    if (!found) {
      throw new Error(`radio input not found: ${label}`);
    }
    return found;
  }

  it("renders a radiogroup with the three contract options", async () => {
    const group = await groupHarness();
    const host = await group.host();
    const buttons = await group.getRadioButtons();

    expect(await host.getAttribute("role")).toBe("radiogroup");
    expect(await host.getAttribute("aria-label")).toBe("Theme");
    expect(await Promise.all(buttons.map(async (button) => button.getLabelText()))).toEqual([
      "Light",
      "Dark",
      "System",
    ]);
  });

  it("defaults to System checked when no choice is stored", async () => {
    const group = await groupHarness();

    expect(await group.getCheckedValue()).toBe(CHOICE_SYSTEM);
  });

  it("groups the options as native radios sharing a name so browser arrow/Home/End navigation applies", () => {
    const inputs = radioInputs();

    expect(inputs).toHaveLength(3);
    for (const input of inputs) {
      expect(input.name).not.toBe("");
    }
    expect(new Set(inputs.map((input) => input.name)).size).toBe(1);
  });

  it("reflects a stored explicit dark choice", async () => {
    toggle.storage = installThemeStorage(CHOICE_DARK);
    store().setChoice(CHOICE_DARK);
    toggle.fixture.detectChanges();

    const group = await groupHarness();
    expect(await group.getCheckedValue()).toBe(CHOICE_DARK);
    expect(inputFor("Dark").getAttribute("tabindex")).toBe("0");
    expect(inputFor("System").getAttribute("tabindex")).toBe("-1");
  });

  it("activates a radio through the store: choice, persistence and root marker", async () => {
    const group = await groupHarness();

    await group.checkRadioButton({ label: "Dark" });

    expect(store().choice()).toBe(CHOICE_DARK);
    expect(toggle.storage.getState()).toBe(CHOICE_DARK);
    expect(document.documentElement.classList.contains("dark")).toBe(true);
  });

  it("moves the roving tabindex to the newly selected option", async () => {
    const group = await groupHarness();
    await group.checkRadioButton({ label: "Light" });
    toggle.fixture.detectChanges();

    expect(await group.getCheckedValue()).toBe(CHOICE_LIGHT);
    expect(inputFor("Light").getAttribute("tabindex")).toBe("0");
    expect(inputFor("Dark").getAttribute("tabindex")).toBe("-1");
  });

  it("repaints the effective theme when System follows the OS", () => {
    expect(store().effective()).toBe("light");

    toggle.media.dispatch(true);

    expect(store().effective()).toBe("dark");
    expect(document.documentElement.classList.contains("dark")).toBe(true);
  });

  it("keeps keyboard focus stable when the OS preference changes", async () => {
    const group = await groupHarness();
    const system = (await group.getRadioButtons({ label: "System" }))[0];
    if (!system) {
      throw new Error("System radio not found");
    }
    await system.focus();
    toggle.media.dispatch(true);
    toggle.fixture.detectChanges();

    expect(document.documentElement.classList.contains("dark")).toBe(true);
    expect(document.activeElement).toBe(inputFor("System"));
  });
});
