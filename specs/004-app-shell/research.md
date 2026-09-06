# Research: App Shell

**Feature**: [004-app-shell](../004-app-shell/spec.md)
**Date**: 2026-09-06

## Scope

Resolve the technical unknowns for "the first real UI on top of the 002 theme foundation and the
003 theme-state store": shell structure, the accessible theme-switcher pattern, wiring the 003
signalStore into the UI, and how to run component-level AXE checks inside the repo's Vitest + jsdom
runner. Page routes are out of scope (deferred with the pages feature). Decisions are verified
against Angular v22 (`@angular/router`, `@angular/core`) and the actual 002/003 artifacts in this
repo.

## Decisions

### D1 - The shell chrome lives in the root `App`; `ThemeToggle` is the only new shell component

- **Decision**: `App` (root, already a standalone component) owns the chrome markup directly in its
  template: `<header>` (brand anchor, `<theme-toggle>`), a skip link to `<main>`, and `<main>` with
  the `<router-outlet>`. `ThemeToggle` is a separate standalone child component. No `Header`
  subcomponent.
- **Rationale**: The header has no independent state, so splitting it adds files without giving a
  testability win — `App`'s spec covers the chrome. `ThemeToggle` *does* split cleanly: it is the
  only component that touches the store and needs its own accessibility surface (radiogroup +
  roving tabindex), so it gets its own file set and spec (AGENTS: "Keep components small and
  focused on a single responsibility" — one component per responsibility, not one per DOM region).
- **Alternatives considered**:
  - A dedicated `Header` component: rejected as overhead; the shell is static chrome.
  - Material/tabs primitives from `@angular/cdk`/Material: rejected — not installed, and the native
    radiogroup pattern (D2) needs no dependency (NFR-005: no new runtime deps).

### D2 - The switcher is a native radio-input radiogroup with roving tabindex

- **Decision**: `ThemeToggle` renders a `role="radiogroup"` container with `aria-label="Theme"`.
  Each of the three options (Light/Dark/System, order from the frozen 002 contract) is a native
  `<input type="radio">` (visually hidden with `sr-only` but focusable) inside a visible `<label>`.
  Only the checked radio is in the tab order (`tabindex=0`), the others `tabindex=-1`.
  ArrowLeft/ArrowRight move + select the adjacent option, Home/End jump to first/last — all through
  the store's `setChoice`, handled on the container's `(keydown)` with `preventDefault` for uniform
  behavior across browsers and jsdom. The `<label>` carries the visible focus ring via
  `focus-within` and the token styling for the selected chip.
- **Rationale**: A three-valued choice is a textbook radio group; roving tabindex matches ARIA
  authoring practices and WCAG 2.1.1 keyboard operability. Native radios expose `role="radio"` and
  checked state to assistive tech without ARIA attributes, and they satisfy Biome's a11y lint
  (`useSemanticElements`/`useAriaPropsForRole`) that rejected a `button[role="radio"]` variant (the
  dynamic `[attr.aria-checked]` binding is invisible to static analysis). Wrapping `<label>`s give
  each radio an accessible name from its visible text. Arrow keys selecting immediately matches the
  common segmented-control UX and keeps the store as the single source of truth (003 D5 single
  writer).
- **Alternatives considered**:
  - `button[role="radio"]` + `[attr.aria-checked]`: implemented first (canonical ARIA example, AXE
    passes), then rejected by Biome static a11y rules — the dynamic binding can't be verified, so
    it was refactored to native inputs per developer decision.
  - One cycling button (`Light → Dark → System`): rejected — a cycle hides the current state from
    the aria-label and adds a "no visible position" ambiguity; radio semantics are clearer.
  - `role="tablist"`: rejected — semantically about tab panels, not document-level settings.

### D3 - The toggle reads 003 `ThemeStore` and never holds its own state

- **Decision**: `ThemeToggle` uses `inject(ThemeStore)`, reads `choice()` (selection) and
  `effective()` where a visually-resolved hint is needed, and its only mutation is
  `store.setChoice(option)` with the contract's string literals. The store instance is provided at
  root (003), so every screen (now and future routed pages) shares the same `ThemeStore`.
- **Rationale**: AGENTS says use signals for state; re-declaring choices or mirroring the store in a
  local signal would create a second writer (violating 003's single-writer US3). The toggle is a
  pure view over the store (FR-003).
- **Alternatives considered**: passing a store instance via `input()` from `App` — rejected: the
  store is root-provided, injection is the idiomatic read path and keeps `App`'s template minimal.

### D4 - Page routes are deferred; `app.routes.ts` stays empty

- **Decision**: For 004, `app.routes.ts` exports a typed `Routes` array equal to `[]`. The
  Home/About lazy routes and the `"**"` wildcard redirect are deliberately NOT implemented — they
  land with the feature that designs the pages. When they arrive, AGENTS mandates lazy loading via
  v22's `loadComponent` (each screen in its own chunk, no NgModules).
- **Rationale**: The shell has no routable destinations until pages exist; the user decided routes
  and new components are premature for 004.
- **Alternatives considered**: shipping placeholder Home/About routes now — rejected (scope trim,
  spec revision 2026-09-06); eager `component:` routes — rejected (no chunking, against AGENTS).

### D5 - Component-level AXE in Vitest via `axe-core` (dev dependency, user-installed); e2e AXE stays in 005

- **Decision**: Add `axe-core` as a devDependency (user installs, per policy). The 004 specs render
  real components in jsdom through the Angular test runner and run
  `await axe(element)`; the assertion is "no violations with impact `serious` or `critical`".
  `incomplete` results (rules jsdom cannot fully compute, e.g. `color-contrast` needing rendered
  colors) are logged but not failed. Full visual/`e2e` AXE scans belong to 005 (Playwright), per
  spec assumptions.
- **Rationale**: NFR-001/US1-A3 demand automated AXE at the component level; the repo's unit
  runner (Vitest + jsdom) is the fastest place to catch ARIA/role regressions continuously.
  Contrast itself is already guaranteed structurally by 002's `contrast.ts` token tests, which is
  exactly why 004 can afford to let `color-contrast` be incomplete in jsdom.
- **Alternatives considered**: depending on 005's Playwright run for all AXE — rejected: 004 would
  ship with no automated accessibility gate for months; adding an Angular-CDK a11y checker —
  rejected (NFR-005, no runtime dep; axe-core is dev-only).

### D6 - Router coverage is deferred with the routes

- **Decision**: No router/navigation specs ship in 004 because there are no routes. When the pages
  feature adds routes, its specs should use `RouterTestingHarness.create()` over
  `provideRouter(routes)` and assert the rendered component/text and the wildcard redirect — no
  extra testing package is required (`RouterTestingHarness` ships with `@angular/router`).
- **Rationale**: The shell spec keeps a real `Router` provider (`provideRouter([])`) so
  `<router-outlet>` renders and survives swap — that is the only router touchpoint 004 needs.
- **Alternatives considered**: textual route-table assertions — rejected (would not prove the lazy
  chunk actually resolves); e2e-only coverage — rejected (unit gate must be self-sufficient).

### D7 - Focus management lives in template `host`/bindings and utilities; no `@HostListener`

- **Decision**: Keyboard handling for the roving tabindex is implemented in the component via
  template `(keydown)` handlers and a key handler method — **not** the `@HostBinding`/
  `@HostListener` decorators (AGENTS forbids them; put host bindings in the `host` object of the
  `@Component` decorator). The skip link uses a token-based visually-hidden utility class that is
  revealed on `:focus-visible`.
- **Rationale**: AGENTS explicitly: "Do NOT use the `@HostBinding` and `@HostListener` decorators".
  A self-managed radiogroup needs keyboard handling regardless; doing it in the template keeps the
  logic testable from the fixture (dispatch `KeyboardEvent` and assert focus + store state).

### D8 - Focus must not be stolen by OS media-query changes

- **Decision**: `ThemeStore`'s OS listener only patches `systemDark` + root marker; it never
  touches `document.activeElement` or the tabindex set. The toggle derives its tabindex from the
  `choice` signal, so an OS change while choice is `System` recomputes the effective theme but the
  roving focus stays where the user left it.
- **Rationale**: 003 already guarantees no writes on OS change; 004 adds nothing that mutates focus.
  This is verified explicitly in the toggle spec (focus stays on the focused radio after a `change`
  dispatch) to prevent a future regression where someone "helpfully" jumps focus.
- **Alternatives considered**: writing a custom focus-tracking layer in the toggle — rejected as
  ceremony; the signal-derived tabindex already yields correct behavior deterministically.

## Open Questions

- Final copy and pages for the future routes (blocker: none — deferred with the pages feature;
  the shell ships brand + toggle copy only).