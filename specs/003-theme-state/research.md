# Research: Theme State

**Feature**: [003-theme-state](../003-theme-state/spec.md)
**Date**: 2026-09-06

## Scope

Resolve the technical unknowns for "runtime theme-state layer over the 002 theme foundation using
`@ngrx/signals`": store shape, persistence ownership, boot ordering vs the pre-paint script, live
OS-following, and jsdom testability. Decisions are verified against `@ngrx/signals` v22 (aligned
with the 22.x Angular line) and the existing 002 artifacts in this repo.

## Decisions

### D1 - A signalStore is the state layer, provided at root

- **Decision**: Implement the theme state as a `signalStore` created with `withState`, `withComputed`,
  `withMethods`, and `withHooks`, exported as `ThemeStore` and provided at the application root via
  the store's `provideThemeStore()`/`with` provider helper pattern (injected with
  `inject(ThemeStore)` anywhere the 004 shell needs it).
- **Rationale**: The roadmap and the user decision fix `@ngrx/signals` `signalStore` for this
  feature. It gives signals-first reactive state (AGENTS: "Use signals for state management"),
  derived values through `withComputed` (effective theme), actions through `withMethods`
  (setChoice, init-time validation), and a declarative lifecycle hook for the OS listener
  (`ngrxOnInit` in `withHooks`). Providing at root keeps the store a singleton like the rest of the
  app's state, while keeping the store's dependency list explicit and unit-testable.
- **Alternatives considered**:
  - Plain class service with `@Service` (AGENTS-preferred for simple singletons) holding raw signals
    — rejected by the roadmap/user decision for this feature; a service would also need hand-rolled
    lifecycle cleanup for the media-query listener.
  - `@Injectable({ providedIn: 'root' })` + `BehaviorSubject` (rxjs) — rejected: signals are the
    established state primitive in this codebase (AGENTS), not rxjs subjects.
  - ngrx-toolkit's `withStorageSync` plugin — rejected in D2.

### D2 - Manual persistence, one writer, no storage plugin

- **Decision**: Persist manually inside `withMethods`: `setChoice(choice)` validates the input
  against `theme-choice.schema.json` (`enum light|dark|system`), updates the `choice` signal,
  writes the raw string to `localStorage["lockr.theme"]`, and applies/removes the `dark` class on
  `document.documentElement` in the same action. Initialization (in `ngrxOnInit`) ONLY *reads* and
  validates; it never writes. The `withStorageSync` plugin from `ngrx-toolkit` is not used.
- **Rationale**: `withStorageSync` persists the whole state slice to storage behind the scenes,
  which fights three requirements of this spec: (a) it would serialize extra derived fields and
  re-hydrate them (we persist only the `choice` raw string per the 002 contract), (b) its default
  sync-on-load would overwrite the stored value at boot, violating FR-004/SC-004 (corrupt value must
  not be overwritten by the boot path), and (c) spurious writes (FR-005, SC-002/SC-003) are far
  easier to guarantee when every write goes through one explicit `writeChoice()` path.
- **Alternatives considered**:
  - `withStorageSync` plugin — rejected above.
  - Reading storage lazily per access — rejected: state must represent the truth after init, and
    validation must happen once at boot for zero-trust handling.

### D3 - Boot ordering: the 002 pre-paint script stays the only before-first-paint applier

- **Decision**: `src/index.html` and its inline pre-paint script are NOT touched by this feature.
  The store initializes after Angular bootstrap: `ngrxOnInit` reads and validates the stored value,
  computes `effective`, and reflects it to the root marker **only when it differs from what the
  boot script already applied**. It never writes storage at init, per D2.
- **Rationale**: The 002 script is the explicit single applier ahead of first paint (002 research D3,
  this spec FR-006). If the store also toggled the class at init, it would risk re-applying a class
  the script already set (harmless but redundant) or — worse — racing the first paint. Reading the
  same contract at runtime keeps the store and the boot script aligned with zero duplicated
  resolution logic: the store reuses `theme-contract.ts` (`resolveEffectiveTheme`, key, choices)
  from 002, so the boot script's decision and the store's decision come from one implementation.
