# Tasks: Zod Runtime Validation

**Input**: Design documents from `/specs/007-zod-validation/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, quickstart.md

**Tests**: Mandatory. The feature spec (Constitution V: Automated Verifiability + fuzzing) and the
plan (T002–T005) demand test-first execution and mutant checks. All story tests are written first,
verified RED, then made GREEN by the story implementation.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Single project**: `src/` at repository root (colocated `*.spec.ts`)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Green baseline and library installation before any implementation

- [ ] T001 Run `pnpm verify` on `feature/007-zod-validation` and confirm GREEN baseline (Biome + full unit suite + build) BEFORE adding any code
- [ ] T002 Install the runtime validation library: `pnpm add zod` so `zod@^4.6.2` lands in `dependencies` in `package.json` (research D1: full `zod`, not `zod/mini`)

**Checkpoint**: `pnpm verify` still GREEN with `zod` installed; no source files touched yet

---

## Phase 2: User Story 1 - Untrusted input validated at the boundary (Priority: P1, MVP)

**Goal**: A never-throwing shared wrapper (`safeParse`) that validates unknown input against a Zod
schema and returns a discriminated `ValidationResult<T>`, with a deterministic malformed-input fuzz
corpus (Constitution V).

**Independent Test**: `pnpm ng test --watch=false --include='src/validation/validation.spec.ts'` runs
the wrapper + fuzz suite: valid input returns `{ success: true, value }`; invalid input returns
`{ success: false, issues }` and never throws on any entry of the fuzz corpus.

### Tests for User Story 1 (write FIRST, verify RED)

- [ ] T003 [P] [US1] Write `src/validation/validation.spec.ts` (verify RED before T004): valid-input
      passthrough, invalid-scalar failure (single issue: `path: ""`, stable `code`, non-empty
      `message`), two-wrong-fields object (both issues listed), never-throws assertion on arbitrary
      input, and the deterministic fuzz corpus (`null`, `undefined`, `0`, `NaN`, `[]`, `{}`,
      `"neon"`, `{ a: 1 }`, nested garbage) asserting every entry yields a well-formed
      `ValidationResult` without throwing

### Implementation for User Story 1

- [ ] T004 [US1] Implement `src/validation/validation.ts`: `ValidationIssue` (`path: string` dotted,
      `code: string`, `message: string`), `ValidationResult<T>` discriminated union, and
      `safeParse<T>(schema: z.ZodType<T>, input: unknown): ValidationResult<T>` mapping
      `result.error.issues` to dotted paths (research D2; Plan FR-002/FR-005/FR-007). Document in the
      module docblock the single unknown-keys policy: `z.object()` default **strip** (Plan FR-006)

**Checkpoint**: `validation.spec.ts` GREEN; US1 independently testable and demonstrable (MVP)

---

## Phase 3: User Story 2 - ThemeStore validation migrated to the shared validator (Priority: P1)

**Goal**: The 003 theme boundary uses the wrapper; `ThemeStore` public contract (signals, methods,
`providedIn: "root"`) and all 003 observable behavior stay identical.

**Independent Test**: `pnpm ng test --watch=false --include='src/theme/**/*.spec.ts'` — the entire
existing 003 suite stays GREEN unchanged (corrupt → `system`, blocked storage → `system`, valid →
itself, `setChoice("neon")` → no-op) plus the new schema spec.

### Tests for User Story 2 (write FIRST, verify RED)

- [ ] T005 [P] [US2] Write `src/theme/theme-choice-schema.spec.ts` (verify RED before T006):
      `safeParse(themeChoiceSchema, X)` accepts `"light"`, `"dark"`, `"system"`; rejects `"neon"`,
      `null`, `""`, `'"dark"'` (JSON-wrapped) and `"dark"` with surrounding quotes, each with
      `success: false`; compile-time assertion that inferred `ThemeChoice` equals
      `"light" | "dark" | "system"`

### Implementation for User Story 2

- [ ] T006 [P] [US2] Create `src/theme/theme-choice-schema.ts`: `const themeChoiceSchema =
      z.enum([CHOICE_LIGHT, CHOICE_DARK, CHOICE_SYSTEM])` and `export type ThemeChoice =
      z.infer<typeof themeChoiceSchema>` built from the frozen 002 literals in `src/theme/theme-contract.ts`
- [ ] T007 [US2] Migrate `src/theme/theme.store.ts`: remove `VALID_CHOICES`/`isThemeChoice`; use
      `safeParse(themeChoiceSchema, ...)` in `readStoredChoice` (fallback `CHOICE_SYSTEM`, try/catch
      preserved for blocked storage) and in the `setChoice` guard (no-op on failure); import the
      re-exported `ThemeChoice` type; keep public API identical (Plan FR-004)
- [ ] T008 [US2] Mutant check on the migration: (a) remove the `readStoredChoice` fallback →
      "falls back to system for corrupt values" FAILS; (b) remove the `setChoice` return guard →
      "out-of-enum value is a no-op" FAILS; (c) remove the `readStoredChoice` try/catch (storage
      blocked, `throwOnGet`) → "never throws when storage access is blocked" FAILS; (d) restore all
      three → GREEN (Plan SC-003)

**Checkpoint**: 003 suite + schema spec GREEN; US1 + US2 both work independently

---

## Phase 4: User Story 3 - Structured, localizable validation failures (Priority: P2)

**Goal**: Failures expose stable `(path, code)` reasons with a deterministic human-readable message
derived from the issue — the seam future form UI (009) maps to user messages.

**Independent Test**: `pnpm ng test --watch=false --include='src/validation/validation.spec.ts'`
asserts the structured-issue acceptance scenarios (single field listed with path + stable code;
multiple wrong fields all listed — no fail-fast truncation; deterministic non-empty message without
raw internals).

### Tests for User Story 3 (write FIRST, verify RED/assert)

- [ ] T009 [US3] Extend `src/validation/validation.spec.ts` (assert against US1 wrapper) with US3
      assertions: one-wrong-field object → exactly one issue with dotted `path` + stable `code` +
      deterministic `message`; two-wrong-fields object → both issues enumerated; failure messages
      name the field/reason without exposing raw library internals (e.g. no nested exception text in
      `message`)
- [ ] T010 [US3] Mutant check on the issue mapping in `src/validation/validation.ts`: (a) drop the
      `path`/`code` fields from the mapped issues → the US3 shape assertions FAIL; (b) map only the
      first issue → the "both issues listed" assertion FAILS; (c) restore → GREEN

**Checkpoint**: All three user stories independently functional and covered

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: Gate polish, bundle sanity, and regression guard

- [ ] T011 Run `pnpm check:fix` — Biome format+lint clean across `src/`
- [ ] T012 Run `pnpm verify` — full unit suite + `ng build` GREEN with `zod` in the bundle
- [ ] T013 Spot-check `dist/nop3-lockr-vault/browser/*.js` bundle size — no obvious dead-code bloat
      or locale drag beyond the theme boundary's import (research D5; Plan SC-004)
- [ ] T014 Regression guard: confirm `src/index.html`, `src/theme/pre-paint.spec.ts`, `src/app/app.spec.ts`
      and `src/app/theme-toggle/theme-toggle.spec.ts` are byte-for-byte/behavior unchanged and still
      GREEN (Plan FR-008). Also confirm `package.json` run scripts and the Biome config
      (`biome.json`) are unchanged by the feature
- [ ] T015 Run `specs/007-zod-validation/quickstart.md` steps end-to-end as the final validation pass

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **US1 (Phase 2)**: Depends on Setup; is the shared capability both other stories reuse
- **US2 (Phase 3)**: Depends on Setup + US1 (`safeParse` wrapper)
- **US3 (Phase 4)**: Depends on Setup + US1 (`ValidationIssue` mapping); asserts on the same wrapper
- **Polish (Phase 5)**: Depends on all three user stories

### Within Each User Story

- Tests are written FIRST and verified RED/asserting before the story implementation runs GREEN
- Schema before migration (US2); wrapper before mapping assertions (US3)

### Parallel Opportunities

- T003 and T005 (US1 + US2 test files) are `[P]` — different files, no interdependency
- T006 (schema file) is `[P]` relative to T005 and T005 alone — the store migration (T007) waits for both
- T001 and T002 are sequential (baseline must be verified before installing)
- Polish tasks T011–T015 run after all stories

### Suggested MVP Scope

User Story 1 only (Phase 1 + Phase 2): installs `zod`, ships the never-throwing `safeParse` wrapper
with its fuzz corpus, and satisfies Constitution V without touching theme code. US2/US3 are
incremental additions.

---

## Parallel Example: US1 + US2 test-first files

```bash
# Launch both RED specs together:
Test: "Write src/validation/validation.spec.ts"  # T003
Test: "Write src/theme/theme-choice-schema.spec.ts"  # T005
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: User Story 1 (wrapper + fuzz corpus)
3. **STOP and VALIDATE**: `validation.spec.ts` GREEN independently
4. Optionally stop here — the capability exists without touching theme code

### Incremental Delivery

1. Setup + US1 → Test independently (MVP: shared validation capability with fuzzing)
2. Add US2 → Test independently (theme boundary migrated, 003 unchanged)
3. Add US3 → Test independently (structured reasons documented+asserted)
4. Polish → full gate green

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability; T009 carries `[US1]` (reuses it)
  and `[US3]` (extends it)
- Each user story is independently completable and testable
- Verify RED before implementing; verify GREEN after; mutant-check each story's core logic
- Commit after each task or logical group, only after user review (AGENTS.md)
- Stop at any checkpoint to validate the story independently
- Avoid: vague tasks, same-file conflicts, cross-story dependencies that break independence