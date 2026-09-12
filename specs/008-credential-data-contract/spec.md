# Feature Specification: Credential Data Contract

**Feature Branch**: `feature/008-credential-data-contract`

**Created**: 2026-09-12

**Status**: Draft

**Input**: User description: "Credential data contract, mock data service, and VaultStore CRUD mutations"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - The Credential data contract is the single source of truth (Priority: P1)

As a developer, I want a Credential data contract that defines the exact shape of a vault entry —
validated at every runtime boundary through the shared validation capability (007) — so that no
feature can silently corrupt the vault by introducing data with the wrong shape or missing required
fields.

**Why this priority**: Every downstream feature (list, form, favorites, search, CRUD) depends on
the Credential shape. Without a validated, enforced contract at the data layer, future UI and
persistence features cannot safely read or write credentials. This is the foundation slice of the
vault domain.

**Independent Test**: Define a Credential schema, feed well-formed and malformed objects through
the boundary validation (`safeParse` from 007), and assert that well-formed values pass through
unchanged while malformed inputs produce structured failures listing the exact offending fields
and reason codes.

**Acceptance Scenarios**:

1. **Given** a well-formed Credential object (all required fields present with correct types),
   **When** the object is validated at the boundary, **Then** the validation passes and the
   original value is returned unchanged.
2. **Given** a Credential with a missing required field (e.g. no `name`), **When** validation
   runs, **Then** the validation fails with a structured issue naming the missing field.
3. **Given** a Credential with a field of the wrong type (e.g. `favorite` is a string instead of
   a boolean), **When** validation runs, **Then** the validation fails with a structured issue
   naming the offending field and the reason.
4. **Given** any input that is not Credential-shaped (e.g. a plain string, `null`, a random
   object), **When** validation runs, **Then** the validation fails without throwing and returns
   a structured result listing the root-level issues.
5. **Given** a valid Credential, **When** extra unknown fields are present on the input,
   **Then** the validated output does not include the unknown fields (strip policy inherited
   from the shared wrapper in 007).

---

### User Story 2 - The VaultStore manages the credential lifecycle in memory (Priority: P1)

As a developer, I want a VaultStore (signal store) that holds the full credential collection
in memory and exposes validated CRUD mutation methods — so that every feature that adds, updates,
or deletes a credential goes through a single, tested, boundary-validated path instead of
directly manipulating state.

**Why this priority**: The list view (009), the form (010), and favorites/search (011) all
depend on a shared, consistent store. Making the store with its validated mutations land before
any UI ensures all downstream features interact with validated data from day one.

**Independent Test**: Instantiate the VaultStore, perform add/update/delete mutations, and assert
that (a) the `credentials` signal reflects each mutation, (b) invalid inputs are rejected
without throwing or mutating state, (c) the `currentId` sequence never collides, and (d) the
public API surface matches the declared shape.

**Acceptance Scenarios**:

1. **Given** the VaultStore seeded with a well-formed Credential, **When** the `list`
   accessor is read, **Then** the credential is present in the collection.
2. **Given** an empty VaultStore, **When** a valid Credential payload is passed to the add
   mutation, **Then** the credential is added to the store with a stable UUID, the
   `created_at` timestamp is set, and the `list` accessor reflects the new entry.
3. **Given** a VaultStore, **When** an add mutation receives an invalid Credential payload,
   **Then** the mutation rejects the input, the `list` accessor is unchanged, and no throw
   escapes.
4. **Given** a VaultStore with a known credential, **When** a valid update payload is passed
   to the update mutation, **Then** the credential in the store reflects the updated fields,
   `updated_at` is set, and `created_at` is preserved.
5. **Given** a VaultStore with a known credential, **When** the delete mutation is called with
   that credential's ID, **Then** the credential is removed from the collection.
6. **Given** a VaultStore with a known credential, **When** the update or delete mutation is
   called with an unknown ID, **Then** the mutation is a no-op (state unchanged, no throw).

---

### User Story 3 - A mock data service seeds a realistic credential catalog (Priority: P2)

As a developer, I want a mock data service that provides a realistic, well-formed seed set of
Credentials — so that downstream features (list, form, detail view) have a populated vault to
render against from the moment they land, without depending on a real backend or manual fixture
creation.

**Why this priority**: The credential list (009) needs data to display. Without seed data the
downstream UI shows an empty state that does not exercise the full rendering path. A mock
service that already validates every seed credential against the contract guarantees the data
is structurally valid and consistent.

**Independent Test**: Call the mock service and assert the returned collection contains at least
the declared minimum number of credentials, every entry validates against the Credential schema
without errors, and all required fields are present and well-typed.

**Acceptance Scenarios**:

1. **Given** the mock data service, **When** seed credentials are requested, **Then** a
   non-empty collection of Credentials is returned.
2. **Given** the seed collection returned by the mock service, **When** each credential is
   validated through the Credential schema, **Then** every credential validates successfully
   (all required fields present, all types correct).
3. **Given** the seed collection, **When** the collection is inspected, **Then** the
   credentials demonstrate a variety of realistic field values (different usernames, domains,
   varying `favorite` states) to exercise downstream list/filter behavior.

---

### Edge Cases

- What happens when `null` or `undefined` is passed to the Credential schema validator?
  Structured failure, no throw; the downstream store treats it as invalid input.
- What happens when `addCredential` receives a payload missing multiple required fields?
  The validation lists every missing field (no fail-fast truncation), the store state is
  unchanged, and no exception escapes.
- What happens when a Credential is updated with only some fields? The store merges the update
  into the existing entry: provided fields overwrite, omitted fields (e.g. `notes`, `favorite`)
  are preserved unchanged.
