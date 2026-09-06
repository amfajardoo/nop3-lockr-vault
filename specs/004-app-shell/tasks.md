---

description: "Task list for app shell feature implementation"
---

# Tasks: App Shell

**Input**: Design documents from `/specs/004-app-shell/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md; 002 (theme tokens, pre-paint)
and 003 (`ThemeStore`) merged in `main`. `axe-core` installed by the developer before T006.

**Constitution**: automated tests are MANDATORY for every scenario (Automated Verifiability +
Testing and Compliance clauses), so every story includes test-first tasks. Tests are written and
shown to FAIL before the implementation that satisfies them.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)
- Exact file paths are included.

## Path Conventions

- Single Angular SPA at repo root: `src/app/` for shell components; store/spec colocated under
  `src/app/<component>/`.
- Runtime dependency installation: `axe-core` (devDependency) is installed by the DEVELOPER (user
  policy) before T006 runs its tests; hold T006's GREEN until the user reports the install green.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Confirm the starting point is green before any change.

- [ ] T001 Confirm the green baseline by running `pnpm verify` and recording the output (all
      gates: `biome ci . && pnpm test && pnpm build`). If green, proceed; if not, STOP and report.

---

## Phase 2: User Story 3 - Routes are lazy and resilient (Priority: P2)

**Goal**: Home/About are lazily loaded with `loadComponent`, `""` is the default, `"**"`
redirects to `""` — spec US3, research D4.

**Independent Test**: `RouterTestingHarness` over the real `routes` navigates to `/`, `/about`,
and an unknown path, asserting the lazy components render and the redirect recovers.

### Tests for User Story 3 (written first - MUST FAIL before T003)

- [ ] T002 [P] [US3] Write the route spec: `src/app/home/home.spec.ts` + `src/app/about/
      about.spec.ts` cooperate with a router-focused spec (`RouterTestingHarness.create()` with
      `provideRouter(routes)`). Assert: (a) navigating to `""` renders the lazy `Home` (welcome
      h1); (b) navigating to `/about` renders the lazy `About`; (c) navigating to `/zzz` redirects
      to `""` and shows Home; (d) the shell hosts the outlet (render `App`, navigate, assert
      header + routed content coexist). EXPECT FAIL: `home.ts`/`about.ts`/routes do not resolve
      (module build error) — the lazy targets do not exist yet.

### Implementation for User Story 3

- [ ] T003 [US3] Implement `src/app/home/home.ts` + `home.html` (welcome screen: h1 + muted intro
      + token-styled placeholder primary button — FR-008), `src/app/about/about.ts` + `about.html`
      (about copy), and rewrite `src/app/app.routes.ts` (typed `Routes`: `""` full → lazy Home,
      `"about"` → lazy About, `"**"` → redirect `""`). Run `pnpm test` and confirm T002 turns
      GREEN.

**Checkpoint**: T002 passes; default/About/redirect all resolve through real lazy chunks (US3
proven except build-chunk assertion, which is T009).

---

## Phase 3: User Story 1 - The shell renders and navigates (Priority: P1)

**Goal**: `App` renders the header chrome (brand, nav, theme switcher), the skip link, the `<main>`
outlet — ARIA-correct and token-styled — spec US1, research D1/D7.

**Independent Test**: Render `App` with the real router + `ThemeStore`, plus an AXE scan; assert
landmarks, links, skip link, `aria-current`, welcome-at-default and header persistence.

### Tests for User Story 1 (written first - MUST FAIL before T005)

- [ ] T004 [P] [US1] Rewrite `src/app/app.spec.ts` (shell chrome surface): with the RouterTesting
      harness and `ThemeStore` (storage/matchMedia stubbed on `document.defaultView`, 002
      technique): (a) header with brand text `Lockr Vault`, Home and About links render; (b) the
      primary `<nav>`/`<header>` landmarks are present; (c) skip link is the first focusable and
      targets `#main-content`; (d) default route shows the welcome h1; (e) navigating to `/about`
      marks the About link `aria-current="page"`; (f) unknown URL redirects to Home; (g) header
      persists across navigation (same element); (h) an AXE scan on the shell reports no
      serious/critical violations. Also add `src/app/header-static.spec.ts`-style structural
      checks if needed (token colors, no literal colors) OR fold them into T008's gate. EXPECT
      FAIL: the shell does not render (current `app.html` is the placeholder) and the HOME nav
      semantics + token classes are absent.

### Implementation for User Story 1

- [ ] T005 [US1] Implement the shell by rewriting `src/app/app.html` (header/banner with
      `a.skip-link`, brand anchor `[routerLink]="['/']"`, `<nav>` with two `routerLink` anchors +
      `RouterLinkActive` + `ariaCurrentWhenActive="page"`, `<theme-toggle>`; `<main id="main-content">`
      around the router-outlet) and `src/app/app.ts` (import `ThemeToggle`, keep root standalone,
      remove the old placeholder card; keep `title` if still displayed or drop it — update
      anything the shell spec relies on). Shell CSS in `src/app/app.css` (token classes only; make
      the brand/links use `text-foreground`/`text-accent` with `focus-visible` rings). Run `pnpm
      test` and confirm T004 turns GREEN.

