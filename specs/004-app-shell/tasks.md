---

description: "Task list for app shell feature implementation"
---

# Tasks: App Shell

**Input**: Design documents from `/specs/004-app-shell/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md; 002 (theme tokens, pre-paint)
and 003 (`ThemeStore`) merged in `main`. `axe-core` installed by the developer before T006.

**Revision 2026-09-06 (developer decision)**: routes and pages (Home/About) are DEFERRED to a later
feature. US3 and T002/T003 are removed; the shell ships without navigation links and
`app.routes.ts` stays an empty typed `Routes` array. The task list below reflects that scope.

**Constitution**: automated tests are MANDATORY for every scenario (Automated Verifiability +
Testing and Compliance clauses), so every story includes test-first tasks. Tests are written and
shown to FAIL before the implementation that satisfies them.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2)
- Exact file paths are included.

## Path Conventions

- Single Angular SPA at repo root: `src/app/` for shell components; store/spec colocated under
  `src/app/<component>/`.
- Runtime dependency installation: `axe-core` (devDependency) is installed by the DEVELOPER (user
  policy) before T006 runs its tests; hold T006's GREEN until the user reports the install green.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Confirm the starting point is green before any change.

- [x] T001 Confirm the green baseline by running `pnpm verify` and recording the output (all
      gates: `biome ci . && pnpm test && pnpm build`). If green, proceed; if not, STOP and report.
      (2026-09-06: GREEN — 140 tests pass on this branch baseline, build OK.)

---

## Phase 2: User Story 1 - The shell renders and is accessible (Priority: P1)

**Goal**: `App` renders the header chrome (brand, theme switcher), the skip link, and the `<main>`
outlet — ARIA-correct and token-styled — spec US1, research D1/D7.

**Independent Test**: Render `App` with the real router provider + `ThemeStore`, plus an AXE scan;
assert brand, the theme switcher, the skip link targeting `<main>`, and no serious/critical AXE
violations.

### Tests for User Story 1 (written first - MUST FAIL before T003)

- [x] T002 [P] [US1] Rewrite `src/app/app.spec.ts` (shell chrome surface): with the Router provider
      and `ThemeStore` (storage/matchMedia stubbed on `document.defaultView`, 002 technique): (a)
      the header with brand text `Lockr Vault` and the theme switcher render; (b) the `<header>`
      and `<main>` landmarks are present; (c) a skip link is the first focusable and targets
      `#main-content`; (d) an AXE scan on the shell reports no serious/critical violations. EXPECT
      FAIL: the shell does not render (current `app.html` is the placeholder) and `axe-core` is not
      installed yet.
      (2026-09-06: RED verified — suite build failure: `TS2307: Cannot find module 'axe-core'`
      (pending user install) and `TS2307: Cannot find module './theme-toggle'`; once those resolve,
      the shell assertions run against the real chrome. GREEN — 2026-09-06: all 3 app.spec tests
      pass; see T003.)

### Implementation for User Story 1

- [x] T003 [US1] Implement the shell by rewriting `src/app/app.html` (header/banner with
      `a.skip-link`, brand anchor with `{{ title() }}`, `<theme-toggle>`, `<main id="main-content">`
      around the router-outlet) and `src/app/app.ts` (import `ThemeToggle`, keep root standalone,
      remove the old placeholder card; keep `title` = signal("Lockr Vault") — `app-tokens.spec.ts`
      requires `{{ title() }}` and the five palette token utilities in the static template). Shell
      CSS in `src/app/app.css` (token classes; no literal colors). Run `pnpm test` and confirm T002
      turns GREEN.
      (2026-09-06: brand anchor renders `{{ title() }}` and carries `text-accent`; skip link uses
      `sr-only focus:not-sr-only`; `<main>` carries `text-muted` (002 palette test needs it in the
      static template now that the nav links are gone). The three `routerLink` anchors also carry a
      static `href` for Biome `useValidAnchor`. GREEN — all 3 app.spec tests pass, including the
      AXE scan.)

**Checkpoint**: T002 passes; the shell renders with brand + switcher and is AXE-clean at the unit
level (US1 proven).

---

## Phase 3: User Story 2 - The theme switcher is accessible and live (Priority: P1)

**Goal**: `ThemeToggle` is a signal-driven radiogroup over `ThemeStore` with roving tabindex +
keyboard selection, focus-safe against OS changes, AXE-clean — spec US2, research D2/D3/D7/D8.

**Independent Test**: Render `ThemeToggle` with a real `ThemeStore` (stubbed storage + matchMedia);
assert options, selection sync, `setChoice` side effects, keyboard roving, focus stability and an
AXE pass.

### Tests for User Story 2 (written first - MUST FAIL before T005)

- [x] T004 [P] [US2] Write `src/app/theme-toggle/theme-toggle.spec.ts`: with `ThemeStore` provided
      (stubs on `document.defaultView`): (a) three radios render (Light/Dark/System) with a
      `radiogroup` container (`aria-label="Theme"`); (b) no stored choice → System checked and is
      the only `tabindex=0` radio; (c) stored `dark` → Dark checked; (d) activating Dark → store
      `choice` `dark`, `lockr.theme` `"dark"`, root dark class applied; (e) ArrowRight from Light
      selects System (focus + store), Home/End jump first/last; (f) OS change while focus is on a
      radio does not move focus (focus stability); (g) an AXE scan on the toggle reports no
      serious/critical violations. EXPECT FAIL: `theme-toggle.ts` does not exist yet (module error);
      `axe-core` is not installed yet.
      (2026-09-06: RED verified — same suite build failure as T002. GREEN — 2026-09-06: all 9 spec
      tests pass (axe-core@^4.13.0 installed by the developer; see T005 for the native-radio
      refactor).)

