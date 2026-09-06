# Implementation Plan: Theme State

**Branch**: `feature/003-theme-state` | **Date**: 2026-09-06 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/003-theme-state/spec.md`

## Summary

Give Lockr Vault a runtime theme-state layer: a `@ngrx/signals` `signalStore` (the only new runtime
dependency) that owns the stored theme choice (`lockr.theme`, validated against the 002 contract),
derives the effective theme, follows the OS preference live when the choice is `system`, and is the
single runtime writer of the document-root `dark` marker. The 002 pre-paint script keeps its
exclusive before-first-paint role; the store joins after Angular bootstrap. No UI (004 owns the
toggle).

## Technical Context

**Language/Version**: TypeScript ~6.0 (strict), Angular 22.x

**Primary Dependencies**: Angular (standalone), `@ngrx/signals` v22.x (runtime, new; installation is
performed by the user as the feature's stated policy), Vitest + jsdom (existing devDependencies)

**Storage**: browser `localStorage` key `lockr.theme` (plain device storage, non-sensitive per
constitution). Writer: this feature's store, exclusively. Read at boot time also by the 002
pre-paint script (read-only there).

**Testing**: Angular `@angular/build:unit-test` (Vitest + jsdom); specs colocated as `*.spec.ts`;
jsdom does not implement `matchMedia`, so the tests stub it (same technique as feature 002: install
stubs on the jsdom window, not `globalThis`).

**Target Platform**: web (modern evergreen browsers)

**Project Type**: Angular SPA (frontend only)

**Performance Goals**: state reads are synchronous and cheap; the 100ms theme-switch SLA from the
constitution is met by wiring OS-change → store update → classList mutation directly (no
scheduler/debounce on the happy path).

**Constraints**: 002's pre-paint contract must not regress (script and head layout untouched); no
UI changes; no token/style changes; static-analysis gate (Biome) green; line coverage > 90%; spec
scenario coverage 100%.

**Scale/Scope**: a single store module under `src/theme/`; the store's public API is the contract
feature 004 will consume.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-checked after Phase 1 design — PASSED.*

| Clause | Application to this feature | Status |
|--------|------------------------------|--------|
| Spec-First | Spec approved (003) before any code | ADHERED |
| Behavioral Immutability | Scenarios frozen from spec; code must match | ADHERED |
| Zero Trust | Stored value is untrusted input; invalid/throwing storage never crashes and is never blindly re-persisted | ADHERED |
| Security by Design | Zero secret material; theme is non-sensitive; plain storage clause applies | ADHERED |
| Automated Verifiability | 100% scenarios tested; >90% lines; gates green pre-PR | ADHERED (enforced in tasks/implementation) |
| Testing/Accessibility | Behavior fully unit-tested; no DOM/visual surface introduced, so no new AXE surface | ADHERED |
| Repository Governance | Feature branch from `main` (#4/#5 merged); single review merge via PR; gates green locally | ADHERED |

Complexity Tracking: none; single store + an OS listener + validation, all owned by one module.

## Project Structure

### Documentation (this feature)

```text
specs/003-theme-state/
├── spec.md              # Feature law (US, FR, SC)
├── plan.md              # This file
├── research.md          # Phase 0 decisions (D1-D5)
├── data-model.md        # Entities: ThemeChoice, ThemeState, EffectiveTheme, RootThemeMarker
├── quickstart.md        # Validation/run guide
├── contracts/
│   └── theme-state.schema.json   # Store state shape contract
├── checklists/
│   └── requirements.md  # Spec quality checklist
└── tasks.md             # Created at implementation kickoff
```

### Source Code (repository root)

```text
src/
├── index.html           # UNCHANGED: 002 pre-paint script stays the only pre-paint applier
├── styles.css           # UNCHANGED (no token changes in this feature)
└── theme/
    ├── theme-contract.ts      # EXISTING from 002 (keys, choices, resolver) — reused here
    ├── theme-state.schema.ts  # (optional) mirror of the contracts/theme-state shape
    ├── theme.store.ts         # NEW: the signalStore (state + computed + methods + hooks)
    ├── theme.store.spec.ts    # NEW: behavior tests (persistence, OS-following, single-writer)
    └── (no UI component)
```

**Structure Decision**: the store lives under `src/theme/` next to the existing theme contract and
contrast utilities; nothing outside Angular's existing `src/` layout is created. The store exposes a
narrow public surface (`state`, `effective`, `choice`, `setChoice`) that feature 004 consumes.

## Complexity Tracking

None. A single store module with one OS media-query listener; no multi-project layering, no
repository pattern. The only new runtime dependency is `@ngrx/signals` (installed by the user at
implementation time).