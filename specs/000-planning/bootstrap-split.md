# Bootstrap Split Plan

**Date**: 2026-09-05 | **Status**: defined (not scheduled)

The original single feature `001-project-bootstrap` bundled too much unrelated work
(toolchain, theming, state, UI shell, e2e) into one spec and one PR. This plan splits it
into five small features, each with its own spec → plan → tasks → implement → converge
cycle, its own branch, and a reviewable PR.

## Constraints

- The project constitution (`.specify/memory/constitution.md`) MUST be defined and merged
  before any feature work starts.
- Tooling/setup changes stay in `chore/000-sdd-tooling` (own branch, own commits) — never
  mixed with feature code.
- Feature branches: `feature/NNN-<slug>` based on `main`, merged only via PR + review +
  green gates.
- Feature `000-planning` is documentation only; it is reused by every feature.
- This document is a roadmap. Each feature still goes through the full SDD flow
  (`/speckit.specify` … `/speckit.converge`) before implementation.

## Features

| ID | Feature | Scope | Depends on | Est. tasks |
|----|---------|-------|-----------|------------|
| `001-toolchain`    | Biome lint/format, remove Prettier, `check`/`format`/`verify` scripts, tsconfig alignment | —      | 4-5 |
| `002-theme-foundation` | Tailwind v4 `@custom-variant dark`, theme tokens, pre-paint FOUC script in `index.html` | 001 | 3-4 |
| `003-theme-state`  | `@ngrx/signals` signalStore, `localStorage` storage (`lockr.theme`, validated, corrupt→system), OS-following, unit tests | 001 | 4-5 |
| `004-app-shell`    | App shell (header + accessible theme toggle), lazy routes Home/About, welcome screen, AXE + unit tests | 002+003 | 5-6 |
| `005-e2e-suite`    | Playwright config, `theme.spec.ts` (toggle/persistence/OS/navigation), AXE scan | 004 | 3-4 |

## Sequencing

1. Define constitution (`/speckit.constitution`) — prerequisite for everything.
2. Finalize `chore/000-sdd-tooling` (constitution + tooling) and merge to `main` via review.
3. `feature/001-toolchain` — no dependencies.
4. `feature/002-theme-foundation` — after 001.
5. `feature/003-theme-state` — after 001 (can run in parallel with 002).
6. `feature/004-app-shell` — after 002 + 003.
7. `feature/005-e2e-suite` — after 004.

## Rationale

- **Reviewability**: each PR is small; reviewers can reason about one concern at a time.
- **Reusability**: toolchain (001) and e2e (005) apply to every future feature.
- **Risk isolation**: a regression in theming (002) no longer blocks the state layer (003).
- **Traceability**: each feature maps 1:1 to its spec artifacts under `specs/<id>/*`.