import { safeParse } from "../validation/validation";
import { credentialSchema } from "./credential.schema";

const validCredential = {
  id: "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
  name: "GitHub",
  username: "octocat",
  domain: "github.com",
  password: "hunter2",
};

describe("credential schema (feature 008, US1): the contract is the single source of truth", () => {
  it("passes a well-formed credential through unchanged", () => {
    const result = safeParse(credentialSchema, validCredential);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.value).toEqual({
        favorite: false,
        notes: "",
        ...validCredential,
      });
    }
  });

  it("fails with a structured issue naming a missing required field", () => {
    const { name: _name, ...withoutName } = validCredential;

    const result = safeParse(credentialSchema, withoutName);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.issues.find((issue) => issue.path === "name")).toBeDefined();
      expect(result.issues.map((issue) => issue.path)).toContain("name");
    }
  });

  it("fails with a structured issue for a field of the wrong type", () => {
    const result = safeParse(credentialSchema, { ...validCredential, favorite: "yes" });

    expect(result.success).toBe(false);
    if (!result.success) {
      const favoriteIssue = result.issues.find((issue) => issue.path === "favorite");
      expect(favoriteIssue).toBeDefined();
      expect(favoriteIssue?.code).toBe("invalid_type");
    }
  });

  it("rejects an empty string for required string fields (minLength protection)", () => {
    for (const field of ["name", "username", "domain", "password"]) {
      const input = { ...validCredential, [field]: "" };
      const result = safeParse(credentialSchema, input);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.issues.some((issue) => issue.path === field)).toBe(true);
      }
    }
  });

  it("fails without throwing for non-object root inputs", () => {
    for (const input of [null, "not an object", 42, []]) {
      const act = (): void => {
        safeParse(credentialSchema, input);
      };

      expect(act).not.toThrow();
      const result = safeParse(credentialSchema, input);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.issues.some((issue) => issue.path === "")).toBe(true);
      }
    }
  });

  it("strips unknown keys from the validated value (007 strip policy)", () => {
    const result = safeParse(credentialSchema, { ...validCredential, evil: "extra" });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.value).not.toHaveProperty("evil");
    }
  });
});
