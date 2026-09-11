# Research: Dashboard Shell

**Feature**: [006-dashboard-shell](../006-dashboard-shell/spec.md)
**Date**: 2026-09-11

## Scope

Resolve the technical unknowns for "the app becomes a routed dashboard": how the lazy route is
registered (v22 `loadComponent`), where the chrome lives (root `App` vs Dashboard), how the nav
stays data-driven and accessible, and how the 005 e2e theme flows survive the re-chrome. Mock
data only; no vault storage or crypto in this feature.

## Decisions

### D1 - `App` becomes a thin bootstrap; the Dashboard owns the chrome

- **Decision**: Root `App` shrinks to `<router-outlet />` only (keeps `title` signal unused or
  moves brand copy into the Dashboard). The Dashboard component — lazy-loaded on `''` — renders
  the `<header>` (skip link, brand, `<theme-toggle>`), the primary `<nav>`, and `<main
  id="main-content">` with a nested `<router-outlet>`.
- **Rationale**: spec US1-A4/FR-001. The user's "dashboard replaces the shell": chrome belongs to
  the screen that is the app's home. Lazy-loading the Dashboard gives the first real chunk split.
- **Alternatives considered**: keeping chrome in `App` and loading the Dashboard inside the outlet
  — rejected: the header would stay always-eager and the "dashboard owns everything" model would
  be cosmetic only; routing the shell gives child-route flexibility (008+ register under the
  dashboard, not under a shell with no outlet).

### D2 - Lazy route via v22 `loadComponent`; wildcard redirect to `''`

- **Decision**: `routes = [ { path: "", loadComponent: () => import("./dashboard/dashboard").then(m => m.Dashboard) }, { path: "**", redirectTo: "" } ]`.
  No NgModules, no `pathMatch` gymnastics: `''` is the root segment matched by the shell/Dashboard.
- **Rationale**: AGENTS mandates lazy loading with `loadComponent`, each screen in its own chunk.
  `'**'` → `''` makes the dashboard the universal landing (spec US1-A3).
- **Alternatives considered**: eager `component: Dashboard` — rejected (no chunk, against AGENTS).

### D3 - The nav is a data-driven constant; one real item for 006

- **Decision**: `NAV_ITEMS: NavItem[] = [{ label: "Overview", route: "" }]` (typed
  `interface NavItem { label: string; route: string }`) exported from the dashboard dir. The
  template `@for`s over it, each item is a router link, `aria-current="page"` is applied via
  `routerLinkActive`/route match. Later features append items next to their routes (008 list,
  010 favorites) without editing the nav markup.
- **Rationale**: spec US2/FR-004 — no dead links; a single source for the landmark; testable by
  asserting the rendered `<nav>` equals the constant.
- **Alternatives considered**: hard-coded anchors — rejected (future features would edit the
  template and risk a11y drift); `routerLinkActive` on the parent with child segments —
  rejected (006 has a single flat item; keep it simple, extend later if navigation becomes
  hierarchical).

### D4 - Active-state via `routerLinkActive` + `aria-current`

- **Decision**: Apply `routerLinkActive` to set the active class, and bind `aria-current` off the
  active check so the current section is announced (`aria-current="page"` when active, else
  removed). Focus ring via the existing `focus-visible` token utilities.
- **Rationale**: spec US2-A2/FR-004/FR-007. `routerLinkActive` is the idiomatic Angular signal for
  "this route is current"; `aria-current` is the WCAG-recognized announcement. Token rings keep
  the 002 contract (FR-006).
- **Alternatives considered**: manual route-param matching per item — rejected (re-inventing
  the router).

### D5 - Headings and empty-state live in the Dashboard main area now

- **Decision**: `<main id="main-content">` renders an `<h1>` section heading ("Dashboard" /
  section title) plus an empty-state hint paragraph, and a nested `<router-outlet>` below it for
  future children (008 list replaces the hint). The skip link keeps targeting `#main-content`.
- **Rationale**: spec US3 — the workspace must not look broken before 008; a real heading gives
  the page structure an anchor and the nested outlet is the extension point.
- **Alternatives considered**: leaving `<main>` empty until 008 — rejected (blank/awkward screen,
  fails US3-A1); rendering the hint as a separate routed placeholder — rejected (a hidden route
  adds ceremony for a single paragraph).

### D6 - 005 e2e survives: the toggle stays reachable on the default route

- **Decision**: The 005 theme specs already boot at `''` (default) and target the toggle by the
  markup it keeps (radiogroup, three radios). After 006, the toggle renders inside the
  lazy-loaded Dashboard on the same URL; the e2e steps need no selector changes. A regression run
  of `pnpm e2e` is a required gate in this feature.
- **Rationale**: spec SC-005. The toggle markup is untouched (D1/FR-007), so the flow steps remain
  valid; the mutant check on 005's "delete the toggle step" still holds.
- **Alternatives considered**: rewriting e2e for a new URL/selector — rejected as unneeded work;
  verified by an actual green e2e run instead.

## Open Questions

- Brand copy location: `title` signal moves to the Dashboard (constant string) once `App` stops
  owning the header. No user input needed — decided as a constant in the Dashboard.
- No other blockers: vault persistence, crypto, and storage remain out of scope per roadmap.