# Research: Credential Data Contract

**Feature**: [008-credential-data-contract](spec.md) | **Phase**: 0 (outline & research)

## Decisions

### 1. Validation surface (reuse 007 wrapper)

- **Decision**: All Credential boundary validation goes through `safeParse` from
  `src/validation/validation.ts` (`ValidationResult<T>` discriminated union, dotted `path`,
  stable zod v4 `code`, deterministic `message`). No new validation API.
- **Rationale**: 007 established the single sanctioned validation surface with strip policy.
  The VaultStore and mock service are runtime boundaries, so they must use it.
- **Alternatives considered**: Writing a bespoke validator (rejected: duplicate surface,
  violates anti-abstraction and reuses nothing); throwing on invalid input (rejected:
  spec FR-010 requires mutations to never throw).

### 2. Store implementation (signalStore from @ngrx/signals)

- **Decision**: VaultStore = `signalStore({ providedIn: "root" }, withState, withComputed,
  withMethods)` with a read-only `credentials` computed signal and synchronous mutations
  (`add`, `update`, `delete`, `getById`).
- **Rationale**: 003 (ThemeStore) already established this exact pattern; `@ngrx/signals` is
  installed; `providedIn: "root"` matches the app-wide singleton convention.
- **Alternatives considered**: A plain injectable class (rejected: ThemeStore precedent and
  signal-store era make the signal-based store the project's canonical state pattern);
  `patching` via `mutate` (rejected by AGENTS: never `mutate`, use `update`/`set`/`patchState`).

### 3. Mutation validation semantics

- **Decision**: `add`/`update` validate input through `safeParse`; invalid input → silent
  no-op (state unchanged, no throw). `update` merges over the existing entry by ID.
- **Rationale**: Spec FR-004/FR-005/FR-010 and US2 acceptance scenarios 3/5/6. Silent-no-op
  mirrors ThemeStore's `setChoice` behavior on invalid candidates.
- **Alternatives considered**: Throwing domain errors (rejected: FR-010 bans throws);
  returning pass/fail tuples (rejected: complicates the API surface, US2 does not require a
  return value).

### 4. Schema source of truth (JSON Schema + zod alignment)

- **Decision**: `specs/008-credential-data-contract/contracts/credential.schema.json` (JSON
  Schema 2020-12) is the cross-feature source of truth; `src/vault/credential.schema.ts` holds
  the runtime zod schema mirroring it.
- **Rationale**: Constitution Specification Structure requires contracts under the feature's
  `contracts/` dir (002 did the same for theme-choice). The runtime schema is consumed by
  `safeParse`.
- **Alternatives considered**: zod-only with no JSON Schema (rejected: constitution mandate +
  future backend/cross-client validation); generated zod from JSON (rejected: adds a build
  step, unnecessary at this scale).

### 5. ID and timestamps

- **Decision**: `id` is a UUID via `crypto.randomUUID()`. `created_at` set on add.
  `updated_at` set on update. Timestamps are ISO-8601 strings.
- **Rationale**: Available in all target browsers (secure contexts) and Node ≥19; no polyfill
  (spec assumption). ISO-8601 strings are sortable and wire-safe.
- **Alternatives considered**: Numeric ids (rejected: cross-device sync will need global ids);
  `performance.timeOrigin`-based ids (rejected: not stable across tabs/contexts).

### 6. Mock data service shape

- **Decision**: Markerless static factory `vault.service.ts` returning a deep-frozen array of
  at least 4 Credential objects, all validated against the schema at the point they are
  returned. Exposes `getSeedCredentials()`.
- **Rationale**: US3 needs a well-formed, realistic, non-empty set exercising distinct field
  values for downstream list/filter features.
- **Alternatives considered**: Configurable generators (rejected: over-build; static seed data
  is sufficient and simpler).

### 7. Randomness test seam

- **Decision**: `add` calls `crypto.randomUUID()` directly; unit tests stub
  `crypto.randomUUID` (and `crypto` itself if absent in the runner) for deterministic
  assertions. No injection of a UUID factory.
- **Rationale**: Keeps the production API free of test-only parameters (anti-abstraction).
  Node ≥19 and Vitest expose `crypto.randomUUID`; stubbing via `vi.stubGlobal` is
  deterministic.
- **Alternatives considered**: Injecting an id factory parameter (rejected: test-only
  surface on a public API); seeding randomness (rejected: fights the platform).

## Decision Log

| # | Decision | Status |
|---|----------|--------|
| 1 | Validation via `safeParse` (007) | locked |
| 2 | VaultStore as signalStore, `providedIn: 'root'` | locked |
| 3 | Invalid mutations = silent no-op, never throw | locked |
| 4 | JSON Schema source of truth + mirroring zod schema | locked |
| 5 | UUID + ISO-8601 timestamps | locked |
| 6 | Static seed array, validated at return | locked |
| 7 | Stub `crypto.randomUUID` in tests | locked |

## Dependencies

- `zod` (v4.6+, installed 007)
- `@ngrx/signals` (installed 003)
- Angular `inject`, `computed`, `signal` (framework core)
- `src/validation/validation.ts` (007)
- Vitest via Angular CLI (`pnpm test:run`)

## In-Scope Boundary

- Schema, store, and mock service only. No components, no routes, no persistence, no
  encryption, no Supabase (roadmap-deferred).