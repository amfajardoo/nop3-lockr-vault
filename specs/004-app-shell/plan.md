# Plan: App Shell

**Feature**: [004-app-shell](../004-app-shell/spec.md)
**Input**: spec.md, research.md, data-model.md, checklists/requirements.md; 002 (`theme-contract`,
`styles.css` tokens, `index.html`) and 003 (`theme.store.ts`) artifacts.
**Date**: 2026-09-06

## Goal

Ship the first real UI: a persistent, accessible shell (brand + nav + theme switcher) with
lazily-loaded Home/About routes, all token-styled, AXE-clean at the component level, with every
user story proven by automated tests first.

## Constitution Conformance

- **Standalone components** — `App` already is; `ThemeToggle`, `Home`, `About` are created
  standalone (v22 default; no `standalone: true` decorator flag).
- **Signals** — toggle reads `ThemeStore` signals; no local mutable state; `computed`/`input`/
  `output` per AGENTS; `RouterTestingHarness` for route specs.
- **No `@HostBinding`/`@HostListener`** — keyboard logic via template `(keydown)` and the
  `host` object; no decorators.
- **Native control flow** — `@if`/`@for` only; no `ngClass`/`ngStyle`.
- **Token-only colors** — 002 contract; no literals (grep-auditable).
- **No NgModules** — lazy via `loadComponent`.
- **ProvidedAtRoot services** — `ThemeStore` untouched; component access via `inject(ThemeStore)`.
- **Tests mandatory** — every US is test-first (constitution: Automated Verifiability); specs shown
  RED before implementation.
- **Review before commit** — commits only after user review; installs by user (axe-core).

## Proposed Structure

```
src/
  app/
    app.ts                  # Root shell: header (brand/nav/theme-toggle) + skip link + main[outlet]
    app.html
    app.css
    app.routes.ts           # typed Routes: "" -> lazy Home, "about" -> lazy About, "**" -> ""
    app.spec.ts             # US1: shell chrome render, nav, skip link, aria-current, AXE
    app-tokens.spec.ts      # 002 artifact, unchanged
    theme-toggle/
      theme-toggle.ts       # Radiogroup switcher over ThemeStore (US2)
      theme-toggle.html
      theme-toggle.spec.ts  # US2: options, selection, setChoice sync, keyboard, focus-safety, AXE
    home/
      home.ts               # Welcome screen (default route, US3)
      home.html
      home.spec.ts          # US2/US3 router coverage entry (lazy resolve + copy)
    about/
      about.ts              # About screen (US3)
      about.html
      about.spec.ts         # US3 router coverage entry
  theme/                    # 002/003 artifacts unchanged
```

## Strategy

1. T001: confirm green baseline on the branch (`pnpm verify`).
2. Write the router/lazy spec (US3) and the welcome/About screens, then the shell spec (US1) and
   the toggle spec (US2) — all REQUIRED to be RED before implementations.
3. User installs `axe-core` (devDependency) before the AXE-scanned specs run green.
4. Implement in dependency order: routes+Home+About → shell `App` → `ThemeToggle`.
5. Polish: full `pnpm verify`, chunk assertions on the build, token-color grep.

## Dependencies & Sequencing

- `axe-core` must be installed before T006 (AXE specs) turns GREEN; parallel-file tasks (T002/T004/
  T006) can be written independently.
- US3 (routes/Home/About) is implemented first because the shell's default route and nav need real
  targets; US1 depends on US3; US2 depends on nothing but the store (003, already merged).
- 005 owns e2e/visual AXE; 004 ships unit-level AXE only (see research D5).
- No changes under `src/theme/` or `src/index.html` in this feature (FR-010).

## Deliverables

- Runnable `pnpm verify` (biome + 160+ expected unit tests across suites + build) green on the
  branch; shell/toggle/route specs all passing; build shows separate Home/About chunks.