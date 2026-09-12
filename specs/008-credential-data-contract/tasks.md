# Tasks: Credential Data Contract

**Input**: Design documents from `/specs/008-credential-data-contract/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Included — the feature spec explicitly requires unit tests (SC-001..SC-006), and AGENTS.md mandates AAA structure, the shared test toolkit, and the mutant check. Tests are written FIRST (RED) before each implementation.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Single project**: `src/`, `contracts/` at repository root
- **Data contract (JSON Schema)**: `specs/008-credential-data-contract/contracts/` (Constitution: feature's `contracts/` dir)
- Fixture helpers live in `src/testing/` (shared toolkit: `clean-state.ts`, `setup-module.ts`)
- Vault domain sources under `src/vault/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Establish the GREEN baseline on the feature branch and confirm the contract artifact

- [ ] T001 Verify `pnpm verify` is GREEN on `feature/008-credential-data-contract` (193 existing tests; biome ci; build) — establishing the pre-feature baseline
- [ ] T002 [P] Add `specs/008-credential-data-contract/contracts/credential.schema.json` (JSON Schema 2020-12: 6 required fields — id/name/username/domain/password; optional favorite/notes/created_at/updated_at; additionalProperties: false) and validate it parses via `node -e "require('./specs/008-credential-data-contract/contracts/credential.schema.json')"`

**Checkpoint**: Baseline GREEN, contract artifact committed-ready

---

## Phase 2: User Story 1 - Credential data contract is the single source of truth (P1) — MVP

**Goal**: A validated Credential contract enforces the exact shape at every boundary via `safeParse` (007), with structured failure results and strip policy. The zod schema is the contract's runtime mirror and is the blocking prerequisite for US2/US3 (it serves multiple stories, so it lives in the earliest story).

**Independent Test**: `pnpm ng test --watch=false --include='src/vault/credential.schema.spec.ts'` — valid object passes unchanged, missing required field → issue naming field, wrong type → issue with code, non-object root → root-level issues, unknown keys stripped.

### Tests for User Story 1

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [ ] T003 [P] [US1] Write `src/vault/credential.schema.spec.ts` using `safeParse(credentialSchema, input)` covering US1 acceptance scenarios 1–5: valid pass-through (with `expect(result).toEqual({success:true,...})`), missing `name` → issue path `"name"` code `"invalid_type"`, `favorite` as string → issue path `"favorite"`, `null`/string/number root → root issue path `""`, unknown key stripped from `value` — runs RED (imports `./credential.schema` which does not exist yet)

### Implementation for User Story 1

- [ ] T004 [US1] Create `src/vault/credential.schema.ts` defining `credentialSchema` (mirror of `specs/008-credential-data-contract/contracts/credential.schema.json` → `Credential`, `favorite` default `false`, `notes` default `""`, no unknown-keys handling beyond the 007 strip policy), plus `credentialDraftSchema` (no `id`/`created_at`/`updated_at` → `CredentialDraft`) and `credentialPatchSchema` (all fields optional except `id` handled by method param → `CredentialPatch`); types exported via `z.infer` — run the T003 spec GREEN
- [ ] T005 [US1] Mutant check for T003/T004: delete `minLength: 1` from `name` → SPEC-FAIL; remove `.default()` from `favorite`/`notes` → SPEC-FAIL; restore code, verify GREEN

**Checkpoint**: US1 done — schema boundary validated; store and service can consume the contract

---

## Phase 3: User Story 2 - The VaultStore manages the credential lifecycle in memory (P1)

**Goal**: A signalStore (`providedIn: 'root'`) exposing read-only `credentials` derived signal, `count`, and synchronous validated mutations `add`/`update`/`delete`/`getById` that never throw.

**Independent Test**: `pnpm ng test --watch=false --include='src/vault/vault.store.spec.ts'` — add assigns UUID+created_at and reflects in list; invalid payload no-ops without throwing; update merges fields sets updated_at preserves created_at; unknown-id update/delete no-op; delete removes; getById finds/undefined.

### Tests for User Story 2

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [ ] T006 [P] [US2] Write `src/vault/vault.store.spec.ts` (AAA pattern; no test-only DI; depends on T004 schema): stub `crypto.randomUUID` via `vi.stubGlobal` for deterministic ids; given store via store-instance creation (for issue-free isolation, create the store instance per-test through the signalStore factory or use the shared TestBed as needed); assert `credentials()` list, `count`, add assigns stable `id` + `created_at`, invalid add leaves list unchanged and does not throw, update merges `password`/`name` + sets `updated_at` preserving `created_at`, unknown-id update/delete unchanged, delete removes entry, `getById` returns entry/`undefined` — runs RED (imports `./vault.store` which does not exist yet)

### Implementation for User Story 2

- [ ] T007 [US2] Implement `src/vault/vault.store.ts` (signalStore with `withState`, `withComputed`, `withMethods`; `safeParse` on add/update with silent no-op on invalid; `patchState` never `mutate`; add builds entry with `crypto.randomUUID()` + `created_at`, omits `updated_at`; update merges over existing entry, sets `updated_at`, preserves `created_at`; delete filters by `id`; run the T006 spec GREEN)
- [ ] T008 [US2] Mutant check for T006/T007: remove validation from `add` → invalid-input spec fails; remove `updated_at` assignment in `update` → spec fails; replace `patchState` with direct array push → spec fails; restore code, verify GREEN

