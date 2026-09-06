# Research: App Shell

**Feature**: [004-app-shell](../004-app-shell/spec.md)
**Date**: 2026-09-06

## Scope

Resolve the technical unknowns for "the first real UI on top of the 002 theme foundation and the
003 theme-state store": shell structure, the accessible theme-switcher pattern, wiring the 003
signalStore into the UI, lazy routing in the Angular v22 standalone world, and how to run
component-level AXE checks inside the repo's Vitest + jsdom runner. Decisions are verified against
Angular v22 (`@angular/router`, `@angular/core`) and the actual 002/003 artifacts in this repo.

## Decisions

### D1 - The shell chrome lives in the root `App`; `ThemeToggle` is the only new shell component

- **Decision**: `App` (root, already a standalone component) owns the chrome markup directly in its
  template: `<header>` (brand anchor, `<nav>` with Home/About `routerLink`s, `<theme-toggle>`), a
  skip link to `<main>`, and `<main>` with the `<router-outlet>`. `ThemeToggle` is a separate
  standalone child component. No `Header` subcomponent.
- **Rationale**: The header has no independent state, so splitting it adds files without giving a
  testability win — `App`'s spec covers the chrome. `ThemeToggle` *does* split cleanly: it is the
  only component that touches the store and needs its own accessibility surface (radiogroup +
  roving tabindex), so it gets its own file set and spec (AGENTS: "Keep components small and
  focused on a single responsibility" — one component per responsibility, not one per DOM region).
- **Alternatives considered**:
  - A dedicated `Header` component: rejected as overhead; the shell is static chrome.
  - Material/tabs primitives from `@angular/cdk`/Material: rejected — not installed, and the native
    radiogroup pattern (D2) needs no dependency (NFR-005: no new runtime deps).

### D2 - The switcher is a native ARIA `radiogroup` with roving tabindex

- **Decision**: `ThemeToggle` renders `role="radiogroup"` with `aria-label="Theme"`. Each of the
  three options (Light/Dark/System, order from the frozen 002 contract) is a `<button
  role="radio">` with `aria-checked` bound to `choice === option` and `aria-label`
  (`Light theme`, `Dark theme`, `System theme`). Only the checked radio is in the tab order
  (`tabindex=0`), the others `tabindex=-1`. ArrowLeft/ArrowRight move + select the adjacent option,
  Home/End jump to first/last — all through the store's `setChoice`. This is the canonical
  WAI-ARIA "radio group" example, so it is also the most AXE-friendly.
- **Rationale**: A three-valued choice is a textbook radio group; roving tabindex matches ARIA
  authoring practices and WCAG 2.1.1 keyboard operability. Using `role="radio"` + `aria-checked`
  gives assistive-tech-friendly semantics that `aria-pressed` toggle-batches cannot express for
  "one of N". Arrow keys selecting immediately matches the common segmented-control UX and keeps
  the store as the single source of truth (003 D5 single writer).
- **Alternatives considered**:
  - One cycling button (`Light → Dark → System`): rejected — a cycle hides the current state from
    the aria-label and adds a "no visible position" ambiguity; radio semantics are clearer.
  - `role="tablist"`: rejected — semantically about tab panels, not document-level settings.

### D3 - The toggle reads 003 `ThemeStore` and never holds its own state

- **Decision**: `ThemeToggle` uses `inject(ThemeStore)`, reads `choice()` (selection) and
  `effective()` (for a visually-resolved hint/aria-check on System can stay plain), and its only
  mutation is `store.setChoice(option)` with the contract's string literals. The store instance is
  provided at root (003), so Home/About lazy chunks share the same `ThemeStore`.
- **Rationale**: AGENTS says use signals for state; re-declaring choices or mirroring the store in a
  local signal would create a second writer (violating 003's single-writer US3). The toggle is a
  pure view over the store (FR-003).
- **Alternatives considered**: passing a store instance via `input()` from `App` — rejected: the
  store is root-provided, injection is the idiomatic read path and keeps `App`'s template minimal.

### D4 - Lazy routing with `loadComponent`, typed Routes, wildcard redirect

- **Decision**: `app.routes.ts` exports a typed `Routes` array with `""` (default) and `"about"`
  both using `loadComponent: () => import('../home/home').then(m => m.Home)` and
  `(() => import('../about/about').then(m => m.About))`, and a final `"**"` entry
  `redirectTo: ""`. No NgModules anywhere (AGENTS: standalone by default in v22).
- **Rationale**: AGENTS mandates lazy loading for feature routes; v22's `loadComponent` keeps each
  screen in its own chunk with zero NgModule ceremony. The `"**"` redirect satisfies the
  "resilient" US3 requirement.
- **Alternatives considered**: eager `component:` for both routes — rejected (no chunking, against
  AGENTS); `loadChildren`/route modules — rejected (moduleless standalones).

### D5 - Component-level AXE in Vitest via `axe-core` (dev dependency, user-installed); e2e AXE stays in 005

- **Decision**: Add `axe-core` as a devDependency (user installs, per policy). The 004 specs render
  real components in jsdom through the Angular test runner and run
  `await axe(element)`; the assertion is "no violations with impact `serious` or `critical`".
  `incomplete` results (rules jsdom cannot fully compute, e.g. `color-contrast` needing rendered
  colors) are logged but not failed. Full visual/`e2e` AXE scans belong to 005 (Playwright), per
  spec assumptions.
- **Rationale**: NFR-001/US1-A5 demand automated AXE at the component level; the repo's unit
  runner (Vitest + jsdom) is the fastest place to catch ARIA/role regressions continuously.
  Contrast itself is already guaranteed structurally by 002's `contrast.ts` token tests, which is
  exactly why 004 can afford to let `color-contrast` be incomplete in jsdom.
- **Alternatives considered**: depending on 005's Playwright run for all AXE — rejected: 004 would
  ship with no automated accessibility gate for months; adding an Angular-CDK a11y checker —
  rejected (NFR-005, no runtime dep; axe-core is dev-only).

### D6 - Router specs use `RouterTestingHarness` (no new dependency)

- **Decision**: Route/lazy tests call `RouterTestingHarness.create()` over
  `provideRouter(routes)` and assert rendered component/text at `""`, `/about`, and an unknown
  path. No `@angular/material` or extra testing package is required (`RouterTestingHarness` ships
  with `@angular/router`).
- **Rationale**: It literally navigates and awaits the lazy chunk, so it proves the full resolver
  path including the wildcard redirect and async `loadComponent`, beating a skim of the Routes
  array.
- **Alternatives considered**: textual route-table assertions only — rejected (would not prove the
  lazy chunk actually resolves); e2e-only coverage — rejected (unit gate must be self-sufficient).

### D7 - Focus management lives in template `host`/bindings and utilities; no `@HostListener`

- **Decision**: Keyboard handling for the roving tabindex is implemented in the component via
  template `(keydown)` handlers and/or a small key handler method — **not** the `@HostBinding`/
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

- Final copy for the welcome screen (blocker: none — placeholder text is fine for 004, real copy
  lands with the vault features).
- Exact route ordering in `app.routes.ts` between `""` and `"**"` (trivial — eager `""` first).