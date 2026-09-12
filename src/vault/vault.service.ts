import { Service } from "@angular/core";

import type { Credential } from "./credential.schema";

const SEED_CREDENTIALS: Credential[] = [
  {
    id: "de6b7b52-9921-4774-8798-08c3293eb6d1",
    name: "GitHub",
    username: "ada@lockr.dev",
    domain: "github.com",
    password: "gh-seed-password",
    favorite: true,
    notes: "",
    created_at: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "0a1835c6-0fbc-415f-aad1-c52b2b8b2d13",
    name: "GitLab",
    username: "ada@lockr.dev",
    domain: "gitlab.com",
    password: "gl-seed-password",
    favorite: false,
    notes: "",
    created_at: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "080a9bb2-13cc-45fe-99dc-f8be64a510f2",
    name: "npm",
    username: "ada@lockr.dev",
    domain: "npmjs.com",
    password: "npm-seed-password",
    favorite: false,
    notes: "",
    created_at: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "77f84663-1e53-4aec-bcdc-53a8b5522b34",
    name: "Vercel",
    username: "ada@lockr.dev",
    domain: "vercel.com",
    password: "vercel-seed-password",
    favorite: false,
    notes: "",
    created_at: "2026-01-01T00:00:00.000Z",
  },
];

@Service()
export class MockDataService {
  getSeedCredentials(): readonly Credential[] {
    return Object.freeze(SEED_CREDENTIALS);
  }
}
