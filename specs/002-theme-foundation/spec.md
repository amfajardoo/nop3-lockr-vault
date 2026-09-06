# Feature Specification: Theme Foundation

**Feature Branch**: `feature/002-theme-foundation`

**Created**: 2026-09-05

**Status**: Draft

**Input**: User description: "Theme foundation: Tailwind v4 class-based dark mode (@custom-variant
dark), semantic theme tokens for light and dark palettes, and a pre-paint script in index.html
that applies the stored or OS-preferred theme before first paint so there is no flash of the
wrong theme (FOUC). No user-facing toggle yet; that belongs to the theme-state and app-shell
features."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Dark mode without a flash (Priority: P1)

As a visitor, I want the page to open already in the correct theme (matching my OS preference or
my previously stored choice) from the very first frame, so that I never see a brief flash of the
wrong palette while the app boots.

**Why this priority**: A visible light/dark flash on every load is the most immediate symptom of a
broken theming foundation and is unacceptable for a polished product; it must be solved where the
shell UI is introduced.

**Independent Test**: Open the app with the OS set to dark and no stored choice; the first painted
frame is dark, with zero appearance of the light palette before it. The same holds when a stored
explicit choice conflicts with the OS setting.

**Acceptance Scenarios**:

1. **Given** the OS prefers dark and no explicit stored choice, **When** the page first loads,
   **Then** the first painted frame uses the dark palette with no visible light theme flash.
2. **Given** a stored explicit choice of dark while the OS prefers light, **When** the page first
   loads, **Then** the first painted frame uses the stored choice (dark) with no flash of light.
3. **Given** a stored value that is not a valid theme choice, **When** the page first loads,
   **Then** the active theme falls back to the OS preference and the page renders normally without
   errors.

---

### User Story 2 - One switch drives the whole palette (Priority: P1)

As a developer, I want the theme to be controlled by a single root-level marker, so that adding or
removing it switches every themed element without per-component styling or conditional hacks at
each screen.

**Why this priority**: The marker is the contract that the theme-state feature (feature 003) and the
shell (feature 004) will build on; without it, every future screen reinvents theming.

**Independent Test**: Apply the dark marker to the document root in isolation and observe every
scaffold surface (page background, headings, links, text, interactive elements) adopting the dark
palette without touching individual components; removing the marker restores the light palette.

**Acceptance Scenarios**:

1. **Given** the document rendered with the light palette, **When** the dark marker is applied to
   the root, **Then** all scaffold surfaces switch to the dark palette through the shared tokens,
   with no per-component style needed.
2. **Given** the dark marker applied, **When** it is removed from the root, **Then** the palette
   returns to light consistently, with no residual dark styling left behind.
3. **Given** either active palette, **When** the app runs its static-analysis gate on the styling
   foundation, **Then** no lint/accessibility violations are introduced by this feature.

---

### User Story 3 - One source of truth for colors (Priority: P2)

As a developer, I want the light and dark palettes defined once as semantic tokens, so that future
screens (shell, vault) reference colors by meaning rather than copying arbitrary values.

**Why this priority**: A single palette source is what keeps future review cheap and the dark theme
consistent with the light theme; it is the prerequisite that makes every later screen's theming
trivial.

**Independent Test**: List the semantic tokens defined by the foundation; every scaffold surface
uses only those tokens, and each token maps to distinct light and dark values.

**Acceptance Scenarios**:

1. **Given** the foundation's token set, **When** a screen needs a surface, text, border, or
   interactive color, **Then** it references a semantic token from the set rather than a literal
   color value.
2. **Given** both palettes, **When** the scaffold renders in either theme, **Then** no hard-coded
   color values remain outside the token definitions in the code under scope.

---

### Edge Cases

- No stored choice exists: fall back to the OS preference, do not guess.
- Stored value is malformed or unknown: ignore it and use the OS preference; never crash or show an
  error.
- Scripts are disabled or fail before bootstrap: the page must still render a usable default
  without errors (the default light palette is an acceptable degraded state).
- The marker and palette must not depend on any network request to resolve or render.
- Applying/removing the marker at runtime must not leak stale styling (e.g., a link painted for one
  theme but text in the other).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST switch the entire visual palette when a single dark-mode marker is present
  on or absent from the document root (class-driven dark mode, not media-query-only).
- **FR-002**: System MUST expose the light and dark palettes as a single set of semantic tokens,
  where each token has a light value and a dark value, consumed by components instead of literal
  colors.
- **FR-003**: System MUST apply the active theme before the first frame of the page is painted,
  resolving the active theme at load time from the stored explicit choice when valid, otherwise
  from the OS preference.
- **FR-004**: System MUST treat an invalid stored theme value as absent and fall back gracefully,
  without errors or side effects.
- **FR-005**: All scaffold text and interactive surfaces MUST meet WCAG AA contrast minimums
  (4.5:1 for normal text) in both the light and dark palettes, and the page MUST remain AXE-clean
  in both themes.
- **FR-006**: The theme foundation MUST render and resolve correctly with no network access.
- **FR-007**: The theme foundation MUST NOT introduce static-analysis or accessibility violations
  in the lint/format gate (the toolchain feature's `check` command stays green).
- **FR-008**: The foundation MUST NOT expose or implement user-facing theme switching controls,
  persistence writing, or OS-following reactivity; those are owned by the theme-state and
  app-shell features.

### Key Entities *(include if feature involves data)*

- **Semantic tokens**: the named set of color values ("surface", "text", "border", "accent",
  "interactive", etc.) with one value per palette; the single source of truth for colors.
- **Root theme marker**: the present/absent state on the document root that selects the dark vs
  light palette.
- **Initial theme resolver**: the identity that picks the effective theme on first load from the
  stored choice (when valid) or the OS preference, and performs the "before first paint" constraint
  (read-only; it owns no persistence writes).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Loading the app with the OS preferring dark and no stored choice produces a dark
  first frame with zero visible frames of the light palette (verified by first-paint capture).
- **SC-002**: Applying/removing the root marker switches every scaffold surface between palettes
  consistently, verified by an automated check that no per-component color overrides are required.
- **SC-003**: AXE scan reports zero violations in both palettes, and every scaffold text pairing
  meets the WCAG AA 4.5:1 contrast minimum in both palettes.
- **SC-004**: The full verification gate (formatting, lint, unit tests, build) remains green after
  the foundation lands.

## Assumptions

- Tailwind v4 (PostCSS pipeline already installed) is the styling foundation; the roadmap fixes the
  approach: a class-driven dark variant (`@custom-variant dark`) plus tokens defined in the Tailwind
  theme layer.
- No user-facing toggle, no persistence writes, no reactive OS-following in this feature
  (roadmap: state is feature 003, toggle UI is feature 004).
- OS preference means the browser's `prefers-color-scheme` match.
- The stored theme key is owned by feature 003; this feature only reads it defensively at load time
  to satisfy the no-flash requirement.
- Single-page application only (no server-side rendering); no Content Security Policy is configured
  today, so the pre-paint script runs inline, blocking before the first paint by design.
- If scripting is unavailable, the light palette is the accepted degraded default; no error UI.
- Window/graphics driver theme behavior on development machines may differ; SC-001 is verified with
  the browser's forced color scheme in an automated capture, not by switching the OS setting.
- End-to-end coverage of the theme flows belongs to feature 005, not this feature.