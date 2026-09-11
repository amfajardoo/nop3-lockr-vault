---
description: "Task list for dashboard shell feature implementation"
---

# Tasks: Dashboard Shell

**Input**: Design documents from `/specs/006-dashboard-shell/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, checklists/requirements.md; 004 (`App`, `ThemeToggle`) and 005 (Playwright e2e) merged in `main`.

**Constitution**: automated tests are MANDATORY for every scenario (Automated Verifiability +
Testing and Compliance clauses), so every story includes test-first tasks. Tests are written and
shown to FAIL before the implementation that satisfies them.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)
- Exact file paths are included.

## Path Conventions

- Single Angular SPA at repo root: `src/app/` for shell components; dashboard under
  `src/app/dashboard/`.
- 002 tokens in `src/styles.css` and `src/theme/`; 003 `ThemeStore` in `src/theme/theme.store.ts`
  — none modified by 006.

---

## Phase 1: Setup (Green Baseline)

**Purpose**: Confirm the starting point is green before any change.

- [x] T001 Confirm the green baseline by running `pnpm verify` and recording the output (all
      gates: `biome ci . && pnpm test && pnpm build`). If green, proceed; if not, STOP and report.
      (2026-09-11: baseline GREEN — 55 files Biome, 150 tests in 9 files, build OK. Note: the
      `verify` script kept `ng test` in watch mode; fixed via `chore/fix-verify-watch` by adding
      `test:run` (`ng test --watch=false`) and routing `verify` through it.)

---

## Phase 2: User Story 1 — App boots into a routable dashboard (Priority: P1)

**Goal**: `App` shrinks to a thin `<router-outlet>` bootstrap; `'**'` → `''` redirect routes to
a lazy-loaded Dashboard that owns the chrome (header + brand + toggle + nav + main); AXE clean.

**Independent Test**: Render `App` via `RouterTestingHarness` (or `provideRouter`), navigate to
`''`, assert the header renders brand `Lockr Vault` and the `<theme-toggle>`, and an AXE scan
on the shell reports no serious/critical violations.

### Tests for User Story 1 (written first — MUST FAIL before T003)

- [x] T002 [P] [US1] Write `src/app/dashboard/dashboard.spec.ts` — render `Dashboard` with
      `provideRouter([])` and `ThemeStore` (stubs on `document.defaultView`): (a) the header
      renders `Lockr Vault` brand and the `<theme-toggle>` radiogroup; (b) the header, nav, and
      main are present with correct landmark roles; (c) a skip link is the first focusable and
      targets `#main-content`; (d) the section heading and empty-state hint render; (e) an AXE
      scan on the full dashboard reports no serious/critical violations.
      **EXPECT FAIL**: `dashboard.ts` does not exist yet (module error); once created, the
      old `App` still owns chrome and the assertions fail against the component under test.
      (2026-09-11: RED verified — `TS2307: Cannot find module './dashboard'`.)
      (2026-09-11: GREEN — extended to cover US2/US3 assertions in one spec file; 8 tests.)

- [x] T003 [US1] Update `src/app/app.spec.ts` to reflect the new thin-bootstrap expectation:
      render `App` with `provideRouter(routes)` (imported from `app.routes.ts`) and assert: (a)
      the root renders only a `<router-outlet>` (no `<header>`, no brand, no toggle); (b) the
      `App` element is minimal (check for absence of chrome). **EXPECT FAIL until routes are
      wired**.
      (2026-09-11: RED verified — `TS2769`/`TS2339` on `axe.run` with nullable
      `routeNativeElement` (fixed with a non-null assertion + cast), and the module error
      `./dashboard`; the router harness import lives in `@angular/router/testing` for v22.)
      (2026-09-11: GREEN — 4 tests passing, incl. lazy-load + wildcard redirect.)

### Implementation for User Story 1

- [x] T004 [US1] Implement routing and thin bootstrap:
      - Rewrite `src/app/app.routes.ts`: `routes = [ { path: "", loadComponent: () => import("./dashboard/dashboard").then(m => m.Dashboard) }, { path: "**", redirectTo: "" } ]`.
      - Rewrite `src/app/app.html`: reduce to `<router-outlet />` only.
      - `src/app/app.ts`: remove `ThemeToggle` import, remove `title` signal (unused once chrome
        moves); keep `selector: "app-root"`, keep imports `[RouterOutlet]`.
      - Confirm T002 and T003 turn GREEN.
      - **Note on `app-tokens.spec.ts` (002)**: this spec asserts `text-muted` in the old
        `app.html` `<main>`. With the chrome moved to Dashboard, this assertion will fail. T006
        will reconcile it; do NOT modify the 002 spec in T004.
      (2026-09-11: routes written (`''` lazy `loadComponent` → Dashboard, `'**'` → `''`); `App`
      reduced to `<router-outlet />`, imports `[RouterOutlet]` only; Dashboard component created
      with header, nav, main. T009 reconciled `app-tokens.spec.ts` in the same change set.)
      (2026-09-11: GREEN — T002/T003 passing; Dashboard renders on `''` via harness.)

