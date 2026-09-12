# Feature Specification: Dashboard Shell

**Feature Branch**: `feature/006-dashboard-shell`

**Created**: 2026-09-11

**Status**: Draft

**Input**: User description: "The app is a password-manager dashboard. The 004 static shell is
replaced by a living Dashboard layout: routing lands (`app.routes.ts` stops being empty), the
root `App` becomes a thin bootstrap and the Dashboard component owns the chrome (header with
brand + theme toggle, primary navigation, main workspace area). No Home/About pages — the
dashboard is the only screen and the future vault work (list, favorites, edit, read, …) happens
inside it. Mock data, no backend."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - The app boots into a routable dashboard (Priority: P1)

As a user, I want the app to boot into a real routed screen — the dashboard layout — so that the
previous empty shell chrome becomes an actual page I can reach.

**Why this priority**: 004 explicitly left `app.routes.ts = []`; without a single routable
destination there is no dashboard, and every later feature (list, form, favorites) needs a place
to render. This story materializes the routed default screen and moves the chrome into a
component that owns it.

**Independent Test**: Render `App` through the real router, navigate to `''`, and assert the
dashboard renders: header with brand `Lockr Vault` and the theme toggle, a main landmark with a
page heading, no dead routes, and an AXE scan reporting no serious/critical violations.

**Acceptance Scenarios**:

1. **Given** the app boots, **When** the router resolves the empty path, **Then** the Dashboard
   layout renders (header/banner, nav, main workspace) instead of a blank outlet.
2. **Given** the rendered dashboard, **When** an AXE scan runs on it, **Then** no
   serious/critical violations are reported.
3. **Given** an unknown URL (e.g. `/does-not-exist`), **When** the router resolves it, **Then**
   the user lands on the dashboard (`''`) via a wildcard redirect.
4. **Given** the root `App`, **When** it renders, **Then** it contains only the `<router-outlet>`
   — all chrome lives in the lazy-loaded Dashboard component.

---

### User Story 2 - The dashboard navigation is accessible and live (Priority: P1)

As a user, I want primary navigation on the dashboard to be keyboard-operable, announce the
current section, and reflect the active route, so that I can orient and move with assistive tech.

**Why this priority**: The chrome moves into the dashboard and the nav is the orientation surface
for every future vault section. Accessibility minimums (WCAG AA, AXE) are constitutional; nav
must not regress the 004 walls.

**Independent Test**: Render the Dashboard, focus the nav, and assert the nav list renders from a
data-driven item array; each link is focusable with a visible ring; the active item carries
`aria-current="page"`; and an AXE scan on the nav reports no serious/critical violations.

**Acceptance Scenarios**:

1. **Given** the dashboard nav, **When** it renders, **Then** it is a `<nav>` landmark with an
   accessible label and one link per declared nav item (all links target real routes).
2. **Given** the rendered nav, **When** the user tabs into it, **Then** every link is focusable
   and shows a visible focus ring; the active section's item carries `aria-current="page"`.
3. **Given** the nav markup, **When** an AXE scan runs on it, **Then** no serious/critical
   violations are reported.

---

### User Story 3 - The workspace area is ready for the vault features (Priority: P2)

As a user, I want the dashboard main area to present a titled workspace section and an empty-state
hint, so that the screen does not look broken before the credential list lands (008).

**Why this priority**: The list feature (008) renders inside the dashboard's main area; until
then the area must render a designed placeholder and host a `<router-outlet>` so future child
routes render without touching the shell.

**Independent Test**: Render the Dashboard and assert the main workspace shows the section heading
and hint copy, and that the main area contains a working `<router-outlet>` (a stubbed child route
renders through it).

**Acceptance Scenarios**:

1. **Given** the dashboard with no child route active, **When** the workspace renders, **Then** a
   titled section heading and an empty-state hint are visible.
2. **Given** a registered child route (spec constant), **When** the router navigates to it,
   **Then** its component renders inside the dashboard's main `<router-outlet>` (not replacing
   the header).
3. **Given** the workspace, **When** the user navigates via the skip link, **Then** focus jumps
   into the main workspace area.

---

### Edge Cases

