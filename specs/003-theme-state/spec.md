# Feature Specification: Theme State

**Feature Branch**: `feature/003-theme-state`

**Created**: 2026-09-06

**Status**: Draft

**Input**: User description: "Theme-state layer over the Tailwind dark marker built in 002: a
@ngrx/signals signalStore that is the single runtime owner of the stored theme choice
(`localStorage["lockr.theme"]`, contract from 002), the effective theme, OS-following when the
choice is `system`, and the runtime `.dark` marker on the document root. Validation and storage
format follow `theme-choice.schema.json` (light|dark|system); missing/corrupt storage falls back to
`system`, never crashes, and never regresses the 002 first-paint behavior. No user-facing UI yet
(app-shell feature 004 owns the toggle)."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - The chosen theme survives reloads (Priority: P1)

As a user, I want my explicitly chosen theme to be remembered, so that returning to the app later
shows the same theme I picked, with the pre-paint boot still painting the correct theme on the first
frame.

**Why this priority**: Persistence is the core value of the state layer; without the store writing
the choice, the 002 pre-paint script has nothing meaningful to read at boot and the whole no-FOUC
promise degrades.

**Independent Test**: Programmatically set the choice to `dark` through the store (the toggle UI is
feature 004, so tests drive the store), then simulate a reload with storage intact: the store
initializes from `lockr.theme` and the effective theme is `dark`, and `documentElement` carries the
`dark` class — the same class the pre-paint script would have applied.

**Acceptance Scenarios**:

1. **Given** no stored choice, **When** the store initializes, **Then** the choice is `system` and
   the effective theme follows the OS preference, without writing anything to storage.
2. **Given** a stored valid explicit choice (`light` or `dark`), **When** the store initializes,
   **Then** the effective theme is that stored choice.
3. **Given** a stored choice set through the store, **When** the page reloads, **Then** the stored
   choice is restored (7round-trip), the pre-paint script applies it before first paint, and the
   store's state is consistent with the applied DOM marker.
4. **Given** the app running in dev mode with a hot reload (HMR), **When** the store re-initializes,
   **Then** no duplicate listeners or spurious storage writes occur (idempotent init).

---

### User Story 2 - The theme follows the OS while choice is `system` (Priority: P1)

As a user who chose "follow system", I want the palette to track my operating system setting live,
so that changing it anywhere (OS settings, browser emulation) repaints the app without a reload.

**Why this priority**: Reactivity is what makes `system` a first-class option rather than a
boot-time-only fallback; the roadmap explicitly calls out OS-following as part of this feature.

**Independent Test**: Set the choice to `system`, then simulate a `prefers-color-scheme` change in a
test stub: the effective theme flips and the root `dark` class flips with it. With an explicit
choice (`light`/`dark`), the same OS change leaves the theme untouched.

**Acceptance Scenarios**:

1. **Given** the choice is `system`, **When** the OS preference flips dark→light or light→dark,
   **Then** the effective theme and the root marker flip accordingly (no reload, no storage write).
2. **Given** an explicit stored choice (`dark`), **When** the OS preference changes, **Then** the
   effective theme stays `dark` and no storage write occurs.
3. **Given** the choice is `system` and the OS preference is dark, **When** the effective theme is
   read, **Then** it equals `dark`; when the OS preference is light, **Then** it equals `light`.

---

### User Story 3 - One writer owns the runtime state (Priority: P2)

As a developer, I want the store to be the single runtime owner of both the persisted choice and the
`dark` marker, so that 002's pre-paint boot contract, the DOM, and the stored value can never drift.

**Why this priority**: A single writer is what keeps the three representations (storage, store
state, DOM class) consistent, which is the invariant every future screen and the 004 toggle rely on.

**Independent Test**: Inspect the runtime write paths: every storage write and every
`documentElement` class mutation during runtime is reachable only through the store's API; boot-time
class mutation remains exclusively the 002 pre-paint script's job.

**Acceptance Scenarios**:

1. **Given** the app booted, **When** anything triggers a theme change, **Then** both the storage
   value and the DOM marker change through the same store action, never through ad-hoc DOM code.
2. **Given** the store initializes with corrupt storage, **When** boot completes, **Then** the
   choice is `system`, the effective theme falls back to the OS preference, the app renders normally,
   and the corrupt value is not silently overwritten by the boot path.
3. **Given** the pre-paint script ran before first paint, **When** the store initializes after
   bootstrap, **Then** the store never re-applies or re-writes the theme unnecessarily at boot
   (no spurious writes, no FOUC regression).

---

### Edge Cases

- Storage read throws (private mode, quota, security error): treat as absent → choice `system`,
  never crash.
