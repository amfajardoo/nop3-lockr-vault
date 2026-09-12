import { safeParse } from "../validation/validation";
import { type ThemeChoice, themeChoiceSchema } from "./theme-choice-schema";
import { CHOICE_DARK, CHOICE_LIGHT, CHOICE_SYSTEM } from "./theme-contract";

describe("theme choice schema (feature 007, US2): validates the 002 enum contract", () => {
  it("accepts the three explicit choices", () => {
    for (const choice of [CHOICE_LIGHT, CHOICE_DARK, CHOICE_SYSTEM]) {
      const result = safeParse(themeChoiceSchema, choice);

      expect(result.success, `choice ${choice}`).toBe(true);
      if (result.success) {
        expect(result.value).toBe(choice);
      }
    }
  });

  it("rejects out-of-enum strings with a structured failure", () => {
    const result = safeParse(themeChoiceSchema, "neon");

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.issues).toHaveLength(1);
      expect(result.issues[0].code).toBe("invalid_value");
      expect(result.issues[0].message.length).toBeGreaterThan(0);
    }
  });

  it("rejects null without throwing", () => {
    const result = safeParse(themeChoiceSchema, null);

    expect(result.success).toBe(false);
  });

  it("rejects an empty string", () => {
    const result = safeParse(themeChoiceSchema, "");

    expect(result.success).toBe(false);
  });

  it("rejects a JSON-wrapped value", () => {
    const result = safeParse(themeChoiceSchema, '"dark"');

    expect(result.success).toBe(false);
  });
});

it("infers ThemeChoice as exactly the three 002 literals", () => {
  const light: ThemeChoice = "light";
  const dark: ThemeChoice = "dark";
  const system: ThemeChoice = "system";
  const explicit: ThemeChoice[] = [CHOICE_LIGHT, CHOICE_DARK, CHOICE_SYSTEM];

  expect([light, dark, system]).toEqual(explicit);
});
