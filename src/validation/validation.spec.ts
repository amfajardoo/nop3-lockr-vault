import * as z from "zod";

import { safeParse, type ValidationIssue } from "./validation";

const nameSchema = z.object({
  name: z.string(),
  age: z.number(),
});

describe("validation safeParse (feature 007, US1): untrusted input at the boundary", () => {
  it("passes valid data through with the inferred type", () => {
    const input = { name: "Ada", age: 36 };

    const result = safeParse(nameSchema, input);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.value).toEqual(input);
    }
  });

  it("rejects a wrong scalar type with one structured issue at the root path", () => {
    const result = safeParse(nameSchema, { name: "Ada", age: "not a number" });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.issues).toHaveLength(1);
      const [issue] = result.issues;
      expect(issue.path).toBe("age");
      expect(issue.code).toBe("invalid_type");
      expect(issue.message.length).toBeGreaterThan(0);
    }
  });

  it("lists every offending field for a deeply malformed input", () => {
    const result = safeParse(nameSchema, { name: 42, age: "no" });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.issues).toHaveLength(2);
      expect(result.issues.map((issue) => issue.path).sort()).toEqual(["age", "name"]);
    }
  });

  it("reports nested paths for array items", () => {
    const listSchema = z.object({
      items: z.array(z.object({ id: z.string() })),
    });

    const result = safeParse(listSchema, { items: [{ id: 1 }] });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.issues).toHaveLength(1);
      expect(result.issues[0].path).toBe("items.0.id");
    }
  });

  it("never throws on any input, valid or malformed", () => {
    const inputs: unknown[] = [
      { name: "Ada", age: 36 },
      { name: 42, age: "no" },
      null,
      undefined,
      "not an object",
      7,
      { name: "Ada" },
      { age: 36 },
    ];

    for (const input of inputs) {
      const act = (): void => {
        safeParse(nameSchema, input);
      };

      expect(act).not.toThrow();
    }
  });
});

describe("validation safeParse (feature 007, US1): malformed-input fuzz corpus", () => {
  const fuzzCorpus: unknown[] = [
    null,
    undefined,
    0,
    NaN,
    "",
    "neon",
    [],
    {},
    { a: 1 },
    { name: "Ada", age: 36 },
    { name: 42, age: "no" },
    { name: { nested: true }, age: [1, 2, 3] },
    [1, "two", { three: 3 }],
    new Map([["k", "v"]]),
    Symbol("x"),
    () => 42,
    "dark",
    ["light", "dark", "system"],
    { name: undefined, age: undefined },
  ];

  const enumSchema = z.enum(["light", "dark", "system"]);

  it("handles every corpus entry as a well-formed result without throwing", () => {
    for (const input of fuzzCorpus) {
      for (const schema of [nameSchema, enumSchema]) {
        const result = safeParse(schema, input);

        expect(result).toHaveProperty("success");
        if (result.success) {
          expect(result).toHaveProperty("value");
        } else {
          expect(Array.isArray(result.issues)).toBe(true);
        }
      }
    }
  });
});

describe("validation safeParse (feature 007, US3): structured, deterministic failures", () => {
  it("exposes one StableReason (dotted path + stable code + deterministic message) per wrong field", () => {
    const result = safeParse(nameSchema, { name: "Ada", age: "not a number" });

    expect(result.success).toBe(false);
    if (!result.success) {
      const firstMessage = result.issues[0].message;
      const secondPass = safeParse(nameSchema, { name: "Ada", age: "not a number" });

      expect(result.issues).toHaveLength(1);
      expect(result.issues[0].path).toBe("age");
      expect(result.issues[0].code).toBe("invalid_type");
      expect(firstMessage.length).toBeGreaterThan(0);
      if (!secondPass.success) {
        expect(secondPass.issues[0].message).toBe(firstMessage);
      }
    }
  });

  it("lists every wrong field without fail-fast truncation", () => {
    const result = safeParse(nameSchema, { name: 42, age: "no" });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.issues).toHaveLength(2);
      expect(result.issues.map((issue) => issue.path).sort()).toEqual(["age", "name"]);
      for (const issue of result.issues) {
        expect(issue.message.length).toBeGreaterThan(0);
      }
    }
  });

  it("names the reason in the message and hides raw library internals", () => {
    const result = safeParse(nameSchema, { name: "Ada", age: "not a number" });

    expect(result.success).toBe(false);
    if (!result.success) {
      const message = result.issues[0].message.toLowerCase();
      expect(message).toContain("number");
      expect(message).not.toMatch(
        /\[object|\bZodError\b|<anonymous>|\bat\b.*\.t[sx]:\d+|\bat\b \w+\.\w+$/,
      );
    }
  });
});

it("shapes the neutral ValidationIssue contract for future consumers", () => {
  const result = safeParse(z.object({ name: z.string() }), { name: 1 });

  expect(result.success).toBe(false);
  if (!result.success) {
    const issue = result.issues[0] as ValidationIssue;
    expect(issue.path).toBe("name");
    expect(typeof issue.code).toBe("string");
    expect(typeof issue.message).toBe("string");
    expect(issue.message.length).toBeGreaterThan(0);
  }
});