- Unknown URL (`/not-a-route`): wildcard redirect lands on `''` — never a blank viewport or a
  crash.
- Repeated navigation to the already-active route: no router errors, no focus loss.
- Small viewport / long nav labels: the layout wraps/stack; no horizontal scrolling; the
  brand+nav affordances remain reachable.
- OS theme change while on the dashboard: the 004 roving-focus guarantee is retained (theme
  changes never move focus).
- Dashboard lazy chunk fails to resolve in dev: the app must not leave a permanently-blank
  outlet on the default route (the route resolves synchronously from the same deployment).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: `App` (root) becomes a thin bootstrap: it renders only the `<router-outlet>`; all
  shell chrome (header, nav, main) moves into the Dashboard component.
- **FR-002**: `app.routes.ts` (typed `Routes`) defines: path `''` lazy-loading the Dashboard via
  `loadComponent` (own chunk, no NgModules), and path `'**'` redirecting to `''`.
- **FR-003**: The Dashboard renders a `<header>` banner: skip link first (targets
  `#main-content`), brand text anchor (`a.brand` → `{{ title() }}`, `Lockr Vault`), and the
  reused 004 `<theme-toggle>`.
- **FR-004**: The Dashboard renders a primary `<nav>` landmark with an accessible label where
  items come from a data-driven constant (label + route), each item is a router link, and the
  item matching the current route carries `aria-current="page"`. Every declared item targets a
  real route (no dead links). For 006 the single item is the overview/`''` itself; future
  features append items alongside their routes.
- **FR-005**: The Dashboard renders a `<main id="main-content">` workspace with a titled section
  heading, an empty-state hint (008 replaces it), and a nested `<router-outlet>` for future
  child routes.
- **FR-006**: The shell color surface stays token-only per the 002 contract: no literal
  `oklch(`/`color-mix(`/hex colors in 006 templates or styles (grep-auditable).
- **FR-007**: Skip link and nav links use `sr-only`-style utilities and visible `focus-visible`
  rings exactly as 004 did; `ThemeToggle` is imported unchanged (no rewrite, no re-declared
  options).
- **FR-008**: `src/index.html` and `src/theme/**` remain byte-for-byte unchanged by 006; the 002
  pre-paint script stays the first child of `<head>` in the built output.

### Key Entities

- **Dashboard**: the routed layout component owning header, nav, and main workspace. Replaces the
  static 004 chrome; hosts future vault sections as child routes.
- **Navigation item**: `{ label: string; route: string }` — the data-driven source for the nav
  landmark. Extensible by later features without touching the shell markup.
- **Child route**: a route registered under the dashboard's nested outlet (landing in 008+); the
  shell is agnostic to which children exist.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: After boot, the default route renders the dashboard with no blank-outlet period on
  standard hardware (built output resolves the lazy chunk locally).
- **SC-002**: 100% of US1/US2/US3 acceptance scenarios have corresponding automated tests that
  are RED before their implementation and GREEN after (spec is the tribunal).
- **SC-003**: Unit-level AXE scans on `App`, the Dashboard, and its nav report zero
  serious/critical violations; WCAG AA focus management is verified by keyboard-driven specs.
- **SC-004**: `pnpm verify` (Biome gate + full unit suite + `ng build`) is green; the build emits
  a lazy dashboard chunk and `dist` `index.html` still has the 002 pre-paint script as the first
  child of `<head>`.
- **SC-005**: The 005 theme e2e flows still pass against the re-chromed app (toggle moved into
  the dashboard, reachable on the default route).

## Assumptions

- English-only copy; no i18n infrastructure is added.
- Mock data only: 006 introduces no persistence, no cryptography, no Supabase (Constitution
  "The Safe" clauses stay out of scope until a vault-storage feature is scheduled).
- 006 ships an empty-state workspace; the credential list, favorites, search, and forms arrive in
  later features that register child routes under the dashboard.
- The nav's single 006 item is the overview/`''` section; later features add their items.
- `ThemeToggle` from 004 is reused verbatim — no new state surface is introduced by 006.
- No new runtime dependencies.
- Visual/real-browser AXE continues to be owned by the e2e suite (005); 006 proves
  accessibility at the unit level in jsdom.