- What happens when `deleteCredential` is called with an ID that has never existed? The store
  is unchanged; this is a documented no-op (idempotent delete).
- What happens when two rapid mutations run on the same Credential? Each mutation is synchronous
  and operates on the current state at invocation; signals reflect the latest committed state
  after the synchronous block completes.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The project MUST define a Credential data contract under `contracts/` as a JSON
  Schema (JSON Schema 2020-12) that serves as the single source of truth for the Credential
  shape across all features.
- **FR-002**: The Credential schema MUST require the following fields: `id` (string, UUID),
  `name` (string), `username` (string), `domain` (string), `password` (string). Optional
  fields: `favorite` (boolean, default `false`), `notes` (string, empty string default),
  `created_at` (string, ISO-8601 timestamp), `updated_at` (string, ISO-8601 timestamp or
  absent). FR-002 describes the full stored Credential (with `id` and timestamps); input
  shapes that reach the store (`CredentialDraft` for add, `CredentialPatch` for update) omit
  `id`/timestamps per FR-005 and are documented in the data model.
- **FR-003**: Every runtime boundary where a Credential enters the app (mock service output,
  store mutations, form submissions) MUST validate the input against the schema using the
  shared `safeParse` wrapper from 007 before the value is used, falling back to a safe
  default or rejecting the mutation as documented per boundary.
- **FR-004**: The VaultStore MUST expose a read-only `credentials` accessor (derived signal)
  and synchronous validated mutation methods: `add`, `update`, `delete` (by ID), and
  `getById`.
- **FR-005**: The `add` mutation MUST accept a Credential payload without `id` / timestamps
  and assign a stable UUID and `created_at` before persisting; the `update` mutation MUST
  accept a payload with an existing `id` and merge provided fields onto the existing entry,
  setting `updated_at`.
- **FR-006**: The VaultStore MUST use `providedIn: 'root'` so the same instance is shared
  across the application without manual provider registration.
- **FR-007**: The mock data service MUST return seed credentials that all validate against the
  Credential schema, with a minimum of four entries exercising distinct field values.
- **FR-008**: The VaultStore public API (`providedIn`, signals, method signatures) MUST remain
  stable and unchanged by downstream features; new mutations (e.g. `setFavorite`) are added
  without removing or renaming existing methods.
- **FR-009**: Existing features (004–007) MUST NOT be modified by this feature; `src/index.html`,
  theme contracts, run scripts, and biome config remain byte-for-byte unchanged.
- **FR-010**: All mutations MUST be synchronous and never throw: invalid input produces a
  failed validation result or no-op without escaping an exception to the caller.

### Key Entities

- **Credential**: A vault entry representing a single stored credential (site login, API key,
  etc.). Identified by a UUID. The schema defines all required and optional fields; the schema
  is the single source of truth for the shape and is validated at every boundary.
- **VaultStore**: An in-memory signal store (`@ngrx/signals`) that owns the canonical
  collection of Credentials for the application. Validates all inputs through the Credential
  schema before mutating state; exposes a read-only derived signal and synchronous mutation
  methods. Mock only: no persistence, no encrypted blob, no cloud sync.
- **MockDataService**: A simple injectable service (`providedIn: 'root'`) that returns a
  pre-built array of well-formed Credential objects used to seed the VaultStore at application
  startup. Serves as the test harness for downstream features until a real backend lands.
- **CredentialSchema**: The JSON Schema under `contracts/` and the corresponding runtime
  validation schema (aligned via the `safeParse` wrapper from 007). Never diverges from the
  JSON Schema source of truth.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Every Credential field has a defined JSON Schema type; 100% of fields in the
  schema are validated at runtime when data crosses a boundary (measured by unit tests per
  US1 acceptance scenarios).
- **SC-002**: The VaultStore add/update/delete mutations are covered by at least 8 passing unit
  tests covering happy path, invalid input (structured failure, no throw), missing-ID no-op,
  timestamp assignment, and ID uniqueness.
- **SC-003**: The mock service returns at least 4 well-formed Credentials; every seed entry
  validates against the schema in unit tests with zero failures.
- **SC-004**: The full unit suite (`pnpm verify`) passes: biome clean, all existing + new tests
  GREEN, production build succeeds.
- **SC-005**: The bundle does not show perceptible bloat in the initial chunk beyond what 007
  already introduced; the Credential schema lives in a chunk accessible to the store only
  when the vault domain is loaded.
- **SC-006**: `pnpm ng test --watch=false --include='src/app/**/*.spec.ts'` continues to pass
  with no modifications to the existing app-level test suite.

## Assumptions

- English-only copy; no i18n infrastructure is added or modified.
- Mock data only: this feature introduces no persistence, no Supabase, no IndexedDB, and no
  encryption. The Constitution's "The Safe" clauses (vault blob, Supabase, AES-256-GCM,
  Argon2id, Master Password handling) remain out of scope until a dedicated storage/cryptography
  feature is scheduled (roadmap deferred).
- The mock Credential passwords are plain strings in memory; this is explicitly safe because
  they are non-sensitive test data, not user-supplied secrets.
- The Credential schema sits under `contracts/` following the convention established by
  002 (`contracts/theme-choice.schema.json`).
- UUID generation uses `crypto.randomUUID()` which is available in all modern browsers and
  Node ≥ 19; no polyfill is required.
- The VaultStore depends on `@ngrx/signals` (already installed by 003) and the `safeParse`
  wrapper from 007; no new runtime dependencies are added by this feature.
- `providedIn: 'root'` for the VaultStore mirrors the convention of the ThemeStore (003) and
  keeps provider registration out of the component tree.
- The feature does not add any Angular routes or components; all files are services, schemas,
  types, and tests. Routing for the credential list and form lands in subsequent features.
