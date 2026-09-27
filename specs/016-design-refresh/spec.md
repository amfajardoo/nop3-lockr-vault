# Feature Specification: Expressive Design Refresh

**Feature Branch**: `feature/016-design-refresh`

**Created**: 2026-09-26

**Status**: Draft

**Input**: User description: "la app está muy fea — crea un spec para mejorar el diseño" plus the
author's answers to the scoping questionnaire: **all five pain points** (visual hierarchy,
layout/responsive, colors & dark mode, typography & spacing, iconography), visual direction
**"look más exprésivo/branded"**, and scope **"CSS + estructura de templates"** (templates may
be reorganized, containers moved, icons added — no behavior/route/a11y-semantic changes). This
slot does not exist in `specs/000-planning/dashboard-roadmap.md` (whose feature slots 006–010
are all shipped as 006–015); it is a new user-requested feature, numbered 016.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - The app looks intentional, not factory-default (Priority: P1)

As a user opening any view of the app, I want a clear visual hierarchy — a page header that
announces where I am, surfaces that read as distinct layers, and interactive elements that
respond to hover/focus — so the product feels designed and trustworthy rather than like a
scaffold.

**Why this priority**: "Falta de jerarquía visual" was the author's first-named pain point, and
it is the layer every other improvement (color, type, icons) hangs on. Without hierarchy,
palette and font work reads as decoration on a wireframe; with it, the refresh is legible even
in grayscale.

**Independent Test**: Navigate the four views (list, detail, create, edit) and assert — through
harnesses — that each renders the shared page-header structure (heading with its existing
accessible id/labeling intact, supporting text, actions slot) and that no view regresses to a
bare `<h1>` in a flex row. No persistence or backend required.

**Acceptance Scenarios**:

1. **Given** the credential list, **When** it renders, **Then** the page header presents the
   title as the dominant element with supporting copy and the action controls grouped in an
   actions slot — not three unrelated items in one row.
2. **Given** the detail view of a credential, **When** it renders, **Then** it uses the same
   page-header pattern with the credential name as the title and Edit/Delete as grouped
   actions, with the data presented in a distinct raised surface (card) below.
3. **Given** the create and edit forms, **When** they render, **Then** the form card reads as a
   raised surface against the page background, with the title inside the header pattern and
   the same max-width measure as other views.
4. **Given** any list row, **When** the user hovers or keyboard-focuses it, **Then** an
   observable hover/focus affordance appears (surface/outline change) that does not exist only
   on hover for keyboard users (focus-visible parity).
5. **Given** the empty, no-results, and not-found states, **When** they render, **Then** each
   reads as a deliberate state card (icon + heading + copy + action) rather than a bare line
   of text.

---

### User Story 2 - Colors and dark mode feel like one coherent brand (Priority: P1)

As a user switching between light and dark mode, I want a single, coherent color system —
body, shell, and components drawing from the same tokens — with a richer brand accent, so the
app never shows seams and looks branded rather than default-Material.

**Why this priority**: The audit found a concrete defect, not just taste: `src/styles.css`
paints the body with a parallel slate palette (`--surface: #ffffff` in light, `#0f172a` in
dark) while every component renders on Material's tinted system surface (`light-dark(#faf8ff,
#11131b)`), so backgrounds can disagree at component edges; `contrast.spec.ts` currently locks
the old slate pairs. The author explicitly ranked "colores y dark mode" as a pain point.

**Independent Test**: With the token layer changed, run the contrast suite: every documented
text pair must measure ≥ 4.5:1 and every non-text pair ≥ 3:1 in **both** schemes via the
existing `contrastRatio` utility; plus specs asserting the body and shell reference the same
token family (no parallel palette). Then switch `.dark` and assert the same structure holds.

**Acceptance Scenarios**:

1. **Given** the light scheme, **When** body, shell, and card surfaces render, **Then** they
   derive from one token family (Material system tokens plus documented semantic extensions) —
   no second, independent palette for the body.
2. **Given** either scheme, **When** every foreground/background pair used by text is measured
   with `contrastRatio`, **Then** text pairs are ≥ 4.5:1 and borders/hover affordances are
   ≥ 3:1 (WCAG AA), asserted in specs for light and dark.
3. **Given** the brand accent (primary blue, tertiary accent), **When** they are applied to
   brand moments (brand mark, active nav, key actions, decorative accent), **Then** their
   on-color pairs pass the same AA thresholds.
4. **Given** the dark scheme, **When** surfaces render, **Then** background, raised surface,
   and container levels are visually distinguishable (distinct token values, asserted) — dark
   mode is not one flat slab.
