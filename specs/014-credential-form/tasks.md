# Tasks: Credential Form (Create & Edit)

**Feature**: [014-credential-form](spec.md) | **Plan**: [plan.md](plan.md)

## Format: `[ID] [P?] [Story] Description`

- `P` = parallelizable with sibling tasks (independent files/concerns)
- Tasks whose description says **write FIRST** must land before their implementation counterpart
  and are expected to FAIL until it exists (mutant-check discipline per AGENTS)
- Story tags map tasks to spec user stories: US1 create, US2 edit, US3 validation UX

## Path Conventions

- New component: `src/app/credential-form/{credential-form.ts,credential-form.html,credential-form.css,credential-form.spec.ts}`
- Routes: `src/app/app.routes.ts`
- Entry points: `src/app/credential-list/credential-list.{html,spec.ts}`,
  `src/app/credential-detail/credential-detail.{html,spec.ts}`
- Off-limits: `src/vault/**` (byte-identical), dashboard chrome, theme files

## Phase 1: Setup (baseline)

- [ ] T001 Confirm green baseline: run `pnpm verify` on branch `feature/014-credential-form`
      (baseline = 212 tests + build from merged main)

## Phase 2: Foundational (blocking prerequisites)

- [ ] T002 [P] Update `src/app/app.routes.ts`: add lazy dashboard children
      `{ path: "credentials/new", loadComponent: CredentialForm }` (listed before the
      parameterized sibling for readability) and `{ path: "credentials/:id/edit", loadComponent: CredentialForm }`
      (FR-001, research D5)
- [ ] T003 SPIKE (research D3): minimal `mat-form-field` + `matInput [formField]` + `<mat-error>`
      probe — determine whether Material opens `mat-error` from signal-form field state alone or
      whether display must be gated on submit/touched state; record the outcome in
      `specs/014-credential-form/research.md` (D3 status → resolved). Blocks T011/T024.
- [ ] T004 Create `src/app/credential-form/credential-form.ts` skeleton: optional
      `id = input<string>()` (mode selector), inject `VaultStore` + `Router`, writable model
      signal with the five fields, `form(model, schemaFn)` wiring with `required()` on the four
      required fields (research D2), minimal template so the route mounts (FR-005)

## Phase 3: User Story 1 - The user creates a new credential (Priority: P1) ?? MVP

### Tests for User Story 1 (write FIRST, must FAIL)

- [ ] T005 [P] [US1] Spec in `credential-form.spec.ts` — create happy path: mount at
      `/credentials/new`, fill all four required fields via `MatInputHarness`, activate Save via
      `MatButtonHarness`, assert `VaultStore` gained exactly one entry with those values and
      navigation landed on `/` with the entry rendered (US1 A1–A2, SC-001)
- [ ] T006 [P] [US1] Spec in `credential-form.spec.ts` — invalid create blocked: submit with an
      empty required field renders an accessible error (`MatFormFieldHarness.getTextErrors()`),
      no navigation occurred, store unchanged (US1 A3, US3 A1)
- [ ] T007 [P] [US1] Spec in `credential-form.spec.ts` — cancel from create: store unchanged,
      navigates back to the list (US1 A4)
- [ ] T008 [P] [US1] Spec in `credential-list.spec.ts` — "Add credential" entry points: header
      control and empty-state CTA both present with accessible names and navigate to
      `/credentials/new` (US1 A1/A5, FR-002)

### Implementation for User Story 1

- [ ] T009 [US1] Create `src/app/credential-form/credential-form.html` — Material form:
      `mat-form-field` + `mat-label` + `matInput [formField]` for `name`, `username`, `domain`,
      `password` (`type="password"`), `textarea matInput` for `notes`; `mat-error` per field
      (markup per T003 outcome); Save (`mat-raised-button`, type submit) + Cancel
      (`mat-button`) in `mat-card-actions` (FR-004, FR-007)
- [ ] T010 [P] [US1] Create `src/app/credential-form/credential-form.css` — token-only styles
      (CSS variables / Material theming; no color literals, no utility classes)
- [ ] T011 [US1] Wire create mode in `credential-form.ts` — `submit(form, action)` guard;
      action calls `VaultStore.add(model())` then navigates to `/`; cancel navigates back with
      no store call; guard against double submit (spec edge case #2) (FR-006, FR-008, FR-009,
      FR-011)
- [ ] T012 [P] [US1] Update `src/app/credential-list/credential-list.html` — "Add credential"
      action beside the heading and as the empty-state CTA (`routerLink="/credentials/new"`,
      Material button semantics) (FR-002)

## Phase 4: User Story 2 - The user edits an existing credential (Priority: P1) ?? MVP

### Tests for User Story 2 (write FIRST, must FAIL)