**Checkpoint**: US2 done — the standalone store handles a full credential lifecycle

---

## Phase 4: User Story 3 - A mock data service seeds a realistic credential catalog (P2)

**Goal**: An injectable service (`providedIn: 'root'`) returning ≥4 deep-frozen seed Credentials that all validate against `credentialSchema`.

**Independent Test**: `pnpm ng test --watch=false --include='src/vault/vault.service.spec.ts'` — non-empty collection, every seed validates through `safeParse(credentialSchema, seed)` success, seeds exercise distinct field values including at least one `favorite: true`.

### Tests for User Story 3

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [ ] T009 [P] [US3] Write `src/vault/vault.service.spec.ts` using `TestBed.inject(MockDataService)` via shared `setup-module.ts`/`clean-state.ts` toolkit: seeds length ≥ 4, every seed `safeParse(credentialSchema, seed).success === true`, at least one `favorite: true`, at least 3 distinct `domain` values, seeds are frozen (`Object.isFrozen`) — runs RED (imports `./vault.service` which does not exist yet)

### Implementation for User Story 3

- [ ] T010 [US3] Implement `src/vault/vault.service.ts` (class `MockDataService` with `@Service` decorator from `@angular/core`, `getSeedCredentials()` returning `Object.freeze([...4+ credentials...])`; run the T009 spec GREEN)
- [ ] T011 [US3] Mutant check for T009/T010: remove a seed → length spec fails; set a seed `password` to empty string → validation spec fails; un-freeze the array → frozen spec fails; restore code, verify GREEN

**Checkpoint**: US3 done — a populated, validated seed catalog ready for the list feature

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: Full-suite verification, lint/format, and run-guide validation

- [ ] T012 Run `pnpm check:fix` (biome check --write) then `pnpm verify` — all of biome ci, `pnpm test:run` (existing + 3 new specs GREEN), and production build pass; zero new findings
- [ ] T013 Validate `specs/008-credential-data-contract/contracts/credential.schema.json` against JSON Schema 2020-12 shape and confirm `src/vault/credential.schema.ts` mirrors it (field names/types/required); fix drift if any
- [ ] T014 Walk the `specs/008-credential-data-contract/quickstart.md` validation guide end-to-end (schema smoke checks, store CRUD smoke, seed service smoke, `pnpm verify` gate)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **US1 (Phase 2)**: Depends on Setup — ships the schema + its validation spec; schema BLOCKS US2/US3
- **User Stories (Phase 3+)**:
  - US2 (P1) — depends on US1 schema (T004); can follow US1 or run in parallel with US3
  - US3 (P2) — depends on US1 schema (T004); independent from US2 (different files)
- **Polish (Final Phase)**: Depends on all user stories

### User Story Dependencies

- **US1**: Blocks downstream schema consumers (US2, US3); the schema is its deliverable
- **US2**: Consumes `credential.schema.ts` (US1); does not touch US3 files
- **US3**: Consumes `credential.schema.ts` (US1); does not touch US2 files
- **NOTE**: US2 and US3 share no files — safe to parallelize after the schema lands

### Within Each User Story

- Tests (included) MUST be written and FAIL before implementation
- Implementation follows the failing test; RED → GREEN
- Mutant check runs after GREEN, then restore + re-GREEN

### Parallel Opportunities

- T002 [P] runs in parallel with T001
- T003 [P] written before T004 (TDD within US1)
- T006 [P] test file written before T007 implementation (TDD)
- T009 [P] test file written before T010 implementation (TDD)
- After the schema lands (T004), US2 and US3 can proceed in parallel
- All store/service specs can be authored independently and run individually

---

## Parallel Example: US2 + US3 (after schema lands)

```bash
# Launch tests for both stories together:
Task: "Write vault.store.spec.ts (T006)"     # src/vault/vault.store.spec.ts
Task: "Write vault.service.spec.ts (T009)"   # src/vault/vault.service.spec.ts

# Then implementations in parallel:
Task: "Implement vault.store.ts (T007)"      # src/vault/vault.store.ts
Task: "Implement vault.service.ts (T010)"    # src/vault/vault.service.ts
```

---

## Implementation Strategy

### MVP First (US1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: US1 (schema spec RED → implementation GREEN) — schema also unblocks US2/US3
3. **STOP and VALIDATE**: `pnpm ng test --watch=false --include='src/vault/credential.schema.spec.ts'` GREEN
4. Optional demo point: contract validated end-to-end

### Incremental Delivery

1. Setup → Foundation ready
2. US1 → schema validated (MVP ✓)
3. US2 → full CRUD store, independently tested
4. US3 → seed catalog validated, ready for the list feature
5. Each story adds value without breaking prior stories; `specs/008-credential-data-contract/contracts/credential.schema.json` is the shared anchor

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to the spec's user story for traceability
- Each user story is independently completable and testable
- Tests fail before implementation (RED → GREEN); mutant checks included in every story
- Commit after each task or logical group — user reviews before commit (AGENTS.md)
- Avoid: vague tasks, same-file conflicts, cross-story dependencies that break independence
- Do NOT modify 004–007 files; `src/app/`, theme, validation, and run configs stay untouched