# Quickstart: Theme State

**Feature**: [003-theme-state](../003-theme-state/spec.md)

**Contracts**: [theme-state.schema.json](./contracts/theme-state.schema.json) · **Data**:
[data-model.md](./data-model.md) · **External**: [theme-choice.schema.json](../../002-theme-foundation/contracts/theme-choice.schema.json)

This is a validation/run guide for the theme-state layer. It does not replace the tests; behavior is
governed by the spec and enforced by the actual test suite (see `tasks.md`).

## Prerequisites

- Node via the repo toolchain; `pnpm install` already done.
- Branch: `feature/003-theme-state` (from `main`, after 002 landed).
- New runtime dependency `@ngrx/signals` is installed by the developer (per the feature's stated
  policy) before running the store implementation.

## Gates

Run from repo root:

```text
pnpm lint
pnpm verify     # = biome ci . && pnpm test && pnpm build
```

Expected: all green (exit code 0), spec coverage 100% of the acceptance scenarios, line coverage
> 90%.

## What to validate

The state layer must satisfy the spec's user stories. Debugging the store without UI (004 owns the
toggle) is done from the dev console:

```js
// expose goes through Angular; in the running app use the DI token via debug tools,
// or rely on the unit tests which instantiate the real store.
```

### 1. Stored choice survives reloads (SC-001, FR-001/FR-003)

- With the dev server running, set `localStorage["lockr.theme"] = "dark"`, reload: the 002 pre-paint
  script paints dark on the first frame, and the store initializes with `choice = "dark"` and
  `effective = "dark"` (assertable via the store's signals in tests).
- Set it back to `"light"` and reload: light, consistent.

### 2. Live OS-following with `system` (SC-002, FR-005)

- With `localStorage["lockr.theme"] = "system"`, use devtools **Emulate CSS prefers-color-scheme**
  to flip the OS preference: the palette repaints live (root class flips), no reload needed, and
  `localStorage["lockr.theme"]` stays `"system"` (no spurious write).

### 3. Explicit choice ignores the OS (SC-003, FR-005)

- With a stored explicit `"dark"` while emulation is light: the theme stays dark when emulation
  flips, and the storage value is never rewritten on OS changes.

### 4. Corrupt storage never breaks boot (SC-004, FR-004)

- Store `localStorage["lockr.theme"] = "bogus"` (or a JSON-wrapped/empty value), reload: the app
  boots normally, resolves to the OS preference, no console errors, and the stored invalid value
  stays untouched.

### 5. No FOUC regression (FR-006, SC-005)

- The built `dist/.../browser/index.html` still has the 002 pre-paint script as the first child of
  `<head>`; first-frame theming behavior is unchanged from 002.

## Resolution rules (contract reminder)

Stored value (key `lockr.theme`) → `light` | `dark` | `system` | missing/invalid:
- `light` → light palette; `dark` → dark palette; `system`/missing/invalid → live OS preference.

## Expected outcomes

- `pnpm verify` green; `pnpm lint` green.
- Spec coverage 100%; line coverage > 90%.
- The 003 implementation touches: `src/theme/theme.store.ts` + its spec, plus reuse of
  `src/theme/theme-contract.ts`. `src/index.html`, `src/styles.css`, and the 002 contract are
  untouched. Feature 004 adds the shell/toggle on top of this store.