**Checkpoint**: T004 passes; the shell is rendered, navigable, and AXE-clean at the unit level
(US1 proven).

---

## Phase 4: User Story 2 - The theme switcher is accessible and live (Priority: P1)

**Goal**: `ThemeToggle` is a signal-driven radiogroup over `ThemeStore` with roving tabindex +
keyboard selection, focus-safe against OS changes, AXE-clean — spec US2, research D2/D3/D6/D8.

**Independent Test**: Render `ThemeToggle` with a real `ThemeStore` (stubbed storage + matchMedia);
assert options, selection sync, `setChoice` side effects, keyboard roving, focus stability and an
AXE pass.

### Tests for User Story 2 (written first - MUST FAIL before T007)

- [ ] T006 [P] [US2] Write `src/app/theme-toggle/theme-toggle.spec.ts`: with `ThemeStore` provided
      (stubs on `document.defaultView`): (a) three radios render (Light/Dark/System) with WAI-ARIA
      roles (`radiogroup`, `radio`, `aria-checked`, group `aria-label="Theme"`); (b) no stored
      choice → System `aria-checked="true"` and is the only `tabindex=0` radio; (c) stored `dark`
      → Dark selected; (d) activating Dark → store `choice` `dark`, `lockr.theme` `"dark"`, root
      dark class applied; (e) ArrowRight from Light selects System (focus + store), Home/End jump
      first/last; (f) OS change while focus is on a radio does not move focus (focus stability);
      (g) an AXE scan on the toggle reports no serious/critical violations. EXPECT FAIL:
      `theme-toggle.ts` does not exist yet (module error).
      PRIOR GATE: user installs `axe-core` and reports green.

### Implementation for User Story 2

- [ ] T007 [US2] Implement `src/app/theme-toggle/theme-toggle.ts` + `theme-toggle.html` (inject
      `ThemeStore`; `options` array from the 002 contract strings; bind `aria-checked`/`tabindex`
      off `choice()`; `(keydown)` ArrowLeft/Right/Home/End → `setChoice`; selected radio uses
      accent-on tokens, unselected `surface-raised`; `focus-visible` rings). Run `pnpm test` and
      confirm T006 turns GREEN.

**Checkpoint**: T006 passes; the switcher is keyboard-complete, live, persistent, and AXE-clean
(US2 proven).

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: End-to-end verification and repo hygiene.

- [ ] T008 Run `pnpm verify` (Biome gate + unit tests + build) and fix any violations; re-run the
      color-literal grep from 002 (no `oklch(`/`color-mix(`/hex in `src/app/**`) and confirm only
      002 token files match; confirm `src/index.html`/`src/theme/**` unchanged (git diff empty);
      `pnpm lint` passes.
- [ ] T009 [P] Confirm lazy shipping: `pnpm build`, then assert
      `dist/nop3-lockr-vault/browser/index.html` still has the 002 pre-paint script as the FIRST
      child of `<head>`, and that the build output contains separate `*.js` chunks for `home` and
      `about` (not inlined into `main-*.js`). No first-paint or chunking regression (FR-010 /
      NFR-003).

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (T001)**: green baseline first.
- **US3 (T002-T003)**: independent of the shell; implemented first because US1's nav and default
  route need the lazy targets to exist.
- **US1 (T004-T005)**: depends on US3 (nav links navigate to real lazy routes; default route needs
  Home).
- **US2 (T006-T007)**: depends only on 003's merged `ThemeStore`; requires `axe-core` installed
  before its GREEN gate.
- **Polish (T008-T009)**: after all stories; T009 is the lazy-chunk proof.

### User Story Dependencies

- **US3 (P2)**: can land alone (routes exist but nothing links to them yet).
- **US1 (P1)**: builds on US3.
- **US2 (P1)**: independent — its toggle can render before the shell exists (standalone spec).

### Within Each User Story

- Tests written and shown FAILING first, then implementation, then green.

### Parallel Opportunities

- T002 (routes), T004 (shell), T006 (toggle) are separate spec files — all can be written before
  any implementation. T003 unlocks T005; T007 is independent until its own spec is green.

---

## Implementation Strategy

### Precedence

1. T001 baseline green.
2. Write all three RED specs (T002, T004, T006) — the file set is small enough.
3. T003 (routes + Home/About) → US3 green.
4. T005 (shell) → US1 green.
5. User installs `axe-core` → T006 spec actively runs → T007 (toggle) → US2 green.
6. Stop, demo (quickstart.md manual checks), then polish gate T008-T009.

### Notes

- **No changes** to `src/index.html`, `src/theme/**`, `src/app/app-tokens.spec.ts`, or the 002/003
  contract files in this feature (FR-010).
- `axe-core` is the ONLY new dependency (devDependency); the developer installs it (user policy)
  and reports green before T006 runs.
- AXE unit scans run in jsdom: assert no serious/critical violations, allow `incomplete`
  (research D5). Real-browser AXE belongs to 005.
- Commit after each task or logical group, always after user review (review-before-commit policy);
  dependency/tooling installs keep their own commit (package.json + lockfile only).