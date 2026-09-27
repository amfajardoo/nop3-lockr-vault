# Research: Expressive Design Refresh (016)

Spikes resolved against the pinned local dependencies and compiled theme output
(`@angular/material@22.1.6`, `dist/**/styles-*.css`), no network required.

## D1 — How to be expressive without leaving Material 3

**Decision**: expressiveness through Material's own extension points: theme color slots
(primary + tertiary), overridden type tokens, surface/elevation layering, and iconography.

**Rejected**:
- *Bespoke component restyling* (hand-written looks per component): fights Material updates,
  breaks Gate VI (abstraction over Material), unmaintainable.
- *New CSS framework / Tailwind*: dropped in 013 per AGENTS.md; reintroducing it is a
  process change, not a design choice.
- *Custom component library*: out of scope and constitution-hostile.

**Evidence**: the compiled theme already ships rich palettes (primary blue #2563eb scale +
tertiary purple scale in `_theme-colors.scss`) — the app simply under-uses them (tertiary is
never referenced by component CSS).

## D2 — Unify the color layer (fix the seam)

**Decision**: `styles.css` body colors derive from Material system tokens
(`--mat-sys-background`, `--mat-sys-on-surface`, …); the parallel slate palette
(`--surface/--foreground/--muted/--accent/--line…`) is removed or reduced to documented
semantic extensions that Material does not provide (`--success`, `--warning` only).

**Evidence of the defect**: `styles.css` paints `#ffffff`/`#0f172a` while the compiled theme
renders `--mat-sys-background: light-dark(#faf8ff, #11131b)` — tinted surfaces against a pure
body color = visible seam.

**Consequence**: `src/theme/contrast.spec.ts` currently asserts the old slate pairs; its
documented pairs are updated to the unified tokens in the same change (FR-004), utility
`contrast.ts` untouched.

## D3 — Responsive sidenav: CDK MediaMatcher + signal

**Decision**: `Dashboard` injects CDK `MediaMatcher`, creates a `wide` signal from
`matchMedia("(min-width: 960px)")`, listens to `change`, cleans up via `DestroyRef`; the
template binds `[mode]` (`side` when wide, `over` when narrow) and conditionally renders a
menu button (narrow only); sidenav `opened` starts `wide()` and resets when crossing to wide.

**Why CDK not raw `window.matchMedia`**: `src/testing/media-matcher-stub.ts` already
providers a stub for `MediaMatcher` (currently used for reduced-motion) — the responsive path
becomes unit-testable with the existing toolkit; raw `window.matchMedia` would need a
different global-mock and is harder to drive per-breakpoint.

**Rejected**: `BreakpointObserver` (LayoutModule) — heavier subscription API for one
breakpoint; CSS-only hiding (cannot switch `mode` or manage `opened` semantics).

**Breakpoint**: `(min-width: 960px)` — Material's conventional large-window line for
persistent navigation; spec marks it inferred/reviewable.

## D4 — Display font via overridden type tokens (spike result)

**Spike**: the compiled `mat.theme()` output emits full font shorthands per role:
`--mat-sys-display-large-font`, `--mat-sys-headline-small-font`, `--mat-sys-body-medium-font`,
`--mat-sys-title-*`, `--mat-sys-label-*` (verified in `dist` styles).

**Decision**: load one display font (Space Grotesk, Google Fonts — same pattern as Roboto in
`index.html`) and override only the display/headline-role `--mat-sys-*-font` tokens in
`styles.css` with a fallback stack; body/label/title roles keep Roboto.

**Rejected**: regenerating the theme with a different `typography` slot (only standard
families); per-component `font-family` rules (duplicates, drifts).

**Risk**: ligature/icon and body text must never pick up the display font — enforced by
token-role targeting + a spec asserting body roles still contain `Roboto`.

## D5 — Iconography: MatIconModule + the already-loaded font

**Evidence**: `index.html` loads `Material+Icons` and `<link rel=preconnect>`, yet no
`<mat-icon>` exists anywhere (`MatIconModule` is never imported); only an inline delete SVG
and unicode stars exist.

**Decision**: import `MatIconModule` where used, ligature icons per the FR-010 inventory;
replace the row delete SVG with `<mat-icon>delete</mat-icon>` and unicode stars with
`mat-icon` star glyphs, keeping every `aria-label`/`aria-pressed`/selector byte-identical.

**Testing note**: no `@angular/material/icon/testing` harness ships in this build (verified:
package has no `testing` entry) → icon assertions use DOM queries (`mat-icon` text), which is
allowed when no harness path exists; button/link names stay harness-asserted.

**Rejected**: SVG sprite / third-party icon package (new dependency), `NgOptimizedImage`
irrelevant here (icons are font glyphs).

## D6 — Spacing scale

**Decision**: define a small `--space-*` scale (4/8/12/16/24/32/48px) once in `styles.css`
and use it in shell + component CSS.

**Why custom props, not only literals**: a named scale is spec-assertable (SC-004) and stops
magic-number drift; note `app-tokens.spec.ts`'s purity check only inspects `--mat-*`
references and literal colors, so `--space-*` does not trip it (verified against the spec
source). `--mat-sys-spacing-*` remains off-limits (not emitted — existing spec guard).

## D7 — Hover/focus and motion

**Decision**: hover = token-driven surface/outline change (`--mat-sys-surface-container-highest`
etc. + `--mat-sys-outline-variant`); focus = Material's built-in focus indicator (no custom
outlines); transitions gated by `prefers-reduced-motion: no-preference`.

**Rejected**: custom `:focus-visible` rings (reimplements Material), hover-only affordances
without focus parity (fails FR-002/III).

## D8 — Decorative accents

**Decision**: brand accents (tertiary color on brand mark, active nav, small decorative
elements) use existing tertiary tokens; any decorative DOM is `aria-hidden` and carries no
information (IV: color/ornament never sole carrier of meaning).

## D9 — What existing specs will feel the change

Inventory of selectors that MUST survive (or be intent-preservingly updated):

- `app-tokens.spec.ts`: dashboard.html/css purity, `{{ title }}`, no literal colors,
  exercises surface/on-surface/primary/outline-variant — new dashboard CSS must stay
  token-only.
- 009/015 list specs: `[data-search]`, `[data-favorites-filter]`, `[data-favorite]`,
  `[data-no-results]`, `[data-empty-state]`, `[data-result-count]`, `mat-label` label
  association, `Delete <name>` / `Add|Remove <name> to favorites` labels, button counts
  (2× "Add credential" on empty).
- 012 dialog, 014 form (route + field) specs: untouched unless headers move their h1s —
  check `credential-detail-heading`-style ids before moving.
- Theme specs: `index.html` pre-paint, single-writer, tokens — untouched by design.

**Decision**: run the suite after each phase; structural template moves update specs only
where the selector's meaning (not location) changed, documented in tasks.md per FR-011.

## D10 — Palette regeneration: only if needed

**Decision**: keep the generated `_theme-colors.scss` palettes (blue primary + purple
tertiary already expressive) and activate tertiary through usage (D8). Regeneration via
`ng generate @angular/material:theme-color --primary-color=…` is the fallback if review says
the blue itself is too tame — it is a one-command change plus contrast-suite updates, kept
out of the default plan to limit blast radius (palette regen touches every Material component
simultaneously).
