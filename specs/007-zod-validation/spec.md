# Feature Specification: Zod Runtime Validation

**Feature Branch**: `feature/007-zod-validation`

**Created**: 2026-09-12

**Status**: Draft

**Input**: User description: "agregate Zod al proyecto como librería de validación en runtime; va a ser
muy necesaria para validar que todo esté bien (datos que entran desde almacenamiento, APIs o formularios)."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Untrusted input is validated at the boundary before it enters the app (Priority: P1)

As a developer (acting for the user), I want every piece of data that crosses a runtime boundary —
what is read from storage, what a future API returns, what a form submits — to be validated against
a declared schema before the app uses it, so that malformed data can never corrupt state or crash the
application (Constitution: malformed data must never crash the app).

**Why this priority**: The Constitution mandates runtime validation as a first-class citizen and
"Zero Trust in Human Memory". Today the theme store hand-rolls a validation function
(`isThemeChoice`) per boundary; future features (vault data model, credential forms) will add many
boundaries. A shared, declarative validation capability is the foundation the vault features build on.

**Independent Test**: Add the validation library, declare a small schema for a typed value that already
exists at a boundary (e.g. the theme-choice shape), and verify in unit tests that valid data passes
through unchanged, that invalid data is rejected with a structured, non-throwing error, and that the
existing 003 theme behavior is unchanged (its specs stay green untouched or with a mechanical swap).

**Acceptance Scenarios**:

1. **Given** a declared schema, **When** valid data is checked, **Then** the original value is returned
   unchanged (identity or structural equality preserved).
2. **Given** a declared schema, **When** invalid data (wrong type, wrong shape, unknown variant) is
   checked, **Then** the check fails without throwing, and the failure carries a structured message
   naming the offending field and reason (safe to surface, no internals leaked).
3. **Given** a runtime boundary in the app, **When** it receives malformed data, **Then** the app does
   not crash: the boundary resolves to a safe default or a handled error state.
4. **Given** the validation helper, **When** it is used from tests, **Then** failures are asserted
   deterministically (no exception escapes into the test runner).

---

### User Story 2 - The ThemeStore validation is migrated to the shared validator (Priority: P1)

As a developer, I want the existing hand-written theme validation to use the shared validation
capability, so that there is exactly one validation pattern in the codebase for boundary data and no
bespoke per-feature validators going forward.

**Why this priority**: 003 is the only feature with a runtime boundary today (`readStoredChoice`).
Migrating it exercises the new capability against real code (mutant-checkable), proves the library
integrates with the signal store without touching its public API, and sets the pattern for the vault
features. This is the concrete, observable slice of US1.

**Independent Test**: Replace `isThemeChoice`/`readStoredChoice` internals with schema-based
validation while keeping the ThemeStore public contract identical; run the existing 003 specs (they
must stay green) plus new specs that feed invalid stored values and assert the safe fallback.

**Acceptance Scenarios**:

1. **Given** the theme store, **When** storage contains a valid theme choice, **Then** the store
   initializes with that choice (behavior unchanged from 003).
2. **Given** the theme store, **When** storage contains an invalid choice (e.g. `"neon"`, a number, or
   `null`), **Then** the store falls back to `system` and never throws.
3. **Given** the theme store, **When** storage read itself fails (blocked/quota/localStorage absent),
   **Then** the fallback is `system` without an exception (003 behavior preserved).
4. **Given** the migrated store, **When** the 003 spec suite runs, **Then** every spec passes without
   modification to observable behavior.

---

### User Story 3 - Validation failures surface structured, localizable errors (Priority: P2)

As a developer, I want validation failures to be structured (field paths + reason codes) rather than
opaque exception messages, so that future form UI (009) and error handlers can map them to user-facing
messages without parsing strings.

**Why this priority**: 009 needs per-field errors for the credential form. Establishing the error
shape now (on the theme boundary as the probe) avoids reworking the validation helper after vault
slices depend on it. P2 because no current UI renders validation messages yet.

**Independent Test**: Trigger validation failures and assert the resulting error object exposes the
set of failed paths with stable, non-localized reason keys; a human-readable default message is
derived deterministically from the reasons.

**Acceptance Scenarios**:

1. **Given** an invalid input with one wrong field, **When** validation runs, **Then** the failure
   lists that field's path and a stable reason key.
2. **Given** an invalid input with multiple wrong fields, **When** validation runs, **Then** every
   offending field is listed (no fail-fast single-error truncation).
3. **Given** any validation failure, **When** a message is needed, **Then** a deterministic
   human-readable message is available that names the field and the reason without exposing raw
   assertion internals.

---

### Edge Cases

