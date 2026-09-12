import { TestBed } from "@angular/core/testing";
import { setupModule } from "@testing/setup-module";
import { expect, it } from "vitest";

import { safeParse } from "../validation/validation";
import { credentialSchema } from "./credential.schema";
import { MockDataService } from "./vault.service";

function createService(): MockDataService {
  return TestBed.inject(MockDataService);
}

describe("vault service (feature 008, US3): mock seed catalog", () => {
  setupModule({ providers: [MockDataService] });

  it("provides exactly four seed credentials", () => {
    const service = createService();

    const seeds = service.getSeedCredentials();

    expect(seeds).toHaveLength(4);
  });

  it("every seed is a valid credential", () => {
    const service = createService();

    const seeds = service.getSeedCredentials();

    for (const seed of seeds) {
      expect(safeParse(credentialSchema, seed).success, `seed ${seed.name}`).toBe(true);
    }
  });

  it("marks at least one seed as favorite", () => {
    const service = createService();

    const seeds = service.getSeedCredentials();

    expect(seeds.some((seed) => seed.favorite)).toBe(true);
  });

  it("uses at least three distinct domains", () => {
    const service = createService();

    const seeds = service.getSeedCredentials();

    expect(new Set(seeds.map((seed) => seed.domain)).size).toBeGreaterThanOrEqual(3);
  });

  it("returns a frozen seed list so callers cannot mutate the catalog", () => {
    const service = createService();

    const seeds = service.getSeedCredentials();

    expect(Object.isFrozen(seeds)).toBe(true);
  });
});