### Implementation for User Story 2

- [x] T005 [US2] Implement `src/app/theme-toggle/theme-toggle.ts` + `theme-toggle.html` (inject
      `ThemeStore`; `options` array from the 002 contract strings; bind `checked`/`tabindex` off
      `choice()`; `(keydown)` ArrowLeft/Right/Home/End → `setChoice`; selected radio uses
      accent-on tokens, unselected `surface-raised`; `focus-within` rings on the labels). Run
      `pnpm test` and confirm T004 turns GREEN.
      (2026-09-06: implemented as a signal-only view (no local state): `isSelected`/`tabIndexOf`
      derive from `store.choice()`, native `<input type="radio">` (sr-only) inside a visible
      `<label>` (label text is the accessible name), keyboard wrapping via `focusOption` on
      `[data-theme-option]` with `preventDefault`. Rationale: Biome a11y lint
      (`useSemanticElements`/`useAriaPropsForRole`) rejects `button[role="radio"]` because the
      dynamic `[attr.aria-checked]` is invisible to static analysis — native inputs satisfy the lint
      and keep AXE green. The spec asserts `checked`/`tabindex` from the DOM, so keydriven tests
      call `fixture.detectChanges()` after dispatch. GREEN — 9 spec tests (axe-core@^4.13.0
      installed by the developer; AXE scan clean).)

**Checkpoint**: T004 passes; the switcher is keyboard-complete, live, persistent, and AXE-clean
(US2 proven).

---

## Phase 4: Polish & Cross-Cutting Concerns

**Purpose**: End-to-end verification and repo hygiene.

- [x] T006 Run `pnpm verify` (Biome gate + unit tests + build) and fix any violations; re-run the
      color-literal grep from 002 (no `oklch(`/`color-mix(`/hex in `src/app/**`) and confirm only
      002 token files match; confirm `src/index.html`/`src/theme/**` unchanged (git diff empty);
      `pnpm lint` passes.
      (2026-09-06: first `pnpm verify` failed at `biome ci .` with 16 errors — formatter/
      organizeImports across the new `src/app/**` files, two a11y lint rules on the
      `button[role="radio"]` toggle, and `useValidAnchor` on the `routerLink` anchors. Fixed via
      `biome check --write src`, the native-radio refactor (T005), and static `href`s on the
      anchors; re-run GREEN — 35 files checked, 150 tests in 9 files, build OK. Color-literal grep
      on `src/app/**` clean; only 002 token files match. `src/index.html`/`src/theme/**` unchanged.
      `pnpm lint` passes.)
- [x] T007 [P] Confirm the deferred-route footprint: `pnpm build`, then assert
      `dist/nop3-lockr-vault/browser/index.html` still has the 002 pre-paint script as the FIRST
      child of `<head>`, and that the build output contains NO page chunks (routes array is empty;
      main bundle only). No first-paint or chunking regression (FR-010 / NFR-003).
      (2026-09-06: `ng build` emitted a single initial bundle (`main-*.js` + `styles`), no lazy
      chunks; dist `index.html` keeps the pre-paint `localStorage`/`matchMedia` script as the first
      child of `<head>` before the charset meta. `pnpm lint` passes.)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (T001)**: green baseline first.
- **US1 (T002-T003)**: the shell is independent of any routes (none exist for 004).
- **US2 (T004-T005)**: depends only on 003's merged `ThemeStore`; requires `axe-core` installed
  before its GREEN gate.
- **Polish (T006-T007)**: after both stories; T007 proves the deferred-route footprint.

### User Story Dependencies

- **US1 (P1)**: can land alone.
- **US2 (P1)**: independent — its toggle can render before the shell exists (standalone spec).

### Within Each User Story

- Tests written and shown FAILING first, then implementation, then green.

### Parallel Opportunities

- T002 (shell) and T004 (toggle) are separate spec files — both can be written before any
  implementation.

---

## Implementation Strategy

### Precedence

1. T001 baseline green.
2. Write both RED specs (T002, T004) — the file set is small enough.
3. User installs `axe-core` → T002/T004 specs actively run → T003 (shell) → US1 green; T005
   (toggle) → US2 green.
4. Stop, demo (quickstart.md manual checks), then polish gate T006-T007.

### Notes

- **No changes** to `src/index.html`, `src/theme/**`, `src/app/app-tokens.spec.ts`, or the 002/003
  contract files in this feature (FR-010).
- `axe-core` is the ONLY new dependency (devDependency); the developer installs it (user policy)
  and reports green before T004 runs.
- AXE unit scans run in jsdom: assert no serious/critical violations, allow `incomplete`
  (research D5). Real-browser AXE belongs to 005.
- Commit after each task or logical group, always after user review (review-before-commit policy);
  dependency/tooling installs keep their own commit (package.json + lockfile only).