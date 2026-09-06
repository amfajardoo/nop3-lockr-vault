# Data Model: Theme Foundation

**Feature**: [002-theme-foundation](../002-theme-foundation/spec.md)

**Contract**: [theme-choice.schema.json](./contracts/theme-choice.schema.json)

## Entities

### ThemeChoice (stored preference)

The raw persisted value the boot script reads. Owned (written) by feature 003; feature 002 reads it
defensively and never writes or mutates it.

| Field  | Type   | Constraints                                          | Notes                                      |
|--------|--------|------------------------------------------------------|--------------------------------------------|
| value  | string | `enum: ["light", "dark", "system"]` (JSON Schema)    | Storage key: `lockr.theme` (plain device storage, non-sensitive) |

Resolution at boot:
- `light` → light palette
- `dark` → dark palette
- `system` → OS preference (`prefers-color-scheme: dark`)
- missing / malformed / invalid value → OS preference (never throws, never blocks first paint)

### EffectiveTheme (resolved palette)

Internal resolved outcome of boot resolution.

| Value   | Meaning                          |
|---------|----------------------------------|
| `light` | root element does NOT carry `dark` |
| `dark`  | root element carries `dark`        |

### RootThemeMarker

The class on the document root selecting the effective palette (FR-001).

| State          | Marker present | `color-scheme` | Palette            |
|----------------|----------------|----------------|--------------------|
| Light theme    | no             | `light`        | `:root` token values |
| Dark theme     | yes (`dark`)   | `dark`         | `.dark` token values |

### SemanticTokens

Single source of truth for colors (FR-002). Raw CSS variables live on `:root` (light) and are
overridden in `.dark`; each is mapped into a Tailwind utility via `@theme inline` (see
[research.md](./research.md#d2---two-layer-semantic-tokens) and
[research.md](./research.md#d6---palette-navy--indigo-trust)). Palette direction: **navy + indigo
"Trust & Precision"** — blue-tinted slate neutrals (tinted per the brand hue rule) with an indigo
interactive accent; designed as a security/trust product (dark-navy surfaces for long sessions).

| Token (raw var)  | Tailwind utility               | Role                                                        | Light         | Dark         | AA invariant pair                                  |
|------------------|--------------------------------|-------------------------------------------------------------|---------------|--------------|----------------------------------------------------|
| `--surface`      | `bg-surface` / `text-surface`  | Default canvas; `.dark` also sets `color-scheme: dark`      | `#ffffff`     | `#0f172a`    | vs `foreground` / `muted` (≥ 4.5:1)                |
| `--surface-raised`| `bg-surface-raised`           | Elevated panels (cards, modals); elevation via lighter fill in dark | `#f1f5f9` | `#1e293b`   | vs `foreground` / `muted` (≥ 4.5:1)                |
| `--foreground`   | `text-foreground`              | Primary text / headings (near-black, not pure black)        | `#0f172a`     | `#f1f5f9`    | vs `surface` (18.9:1 / 15.4:1, AAA)                |
| `--muted`        | `text-muted`                   | Secondary text, captions, metadata (≥ 4.5:1 enforced)       | `#475569`     | `#94a3b8`    | vs `surface` (5.9:1 / 5.2:1, AA)                   |
| `--accent`       | `text-accent` / `bg-accent` / `ring-accent` | Interactive/brand: links, CTAs, active states, focus ring | `#2563eb` | `#818cf8` | as text vs `surface` (4.5:1 / 4.7:1, AA)           |
| `--on-accent`    | `text-on-accent`               | Foreground drawn ON solid `accent` fill                     | `#ffffff`     | `#0f172a`    | vs solid `accent` (5.1:1 / ~8:1, AA)               |
| `--line`         | `border-line`                  | AA borders: form fields, controls, focus outline (≥ 3:1)    | `#64748b`     | `#64748b`    | vs `surface` (4.6:1 / 3.5:1, non-text ≥ 3:1)       |
| `--line-subtle`  | `border-line-subtle`           | Decorative dividers (no AA requirement)                     | `#e2e8f0`     | `#334155`    | —                                                   |
| `--success`      | `text-success`/`bg-success`    | Confirmation / positive metrics                             | `#15803d`     | `#4ade80`    | vs `surface` (≥ 4.5:1)                             |
| `--warning`      | `text-warning`/`bg-warning`    | Alerts, caution                                             | `#b45309`     | `#fbbf24`    | vs `surface` (≥ 4.5:1)                             |
| `--error`        | `text-error`/`bg-error`        | Destructive / errors                                        | `#b91c1c`     | `#f87171`    | vs `surface` (≥ 4.5:1)                             |
| `--info`         | `text-info`/`bg-info`          | Neutral notifications                                       | `#1d4ed8`     | `#a5b4fc`    | vs `surface` (≥ 4.5:1)                             |

Hover variants of `--accent`: light mode darkens 10-15% (`#1d4ed8`); dark mode LIGHTENS (`#a5b4fc`)
— dark mode is not an inversion, and must always pass AA against its background. Semantic states
(success/warning/error/info) are never communicated by color alone: always paired with an icon or
label (color-vision-deficiency safe).

The contrast test (research D4) enforces the AA invariants; the token roles and these values are the
stable contract, and any future adjustment keeps the same structure.

**Validation rules** (from spec requirements):
- FR-002: every scaffold surface references these tokens only; no literal colors outside
  `:root`/`.dark` in the code under scope.
- FR-005: text pairings ≥ 4.5:1; non-text (border, focus ring) ≥ 3:1; both palettes.
- FR-006: resolution and rendering require no network (all tokens are static CSS).

## State transitions

```
[ boot ] -> resolveInitialTheme(stored: unknown, systemDark: boolean) -> EffectiveTheme
              -> apply/remove RootThemeMarker (before first paint)        -> [ first frame ]
```

No later mutation occurs in this feature; runtime toggling/re-persistence is feature 003. The
marker-palette correspondence (apply/remove → palette switch) is validated in this feature, but
*who* triggers it at runtime is 003's scope.