5. **Given** the theme pre-paint script in `index.html`, **When** the page loads before CSS,
   **Then** the no-flash behavior and single-writer theme tests (existing) remain green.

---

### User Story 3 - The shell works on any screen (Priority: P1)

As a user on a narrow window or phone, I want the side navigation to stop consuming permanent
width — collapsing behind a labeled menu button while wide screens keep the persistent rail —
and content to sit on a readable measure with consistent spacing, so the layout is usable
everywhere.

**Why this priority**: The audit found `mode="side" opened` hard-coded: the 280px rail is
always open, leaving no room for content at small widths (a reflow failure, WCAG 1.4.10).
Layout was an author-named pain point and it gates the mobile experience of every other view.

**Independent Test**: Drive the CDK `MediaMatcher` stub across breakpoints: at wide width the
sidenav renders as a persistent side rail with no menu button visible; at narrow width it
renders closed/over with a menu button whose activation opens it (and Escape/close dismisses
it) — all asserted through harnesses without a real browser.

**Acceptance Scenarios**:

1. **Given** a wide viewport (≥ 960px), **When** the dashboard renders, **Then** the sidenav
   is a persistent side rail, no menu button is rendered, and content fills the remaining
   width within a max measure.
2. **Given** a narrow viewport (< 960px), **When** the dashboard renders, **Then** the sidenav
   is closed (over mode) and a menu button with an accessible name is visible.
3. **Given** the narrow layout, **When** the user activates the menu button, **Then** the
   sidenav opens as an overlay with a scrim, and closing it (button/scrim/Escape) returns
   focus appropriately per Material's behavior.
4. **Given** any viewport down to 320px of reflow width, **When** pages render, **Then** no
   horizontal scrolling is required (content measure, wrapping header controls, sidenav out of
   flow).
5. **Given** a viewport crossing the breakpoint, **When** the media query changes, **Then** the
   sidenav mode updates reactively (signal-driven), with listeners cleaned up on destroy.

---

### User Story 4 - Typography and spacing follow a deliberate system (Priority: P2)

As a user, I want headings that carry the brand's personality, a clear type hierarchy from
page title to metadata, and spacing that falls on a consistent scale, so the interface reads
as one system instead of accumulated one-off values.

**Why this priority**: Directly implements the author's "tipografía y espaciado" pain point;
it depends on US1's header structure (where the type hierarchy lives), so it lands after the
P1 stories while remaining independently testable.

**Independent Test**: Assert statically and behaviorally: headings consume the display
font (overridden Material type tokens), body text stays Roboto, page titles use the title
tokens (not ad-hoc px), and component stylesheets reference the shared spacing scale instead
of scattered magic numbers — via CSS-token specs.

**Acceptance Scenarios**:

1. **Given** any page header, **When** the title renders, **Then** it uses the display/brand
   font via overridden Material type tokens (`--mat-sys-*-font`), distinct from body copy.
2. **Given** the app in either scheme, **When** body text renders, **Then** it remains Roboto
   (the font loaded today) with the Material body tokens — the brand font is restricted to
   display/headline roles, never buttons, inputs, or data.
3. **Given** component stylesheets, **When** inspected by specs, **Then** spacing values come
   from the shared scale (documented custom properties or the scale's literal values) rather
   than arbitrary values, and no literal colors appear anywhere (token purity extended to all
   components).
4. **Given** the brand font fails to load (offline/blocked CDN), **When** headings render,
   **Then** a fallback stack keeps text legible and layout intact (no invisible or unstyled
   text).
5. **Given** the type hierarchy, **When** list rows and metadata render, **Then** title, line,
   and meta levels are distinguishable through Material type tokens (label/title/body roles),
   not only color or size tweaks.

---

### User Story 5 - Actions and states speak through icons (Priority: P2)

As a user, I want the navigation, search, filter, favorite, delete, and empty/error states to
carry recognizable icons (with the accessible names I already rely on), so the interface stops
looking like a text wireframe.

**Why this priority**: The author's "falta de iconografía" pain point; purely additive on top
of US1's structure and constrained by FR-010 (existing accessible names and harness selectors
must survive), so it is safest last.

**Independent Test**: Assert through harnesses/DOM that each inventoried location renders its
`<mat-icon>` (correct ligature) and that every pre-existing accessible name/`aria-label` the
specs rely on (e.g. `Delete <name>`, `Add/Remove <name> to favorites`) is byte-identical
before and after — the icon must not change the name.

