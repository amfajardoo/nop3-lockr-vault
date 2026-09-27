# Implementation Plan: Expressive Design Refresh (016)

**Feature**: `specs/016-design-refresh/` — spec: `spec.md`

**Branch**: `feature/016-design-refresh`

## Why

**Stated** (author questionnaire): the app "está muy fea" — all five pain points selected
(falta de jerarquía visual, layout/responsive, colores y dark mode, tipografía y espaciado,
falta de iconografía), direction = **look más exprésivo/branded**, scope = **CSS + estructura
de templates** (no behavior/routes/a11y-semantic changes).

**Inferred** (flag in PR): the audit evidence behind each story — the dual palette seam
(body slate `#ffffff`/`#0f172a` vs Material `light-dark(#faf8ff, #11131b)`), the hard-coded
`mode="side" opened` sidenav (no responsive path), zero `<mat-icon>` despite the icon font
being loaded, no display-font usage (`--mat-sys-*-font` tokens exist but are unused), and the
roadmap having no design slot (hence number 016).

## Why this approach

Deliver expressiveness **inside** Material 3: theme color slots, overridden type tokens,
surface/elevation usage, and iconography — not a bespoke CSS system (Gate VI: no
abstraction layer over Material). Behavior stays frozen (Gate II): only presentation layers
move.

## Constitution gates

| Gate | Plan | Evidence |
| --- | --- | --- |
| I Spec-First | Full artifact set committed before code | this directory |
| II Behavioral Immutability | `src/vault/`, routes, store, dialogs, forms untouched; specs stay green | FR-011/014, SC-006 |
| III Zero Trust | 9 edge cases (flapping, focus, icon-font failure, reflow, reduced motion, pre-paint, spec drift, contrast drift, palette regen) test-locked | spec.md Edge Cases |
| IV Security by Design | Theme single-writer + pre-paint untouched; no new external assets beyond one font link (same origin pattern as Roboto) | FR-005/014 |
| V Automated Verifiability | Contrast suite, token specs, harness specs, 4 mutants, `pnpm verify` | FR-013, SC-007 |
| VII Spec Structure | Full artifact set incl. `contracts/visual-system.md` | this directory |
| VIII Repo Governance | Feature branch off post-015 `main`; mock-only; English | tasks.md T001 |

## Scope

**In**:
- `src/styles.css` (token unification + spacing scale), `src/material-theme.scss`,
  `src/_theme-colors.scss` (only if regeneration is needed — default: keep palettes),
  `src/index.html` (display-font link only)
- `src/app/dashboard/*` (shell: responsive sidenav, header treatment, nav icons)
- `src/app/credential-{list,detail,form}/*` (headers, surfaces, icons, hover/focus)
- `src/theme/contrast.spec.ts` (updated pairs for the unified token layer)
- `src/app/app-tokens.spec.ts` (extended purity assertions)
- New/updated specs colocated per component; `src/testing/` only if a responsive stub helper
  is required (then: tooling-flavored commit per Branching policy)

**Out**: `src/vault/`, constitution/.specify, routes, store, copy overhauls, i18n, density
changes, new dependencies, icon-per-everything beyond the FR-010 inventory, roadmap edit.

## Planned file impact

| File | Change |
| --- | --- |
| `styles.css` | body tokens derive from `--mat-sys-*`; add spacing scale; drop parallel palette |
| `material-theme.scss` | only if palette/typography slots need tuning |
| `index.html` | add display-font `<link>` (Roboto link stays) |
| `dashboard.html/.css/.ts` | `MediaMatcher` signal, menu button, nav/brand icons, header shell |
| `nav-items.ts` | add `icon` field (presentation metadata) |
| `credential-list.html/.css` | page header, icons (search/filter/star/delete), hover/focus |
| `credential-detail.html/.css` | page header, state icons, surface card |
| `credential-form.html/.css` | page header, surface treatment |
| `app-tokens.spec.ts`, `contrast.spec.ts`, new `*.spec.ts` | guards per SC-001..005 |

## Architecture

```
index.html (display font link, pre-paint script untouched)
   └─ mat.theme() ── color slots (primary blue + tertiary purple), Roboto, density 0
        └─ styles.css: single token layer (--mat-sys-* + documented --space-* scale)
             ├─ dashboard: wide/narrow = signal(MediaMatcher) → sidenav mode + menu button
             └─ views: page-header pattern (title/lede/actions) + surfaces + <mat-icon>s
```

- Responsive state is component-local (no store): `signal` + `MediaMatcher.matchMedia(...)`
  `change` listener + `DestroyRef` cleanup; testable via the existing CDK `MediaMatcher`
  stub pattern in `src/testing/media-matcher-stub.ts` (a wide/narrow variant will be added
  there if needed — stubs are test tooling, kept in their own commit).
- Contrast truth stays in `src/theme/contrast.ts` (utility untouched); only the spec's
  documented pairs are updated to the unified tokens.

## Testing approach

- Harness-first for structure (page headers, menu button, sidenav open/close, icons via DOM
  query since no `MatIconHarness` path exists in this Material build).
- Static/token specs for: token purity (all stylesheets), display-font overrides,
  spacing-scale usage, contrast pairs (both schemes).
- Mutants planned: (A) sidenav always `side` → responsive specs fail; (B) body palette forked
  back to hand colors → token-family spec fails; (C) display-font override removed → type
  spec fails; (D) a documented contrast pair worsened → contrast suite fails.
- Regression anchor: the pre-existing 245 tests must pass unchanged except documented
  structural intent-preserving updates (SC-006).

## Risks / open questions

- Template restructuring may ripple into harness selectors of 009/012/014/015 — inventory
  first (grep selectors), adjust with intent preserved, document per FR-011.
- Aesthetic outcome cannot be CI-verified — SC-008 puts the human eye at the end of the loop;
  keep changes incremental so review can steer (font choice, accent intensity).
- Display font adds an external request; failure mode documented (fallback stack, icons
  `aria-hidden`).
