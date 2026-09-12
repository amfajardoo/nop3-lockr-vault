# Plan: Dashboard Shell

**Feature**: [006-dashboard-shell](../006-dashboard-shell/spec.md)
**Input**: spec.md, research.md, data-model.md, checklists/requirements.md; 004 (`App`, `ThemeToggle`) and 005 (Playwright e2e) artifacts.
**Date**: 2026-09-11

## Goal

Replace the static 004 app shell with a living Dashboard layout: routing lands (lazy `loadComponent`), `App` becomes a thin `<router-outlet>` bootstrap, and the Dashboard component owns the chrome (header + theme toggle reused, primary nav, main workspace). No Home/About pages — the dashboard is the only screen and the future vault features (list, form, favorites, …) register as child routes inside its nested outlet. Mock data only; no vault storage or crypto.

## Constitution Conformance

- **Standalone components** — `Dashboard` is created standalone (v22 default; no `standalone: true` decorator flag).
- **Lazy `loadComponent`** — dashboard chunk split via `loadComponent` (AGENTS); no NgModules, no eager `component:`.
- **Signals** — nav items are a read-only typed constant (no mutable signal needed yet); brand `title` becomes a plain string in Dashboard; no local mutable state.
- **No `@HostBinding`/`@HostListener`** — no host decorators; all bindings in the component decorator or template.
- **Native control flow** — `@for` over nav items, `@if` for placeholder; no `ngClass`/`ngStyle`.
- **Token-only colors** — 002 contract; no literals (grep-auditable).
- **ProvidedAtRoot services** — `ThemeStore` untouched; `Dashboard` accesses it through the `ThemeToggle` import, not by injection.
- **Tests mandatory** — every US is test-first (Constitution: Automated Verifiability).
- **Review before commit** — commits only after user review.

## Proposed Structure

```
specs/
  006-dashboard-shell/
    spec.md, plan.md, tasks.md, research.md, data-model.md,
    quickstart.md, checklists/requirements.md
src/
  app/
    app.ts                    # Thin bootstrap: <router-outlet> only
    app.html                  # <router-outlet />
    app.css                   # unchanged (`:host { display: block }`)
    app.routes.ts             # '' → Dashboard (lazy), '**' → redirect ''
    app.spec.ts               # UPDATED: minimal bootstrap only
    app-tokens.spec.ts        # UNCHANGED (002 artifact; <main text-muted> removed; check if it breaks)
    dashboard/
      dashboard.ts            # Dashboard layout component
      dashboard.html          # header + nav + main(outlet)
      dashboard.css           # layout styles (token-only)
      dashboard.spec.ts       # US1+US2+US3: chrome render, nav, AXE, skip link, child outlet
      nav-items.ts            # NAV_ITEMS constant + NavItem type
  theme/                      # 002/003 artifacts UNCHANGED
```

## Strategy

1. **T001**: confirm green baseline on `main` (`pnpm verify`).
2. **T002**: write RED specs: `dashboard.spec.ts` (US1+US2+US3), update `app.spec.ts` to the new thin-bootstrap expectation.
3. **T003**: implement the thin `App` bootstrap (`app.html` = `<router-outlet />`, routes registered).
4. **T004**: implement `Dashboard` layout + `nav-items.ts`; GREEN all specs; confirm `app-tokens.spec.ts` still passes (002 contract check: `text-muted` was in the old `app.html` `<main>`; may need to move the assertion to `dashboard.html` or add it there).
5. **T005**: run `pnpm e2e` — confirm 005 theme flows still pass against the re-chromed app.
6. **T006**: polish gate — `pnpm verify`, color-literal grep on `src/app/**`, dist `index.html` pre-paint assertion, lazy dashboard chunk verification, `pnpm lint` clean.

## Dependencies & Sequencing

- `App` + `Dashboard` are independent of vault data (no 007 dependency yet).
- `ThemeToggle` is reused unchanged (004 artifact).
- 005 e2e suite must remain green; 006 owns the regression gate (SC-005).
- `app-tokens.spec.ts` (002) asserts `text-muted` in the old static `app.html` template; T003 must reconcile this (move the assertion to `dashboard.html` or remove the assertion if 002 never guaranteed the root text; decision: research D5 above).

## Deliverables

- Runnable `pnpm verify` green; unit specs (dashboard + app + tokens) passing; build output shows the 002 pre-paint script and a lazy dashboard chunk.
- 005 e2e theme flows green against the re-chromed app.