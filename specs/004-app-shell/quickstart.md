# Quickstart: App Shell

**Feature**: [004-app-shell](../004-app-shell/spec.md)

## Prerequisites

- 002 + 003 merged to `main` (theme tokens + `ThemeStore` available).
- `axe-core` installed as a devDependency (user installs it, per policy) for the AXE-scanned specs.

## Commands

| Command | Purpose |
|---------|---------|
| `pnpm verify` | Full gate: `biome ci . && pnpm test && pnpm build` |
| `pnpm test` | Vitest unit suite (shell, toggle, theme suites from 002/003) |
| `pnpm lint` | Biome lint check |
| `pnpm start` | Dev server for manual checks |

## Manual Checks (after `pnpm start`)

1. Open `http://localhost:4200/` — the shell renders inside the app root: persistent header with
   the **Lockr Vault** brand and the theme switcher; no navigation links or pages yet (routes are
   deferred with the pages feature).
2. Toggle each theme: click **Dark** — page repaints dark; the toggle reflects the chosen option;
   `localStorage["lockr.theme"]` = `"dark"`. Reload — dark is preserved from the first paint (FOUC
   prove: no light flash).
3. Keyboard: Tab to the switcher (System selected at first boot), press ArrowRight — **Dark**
   becomes selected and applied immediately; ArrowRight again — **System**; Home/End jump to first/
   last. Focus rings are visible on every focusable element.
4. OS-follow: select **System**, toggle the OS/browser `prefers-color-scheme` emulation — theme
   flips live; focus stays on the switcher.
5. Skip link: press Tab once from a fresh load — "Skip to content" appears and jumps to the main
   content.

## AXE (component-level)

`pnpm test` runs `axe-core` scans on the rendered shell and the toggle and fails on serious/
critical violations (`color-contrast` may report incomplete in jsdom — that is expected and covered
by 002's contrast unit tests; real-browser AXE is feature 005's Playwright run).