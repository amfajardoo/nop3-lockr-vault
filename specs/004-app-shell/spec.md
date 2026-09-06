# Feature Specification: App Shell

**Feature Branch**: `feature/004-app-shell`

**Created**: 2026-09-06

**Status**: Draft

**Input**: User description: "App shell on top of the 002 theme foundation and the 003 theme-state
store: a persistent header with branding and a primary theme switcher (Light/Dark/System) wired to
the `ThemeStore`, primary navigation with lazily-loaded Home and About routes (Home is the welcome
screen), a default-route welcome experience, and token-based styling. The shell must be accessible
(landmarks, skip link, keyboard-operable toggle, focused navigation states) and pass automated AXE
checks at the unit/component level; the visual/e2e AXE pass is owned by feature 005."

## User Stories & Testing *(mandatory)*

### User Story 1 - The shell renders and navigates (Priority: P1)

As a user, I want a persistent app shell with branding and navigation, so that every screen offers
the same entry points and I always know where I am.

**Why this priority**: The roadmap marks 004 as the materialization of the app UI on top of the 002
tokens and the 003 theme layer; without the shell there is nothing to hang the toggle or the routes
on.

**Independent Test**: Render `App` with the real router provider and `ThemeStore` in a jsdom
fixture: the header (brand, navigation, theme switcher) is present above the routed content, the
welcome screen renders at the default route, and the unknown-path redirect lands back on the
welcome screen. A structural spec asserts the header owns landmark roles and a skip link.

**Acceptance Scenarios**:

1. **Given** an empty path, **When** the app boots, **Then** the shell (header + main) renders and
   the Home welcome screen is the default routed content.
2. **Given** the header, **When** the page is scrolled and the skip link is focused, **Then** focus
   jumps to the main content container.
3. **Given** the header navigation, **When** the user navigates to a route, **Then** the matching
   link exposes `aria-current="page"`.
4. **Given** an unknown path, **When** the router resolves it, **Then** the app redirects to the
   Home welcome screen without an error page.
5. **Given** the rendered shell, **When** an AXE scan runs on it, **Then** no serious/critical
   violations are reported.

---

### User Story 2 - The theme switcher is accessible and live (Priority: P1)

As a user, I want to switch the theme from the header and have the change apply instantly and be
remembered, using only the keyboard if I need to.

**Why this priority**: The 003 store exists precisely to serve this control; the switcher is the
first real consumer and the UX surface of the whole theming story.

**Independent Test**: Render `ThemeToggle` with an injected `ThemeStore` (storage and `matchMedia`
stubbed on the jsdom window): the three options (Light/Dark/System) render, the selected option
reflects the `choice` signal, activating an option calls `setChoice` (persisting it and applying
the root marker), Arrow/Home/End keys move the roving focus, and the component passes an AXE scan.

**Acceptance Scenarios**:

1. **Given** the toggle with no stored choice, **When** it renders, **Then** System is selected and
   `aria-checked="true"` is on the System radio.
2. **Given** a stored `dark` choice, **When** the toggle renders, **Then** Dark is selected.
3. **Given** the toggle, **When** the user activates Dark, **Then** the store `choice` becomes
   `dark`, `lockr.theme` = `"dark"`, and the root `dark` class is applied.
4. **Given** the toggle, **When** the user sites Dark and presses ArrowRight, **Then** focus moves
   to System and (with Enter/Space) selects it without a write for skipped options.
5. **Given** the toggle markup, **When** an AXE scan runs, **Then** no serious/critical violations
   are reported and the control offers a keyboard path to every option.

---

### User Story 3 - Routes are lazy and resilient (Priority: P2)

As a user, I want fast startup, so that only the screen I need loads; and I want bad URLs to
recover to the welcome screen instead of failing.

**Why this priority**: Lazy loading is an AGENTS best practice (each route chunk loads on demand)
and keeps the initial bundle small; the redirect makes the app feel robust.

**Independent Test**: With a router test harness over the real `routes`, navigating to `/` renders
the lazy `Home`, `/about` renders the lazy `About`, and `/anything-else` redirects to `/`. The
build output must contain separate lazy chunks for Home and About rather than inlining them into
the main bundle.

**Acceptance Scenarios**:

1. **Given** the app bundle, **When** the default route loads, **Then** the Home component comes
   from its own lazy chunk.
2. **Given** the `/about` URL, **When** the app boots directly to it, **Then** the About component
   renders inside the shell.
