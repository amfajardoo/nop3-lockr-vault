# Data Model: Expressive Design Refresh (016)

No entities, schemas, or store changes (`src/vault/` untouched). This feature's "model" is
the token/state surface it adds.

## Token layer (replaces the parallel slate palette)

### Color (single source: Material system tokens)

| Role | Source | Notes |
| --- | --- | --- |
| Background / surfaces | `--mat-sys-background`, `--mat-sys-surface`, `--mat-sys-surface-container{,-high,-highest}` | body + shell + cards; kills the `#ffffff` vs `#faf8ff` seam (research D2) |
| Text | `--mat-sys-on-surface`, `--mat-sys-on-surface-variant` | |
| Brand primary | `--mat-sys-primary` (+ container/on-container) | existing blue palette |
| Brand accent | `--mat-sys-tertiary` (+ container) | existing purple palette, newly activated (D8) |
| Lines | `--mat-sys-outline`, `--mat-sys-outline-variant` | hover/borders ≥ 3:1 |
| Semantic extensions | `--success`, `--warning` (kept from `styles.css`) | Material has no equivalents; documented + contrast-tested (FR-003/004). `--error` uses `--mat-sys-error` |
| Removed | `--surface`, `--surface-raised`, `--foreground`, `--muted`, `--accent`, `--on-accent`, `--line`, `--line-subtle`, `--info`, and their `.dark` overrides | superseded; `.dark` keeps only `color-scheme` + any extension re-derivation |

### Type (overridden roles)

| Role | Token overridden in `styles.css` | Font |
| --- | --- | --- |
| Display / headline / page titles | `--mat-sys-display-*-font`, `--mat-sys-headline-*-font` | display font (Space Grotesk, inferred) + fallback stack |
| Body / label / title / data | `--mat-sys-body-*-font`, `--mat-sys-label-*-font`, `--mat-sys-title-*-font` | Roboto (unchanged, spec-asserted) |

### Spacing scale

`--space-1..7` = 4 / 8 / 12 / 16 / 24 / 32 / 48 px (documented in `styles.css`, used by shell
and component stylesheets; asserted by token spec SC-004).

## Shell responsive state (component-local, no store)

| Signal | Type | Derivation | Consumed by |
| --- | --- | --- | --- |
| `wide` | `signal<boolean>` | `MediaMatcher.matchMedia("(min-width: 960px)").matches` + `change` listener, cleaned up on destroy | `[mode]` (`side`/`over`), menu-button rendering, `opened` initial/reset |
| sidenav `opened` (template ref) | Material state | starts `wide()`; resets to open when crossing wide | overlay behavior in narrow mode |

Test seam: CDK `MediaMatcher` provider stub (existing `media-matcher-stub.ts` pattern;
wide/narrow driver added in `src/testing/` if needed).

## Structural metadata

| Entity | Change | Semantics preserved |
| --- | --- | --- |
| `NavItem` (`dashboard/nav-items.ts`) | + `icon: string` (Material ligature name) | `label`, `route`, `ariaCurrentWhenActive`, active styling |
| Page-header pattern | title + lede + actions slot markup shared by 4 views | existing heading ids/`aria-labelledby`, link/button names, harness selectors |
| Icon inventory (FR-010) | fixed map location → ligature: nav (e.g. `vault`), brand (`lock`), search prefix (`search`), filter (`star_border`), favorite (`star`/`star_border`), delete (`delete`), empty (`lock`/`key`), no-results (`search_off`), not-found (`help`) | every icon `aria-hidden`; no accessible-name deltas |

## Explicitly unchanged

- `VaultStore` state/methods; `Credential` schema; routes; dialog/form logic; theme store +
  pre-paint single-writer flow; `contrast.ts` utility (only its spec's documented pairs).
