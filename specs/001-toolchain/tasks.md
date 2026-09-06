---

description: "Task list template for feature implementation"
---

# Tasks: Developer Toolchain

**Input**: Design documents from `/specs/001-toolchain/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: No new test files are requested by the spec; unit tests exist and are exercised as a
gate inside `verify`. Tasks below validate the toolchain via the quickstart scenarios + existing
test/build gates.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Single project (Angular SPA)**: `src/`, configs and scripts at repository root
- Toolchain root files: `biome.json`, `tsconfig*.json`, `package.json`, `README.md`, `.prettierrc`

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Install the single tool that powers all gates

- [x] T001 Add `@biomejs/biome@2.5.12` as an exact-pinned devDependency in `package.json` and run `pnpm install` to update `pnpm-lock.yaml`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Configuration and alignment that MUST exist before any user story can be demonstrated

**CRITICAL**: No user story work can begin until this phase is complete

- [x] T002 Create `biome.json` per `research.md` Decision 1/4: `$schema` (2.5.12), `files.ignore` (`dist/`, `node_modules/`, `.angular/`, `coverage/`, `playwright-report/`, `test-results/`), `formatter` (space, 2, 100), `linter` (recommended + Angular overrides per research), `organizeImports`, `vcs` (git, useIgnoreFile)
- [x] T003 Align TypeScript configs per `research.md` Decision 3: move shared strict options into `tsconfig.json` (root) and make `tsconfig.app.json` + `tsconfig.spec.json` extend it with only app/spec-specific fields
- [x] T004 Remove Prettier per `spec.md` FR-004: delete `prettier` from `package.json` devDependencies (update lockfile), delete `.prettierrc`, and run `git grep -in prettier` to confirm zero references in code/configs/docs
- [x] T005 Add toolchain scripts to `package.json` per `contracts/toolchain-cli.md` §1: `format` (`biome format --write .`), `check` (`biome check .`), `check:fix` (`biome check --write .`), `check:format` (`biome ci .`), `verify` (`biome ci . && pnpm test && pnpm build`); keep existing `start`/`test`/`build`

**Checkpoint**: Foundation ready — user story demonstration can now begin

---

## Phase 3: User Story 1 - One-command static verification (Priority: P1)

**Goal**: `pnpm verify` runs every gate (format, lint, unit tests, build) and reports green/red.

**Independent Test**: Run `pnpm verify` on a clean tree → exit 0 with all gates green; introduce a lint violation → non-zero exit pointing at the file.

### Implementation for User Story 1

- [x] T006 [US1] Run `pnpm verify` and fix any findings it surfaces (format/lint on existing scaffold files, e.g. `src/app/app.spec.ts`); confirm exit 0 and all gates green
- [x] T007 [US1] Negatively test the gate per `quickstart.md` Scenario 2: introduce a deliberate lint violation in `src/app/app.ts`, run `pnpm check`, confirm non-zero exit + `file:line`/rule output, then revert

**Checkpoint**: At this point, User Story 1 is fully functional and testable independently

---

## Phase 4: User Story 2 - Automatic formatting and fixable lint (Priority: P1)

**Goal**: `pnpm format` rewrites canonical style idempotently; `pnpm check:fix` corrects safe issues.

**Independent Test**: Break formatting in a source file → `pnpm format` rewrites it, a second `pnpm format` is a no-op diff.

### Implementation for User Story 2

- [x] T008 [US2] Run `pnpm check --write .` then `pnpm format` across the repo per `quickstart.md` Scenario 3; confirm the working tree is canonical
- [x] T009 [US2] Verify idempotency: run `pnpm format` a second time and confirm `git diff` shows no additional changes

**Checkpoint**: At this point, User Stories 1 AND 2 both work independently

---

## Phase 5: User Story 3 - Consistent, committed configuration (Priority: P2)

**Goal**: Committed, pinned config gives every contributor identical, offline-capable results.

**Independent Test**: Disconnect network → `pnpm check` still succeeds cleanly; `git grep prettier` returns nothing.

### Implementation for User Story 3

- [x] T010 [US3] Verify offline capability per `quickstart.md` Scenario 4: with the network disconnected, run `pnpm check` and confirm it exits 0 (no remote fetches)
- [x] T011 [US3] Update `README.md` command reference per `contracts/toolchain-cli.md` §1 + `plan.md`: document `format`, `check`, `check:fix`, `check:format`, `verify`, and the Biome install/setup note

**Checkpoint**: All user stories are now independently functional

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final validation sweep against SC-001…SC-004

- [x] T012 Run every `quickstart.md` scenario (1-5) end-to-end and confirm expected outcomes; run `pnpm verify` one final time on a clean tree
- [x] T013 Confirm FR-009: `biome.json` excludes all generated artifacts and a `git status --short` after `pnpm verify` shows no stray files (only expected build outputs, ignored)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup - BLOCKS all user stories
- **User Stories (Phase 3+)**: All depend on Foundational phase completion
- **Polish (Phase 6)**: Depends on all user stories

### User Story Dependencies

- **User Story 1 (P1)**: After Foundational - No dependencies on other stories
- **User Story 2 (P1)**: After Foundational - shares `package.json` scripts with US1, sequential within same phase order
- **User Story 3 (P2)**: After Foundational - no cross-story dependencies

### Within Each User Story

- Core implementation before validation
- Story complete before moving to next priority

### Parallel Opportunities

- T002/T003 can run in parallel (different files) once T001 completes
- T006/T007 are sequential-demonstration within US1
- T010/T011 run in parallel within US3 (documentation vs offline check, different surfaces)

---

## Parallel Example: Setup + Foundational

```bash
# After pnpm install (T001):
Task: "Create biome.json (T002)"
Task: "Align TypeScript configs (T003)"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001)
2. Complete Phase 2: Foundational (T002-T005) - CRITICAL, blocks all stories
3. Complete Phase 3: User Story 1 (T006-T007)
4. **STOP and VALIDATE**: run `pnpm verify` (US1 accepted)
5. Proceed to US2/US3

### Incremental Delivery

1. Setup + Foundational → `verify` available
2. US1 → single-command green gate (foundation!)
3. US2 → format/check:fix ergonomics
4. US3 → reproducibility + docs
5. Polish → full quickstart validation

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story is independently completable and testable
- Node commands (`pnpm`/`biome`) follow AGENTS.md Process Policies: if a run fails or yields an unexpected result, stop and hand the exact command to the user
- Verify tests fail before implementing: the failing gates are T007 (negative check) as the proof
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently