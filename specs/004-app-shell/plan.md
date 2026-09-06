# Plan: App Shell

**Feature**: [004-app-shell](../004-app-shell/spec.md)
**Input**: spec.md, research.md, data-model.md, checklists/requirements.md; 002 (`theme-contract`,
`styles.css` tokens, `index.html`) and 003 (`theme.store.ts`) artifacts.
**Date**: 2026-09-06

## Goal

Ship the first real UI: a persistent, accessible shell (brand + theme switcher + skip link + main
outlet) on top of the 002 tokens and the 003 `ThemeStore`. Routes and pages are deliberately out of
scope — `app.routes.ts` stays empty and Home/About arrive with their own feature (spec revision
2026-09-06).

## Constitution Conformance

- **Standalone components** — `App` already is; `ThemeToggle` is created standalone (v22 default;
  no `standalone: true` decorator flag).
- **Signals** — toggle reads `ThemeStore` signals; no local mutable state; `computed`/`input`/
  `output` per AGENTS.
- **No `@HostBinding`/`@HostListener`** — keyboard logic via template `(keydown)`, no decorators.
- **Native control flow** — `@if`/`@for` only; no `ngClass`/`ngStyle`.
- **Token-only colors** — 002 contract; no literals (grep-auditable).
- **No NgModules** — no modules anywhere; routes stay empty for 004.
- **ProvidedAtRoot services** — `ThemeStore` untouched; component access via `inject(ThemeStore)`.
- **Tests mandatory** — every US is test-first (constitution: Automated Verifiability); specs shown
  RED before implementation.
- **Review before commit** — commits only after user review; installs by user (axe-core).

## Proposed Structure

```
src/
  app/
    app.ts                  # Root shell: header (brand/theme-toggle) + skip link + main[outlet]
    app.html
    app.css
    app.routes.ts           # typed Routes = [] (pages/routes deferred)
    app.spec.ts             # US1: shell chrome render, brand, skip link, AXE
    app-tokens.spec.ts      # 002 artifact, unchanged
    theme-toggle/
      theme-toggle.ts       # Native-radio radiogroup switcher over ThemeStore (US2)
      theme-toggle.html
      theme-toggle.spec.ts  # US2: options, selection, setChoice sync, keyboard, focus-safety, AXE
  theme/                    # 002/003 artifacts unchanged
```

## Strategy

1. T001: confirm green baseline on the branch (`pnpm verify`).
2. Write the toggle spec (US2) and the shell spec (US1) — both REQUIRED to be RED before their
   implementations.
3. User installs `axe-core` (devDependency) before the AXE-scanned specs run green.
4. Implement `App` shell, then `ThemeToggle`.
5. Polish: full `pnpm verify`, token-color grep, pre-paint assertion on the build output.

## Dependencies & Sequencing

- `axe-core` must be installed before T006 (AXE specs) turns GREEN; the two spec files (T004/T006)
  can be written independently.
- The shell's `App` and the toggle are independent of any routes (none exist); the toggle depends on
  003's merged `ThemeStore` only.
- 005 owns e2e/visual AXE; 004 ships unit-level AXE only (see research D5).
- No changes under `src/theme/` or `src/index.html` in this feature (FR-010).

## Deliverables

- Runnable `pnpm verify` (biome + full unit suite across suites + build) green on the branch;
  shell/toggle specs passing; build output keeps the 002 pre-paint script and shows no page chunks.