import { inject } from "@angular/core";
import { type ComponentFixture, TestBed } from "@angular/core/testing";
import { createFixture, setupThemeTestBed } from "@testing/setup-theme";
import { installThemeStorage, type StorageStub } from "@testing/theme-stubs";
import { ThemeStore, type ThemeStoreInstance } from "@theme/theme.store";
import { CHOICE_DARK, CHOICE_LIGHT, CHOICE_SYSTEM } from "@theme/theme-contract";
import axe from "axe-core";
import { ThemeToggle } from "./theme-toggle";

const TOGGLE_AXE_RULES = [
  "aria-allowed-role",
  "aria-required-attr",
  "aria-required-children",
  "aria-roles",
  "aria-valid-attr-value",
  "aria-valid-attr",
  "duplicate-id",
  "focus-order-semantics",
  "label",
  "tabindex",
];

function store(): ThemeStoreInstance {
  return TestBed.runInInjectionContext(() => inject(ThemeStore));
}

describe("ThemeToggle (feature 004, US2): accessible switcher", () => {
  let media: ReturnType<typeof setupThemeTestBed>["media"];
  let storage: StorageStub;
  let fixture: ComponentFixture<ThemeToggle>;

  beforeEach(() => {
    const handles = setupThemeTestBed();
    media = handles.media;
    storage = handles.storage;
    fixture = createFixture(ThemeToggle);
  });

  function radios(): HTMLInputElement[] {
    return [...fixture.nativeElement.querySelectorAll('input[type="radio"]')] as HTMLInputElement[];
  }

  function radio(label: string): HTMLInputElement {
    const found = radios().find((el) => el.closest("label")?.textContent?.includes(label));
    if (!found) throw new Error(`radio not found: ${label}`);
    return found;
  }

  function keyOn(el: HTMLElement | Element, key: string): void {
    el.dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true, cancelable: true }));
    fixture.detectChanges();
  }

  function optionLabels(): string[] {
    const root = fixture.nativeElement as HTMLElement;
    return [...root.querySelectorAll<HTMLLabelElement>("label")].map(
      (el) => el.textContent?.trim() ?? "",
    );
  }

  function checkedLabel(): string | undefined {
    return radios()
      .find((el) => el.checked)
      ?.closest("label")
      ?.textContent?.trim();
  }

  it("renders a radiogroup with the three contract options", () => {
    const group = fixture.nativeElement.querySelector('[role="radiogroup"]') as HTMLElement;

    expect(group).toBeTruthy();
    expect(group.getAttribute("aria-label")).toBe("Theme");
    expect(optionLabels()).toEqual(["Light", "Dark", "System"]);
  });

  it("defaults to System checked and roving focus when no choice is stored", () => {
    const checked = checkedLabel();

    expect(checked).toBe("System");
    for (const el of radios()) {
      const isSystem = el.closest("label")?.textContent?.includes("System") ?? false;
      expect(el.getAttribute("tabindex")).toBe(isSystem ? "0" : "-1");
    }
  });

  it("reflects a stored explicit dark choice", () => {
    storage = installThemeStorage(CHOICE_DARK);

    store().setChoice(CHOICE_DARK);
    fixture.detectChanges();

    expect(checkedLabel()).toBe("Dark");
  });

  it("activates a radio through the store: choice, persistence and root marker", () => {
    radio("Dark").click();

    expect(store().choice()).toBe(CHOICE_DARK);
    expect(storage.getState()).toBe(CHOICE_DARK);
    expect(document.documentElement.classList.contains("dark")).toBe(true);
  });

  it("repaints the effective theme when System follows the OS", () => {
    expect(store().effective()).toBe("light");

    media.dispatch(true);

    expect(store().effective()).toBe("dark");
    expect(document.documentElement.classList.contains("dark")).toBe(true);
  });

  it("moves selection roving with ArrowRight from Light and wraps past System", () => {
    store().setChoice(CHOICE_LIGHT);
    fixture.detectChanges();

    expect(checkedLabel()).toBe("Light");

    keyOn(radio("Light"), "ArrowRight");

    expect(checkedLabel()).toBe("Dark");
    expect(store().choice()).toBe(CHOICE_DARK);
    expect(document.activeElement).toBe(radio("Dark"));

    keyOn(radio("Dark"), "ArrowRight");

    expect(checkedLabel()).toBe("System");

    keyOn(radio("System"), "ArrowRight");

    expect(checkedLabel()).toBe("Light");
    expect(store().choice()).toBe(CHOICE_LIGHT);
  });

  it("jumps to first and last option with Home and End keys", () => {
    store().setChoice(CHOICE_DARK);
    fixture.detectChanges();

    keyOn(radio("Dark"), "End");

    expect(checkedLabel()).toBe("System");
    expect(document.activeElement).toBe(radio("System"));

    keyOn(radio("System"), "Home");

    expect(checkedLabel()).toBe("Light");
    expect(document.activeElement).toBe(radio("Light"));
  });

  it("keeps keyboard focus stable when the OS preference changes", () => {
    store().setChoice(CHOICE_SYSTEM);
    fixture.detectChanges();
    const systemRadio = radio("System");
    systemRadio.focus();

    media.dispatch(true);

    expect(document.documentElement.classList.contains("dark")).toBe(true);
    expect(document.activeElement).toBe(systemRadio);
  });

  it("passes an AXE scan without serious or critical violations", async () => {
    const results = await axe.run(fixture.nativeElement, {
      runOnly: { type: "rule", values: TOGGLE_AXE_RULES },
    });
    const bad = results.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
    expect(bad).toEqual([]);
  });
});
