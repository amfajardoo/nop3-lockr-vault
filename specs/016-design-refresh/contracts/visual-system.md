# Contract: Visual System (016)

Presentation contract for the refreshed app. **Routing contract unchanged**
(`specs/009-*/contracts/navigation.md` + 014's `navigation.md` still govern); no route is
added, removed, or re-pointed by this feature.

## Page-header pattern (all four views)

```
<header class="page-header">
  <div class="page-header-text">
    <h1 …existing id/aria-labelledby…>Title</h1>   ← dominant, display font
    <p class="page-lede">Supporting copy</p>       ← optional, on-surface-variant
  </div>
  <div class="page-header-actions">…existing action controls…</div>
</header>
```

Invariants: existing heading ids and `aria-labelledby` references survive byte-identically;
action controls keep their text, hrefs, and `aria-*` attributes; the pattern is structural
(markup grouping), not a new component API.

## Surface hierarchy (light and dark)

| Level | Token | Used by |
| --- | --- | --- |
| Base | `--mat-sys-background` | page/body |
| Raised | `--mat-sys-surface-container` | toolbar, sidenav, chips |
| Card | `--mat-sys-surface-container-high` (or `surface` + outline) | form card, detail card, state cards |
| Interaction | hover → container-high/`outline-variant`; focus → Material focus ring | rows, buttons |

Dark mode: same token roles, values from `light-dark()` — background ≠ container ≠
card asserted distinct (SC-002).

## Breakpoint contract

| Query | Sidenav | Menu button | Content |
| --- | --- | --- | --- |
| `(min-width: 960px)` | `mode="side"`, opened | not rendered | max measure, centered, fills rail remainder |
| `< 960px` | `mode="over"`, closed (opens via button/scrim/Escape) | rendered, accessible name (e.g. "Toggle navigation"), `aria-expanded` follows state | full width, padding per scale |

Reflow: no horizontal scroll at 320px. Media listeners registered once, removed on destroy.

## Icon contract (FR-010 inventory)

| Location | Ligature | Notes |
| --- | --- | --- |
| Sidenav nav items | per `NavItem.icon` (start: `vault` for Overview) | icon `aria-hidden`, link name = label |
| Brand | `lock` | inside existing link to `/` |
| Search field | `search` | `matIconPrefix` — must not change label association (`label[for]`) |
| Favorites filter | `star_border` (or `filter_alt`) | button text + `aria-pressed` unchanged |
| Favorite toggle | `star` / `star_border` | `aria-label`/`aria-pressed` byte-identical to 009/015 specs |
| Delete | `delete` (replaces inline SVG) | `aria-label="Delete <name>"` unchanged |
| Empty state | `lock` (or `key`) | decorative; copy/CTA unchanged |
| No-results | `search_off` | decorative; reset button unchanged |
| Not-found (detail/form) | `help` | decorative; copy unchanged |

All icons: `aria-hidden="true"` (or `<mat-icon>` default decorative behavior with no
accessible-name contribution). **No spec-visible name may change** — SC-005 proves it by
running the 009/012/014/015 specs unchanged on those selectors.

## Accessibility contract (observable)

1. Contrast: every documented text pair ≥ 4.5:1, non-text ≥ 3:1, both schemes (spec suite).
2. Focus: Material focus indicator visible on all interactive elements; hover effects have
   focus-visible parity.
3. Motion: transitions only under `prefers-reduced-motion: no-preference`.
4. State cards and page headers keep semantic headings/labels; icons add no spoken noise
   (`aria-hidden`).
5. Skip link, `aria-current="page"`, `aria-live` result count, dialog semantics: unchanged.

## Non-goals

- No new routes/components as APIs, no copy overhaul, no density change (stays 0),
  no dependency additions, no icon-per-everything beyond the inventory,
  no changes to form/dialog/store behavior, no roadmap edit.
