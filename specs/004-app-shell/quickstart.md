# Quickstart: App Shell

**Feature**: [004-app-shell](../004-app-shell/spec.md)

## Prerequisites

- 002 + 003 merged to `main` (theme tokens + `ThemeStore` available).
- `axe-core` installed as a devDependency (user installs it, per policy) for the AXE-scanned specs.

## Commands

| Command | Purpose |
|---------|---------|
| `pnpm verify` | Full gate: `biome ci . && pnpm test && pnpm build` |
| `pnpm test` | Vitest unit suite (shell, toggle, routes, theme suites from 002/003) |
| `pnpm lint` | Biome lint check |
| `pnpm start` | Dev server for manual checks |

## Manual Checks (after `pnpm start`)

1. Open `http://localhost:4200/` — welcome screen (`Welcome to Lockr Vault`) inside the shell;
   header shows brand, Home/About links and the theme switcher.
2. Toggle each theme: click **Dark** — page repaints dark; the toggle reflects the chosen option;
   `localStorage["lockr.theme"]` = `"dark"`. Reload — dark is preserved from the first paint (FOUC
   prove: no light flash).
3. Keyboard: Tab to the switcher (System selected at first boot), press ArrowRight — **Dark**
   becomes selected and applied immediately; ArrowRight again — **System**; Home/End jump to first/
   last. Focus rings are visible on every focusable element.
4. OS-follow: select **System**, toggle the OS/browser `prefers-color-scheme` emulation — theme
   flips live; focus stays on the switcher.
5. Navigate Home ↔ About — header persists, no full-page reload; the active link has
   `aria-current="page"`. Deep-link `http://localhost:4200/about` works on cold boot.
6. Type `http://localhost:4200/nonexistent` — redirected back to the welcome screen.
7. Skip link: press Tab once from a fresh load — "Skip to content" appears and jumps to the main
   content.

## AXE (component-level)

`pnpm test` runs `axe-core` scans on the rendered shell and the toggle and fails on serious/
critical violations (`color-contrast` may report incomplete in jsdom — that is expected and covered
by 002's contrast unit tests; real-browser AXE is feature 005's Playwright run).