- **Alternatives considered**:
  - Let the store run before/at the first frame — rejected: contradicts FR-006 and 002's D3
    (only a synchronous inline head script can guarantee pre-paint ordering for a class that styles
    must read).
  - A third resolution path inside the store — rejected: duplicates the 002 resolver; reuse the
    existing exports.

### D4 - Live OS-following via `matchMedia` listener, stubbed in jsdom

- **Decision**: When `choice === "system"`, the store updates `effective` live by listening to
  `matchMedia("(prefers-color-scheme: dark)")` change events. The listener is registered in
  `ngrxOnInit` and never registered more than once (idempotent under HMR); a provided "current
  system dark" getter is read once at init. jsdom does not implement `matchMedia`, so specs install
  a stub **on the jsdom window** (`document.defaultView`) whose returned MediaQueryList carries a
  `matches` flag and a manual `addEventListener`/`dispatch`, mirroring the 002 pre-paint spec
  technique (window-bound, driven via a fake event).
- **Rationale**: `prefers-color-scheme` change events are the standard, browser-rendered live signal
  and match what the 002 script reads at boot. Registering the listener exactly once in the store
  lifecycle avoids listener leaks under HMR (FR-004 edge case). Stubbing `matchMedia` on the jsdom
  window (not `globalThis`) matches the proven 002 approach where jsdom's vm isolation hid
  window-bound globals.
- **Alternatives considered**:
  - Polling system preference on an interval — rejected: wasteful and slow versus an event.
  - Relying on Angular's change detection or a zone-based subscription — rejected: the listener
    updates a signal directly; no zone dance required.
  - Skipping live updates and re-resolving only at boot — rejected: fails FR-005/US2.

### D5 - Single runtime writer: DOM marker and storage always change through the store

- **Decision**: All runtime mutations of both `localStorage["lockr.theme"]` and the root `dark`
  class live inside `ThemeStore` and are unreachable elsewhere: the store exposes only
  `setChoice(choice)` for writing, and the root-marker toggle is a private helper called from
  `setChoice` and from the OS listener path (`computeEffectiveAndApply`). No other module touches
  `documentElement.classList` or the storage key at runtime.
- **Rationale**: US3/FR-002 require a single writer so the three representations (storage, store
  state, DOM marker) cannot drift. Centralizing the two side effects in one module makes the
  "no spurious writes" acceptance scenarios (SC-002/SC-003) assertable by construction and keeps the
  004 shell's job to a pure "read state / call setChoice".
- **Alternatives considered**:
  - A separate `ThemeDomService` responsible for the class toggle — rejected: two writers by
    delegation still split the side effects across files; the store is already the cohesion point.
  - An effect watching `effective` and applying the class reactively — rejected:
    `ngrxOnInit`-initiated application via `fromSignal`/effect can fire on boot unnecessarily,
    creating spurious writes; the imperative helper is deterministic and testable.

## Out of scope (confirmed)

- Toggle UI / shell: feature 004.
- Playwright e2e and AXE scans: feature 005.
- Token value changes, `src/styles.css`, `src/index.html` head changes: feature 002 (frozen).

## References

- `@ngrx/signals` official docs — `signalStore`, `withState`, `withComputed`, `withMethods`,
  `withHooks` (`ngrxOnInit`) and root-provider pattern.
- Feature 002 artifacts in this repo — `research.md` D3 (pre-paint), `data-model.md`
  (ThemeChoice/EffectiveTheme/RootThemeMarker), `contracts/theme-choice.schema.json`,
  `src/theme/theme-contract.ts` (reused by the store).
- Feature 002 `pre-paint.spec.ts` — the jsdom window-stub technique for `matchMedia`/`localStorage`
  (proven inside the builder's jsdom environment).