**Acceptance Scenarios**:

1. **Given** the sidenav, **When** nav items render, **Then** each shows its icon alongside
   the label, with the icon decorative (`aria-hidden`) so the link's name stays the label.
2. **Given** the list header, **When** search and filter render, **Then** the search field
   shows a leading search icon and the filter button a star/filter icon, names unchanged.
3. **Given** a credential row, **When** it renders, **Then** favorite and delete actions use
   Material icons (star/star-border, delete) replacing the unicode star and inline SVG, with
   `aria-label`/`aria-pressed` assertions from 009/015 still passing byte-identically.
4. **Given** the empty, no-results, and not-found states, **When** they render, **Then** each
   shows a state icon reinforcing the message (decorative), with text and actions unchanged.
5. **Given** the brand mark in the shell toolbar, **When** it renders, **Then** it carries a
   lock/shield icon plus the app title, still acting as the link to `/` with its existing
   behavior.

---

### Edge Cases

- **Breakpoint flapping**: rapid resize across 960px must not leave a stale open side rail or
  an orphaned scrim — mode derives from a signal, open state resets when switching to wide.
- **Overlay vs rail focus**: opening the narrow-mode sidenav must not strand focus behind the
  scrim; Material's `mat-sidenav` handles trapping/closing — specs assert close paths
  (button, scrim, Escape).
- **Icon font unavailable**: ligature `<mat-icon>` would render raw text (e.g. "delete");
  mitigated by the existing Google Fonts link pattern + `preconnect` and by keeping every
  icon `aria-hidden` so a raw word never becomes a spoken label (copy remains in
  `aria-label`s).
- **Long titles/names**: display-font titles with long credential names must wrap, not
  overflow (reflow at 320px covers it).
- **Reduced motion**: any new hover/transition effects must be disabled under
  `prefers-reduced-motion` (existing `MediaMatcher` stub already simulates it).
- **Dark-mode pre-paint**: the inline `index.html` script and `.dark` single-writer flow must
  remain untouched (existing specs lock them).
- **Spec drift from restructured templates**: moving containers can break harness selectors
  (e.g. `[data-favorite]`, `mat-label` label association, button counts); every affected spec
  keeps its intent with the minimal structural update documented — no assertion weakened.
- **Contrast regressions from accents**: any new accent/surface pair must be added to the
  contrast suite at the moment it is introduced, not later.
- **Palette regeneration side effects**: regenerating `_theme-colors.scss` changes every
  Material component at once; the design must pass the full 245-test suite after any
  regeneration.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Every page view (list, detail, create, edit) MUST render the shared page-header
  pattern: dominant title (existing accessible ids/labeling preserved), supporting copy, and a
  grouped actions slot.
- **FR-002**: Views MUST express surface hierarchy using Material system surface tokens
  (background vs surface-container levels vs raised cards) with hover/focus affordances on
  interactive rows that have focus-visible parity with hover.
- **FR-003**: The body/`html` color layer MUST derive from the Material system token family
  (no parallel hand-maintained palette for body colors); semantic extensions (success/warning)
  MUST be documented and contrast-tested like any other token.
- **FR-004**: The contrast suite MUST assert every documented text pair ≥ 4.5:1 and non-text
  pair ≥ 3:1 in light and dark using the existing `contrastRatio` utility; new accent/surface
  pairs are added to the suite in the same change that introduces them.
- **FR-005**: Dark mode MUST show distinguishable surface levels (at least background, raised,
  container) with distinct token values in both schemes, and MUST keep the `index.html`
  pre-paint script and `.dark` single-writer behavior unchanged.
- **FR-006**: The shell MUST switch sidenav behavior at `(min-width: 960px)` using the CDK
  `MediaMatcher` (signal + change listener + destroy cleanup): persistent side rail with no
  menu button when wide; closed overlay with an accessible menu button when narrow.
- **FR-007**: Content MUST render on a bounded, centered measure with consistent page padding
  and MUST reflow without horizontal scrolling at 320px.
- **FR-008**: Page/section titles MUST use the display/brand font applied through overridden
  Material type tokens (`--mat-sys-*-font`); body, controls, and data text MUST remain Roboto
  via Material body/label/title tokens; the brand font MUST include a fallback stack.
- **FR-009**: Spacing MUST follow a single documented scale used by shell and components;
  component stylesheets MUST contain no literal color values (token-purity guard extended from
  `dashboard.css` to every component stylesheet) and only approved variable prefixes.
