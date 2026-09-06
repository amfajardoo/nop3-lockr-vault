# Data Model: Theme State

**Feature**: [003-theme-state](../003-theme-state/spec.md)

**Contracts**: [theme-choice.schema.json](../../002-theme-foundation/contracts/theme-choice.schema.json)
(external, 002) · [theme-state.schema.json](./contracts/theme-state.schema.json) (this feature)

## Entities

### ThemeChoice (stored preference — contract owned by 002)

The raw persisted value under `localStorage["lockr.theme"]`. Read at runtime by this feature's
store; written EXCLUSIVELY by this feature's store (FR-002). The 002 pre-paint script reads it only
defensively at boot.

| Field  | Type   | Constraints                                          | Notes                                      |
|--------|--------|------------------------------------------------------|--------------------------------------------|
| value  | string | `enum: ["light", "dark", "system"]` (JSON Schema)    | Plain string, no JSON wrapper; non-sensitive preference |

### ThemeState (store state)

The signalStore state exposed by the theme state layer. Persisted value is only `choice`;
`effective` is derived and never persisted.

| Field      | Type   | Constraints                        | Notes                                                     |
|------------|--------|------------------------------------|-----------------------------------------------------------|
| choice     | string | `enum: ["light", "dark", "system"]`| Explicit user choice, or `system` for absent/invalid       |
| effective  | string | `enum: ["light", "dark"]`           | Resolved palette; derived, not stored serialized           |

Public API (feature 004 consumes this):

- `choice` (signal) — current choice
- `effective` (signal, computed) — resolved palette
- `setChoice(choice: ThemeChoice): void` — validate → set `choice` → write storage → apply/remove
  root marker (single atomic action, FR-003)
- boot (`ngrxOnInit`) — read + validate stored value; never write; derive effective

### EffectiveTheme (resolved palette)

| Value   | Meaning                          |
|---------|----------------------------------|
| `light` | root element does NOT carry `dark` |
| `dark`  | root element carries `dark`        |

Resolution rules (reuse `resolveEffectiveTheme` from 002 `theme-contract.ts`):

- `light` → light; `dark` → dark; `system` → live OS preference; missing/invalid/throwing → OS
  preference (never throws, never crashes, never re-persisted at boot)

### RootThemeMarker

The runtime `dark` class on `document.documentElement` selecting the effective palette.

| State          | Marker present | Palette            |
|----------------|----------------|--------------------|
| Light theme    | no             | `:root` token values |
| Dark theme     | yes (`dark`)   | `.dark` token values |

Single writer post-boot: the store (via `setChoice` and the OS listener path). Single applier
before first paint: the 002 pre-paint script (unchanged).

## State transitions

```
[ init ] ngrxOnInit:
  stored = localStorage.getItem("lockr.theme")            -- read-only, zero-trust
  choice = validate(stored) || "system"                   -- never writes; corrupt preserved
  effective = resolveEffectiveTheme(choice, systemDark)   -- live query at init
                   | observable via matchMedia when choice === "system"

[ user action ] setChoice(candidate):
  validate(candidate) -> if not in enum: NO-OP, no write
  choice = candidate
  localStorage.setItem("lockr.theme", candidate)          -- the only storage write path
  effective = candidate (or systemDark if "system")
  apply/remove root `dark` class                          -- the only runtime class mutation path

[ OS change ] on matchMedia change (choice === "system"):
  effective = new systemDark
  apply/remove root `dark` class                          -- no storage write (FR-005)

[ boot reconcile ] after Angular bootstrap:
  reflect effective to the root marker ONLY if it differs from what the 002 script applied
  (no spurious writes; FR-006/SC-004).
```

## Validation rules (from spec requirements)

- FR-002/FR-003: every runtime write of `lockr.theme` and every runtime root-class mutation goes
  through the store; nothing else touches them.
- FR-004/SC-004: invalid/throwing storage resolved to `system`, never crashing, never overwritten by
  the boot path.
- FR-005/SC-002/SC-003: `system` choice keeps the OS listener live; explicit choices ignore OS
  changes with zero writes.