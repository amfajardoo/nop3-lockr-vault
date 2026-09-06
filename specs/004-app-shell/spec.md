# Feature Specification: App Shell

**Feature Branch**: `feature/004-app-shell`

**Created**: 2026-09-06

**Status**: Draft (revised 2026-09-06)

**Input**: User description: "App shell on top of the 002 theme foundation and the 003 theme-state
store: a persistent header with branding and a primary theme switcher (Light/Dark/System) wired to
the `ThemeStore`, primary navigation with lazily-loaded Home and About routes (Home is the welcome
screen), a default-route welcome experience, and token-based styling. The shell must be accessible
(landmarks, skip link, keyboard-operable toggle, focused navigation states) and pass automated AXE
checks at the unit/component level; the visual/e2e AXE pass is owned by feature 005."

**Revision 2026-09-06 (developer decision)**: routes and pages (Home/About) are DEFERRED to a later
feature that designs them. 004 ships the shell chrome only — persistent header (brand + theme
switcher), skip link, `<main>` outlet — and `app.routes.ts` stays an empty typed `Routes` array.
US3 and every navigation-dependent requirement are removed from this specification.

## User Stories & Testing *(mandatory)*

### User Story 1 - The shell renders and is accessible (Priority: P1)

As a user, I want a persistent app shell with branding and the theme switcher, so that every screen
offers the same chrome and theme control.

**Why this priority**: The roadmap marks 004 as the materialization of the app UI on top of the 002
tokens and the 003 theme layer; without the shell there is nothing to hang the toggle on.

**Independent Test**: Render `App` with the real router provider and `ThemeStore` in a jsdom
fixture: the header (brand, theme switcher) renders above the `<main>` outlet, a skip link is the
first focusable element and targets the main landmark, and an AXE scan reports no serious/critical
violations.

**Acceptance Scenarios**:

1. **Given** the app boots, **When** the shell renders, **Then** the header shows the brand and the
   theme switcher and a `<main>` wraps the routed outlet.
2. **Given** the header, **When** the skip link is focused, **Then** focus jumps to the main content
   container.
3. **Given** the rendered shell, **When** an AXE scan runs on it, **Then** no serious/critical
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

1. **Given** the toggle with no stored choice, **When** it renders, **Then** System is selected
   (its radio is checked) and it is the only radio in the tab order.
2. **Given** a stored `dark` choice, **When** the toggle renders, **Then** Dark is selected.
3. **Given** the toggle, **When** the user activates Dark, **Then** the store `choice` becomes
   `dark`, `lockr.theme` = `"dark"`, and the root `dark` class is applied.
4. **Given** the toggle, **When** the user selects Dark and presses ArrowRight, **Then** focus moves
   to System and (with Enter/Space) selects it without a write for skipped options.
5. **Given** the toggle markup, **When** an AXE scan runs, **Then** no serious/critical violations
   are reported and the control offers a keyboard path to every option.

---

## Functional Requirements

- **FR-001**: `App` (root) renders a `<header>` with landmark `banner` role: a brand text anchor
  (`a.brand`) and the `<theme-toggle>` component; a `<main>` with a skip-target id wraps the
  `<router-outlet>`.
- **FR-002**: The shell keeps the token-only color surface contract from 002: no literal
  `oklch(`/`color-mix(`/hex colors in 004 templates or styles (grep-auditable).
- **FR-003**: `ThemeToggle` is a standalone component that owns no state: it reads `choice` and
  `effective` from the injected 003 `ThemeStore` via signals and only calls `setChoice`.
- **FR-004**: `ThemeToggle` is a keyboard-operable radiogroup of three native `<input type="radio">`
  controls (Light/Dark/System, no other values) inside visible `<label>`s, under a container with
  `role="radiogroup"` and `aria-label="Theme"`. The inputs are visually hidden but remain
  focusable; only the selected radio is in the tab order (roving `tabindex`); ArrowLeft/ArrowRight/
  Home/End select and focus the target option — every option reachable with the keyboard alone.
- **FR-005**: Focusable shell elements (toggle radios, skip link) show a visible focus ring using
  token classes (`focus-within`/`focus-visible`), never relying on default browser outline removal
  without a replacement.
- **FR-006**: A visually-hidden skip link (token-based `sr-only`-style utility that becomes visible
  on focus) is the first focusable element and targets the `<main>` content container.
- **FR-007**: `app.routes.ts` stays a typed `Routes` array and remains empty for 004; the Home/About
  lazy routes and the `"**"` redirect are deferred to the feature that introduces the pages.
- **FR-010**: The 002 pre-paint script and `src/index.html` remain byte-for-byte unchanged by 004.

## Non-Functional Requirements

- **NFR-001**: AXE unit scans report zero serious/critical violations on the rendered shell and the
  toggle (jsdom scope; incomplete rules permitted and recorded).
- **NFR-002**: WCAG AA minimums (focus management, keyboard operability, ARIA) per AGENTS
  Accessibility Requirements.
- **NFR-004**: All 004 files pass `biome ci .`, the full unit suite, and `ng build` (`pnpm
  verify`).
- **NFR-005**: No new runtime dependencies; only a dev dependency `axe-core` (user-installed) for
  AXE scans.

## Boundary / Edge Cases

1. Choice storage blocked (private mode): `setChoice` still updates the signal and the root marker;
   persistence silently no-ops (003 already handles the throw — 004 must not re-wrap it).
2. Media-query noise while focus is on the toggle: switching the OS must not steal keyboard focus
   or reset the roving tabindex.
3. Repeated clicks on the already-selected radio: no-op against the store (003 `setChoice` validates
   and identical writes are harmless — do not add extra guards that could reintroduce drift).

## Assumptions

- Routes and pages (Home/About) are out of scope for 004 and will be designed in a later feature;
  004 shipps the shell alone.
- Copy is English; no i18n infrastructure is added.
- No footer or additional routes are required by the roadmap.
- Visual, real-browser AXE verification is owned by feature 005 (Playwright); 004 proves
  accessibility at the component level in jsdom.
- The toggle options reuse the frozen 002 contract (`theme-choice.schema.json`): `light | dark |
  system`; no new persisted contract is introduced by 004.
- Branding is text-only (no images), so `NgOptimizedImage` is not exercised by 004.