- **FR-010**: Icons MUST come from Material Icons (`MatIconModule` + already-loaded font):
  nav items, brand, search prefix, filter, favorite, delete (replacing the inline SVG), and
  the empty/no-results/not-found states; every icon is decorative (`aria-hidden`) and MUST NOT
  alter any existing accessible name, `aria-label`, `aria-pressed`, id, or harness selector.
- **FR-011**: No behavior, routing, store, form, dialog, or copy changes: the existing 245
  tests MUST pass; template restructures limited to presentation may adjust a spec only with
  intent preserved and the change documented in tasks.md.
- **FR-012**: Interactive effects (transitions, hover) MUST respect
  `prefers-reduced-motion`; focus indicators MUST remain Material-provided and visible.
- **FR-013**: All scenarios MUST have automated tests (harness where a harness path exists,
  DOM/token/contrast assertions otherwise), pass the mutant check, and keep `pnpm verify`
  green.
- **FR-014**: `src/vault/`, the constitution, `.specify/`, theme single-writer architecture,
  and route definitions MUST remain untouched.

### Key Entities

- **Design tokens**: Material system tokens (single source for color/surface/type) + approved
  semantic extensions + the new spacing scale; replaces the parallel slate palette for the
  body.
- **Page-header pattern** (new presentation contract): title + supporting copy + actions slot,
  shared across views; semantics (headings, ids, links) unchanged.
- **Shell responsiveness state**: `wide`/`narrow` derived from `MediaMatcher` +
  sidenav open state (component-local signals; no store).
- **NavItem** (existing, `dashboard/nav-items.ts`): gains an `icon` field (presentation
  metadata only; label/route semantics unchanged).
- **Icon inventory** (new): fixed list of ligature icons per location, asserted by specs.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Harness specs prove the page-header pattern on all four views with existing
  accessible ids/names intact; state cards (empty/no-results/not-found) render icon + heading
  + copy + action.
- **SC-002**: Contrast specs prove ≥ 4.5:1 (text) and ≥ 3:1 (non-text) for every documented
  pair in both schemes; token-family specs prove the body no longer uses a parallel palette.
- **SC-003**: MediaMatcher-driven specs prove both breakpoint behaviors (wide: rail, no menu
  button; narrow: closed overlay + working menu button open/close) and reactive updates.
- **SC-004**: Token specs prove display-font overrides on titles, Roboto retained for body,
  spacing-scale usage, and zero literal colors across **all** component stylesheets.
- **SC-005**: Icon specs prove each inventoried `<mat-icon>` renders its ligature and every
  pre-existing accessible name/selector asserted by 009/012/014/015 specs is byte-identical.
- **SC-006**: The full suite stays green: the existing 245 tests pass (structural adjustments
  only where documented, intent preserved) plus the new design specs; `pnpm verify` green.
- **SC-007**: Mutant check demonstrated: breaking the breakpoint signal (always-wide), the
  token unification (body palette fork), the display-font override, or a documented contrast
  pair makes at least one spec fail.
- **SC-008**: Manual `quickstart.md` walkthrough (light/dark, wide/narrow, keyboard,
  320px reflow) reviewed by the human, since aesthetics are ultimately judged by eye.
- **SC-009**: Diffs confined to styles/templates/shell/theme-config and their specs;
  `src/vault/`, routes, and store behavior untouched.

## Assumptions

- **Stated rationale**: the questionnaire answers quoted in the Input (all five pain points;
  expressive/branded direction; CSS + template structure scope). **Everything else in this
  spec is inferred** — including the feature number 016, the specific breakpoint (960px), the
  display-font choice, spacing-scale values, and the decision to keep the existing primary
  blue while activating the existing tertiary purple as the brand accent (palettes already in
  `_theme-colors.scss`) — and is marked for reviewer confirmation in the PR.
- Display font: a geometric/techy Google font in the vein of Space Grotesk (single link in
  `index.html`, same pattern as Roboto) — swappable at review without structural change.
- "Expressive" is delivered **within** Material 3 (theme slots, tokens, type/surface/icon
  usage), not by forking component styles into a bespoke design system (Constitution VI).
- Icon coverage follows the FR-010 inventory only; no icon-per-everything pass.
- Copy stays English and unchanged except optional supporting lines in page headers (short,
  factual microcopy; flagged in review).
- Hover effects are progressive enhancement: all information is available without hover.
- No new dependencies (no CSS framework, no icon package, no font-subsetting tooling).
- Aesthetic judgment itself (SC-008) stays human: specs lock structure, contrast, tokens, and
  semantics — not taste.
