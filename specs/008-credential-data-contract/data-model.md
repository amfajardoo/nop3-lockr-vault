# Data Model: Credential

**Feature**: [008-credential-data-contract](spec.md) | **Source of truth**: [credential.schema.json](contracts/credential.schema.json)

## Entity: Credential

A single vault entry (a site login, API key, or other stored secret). Credentials are held in
memory by the VaultStore. This feature is mock only: passwords are plain strings, there is no
encryption, persistence, or backend (roadmap-deferred).

### Fields

| Field        | Type    | Required | Default         | Rules |
|--------------|---------|----------|-----------------|-------|
| `id`         | string  | yes      | —               | UUID v4 format (rfc 4122) |
| `name`       | string  | yes      | —               | Non-empty; user-facing label |
| `username`   | string  | yes      | —               | Value per field's own rule |
| `domain`     | string  | yes      | —               | Value per field's own rule |
| `password`   | string  | yes      | —               | Mock only; no real secrets |
| `favorite`   | boolean | no       | `false`         | Default false when absent |
| `notes`      | string  | no       | `""`            | Default empty string |
| `created_at` | string  | no       | set on add      | ISO-8601 (e.g. `2026-09-12T08:00:00.000Z`) |
| `updated_at` | string  | no       | absent on create | ISO-8601; set on update |

### Validation rules

- Unknown extra fields on input are stripped (007 strip policy), never preserved.
- `favorite` defaults to `false` when missing; `notes` defaults to `""` when missing
  (handled by the zod schema `.default()`).
- `created_at`/`updated_at` are optional on input; the store assigns them on mutation.
- Missing required field → structured failure with dotted path (e.g. `"name"`).
- Wrong type → structured failure with stable code (e.g. `favorite` as string →
  `invalid_type`).
- Root-level wrong shape (`null`, a number, an object) → structured failure at path `""`.

## VaultStore state

| Property      | Type                  | Behavior |
|---------------|-----------------------|----------|
| `items`       | `Signal<Credential[]>` (internal) | Raw state, never exposed directly |
| `credentials` | `Signal<Credential[]>` (computed) | Read-only accessor: `items.map(...)` immutable view |
| `count`       | `Signal<number>` (computed) | `credentials().length` |

## State transitions

### add(payload: CredentialDraft)

1. Validate `payload` through `safeParse(credentialSchema)`.
2. On failure → silent no-op (state unchanged, no throw).
3. On success → build entry: `{ ...validated, id: crypto.randomUUID(), created_at: now,
   updated_at: undefined }`, push onto `items` via `patchState`. `updated_at` omitted.

### update(id: string, patch: CredentialPatch)

1. Validate `patch` through `safeParse(credentialPatchSchema)`.
2. On failure → silent no-op.
3. Find entry by `id` in `items`.
4. Unknown id → silent no-op (idempotent).
5. Known id → merge: `{ ...existing, ...validated, updated_at: now }` via `patchState`.
   `created_at` preserved (not in patch schema).

### delete(id: string)

1. Find entry by `id`.
2. Unknown id → silent no-op.
3. Known id → remove via `patchState(items.filter(...))`.

### getById(id: string)

- Synchronous lookup; returns the matching `Credential` or `undefined`.

## Input/Output shapes

| Shape | Fields (input) | Notes |
|-------|----------------|-------|
| `CredentialDraft` (add) | `name`, `username`, `domain`, `password`, `favorite?`, `notes?` | no `id`, no timestamps |
| `CredentialPatch` (update) | `name?`, `username?`, `domain?`, `password?`, `favorite?`, `notes?` | all optional; no `id`, no timestamps |
| `Credential` (output) | `id`, `name`, `username`, `domain`, `password`, `favorite`, `notes`, `created_at` | full shape after add |
| `Credential` (after update) | + `updated_at` | merged entry |

## Relationship map

- **VaultStore** owns the canonical in-memory collection.
- **MockDataService** (`vault.service.ts`) provides the seed collection consumed on app init.
- **credential.schema.ts** (zod) drives validation for both store and service; mirrors
  `contracts/credential.schema.json`.
- No components, routes, or persistence touch this model in this feature (009/010+).