**Checkpoint**: T002 + T003 both GREEN; `App` is a thin bootstrap; dashboard renders on `''`.

---

## Phase 3: User Story 2 — Navigation is accessible and live (Priority: P1)

**Goal**: Dashboard renders a data-driven primary nav with `aria-current="page"`, keyboard
focusable links, visible focus rings, and AXE-clean landmarks.

**Independent Test**: Render `Dashboard`, assert the nav renders one `Overview` link targeting
`''`; the link is focusable with a visible ring; `routerLinkActive` sets `aria-current="page"`;
and an AXE scan on the nav reports no serious/critical violations.

### Tests for User Story 2 (written first — MUST FAIL before T006)

- [x] T005 [P] [US2] Expand `src/app/dashboard/dashboard.spec.ts` with nav assertions: (a)
      the `<nav>` has `aria-label="Main"` and renders one link; (b) the link text is
      `Overview`; (c) the link is focusable and shows a visible ring on `:focus-visible`; (d)
      the active item (current route `''`) carries `aria-current="page"`; (e) an AXE scan
      scoped to the nav reports no serious/critical violations.
      **EXPECT FAIL**: no `<nav>` renders in the dashboard yet.
      (2026-09-11: GREEN — written with the real `routes`; active nav uses Angular's native
      `ariaCurrentWhenActive` input on `RouterLinkActive`.)

### Implementation for User Story 2

- [x] T006 [US2] Implement nav in `src/app/dashboard/dashboard.html`: add `<nav aria-label="Main">`
      with `@for (item of items; track item.route)` rendering `<a [routerLink]="item.route"
      routerLinkActive="active" [attr.aria-current]="isActive(item.route) ? 'page' : null">`.
      Implement `isActive` helper in `dashboard.ts` (inject `ActivatedRoute` or use `Router`).
      Create `src/app/dashboard/nav-items.ts` with `NAV_ITEMS = [{ label: "Overview", route: "" }]`
      and `NavItem` interface.
      Add nav styles in `src/app/dashboard.css` (token-based focus-visible rings, active state).
      Run `pnpm test` and confirm T005 turns GREEN.
      (2026-09-11: GREEN — nav renders via template ref `#link="routerLinkActive"` +
      `ariaCurrentWhenActive="page"`; `NAV_ITEMS` uses route `"/"` so the root path matches
      `isActive`; barring `routerLinkActive` as a bare attribute is required for the exportAs
      template ref to resolve.)

**Checkpoint**: T005 GREEN; nav renders one item, active state works, AXE clean.

---

## Phase 4: User Story 3 — Workspace ready for vault features (Priority: P2)

**Goal**: Dashboard main area shows a section heading, an empty-state hint, and a working nested
`<router-outlet>` for future child routes.

**Independent Test**: Render Dashboard; assert the `<h1>` section heading and empty-state
paragraph render; register a stub child route and assert its content appears through the nested
outlet.

### Tests for User Story 3 (written first — MUST FAIL before T008)

- [x] T007 [P] [US3] Add to `src/app/dashboard/dashboard.spec.ts`: (a) the main area contains an
      `<h1>` heading; (b) the empty-state hint paragraph renders; (c) register a stub child route
      via `provideRouter([{ path: "", component: StubChild }])` nested under the dashboard's
      outlet and assert its text appears in the rendered output.
      **EXPECT FAIL**: main area currently has no heading or outlet (T006 nav pass didn't add
      them).
      (2026-09-11: GREEN — stub child route uses `{ path: "", component: Dashboard, children: [...]
      }` with `RouterTestingHarness` navigation; avoids duplicate `provideRouter` conflicts by
      configuring each `it` independently.)

### Implementation for User Story 3

- [x] T008 [US3] Implement workspace in `src/app/dashboard/dashboard.html`: add `<main
      id="main-content">` with `<h1 class="text-lg font-semibold">Dashboard</h1>`, `<p
      class="text-muted">Your credentials will appear here.</p>`, and a nested
      `<router-outlet />`. Run `pnpm test` and confirm T007 turns GREEN.
      (2026-09-11: GREEN — `<main id="main-content">` + `<h1>` + empty-state paragraph + nested
      `<router-outlet>` present.)

**Checkpoint**: T007 GREEN; main area renders heading + hint; child route outlet works.

---

## Phase 5: Reconcile 002 token assertion