- [ ] T013 [P] [US2] Spec in `credential-form.spec.ts` — edit prefill: seed a credential, mount
      `/credentials/:id/edit`, assert all five fields show the seeded values via
      `MatInputHarness` (US2 A1, SC-002)
- [ ] T014 [P] [US2] Spec in `credential-form.spec.ts` — edit save: change the name, submit,
      assert `update` was applied (new name, `updated_at` set by store, other fields untouched)
      and navigation landed on `/credentials/:id` rendering the new value (US2 A2, SC-002)
- [ ] T015 [P] [US2] Spec in `credential-form.spec.ts` — cancel from edit: modified field is
      NOT persisted; store entry byte-identical (US2 A4)
- [ ] T016 [P] [US2] Spec in `credential-form.spec.ts` — unknown edit id: mount
      `/credentials/<bogus>/edit`, assert not-found card with back link, no form fields
      rendered, no crash (US2 A5, FR-012, SC-005)
- [ ] T017 [P] [US2] Spec in `credential-detail.spec.ts` — "Edit" action present with an
      accessible name and navigates to `/credentials/:id/edit` (FR-003)

### Implementation for User Story 2

- [ ] T018 [US2] Wire edit mode in `credential-form.ts` — on init (id present) prefill model
      from `VaultStore.getById`; valid submit calls `VaultStore.update(id, model())` then
      navigates to `/credentials/:id`; cancel navigates to the detail (FR-010, FR-011, FR-013)
- [ ] T019 [P] [US2] Add the edit-mode not-found branch to `credential-form.html` —
      `mat-card` heading "Credential not found" + copy + back link (parity with
      `credential-detail`) (FR-012)
- [ ] T020 [P] [US2] Update `src/app/credential-detail/credential-detail.html` — "Edit"
      `mat-button` with `routerLink="/credentials/:id/edit"` (FR-003)

## Phase 5: User Story 3 - Invalid input is explained accessibly (Priority: P2)

### Tests for User Story 3 (write FIRST, must FAIL)

- [ ] T021 [P] [US3] Spec in `credential-form.spec.ts` — error semantics after submit: field
      keeps its accessible label, error text is retrievable (`MatErrorHarness`), offending field
      is focusable/reachable, no store mutation (US3 A1, FR-007)
- [ ] T022 [P] [US3] Spec in `credential-form.spec.ts` — fix clears the error while sibling
      fields keep their typed values (US3 A2)
- [ ] T023 [P] [US3] Spec in `credential-form.spec.ts` — zod parity: whitespace-only input
      passes the form gate AND `credentialDraftSchema` accepts the same payload (spec edge
      case #1, FR-006)

### Implementation for User Story 3

- [ ] T024 [US3] Finalize error display per the T003 spike outcome — per-field messages,
      shown after a submit attempt (or touched state), WCAG AA contrast in both themes, no
      color-only signaling (FR-007, US3 A3–A4)
- [ ] T025 [P] [US3] Confirm double-submit safety: second activation during/after the first
      submit never produces a second store entry (spec edge case #2)

## Phase 6: Cross-cutting route behavior

- [ ] T026 [P] Spec — route ranking: navigating to `/credentials/new` renders the create form,
      not the detail not-found state (edge case #3, research D5, SC-005)

## Phase 7: Hardening & delivery

- [ ] T027 Run the four mutant checks from research D8 / quickstart (validity gate, prefill,
      store mutation on submit, entry points) — each must fail a spec; restore and re-verify
      (SC-007); record results for the PR body
- [ ] T028 [P] Re-read every new/changed template for AGENTS compliance: native control flow,
      no `ngClass`/`ngStyle`, Material primitives for semantics, `input()`/`output()`, no
      `standalone: true`, no explicit `OnPush`
- [ ] T029 Run `pnpm verify` (biome + full suite + build) — green (SC-008)
- [ ] T030 Audit diff scope against SC-009 (no `src/vault/` changes, no theme/shell drift);
      confirm `git diff --stat` matches plan.md's file list
- [ ] T031 Present the change summary to the user and WAIT for explicit approval before any
      commit (AGENTS review-before-commit); then commit in focused slices (spec artifacts,
      then code) and open the PR using `.github/PULL_REQUEST_TEMPLATE.md` (six required
      sections, stated vs inferred rationale)

## Dependency Notes

- T003 (spike) gates T009/T011/T024 error markup decisions.
- T002 (routes) gates every route-driven spec (T005+); component skeleton (T004) gates T005–T007.
- US1 implementation (T009–T012) and US2 tests (T013–T017) are parallel tracks once Phase 2 is
  done; US3 builds on US1/US2 markup.
- MVP = Phases 1–4 (both P1 stories); Phase 5 (P2) ships in the same slice because validation
  gating is already required by US1/US2 acceptance.
