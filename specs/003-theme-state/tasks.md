---

description: "Task list for theme state feature implementation"
---

# Tasks: Theme State

**Input**: Design documents from `/specs/003-theme-state/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/
(`theme-state.schema.json`; external `theme-choice.schema.json` from 002)

**Constitution**: automated tests are MANDATORY for every scenario (Automated Verifiability + Testing
and Compliance clauses), so every story includes test-first tasks. Tests are written and shown to
FAIL before the implementation that satisfies them.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)
- Exact file paths are included.

## Path Conventions

- Single Angular SPA at repo root: `src/` (store and its spec colocated under `src/theme/`).
- Runtime dependency installation: performed by the DEVELOPER (user policy). `@ngrx/signals` v22
  must be installed before T003 runs its tests; hold any implementation task until the user reports
  the install green.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Confirm the starting point is green before any change.

- [ ] T001 Confirm the green baseline by running `pnpm verify` and recording the output (all
      gates: `biome ci . && pnpm test && pnpm build`). If green, proceed; if not, STOP and report.
      (Expected: the 120 tests from feature 002 pass on this branch.)

---

## Phase 2: User Story 1 - The chosen theme survives reloads (Priority: P1) — MVP

**Goal**: The store initializes from the validated stored choice (falling back to `system` without
crashing or overwriting corrupt data) and persists every explicit choice through one atomic action
(storage write + root marker) that survives reloads — spec US1, research D2/D3.

**Independent Test**: `pnpm test` instantiates the REAL `ThemeStore` inside the builder's jsdom with
a window-stubbed `localStorage`/`matchMedia` and asserts state, persistence, and the root class for
every acceptance scenario.

### Tests for User Story 1 (written first - MUST FAIL before T003)

- [ ] T002 [P] [US1] Write `src/theme/theme.store.spec.ts` (init + persistence surface): instantiating
      the real store against jsdom with stubs installed on `document.defaultView` (same technique as
      002's `pre-paint.spec.ts`), assert: (a) init with no stored value → `choice === "system"`,
      `effective` = OS preference stub, and NOTHING written to storage; (b) init with `"dark"` → choice
      `"dark"`, effective `"dark"`; (c) init with `"light"`; (d) init with `"system"`; (e) init with a
      corrupt value (`"bogus"`, `""`, or JSON-wrapped) → choice `"system"`, effective = OS, stored
      value NOT overwritten; (f) `getItem` throwing → choice `"system"`, never throws; (g)
      `setChoice("light")` → storage `"light"`, root `dark` class absent, effective `"light"`; (h)
      `setChoice("dark")` → storage `"dark"`, root `dark` class present; (i) `setChoice("system")` →
      storage `"system"`, effective = OS stub; (j) `setChoice` with an out-of-enum value → no-op
      (state unchanged, no write). EXPECT FAIL: `theme.store.ts` does not exist yet.
      (Runs via the builder's unit-test runner; the store type-checks in the same pass.)

### Implementation for User Story 1

- [ ] T003 [US1] Implement `src/theme/theme.store.ts`: `signalStore` with `withState`
      (`{ choice }`), `withComputed` (`effective`), `withMethods` (`setChoice`: validate against the
      enum → set state → `localStorage.setItem` → apply/remove root `dark` class atomically), and
      `withHooks` (`ngrxOnInit`: read + validate only, never write, boot-reconcile effective into the
      marker only if 002's pre-paint script did not already apply it). Reuse `theme-contract.ts`
      (`THEME_STORAGE_KEY`, choices, `resolveEffectiveTheme`) — no duplicated literals (research
      D3). PRIOR GATE: user installs `@ngrx/signals` v22 and reports green; then run `pnpm test` and
      confirm T002 turns GREEN.

**Checkpoint**: T002 passes; persisted explicit choices round-trip and corrupt storage never breaks
boot (US1 proven, MVP).

---

## Phase 3: User Story 2 - The theme follows the OS while choice is `system` (Priority: P1)

**Goal**: With `choice === "system"`, a live `prefers-color-scheme` change flips the effective theme
and the root marker; explicit choices ignore OS changes with zero writes — spec US2, research D4.

**Independent Test**: `pnpm test` drives a manually-dispatched fake media-query change and asserts
the effective theme + root class flip, and stay frozen for explicit choices.

### Tests for User Story 2 (written first - MUST FAIL before T005)

- [ ] T004 [P] [US2] Extend `src/theme/theme.store.spec.ts` with an OS-following surface: a test
      helper creates a fake MediaQueryList (own `matches` flag + `addEventListener`/dispatch) stubbed
      on the jsdom window (002 technique). Then assert: (a) choice `"system"` + initial OS dark →
      effective `"dark"` and root class present; (b) dispatch OS change to light → effective
      `"light"`, root class removed, and no storage write; (c) dispatch back to dark → flips again;
      (d) explicit choice `"dark"` + OS change → effective stays `"dark"`, no storage write;
      (e) re-instantiating the store (HMR simulation) registers the listener exactly once (no
      duplicate listens). EXPECT FAIL: the listener does not exist yet.

### Implementation for User Story 2

- [ ] T005 [US2] Implement the OS listener in the store: register `matchMedia(DARK_SCHEME_QUERY)`
      change → when `choice === "system"`, update effective and apply/remove the root marker (no
      storage write); guard so the listener is attached once regardless of re-init (research D4/D5).
      Run `pnpm test` and confirm T004 turns GREEN.

**Checkpoint**: T004 passes; `system` tracks the OS live and explicit choices are insulated (US2
proven).

---

## Phase 4: User Story 3 - One writer owns the runtime state (Priority: P2)

**Goal**: The store is the only runtime writer of storage and the root marker; the 002 pre-paint
script and the 002 first-paint contract stay untouched — spec US3, research D5.

**Independent Test**: structural/grep assertions: no runtime storage-write or class-mutation escapes
`theme.store.ts`; the pre-paint script is still the first child of `<head>`.

### Tests for User Story 3 (written first - MUST FAIL before T007)

- [ ] T006 [P] [US3] Write `src/theme/theme-single-writer.spec.ts` (structural): assert (a)
      `src/index.html` is unchanged from 002 — the inline synchronous pre-paint script is still the
      FIRST child of `<head>` with no `defer`/`async`/`type="module"`; (b) no `localStorage.setItem`
      and no `classList.add|remove|toggle` exists anywhere under `src/` except inside
      `theme.store.ts` and the 002 inline script; (c) `theme.store.ts` references the contract keys
      from `theme-contract.ts` rather than re-declaring `"lockr.theme"` literals. EXPECT FAIL:
      `theme.store.ts` does not exist yet (the grep finds no store to authorize).

### Implementation for User Story 3

- [ ] T007 [US3] Harmonize the implementation to pass T006: single-writer side effects centralised in
      `ThemeStore` (verify no accidental writes elsewhere), store references only `theme-contract.ts`
      constants, and `src/index.html` byte-for-byte unchanged from 002. Fix any drift found; run
      `pnpm test` and confirm T006 turns GREEN.

**Checkpoint**: T006 passes; the store provably owns every runtime write (US3 proven).

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: End-to-end verification and repo hygiene.

- [ ] T008 Run `pnpm verify` (Biome gate + unit tests + build) and fix any violations; re-run the
      `localStorage.setItem`/`classList` grep from T006 and confirm only the store + pre-paint script
      match; `pnpm lint` passes.
- [ ] T009 [P] Confirm the shipped build keeps the 002 pre-paint script: `pnpm build`, then assert
      `dist/nop3-lockr-vault/browser/index.html` still has the inline script as the FIRST child of
      `<head>` (no first-paint regression, FR-006).

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (T001)**: green baseline first.
- **US1 (T002-T003)**: T003 depends on the developer-installed `@ngrx/signals`; all later phases
  depend on T003.
- **US2 (T004-T005)**: depends on US1 (the store must exist to add the listener).
- **US3 (T006-T007)**: depends on US1 (grep authorizes `theme.store.ts`); T007 depends on T002/T004
  passing.
- **Polish (T008-T009)**: after all stories.

### User Story Dependencies

- **US1 (P1)**: standalone; can land and be demoed alone (persisted choice + boot fallback).
- **US2 (P1)**: builds on US1's store.
- **US3 (P2)**: verifies invariants; runs after US1 (+ US2 impl exists so the lists are final).

### Within Each User Story

- Tests written and shown FAILING first, then implementation, then green.

### Parallel Opportunities

- T002 (spec file) vs T006 (structural spec file): different files, both red until T003/T007.
- T001 can run concurrently with writing the test files.

---

## Implementation Strategy

### MVP First (User Story 1 only)

1. T001 baseline green.
2. T002 store spec (RED) → developer installs `@ngrx/signals` → T003 store (GREEN).
3. STOP and VALIDATE US1 independently (persistence round-trip, corruption fallback).

### Incremental Delivery

1. US1 (persistence round-trip) → demo via tests (+ devtools reload checks from quickstart.md).
2. US2 (OS-following) → validated by the fake-OS-change tests.
3. US3 (single-writer + no-FOUC) → validated by structural spec.
4. Polish: verify + build assertions.

### Notes

- `@ngrx/signals` v22 is the ONLY new runtime dependency; the developer installs it (user policy)
  and reports the install green before T003.
- The `lockr.theme` contract and the pre-paint script are frozen 002 artifacts; 003 does not modify
  them.
- Visual/AXE end-to-end coverage is owned by feature 005 (per spec assumptions).
- Commit after each task or logical group, always after user review (review-before-commit policy).