**Purpose**: `app-tokens.spec.ts` (002 artifact) asserts that the static `app.html` contains
`text-muted` (the old `<main>` had it). With `App` reduced to `<router-outlet />`, this
assertion must be reconciled — either moved to the dashboard template or removed if the 002
assertion was incidental and not contractually binding.

- [x] T009 Reconcile `src/app/app-tokens.spec.ts` (002 artifact): confirm what it asserts and
      decide (a) if the assertion targets a template class literal that should live in the
      Dashboard instead, update the test to query the Dashboard's `text-muted` element; or (b)
      if the assertion was only checking the root's own styling utilities, update the selector to
      target the dashboard main area. Run `pnpm test` and ensure the 002 test still passes
      without modifying `src/styles.css` or `src/theme/**`.
      (2026-09-11: GREEN — spec updated to query `Dashboard` template/style files; 6 tests pass.
      `src/styles.css` and `src/theme/**` untouched.)

---

## Phase 6: E2E Regression & Polish Gate

**Purpose**: Confirm the re-chromed app still passes the 005 theme flows and the full gate.

- [x] T010 Run `pnpm e2e` (005 theme flows) against the running app (`ng serve` or `webServer`
      in `playwright.config.ts`). If any selector broke because chrome moved into the lazy
      Dashboard, update the selectors in `e2e/support/shared.ts` or `e2e/theme/theme.spec.ts`
      (adjust only selectors; do not remove or weaken any assertion — mutant check applies).
      The flow step order (`emulateColorScheme`, `goto`, `click` toggle) must remain unchanged.
      (2026-09-11: GREEN — 15 tests across chromium/firefox/webkit; the chrome move into the
      lazy Dashboard did not break the 005 flows; no selector changes needed.)

- [x] T011 Run `pnpm verify` (Biome gate + full unit suite + `ng build`) and fix any violations;
      run the color-literal grep on `src/app/**` and confirm no `oklch(`/`color-mix(`/hex
      literals; confirm `src/index.html`/`src/theme/**` unchanged (git diff empty on those
      paths); confirm `dist/nop3-lockr-vault/browser/index.html` still has the 002 pre-paint
      script as the first child of `<head>`; confirm the build emits a lazy chunk for the
      dashboard; `pnpm lint` passes.
      (2026-09-11: GREEN — `pnpm verify` passes: Biome 60 files clean, 160 unit tests, build
      OK with lazy `dashboard` chunk `chunk-7GJWZMIB.js`. Grep found no color literals in
      `src/app/**`. `src/index.html` + `src/theme/**` git-diff empty. Pre-paint script is the
      first child of `<head>` in the built `index.html`. Note: `useValidAnchor` (biome HTML
      a11y) flags `routerLink` anchors lacking a static `href`; resolved with a static
      `href="/"` on the brand link and a `biome-ignore` for the data-driven nav link, since
      Angular `RouterLink` overwrites `href` at runtime.)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (T001)**: green baseline first.
- **US1 (T002–T004)**: independent of vault data; can proceed first.
- **US2 (T005–T006)**: depends on T004 (dashboard must exist with `<nav>` slot).
- **US3 (T007–T008)**: depends on T004 (dashboard main area must exist).
- **002 reconcile (T009)**: after T004 (the old `app.html` assertion is broken by T004).
- **Polish (T010–T011)**: after all stories and T009.

### Within Each User Story

- Tests written and shown FAILING first, then implementation, then green.

### Parallel Opportunities

- T002 (dashboard spec) and T003 (app spec) can be written in parallel (separate files).
- T005 (nav spec) and T007 (workspace spec) can be written in parallel after T004.
- T006 and T008 are independent implementations (nav markup vs main markup).

---

## Implementation Strategy

### Precedence

1. T001 baseline green.
2. Write RED specs T002 + T003.
3. Implement T004 (routes + thin App) → US1 GREEN; reconcile T009 (002 tokens) in same commit
   to avoid a broken baseline.
4. Write T005 + T007 RED specs; implement T006 (nav) + T008 (workspace) → US2 + US3 GREEN.
5. Run T010 e2e regression; fix selectors only if needed.
6. Gate T011: `pnpm verify` + e2e green.

### Notes

- `ThemeToggle` is imported unchanged from 004; 006 must NOT rewrite or re-declare its options.
- `app-tokens.spec.ts` (002) asserts `text-muted` in the old `app.html` `<main>`. T004 will
  break this; T009 reconciles it in the same commit set to keep the baseline clean.
- The `'**'` wildcard redirect requires `pathMatch: "full"` — standard Angular router practice
  for wildcard routes on the root config.
- No changes to `src/index.html`, `src/theme/**`, or the 002/003 contract files.
- Commits follow review-before-commit policy; each phase may be committed separately after
  review.