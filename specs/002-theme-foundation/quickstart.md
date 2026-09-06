# Quickstart: Theme Foundation

**Feature**: [002-theme-foundation](../002-theme-foundation/spec.md)

**Contract**: [theme-choice.schema.json](./contracts/theme-choice.schema.json) · **Data**:
[data-model.md](./data-model.md)

This is a validation/run guide for the theme foundation. It does not replace the tests; behavior is
governed by the spec and enforced by the actual test suite (see `tasks.md`).

## Prerequisites

- Node via the repo toolchain; `pnpm install` already done.
- Branch: `feature/002-theme-foundation` (from `main`).

## Gates

Run from repo root:

```text
pnpm lint
pnpm verify     # = biome ci . && pnpm test && pnpm build
```

Expected: all green (exit code 0), spec coverage 100% of the acceptance scenarios, line coverage
> 90%.

## What to validate

The foundation must satisfy the spec's user stories. The quick manual checks below can be run with
`pnpm start` (dev server) or on the built output; automated equivalents live in the test suite.

### 1. No flash of the wrong theme (SC-001, FR-003)

- Open the app in a browser devtools session with **Emulate CSS prefers-color-scheme: dark** forced
  and no stored value: the very first painted frame is dark, with no light flash.
- Store `lockr.theme = "light"` in localStorage while OS/emulation is dark, then reload: the first
  frame is light (stored choice wins over OS).
- Store an invalid value (`lockr.theme = "bogus"`) and reload: falls back to the OS preference,
  renders normally, no console errors.

### 2. One marker switches every surface (SC-002, FR-001)

- With the app running, toggle the `dark` class on `<html>` via devtools. All scaffold surfaces
  (page background, headings, paragraphs, pills, social icons, divider) switch palette through the
  shared tokens; no per-component style changes are needed. Removing the class restores light.

### 3. Single source of truth (US3, FR-002, FR-005)

- Inspect built CSS: utilities reference the token variables (`--surface`, `--foreground`,
  `--muted`, `--accent`, `--line`, ...) mapped via `@theme inline`; literal colors exist only
  inside `:root`/`.dark`.
- The token regression test asserts every normal-text pairing ≥ 4.5:1 and non-text ≥ 3:1 in both
  palettes, so no manual contrast math is required here.

### 4. Offline (FR-006)

- Disable the network in devtools, reload: theme resolves and renders with no requests; palette
  tokens are static CSS.

## Resolution rules (contract reminder)

Stored value (key `lockr.theme`) → `light` | `dark` | `system` | missing/invalid:
- `light` → light palette; `dark` → dark palette; everything else → OS `prefers-color-scheme`.

## Expected outcomes

- `pnpm verify` green; `pnpm lint` green.
- Spec coverage 100%; line coverage > 90% (see `coverage/`).
- The 002 implementation touches: `src/styles.css`, `src/index.html`, the scaffold component using
  tokens, and the test files that enforce D3/D4. Feature 003 adds the state/toggle layer on top.