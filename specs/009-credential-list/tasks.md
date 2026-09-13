---

description: "Task list template for feature implementation"
---

# Tasks: Credential List

**Input**: Design documents from `/specs/009-credential-list/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: The spec mandates tests for every US (Constitution Automated Verifiability: 100% scenario coverage, mutant checks, harness-first, AAA). Test tasks included.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story. TDD required per feature: write specs FIRST (RED), implement (GREEN), then mutant-check each story's assertions.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Single project**: `src/`, `tests/` at repository root
- Frontend-only Angular SPA: components under `src/app/<feature>/`, specs colocated (`*.spec.ts`), gallery stories colocated (`*.story.ts`), domain layer `src/vault/` (008, unchanged)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Baseline verification and route/seed wiring that the feature's stories mount on

- [x] T001 Confirm green baseline: run `pnpm verify` on branch `feature/009-credential-list` (baseline = 216 tests + build, from 008)
- [x] T002 Register new-component external templates in gallery resolver `playwright/gallery/vite.component-resource.ts` (raw-import template + style for `credential-list` and `credential-detail`; do when the files land in T009–T012 and T016–T019)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: App bootstrap and route structure MUST be complete before ANY user story renders

**CRITICAL**: No user story work can begin until this phase is complete

- [x] T003 Update `src/app/app.routes.ts` to add lazy children under the dashboard `""` route: `{ path: "", loadComponent: CredentialList }` and `{ path: "credentials/:id", loadComponent: CredentialDetail }`
- [x] T004 Update `src/app/app.ts` to inject `VaultStore` + `MockDataService` and seed the store in the constructor when `count() === 0` (add each `getSeedCredentials()` item); keep `App` thin
- [x] T005 Update `src/app/dashboard/dashboard.html` to remove the placeholder copy ("Your credentials will appear here.") so the mounted child list is the primary content (FR-002); keep shell chrome unchanged
- [x] T006 Update `src/app/dashboard/dashboard.spec.ts` so the "workspace ready" expectations match the new mounted list route (006 US3 test now asserts the child list mounts)

**Checkpoint**: Foundation ready — `pnpm verify` green with seed bootstrap + routes wired and dashboard spec updated.

---

## Phase 3: User Story 1 - The user sees every saved credential in a scannable list (Priority: P1) 🎯 MVP

**Goal**: The dashboard renders all credentials from the store as a scannable list (name, username, domain, favorite indicator) in deterministic insertion order, with navigation to detail.

**Independent Test**: Seed the VaultStore via its `add` mutations, render the list, assert every seed appears with name/username/domain and the favorite mark. No persistence needed.

### Tests for User Story 1 (write FIRST, must FAIL)

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [x] T007 [P] [US1] Spec `src/app/credential-list/credential-list.spec.ts` — renders every seeded credential with name, username, domain (US1 A1), favorite indicator distinct (A2), deterministic order (A3), and navigation link to detail (A4)
- [x] T008 [P] [US1] Spec `src/app/credential-list/credential-list.spec.ts` — AXE scan on populated list, no serious/critical violations (A5, WCAG AA, both themes via `setupThemeTestBed`)

### Implementation for User Story 1

- [x] T009 [P] [US1] Create story `src/app/credential-list/credential-list.story.ts` (seeded-vault story: inject `VaultStore` + `MockDataService`, seed via `add`; empty-vault story) — gallery mount target for CT specs
- [x] T010 [US1] Create component `src/app/credential-list/credential-list.ts` (selector `credential-list`, standalone, inject `VaultStore`, expose `credentials()`/`count()` as `computed`, `RouterLink` per row to `/credentials/:id`)
- [x] T011 [P] [US1] Create template `src/app/credential-list/credential-list.html` (@for rows: name/username/domain, favorite indicator with `aria-label`, routerLink; @if empty state placeholder delegated to US3)
- [x] T012 [P] [US1] Create styles `src/app/credential-list/credential-list.css` (token-only colors from 002 contract; no literals)

**Checkpoint**: US1 independently testable — `pnpm ng test --watch=false --include='src/app/credential-list/**'` green; seeds render.

---

## Phase 4: User Story 2 - The user reads a saved credential's details (Priority: P1)

**Goal**: Detail/read view shows full fields (name, username, domain, notes) with password masked by default, a reveal toggle, and a not-found state for unknown ids.

**Independent Test**: Seed a credential, navigate to `/credentials/:id`, assert fields render, DOM has no plaintext password, reveal toggles masked↔visible, unknown id shows not-found.

### Tests for User Story 2

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [x] T013 [P] [US2] Spec `src/app/credential-detail/credential-detail.spec.ts` — renders name/username/domain/notes (US2 A1); masked password by default with NO plaintext in DOM (A2)
- [x] T014 [P] [US2] Spec `src/app/credential-detail/credential-detail.spec.ts` — reveal control shows plaintext and reflects state (A3) then re-masks on second activation (A4)
- [x] T015 [P] [US2] Spec `src/app/credential-detail/credential-detail.spec.ts` — unknown id renders not-found with a back-to-list link (A5, no crash); AXE clean on detail + not-found

### Implementation for User Story 2

- [x] T016 [P] [US2] Create story `src/app/credential-detail/credential-detail.story.ts` (valid-id story seeded via store; unknown-id story) — gallery mount target
- [x] T017 [US2] Create component `src/app/credential-detail/credential-detail.ts` (selector `credential-detail`, standalone, inject `VaultStore` + `ActivatedRoute`, `revealed = signal(false)`, render `getById(id)` or not-found)
- [x] T018 [P] [US2] Create template `src/app/credential-detail/credential-detail.html` (@if credential: fields, masked label OR plaintext only when `revealed()`, reveal button with dynamic aria-label/aria-pressed; @else not-found + link to `/`)
- [x] T019 [P] [US2] Create styles `src/app/credential-detail/credential-detail.css` (token-only)

**Checkpoint**: US1 AND US2 work — route specs green via `RouterTestingHarness`.

---

## Phase 5: User Story 3 - Empty vault shows a helpful empty state (Priority: P2)

**Goal**: With an empty store, the list renders a clearly marked empty state instead of a blank list; adding a credential replaces it reactively.

**Independent Test**: Render the list against an empty VaultStore and assert the empty-state text/marker renders and no rows exist.

### Tests for User Story 3

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [x] T020 [P] [US3] Spec `src/app/credential-list/credential-list.spec.ts` — empty store renders empty state with no credential rows (US3 A1); AXE-clean empty state (A2)
- [x] T021 [P] [US3] Spec `src/app/credential-list/credential-list.spec.ts` — store transitions empty→populated reacts without reload: add a credential and assert rows replace the empty state (A3)

### Implementation for User Story 3

- [x] T022 [P] [US3] Add empty-state branch to `src/app/credential-list/credential-list.html` (@if `count() === 0`: empty-state text "Your vault is empty." with an `aria-label`/marker)

**Checkpoint**: US3 independently evaluable — empty state appears; reactive transition covered.

---

## Phase 6: User Story 4 - The user deletes a credential with confirmation (Priority: P2)

**Goal**: Per-row delete opens an inline confirmation; confirming calls `VaultStore.delete(id)`, cancelling/Escape leaves the store untouched. One dialog at a time, keyboard operable, focus managed.

**Independent Test**: Seed a credential; activate delete → confirmation appears, list unchanged; confirm → removed from store + list; cancel → remains. Must pass mutant check.

### Tests for User Story 4

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [x] T023 [P] [US4] Spec `src/app/credential-list/credential-list.spec.ts` — activating delete opens confirmation naming the credential, list unchanged (A1)
- [x] T024 [P] [US4] Spec `src/app/credential-list/credential-list.spec.ts` — confirm removes from store and list; only that credential affected (A2, A4)
- [x] T025 [P] [US4] Spec `src/app/credential-list/credential-list.spec.ts` — cancel closes dialog, credential remains (A3), no store mutation (FR-013)
- [x] T026 [P] [US4] Spec `src/app/credential-list/credential-list.spec.ts` — Escape cancels; dialog keyboard-operable with managed focus (A5, FR-015); AXE clean on dialog

### Implementation for User Story 4

- [x] T027 [US4] Add `pendingDelete = signal<Credential | null>(null)` to `src/app/credential-list/credential-list.ts`; method `requestDelete(credential)` (opens native `<dialog>` via `showModal`), `confirmDelete()` (calls `VaultStore.delete(id)`, closes, restores focus to row control), `cancelDelete()` (closes, no mutation)
- [x] T028 [P] [US4] Add dialog markup to `src/app/credential-list/credential-list.html` (native `<dialog>` with credential name in the label, confirm + cancel buttons, `@if (pendingDelete())` gate, one dialog instance)

**Checkpoint**: US4 complete — delete confirm/cancel/Escape covered; all four stories independently green.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Gallery CT specs, mutant checks, full-suite regression, dashboard visual/chain verification, and quickstart validation

- [x] T029 [US1] Gallery CT spec `tests/components/credential-list.spec.ts` — mount seeded and empty stories; assert rows/empty state; AXE in light+dark themes
- [x] T030 [US2] Gallery CT spec `tests/components/credential-detail.spec.ts` — mount valid/unknown-id stories; assert fields, masked→reveal round-trip, not-found; AXE
- [x] T031 Run mutant checks per story (test still fails when the asserted logic is removed/altered), restore implementation
- [x] T032 Run `pnpm check:fix` (biome) on changed `src/app/` + `tests/components/` files; fix findings
- [x] T033 Run `pnpm verify` full gate: biome + full unit suite (baseline 216 + new) + production build; confirm green
- [x] T034 Run `pnpm e2e:components` — all gallery CT specs green (theme-toggle + credential-list + credential-detail); Vite dev server port 5173 strictPort
- [x] T035 Validate `specs/009-credential-list/quickstart.md` scenarios against results; update if any proof gaps
- [x] T036 Review diff (git status/diff) for SC-008: no files touched outside `src/app/credential-list`, `src/app/credential-detail`, `src/app/app.routes.ts`, `src/app/app.ts`, `src/app/dashboard/dashboard.{html,spec.ts}`, `playwright/gallery/vite.component-resource.ts`, `tests/components/*`, and `specs/009-credential-list/*`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately; T002 deferred until component files exist
- **Foundational (Phase 2)**: Depends on Setup (baseline green). BLOCKS all user stories (routes must exist for row navigation; seed bootstrap must pre-populate store)
- **User Stories (Phase 3+)**: All depend on Foundational
  - US1 (P1) and US2 (P1) can run as the two P1 tracks
  - US3 (P2) depends on US1 list rendering (same component/template)
  - US4 (P2) depends on US1 list (same component); runs after US1
- **Polish (Final Phase)**: Depends on all user stories complete

### User Story Dependencies

- **User Story 1 (P1)**: After Foundational — no deps on other stories
- **User Story 2 (P1)**: After Foundational — route + store seeded; independent component; testable without US1
- **User Story 3 (P2)**: After US1 (same template/list component)
- **User Story 4 (P2)**: After US1 (same component adds dialog); reads `pendingDelete` state in US1's template

### Within Each User Story

- Tests MUST be written and FAIL before implementation (RED→GREEN)
- Implementation before integration (e.g. story → route registration order in Phase 2)
- Story complete before moving to next priority

### Parallel Opportunities

- T002/T003–T006 (Phase 1/2): distinct files — but routes (T003) gate US2 navigation; keep phase order
- US1 and US2 test tasks (T007/T008 ∥ T013–T015) and story files can run in parallel (different directories)
- US3 test tasks T020/T021 parallel with each other and with US4 tests T023–T026 (all in list spec — NOTE: same file, sequence within file, parallel via separate `describe` blocks)
- Component `.ts`/`.html`/`.css`/`.story.ts` within a US are parallel (distinct files) but implementation must wait for that US's tests to fail first

---

## Parallel Example: User Story 1

```bash
# Launch all US1 test tasks together (RED):
pnpm ng test --watch=false --include='src/app/credential-list/**'  # T007 T008
# Once RED, implement in parallel:
# T009 story, T010 .ts, T011 .html, T012 .css
# Then GREEN: re-run include above
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (baseline green)
2. Complete Phase 2: Foundational (routes + seed + dashboard placeholder)
3. Complete Phase 3: User Story 1 (list renders seeds, favorite marks, navigation)
4. **STOP and VALIDATE**: list spec green; MVP = scannable list

### Incremental Delivery

1. Setup + Foundational → foundation ready
2. Add US1 → test independently → MVP (scannable list)
3. Add US2 → read/detail + reveal + not-found
4. Add US3 → empty state
5. Add US4 → confirmed delete
6. Polish → gallery CT, mutants, full `pnpm verify` + `pnpm e2e:components`

### Parallel Team Strategy

With the P1 pair: one track builds CredentialList (US1→US3→US4), another builds CredentialDetail (US2), then merge both into the routes in Phase 2 wiring.

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story is independently completable and testable
- Verify tests fail before implementing (RED→GREEN mandatory)
- Commit after each logical group (feature commits on `feature/009-credential-list`)
- Story order in spec: US1 P1, US2 P1, US3 P2, US4 P2 — implement in spec priority order
- Constraints: no `src/vault/` edits, no i18n, no crypto/Supabase, dashboard shell chrome untouched, English copy, token-only colors, native control flow, `input()/output()`/`model()` where applicable, no `@HostBinding`/`@HostListener` (host in decorator), no `mutate` on signals (use `patchState`/`update`/`set`)