- `undefined` / `null` input: rejected by required schemas; optional fields accept `undefined`.
- Empty string vs missing field: distinct outcomes (empty string is invalid where non-blank is
  required; missing is invalid where required).
- Extra unknown keys on input: handled per schema policy (default: stripped or rejected consistently,
  chosen once and documented) — never silently kept in a way that changes the safe shape.
- Deeply nested malformed data: error paths are full paths (e.g. `items.3.name`) so the offending
  location is never ambiguous.
- Already-valid data: validation is a pass-through with no mutation of the source object.
- Performance on hot paths: validating at a boundary must not add perceptible cost to 003's theme
  read (single scalar check is negligible); no network or runtime-probe overhead is introduced.
- Library stripping/tree-shaking: unused schema code does not bloat the initial bundle any more than
  the theme boundary itself requires; build stays within existing budget.
- TS strictness: schema types must compose with `strict`, `noPropertyAccessFromIndexSignature` and the
  existing signal-store patterns without `any` escapes.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The project MUST add a runtime validation dependency (Zod and, if needed, its
  official companion for error messages) to the runtime `dependencies` (not dev).
- **FR-002**: The app MUST expose a thin, tree-shakeable wrapper/pattern around the library (schema
  definition + safe parse that returns a discriminated result, never throws) that features import
  from a shared location under `src/`.
- **FR-003**: Every runtime data boundary (currently: theme choice read; later: vault data, API
  payloads, form submissions) MUST validate input through the shared capability before use, falling
  back to a declared safe default on failure — no `try/catch` duplicating logic per boundary.
- **FR-004**: The ThemeStore (`readStoredChoice`) MUST be migrated to the shared capability with the
  same observable behavior as 003: invalid choice → `system`; blocked storage → `system`; valid
  choice → itself. The store's public API (signals, methods, `providedIn: "root"`) MUST NOT change.
- **FR-005**: Validation failures MUST be structured: an ordered list of (field path, stable reason
  key) pairs plus a deterministic human-readable message derived from those pairs; no raw exception
  text from the library may be shown to users.
- **FR-006**: Unknown extra keys policy MUST be decided once, documented in the shared wrapper, and
  applied consistently (the chosen default for this feature is **strip on safe-parse**).
- **FR-007**: The shared wrapper MUST be typed end-to-end: the inferred output type of a schema is the
  type used at the boundary; `unknown` inputs are required at the boundary (never `any`);
  `asserts`-style narrowing is used by the store for the migrated read.
- **FR-008**: `src/index.html`, `src/theme/**`, run scripts, and the biome config MUST remain
  byte-for-byte unchanged by this feature except for mechanical, explainable edits if a schema file is
  co-located under `src/theme/`.

### Key Entities

- **Schema**: the declarative description of a typed value at a boundary (e.g. the theme choice
  union). Single source of truth for the shape.
- **Failure/Issue**: the structured validation result: field path + stable reason key + derived message.
- **Safe default**: the declared fallback value a boundary returns when validation fails (e.g. `system`
  for theme).
- **Boundary**: any point where data enters the app from outside it (storage, network, forms today or
  future features).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of US1/US2/US3 acceptance scenarios have corresponding automated tests that are RED
  before their implementation and GREEN after (spec is the tribunal).
- **SC-002**: The 003 theme spec suite passes unchanged (or with only mechanical import edits) once the
  store is migrated; zero behavioral regressions in theme initialization.
- **SC-003**: Unit-level mutation checks validate the migration: (a) removing the invalid-choice
  fallback, (b) removing the blocked-storage fallback, and (c) dropping the structured-reasons helper
  each fail their spec.
- **SC-004**: `pnpm verify` (Biome gate + full unit suite + `ng build`) is green; the built bundle
  contains the validation runtime only if/where the theme boundary pulls it in (no dead-code bloat
  beyond what the store imports).
- **SC-005**: No new `any` is introduced in `src/` by this feature; `strict` + TS 6.0 typecheck passes.

## Assumptions

- Zod (plus its official companion for readable messages, only if it stays uncomplicated on
  Angular 22/browser targets) is the chosen runtime-validation library; it is a runtime dependency by
  contract, and a thin local wrapper under `src/` is the only sanctioned import surface for features.
- The only real boundary migrated in this feature is the theme choice read; the vault/data-model
  boundaries arrive in later features but MUST use the wrapper established here (documented in the
  roadmap so 007-vault-data-model and siblings reference it).
- Unknown extra keys policy default: strip — the safe shape wins; this is documented in the wrapper
  and reviewed in `/speckit.clarify`.
- English-only validation messages (error keys are stable for future i18n mapping).
- No CDN/remote loading of the validation runtime; it ships with the app bundle like any dependency.
- `src/index.html` and the 002 pre-paint script are untouched by this feature.