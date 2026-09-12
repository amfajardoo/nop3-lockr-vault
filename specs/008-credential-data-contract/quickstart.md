# Quickstart: Credential Data Contract

**Feature**: [008-credential-data-contract](spec.md) | **Contract**: [credential.schema.json](contracts/credential.schema.json) | **Data model**: [data-model.md](data-model.md)

This guide proves the feature works end-to-end as a data layer. There is no UI in this feature —
validation happens through the `safeParse` wrapper and the VaultStore's public API.

## Prerequisites

- `pnpm install` up to date (zod v4, @ngrx/signals already present).
- Branch `feature/008-credential-data-contract` checked out.

## Running the validations

```powershell
$env:PATH = "C:\Users\andre\AppData\Roaming\fnm\aliases\default;C:\Users\andre\AppData\Local\pnpm\bin;$env:PATH"
pnpm test:run
```

Expected: the full suite is GREEN, including these feature specs:

| Spec | Proves |
|------|--------|
| `src/vault/credential.schema.spec.ts` | US1 — contract validation against the Credential schema |
| `src/vault/vault.store.spec.ts` | US2 — VaultStore CRUD mutations (add/update/delete/getById) |
| `src/vault/vault.service.spec.ts` | US3 — mock seed data validates against the schema |

## Manual smoke checks (optional)

### 1. Schema boundary validation

```ts
import { safeParse } from "../validation/validation";
import { credentialSchema } from "./credential.schema";

const ok = safeParse(credentialSchema, {
  id: "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
  name: "GitHub",
  username: "octocat",
  domain: "github.com",
  password: "hunter2",
});
console.log(ok.success); // true

const bad = safeParse(credentialSchema, { name: "GitHub", favorite: "yes" });
console.log(bad.success); // false
// One issue per missing/malformed field, not just the first:
console.log(bad.issues);  // [ { path: "id", code: "invalid_type", ... },
                          //   { path: "username", code: "invalid_type", ... },
                          //   { path: "domain", code: "invalid_type", ... },
                          //   { path: "password", code: "invalid_type", ... },
                          //   { path: "favorite", code: "invalid_type", ... } ]
```

### 2. VaultStore CRUD

```ts
const store = inject(VaultStore);

store.add({ name: "GitHub", username: "octocat", domain: "github.com", password: "hunter2" });
store.credentials();        // [ Credential with stable UUID + created_at ]
store.update(store.credentials()[0].id, { password: "new-pass" });
store.getById(store.credentials()[0].id); // updated entry, updated_at set
store.delete(store.credentials()[0].id);
store.credentials();        // []
```

### 3. Mock seed service

```ts
const svc = inject(MockDataService);
const seeds = svc.getSeedCredentials();
seeds.length;               // >= 4
credentialSchema.safeParse(seeds[0]).success;   // true
```

## Verification gate

Run from repo root:

```powershell
pnpm verify
```

All of: biome ci clean, `pnpm test:run` GREEN (existing 193+ tests plus new specs), production
build succeeds.

## Expected outcomes

- Well-formed Credentials pass through validation unchanged (strip policy applied).
- Malformed input never throws; `ValidationResult` carries structured issues with dotted
  paths and stable zod codes.
- VaultStore mutations are synchronous and never throw; invalid payloads and unknown IDs are
  silent no-ops.
- Mock seed service returns at least 4 credentials that all validate against the schema.
- No component, route, or HTML file was touched; 004–007 behavior is byte-for-byte unchanged.