- Stored value is `"system"`: option is valid, effective theme = live OS preference.
- Stored value is anything other than `light`/`dark`/`system` (malformed/unknown): treat as absent,
  fall back to `system`, do not guess, do not crash.
- `setChoice()` called with a value outside the enum: no-op (optionally logged), state unchanged,
  no storage write.
- OS preference changes rapidly (debounce/jitter): trailing state wins; no intermediate frames get
  stuck in a stale palette.
- Store re-initialization (HMR, tests): never duplicates the OS listener and never writes storage
  on init.
- No UI exists yet (feature 004 owns the shell): the store is exercised via its public API and unit
  tests; attempting to render a toggle here is out of scope.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST expose a single theme-state layer (a `@ngrx/signals` signalStore) with
  three read-facing values: stored `choice` (`light`|`dark`|`system`), `effective` theme
  (`light`|`dark`), and the OS-following flag implied by `choice`.
- **FR-002**: The store MUST be the only runtime writer of `localStorage["lockr.theme"]` and the
  only runtime mutator of the document root `dark` class; boot-time mutation stays exclusively in the
  002 pre-paint script.
- **FR-003**: Setting a valid choice MUST persist the value (raw string, no JSON wrapper, per the
  `theme-choice.schema.json` contract) and apply/remove the root marker in the same action.
- **FR-004**: Initialization MUST validate the stored value against the contract; missing,
  malformed, unknown, or storage-throwing values MUST resolve to `system` and MUST NOT crash or
  overwrite the stored value at boot.
- **FR-005**: When `choice` is `system`, the effective theme MUST track a live
  `prefers-color-scheme: dark` media-query listener, updating the root marker on change; when
  `choice` is explicit, OS changes MUST be ignored and MUST NOT write storage.
- **FR-006**: Initialization and all state transitions MUST NOT regress the 002 first-paint contract:
  `src/index.html` keeps its pre-paint script untouched, and the store never applies the marker
  before Angular bootstrap completes.
- **FR-007**: The feature MUST NOT introduce user-facing UI (toggle/settings live in feature 004) and
  MUST NOT alter the theme tokens, `src/styles.css` surface, or the `theme-choice.schema.json`
  contract.
- **FR-008**: All acceptance scenarios MUST be covered by unit tests (Vitest/jsdom, same harness as
  feature 002), the static-analysis gate MUST stay green, and line coverage MUST stay > 90%.

### Key Entities *(include if feature involves data)*

- **ThemeChoice**: the persisted preference value (`light`|`dark`|`system`) — contract owned by 002
  (`theme-choice.schema.json`), storage key `lockr.theme`.
- **ThemeState (store)**: the signalStore state shaped as `{ choice, effective }` where `choice` is
  the explicit or `system` value and `effective` is the resolved palette applied to the root.
- **EffectiveTheme**: the derived, resolved palette (`light`/`dark`) that the store reflects onto the
  root marker.
- **RootThemeMarker**: the runtime `dark` class on `document.documentElement`; single writer is the
  store (post-boot), single pre-paint applier is the 002 script.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A choice set through the store survives a simulated reload with zero drift between the
  stored value, the effective theme, and the applied root marker (verifiable round-trip).
- **SC-002**: With choice `system`, a simulated OS preference change updates the effective theme and
  the root marker within the constitution's 100ms theme-switch SLA, with no spurious storage writes.
- **SC-003**: With an explicit choice, simulated OS changes produce zero effective-theme changes and
  zero storage writes.
- **SC-004**: Corrupt or throwing storage never breaks boot: the app resolves to `system`, renders
  normally, and preserves the stored (invalid) value untouched.
- **SC-005**: The full verification gate (`pnpm verify`: formatting, lint, unit tests, build) stays
  green and line coverage stays > 90% after this feature lands.

## Assumptions

- The state layer is built with `@ngrx/signals` `signalStore` (explicit roadmap + user decision),
  which becomes the feature's only new runtime dependency; Angular 22.x is the target.
- The storage key (`lockr.theme`), value set, and JSON Schema contract are fixed by feature 002 and
  reused unchanged.
- The pre-paint script from 002 remains the single ahead-of-first-paint applier; the store joins in
  only after Angular bootstrap and never re-paints the first frame.
- No user-facing UI and no changes to the token system (`src/styles.css`) in this feature; the 004
  shell consumes the store's public API.
- The OS preference is the browser's `prefers-color-scheme: dark` match; in jsdom the media query is
  stubbed (same technique as feature 002's specs), and OS-change events are simulated in tests.
- Single-page application only, no SSR; HMR re-initialization must be idempotent.
- Full end-to-end coverage of theme flows belongs to feature 005, not this feature.