3. **Given** an unknown URL, **When** the router resolves it, **Then** it redirects to the Home
   welcome screen.
4. **Given** the main shell page, **When** navigation occurs, **Then** no full-page reload happens
   and the header persists across route changes.

---

## Functional Requirements

- **FR-001**: `App` (root) renders a `<header>` with landmark `banner` role: brand text with an
  `app-name` class anchor, primary `<nav>` (landmark `navigation`) with Home and About links
  (`routerLink`), and the `<theme-toggle>` component; a `<main>` with a skip-target id wraps the
  `<router-outlet>`.
- **FR-002**: The shell keeps the token-only color surface contract from 002: no literal
  `oklch(`/`color-mix(`/hex colors in 004 templates or styles (grep-auditable).
- **FR-003**: `ThemeToggle` is a standalone component that owns no state: it reads `choice` and
  `effective` from the injected 003 `ThemeStore` via signals and only calls `setChoice`.
- **FR-004**: `ThemeToggle` uses a WAI-ARIA `radiogroup` pattern: container `role="radiogroup"`
  with `aria-label="Theme"`, each option `role="radio"` + `aria-checked` + `aria-label`, roving
  `tabindex` (only the selected radio is in the tab order), and ArrowLeft/ArrowRight/Home/End key
  handling that activates the target option (Arrow keys reveal it and, per common toggle UX, also
  select it) — every option reachable with the keyboard alone.
- **FR-005**: Focusable shell elements (nav links, toggle radios, skip link) show a visible focus
  ring using token classes (`focus-visible`), never relying on default browser outline removal
  without a replacement.
- **FR-006**: A visually-hidden skip link (token-based `sr-only`-style utility that becomes visible
  on focus) is the first focusable element and targets the `<main>` content container.
- **FR-007**: Routes are declared as a typed `Routes` array in `app.routes.ts` with lazy
  `loadComponent` for Home and About; an exact-empty `"": pathMatch: "full"` default and a
  `"**"` wildcard redirecting to `""`.
- **FR-008**: The default route renders the Home welcome screen: an h1, a muted intro paragraph,
  and a token-styled primary action button placeholder (no business logic yet).
- **FR-009**: `App` (shell) and `ThemeStore` are provided once at root; route-level lazy components
  never re-instantiate the store (navigation across Home/About keeps the same store instance and
  the toggle reflects it).
- **FR-010**: The 002 pre-paint script and `src/index.html` remain byte-for-byte unchanged by 004.

## Non-Functional Requirements

- **NFR-001**: AXE unit scans report zero serious/critical violations on the rendered shell and the
  toggle (jsdom scope; incomplete rules permitted and recorded).
- **NFR-002**: WCAG AA minimums (focus management, keyboard operability, ARIA) per AGENTS
  Accessibility Requirements.
- **NFR-003**: Initial bundle keeps Home/About out of the main chunk (lazy); verify by inspecting
  the build output.
- **NFR-004**: All 004 files pass `biome ci .`, the full unit suite, and `ng build` (`pnpm
  verify`).
- **NFR-005**: No new runtime dependencies; only a dev dependency `axe-core` (user-installed) for
  AXE scans.

## Boundary / Edge Cases

1. Choice storage blocked (private mode): `setChoice` still updates the signal and the root marker;
   persistence silently no-ops (003 already handles the throw — 004 must not re-wrap it).
2. Media-query noise while focus is on the toggle: switching the OS must not steal keyboard focus
   or reset the roving tabindex.
3. Navigation while a route is still loading an async chunk: the shell header must render
   immediately and stay stable while `router-outlet` swaps content.
4. Direct deep-link to `/about` with a cold boot: the pre-paint theme (002) still applies before
   first paint and About renders inside the shell.
5. Repeated clicks on the already-selected radio: no-op against the store (003 `setChoice` validates
   and identical writes are harmless — do not add extra guards that could reintroduce drift).

## Assumptions

- Home is a static welcome screen; real vault/business UI is out of scope for 004.
- Copy is English; no i18n infrastructure is added.
- No footer or additional routes are required by the roadmap.
- Visual, real-browser AXE verification is owned by feature 005 (Playwright); 004 proves
  accessibility at the component level in jsdom.
- The toggle options reuse the frozen 002 contract (`theme-choice.schema.json`): `light | dark |
  system`; no new persisted contract is introduced by 004.
- Branding is text-only (no images), so `NgOptimizedImage` is not exercised by 004.