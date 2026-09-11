# Quickstart: Dashboard Shell

**Feature**: [006-dashboard-shell](../006-dashboard-shell/spec.md)

## Prerequisites

- 004 + 005 merged to `main` (app shell + Playwright e2e).
- `pnpm install` up to date (lockfile).

## Commands

| Command | Purpose |
|---------|---------|
| `pnpm verify` | Full gate: `biome ci . && pnpm test && pnpm build` |
| `pnpm test` | Vitest unit suite (dashboard, app bootstrap, 002/003/004 suites) |
| `pnpm e2e` | Playwright e2e (005 theme flows — must stay green after the re-chrome) |
| `pnpm lint` | Biome lint check |
| `pnpm start` | Dev server for manual checks |

## Manual Checks (after `pnpm start`)

1. Open `http://localhost:4200/` — the app boots into the **Dashboard**: header with the
   **Lockr Vault** brand and the theme switcher, a primary **Main** nav with one **Overview**
   item, and a main workspace showing the "Dashboard" heading and the empty-state hint.
2. Navigate to an unknown URL (`http://localhost:4200/whatever`) — the wildcard `'**'` redirect
   lands you back on the dashboard.
3. Tab navigation: the skip link is the first focusable element and jumps to the main workspace;
   nav links show visible focus rings; the active **Overview** item carries `aria-current="page"`.
4. Theme toggle still works from the dashboard header (Dark persists on reload, OS-follow works).
5. Confirm there is no light flash on first paint (002 pre-paint script intact).

## AXE (component-level)

`pnpm test` runs `axe-core` scans on the rendered dashboard (and its nav) and fails on serious/
critical violations. `color-contrast` may report incomplete in jsdom — that is expected and
covered by 002's contrast unit tests; real-browser AXE is feature 005's Playwright run.