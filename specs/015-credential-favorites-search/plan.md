# Implementation Plan: Credential Favorites & Search (015)

**Feature**: `specs/015-credential-favorites-search/` — spec: `spec.md`

**Branch**: `feature/015-credential-favorites-search`

## Why

The roadmap slot (originally `010-credential-favorites-search`) says: *"Mark/unmark favorites,
search by title/username/domain, filter by favorites, derived filtered list."* Favorites exist as
seed/display data since 008/009 but cannot be changed, and the list is scroll-only — the browse
workflow does not scale beyond a handful of entries. This feature closes that slot with derived,
store-untouched view state plus one existing-store write (`update`).

**Stated vs inferred**: the scope sentence above is the author's stated rationale (roadmap).
Everything else in this plan (renumber to 015, replace-the-indicator choice, query persistence
non-goals) is **inferred** from spec.md Assumptions and must be confirmed by the human reviewer.

## What (user-visible)

- Search input in the list header filters rows by `name`/`username`/`domain`
  (case-insensitive literal substring, trimmed query).
- Row-level favorite toggle (Material icon button, `aria-pressed`) calling
  `store.update(id, { favorite: !current })`; replaces the passive `★` indicator (009 tests
  updated in place, intent preserved).
- Favorites-only filter toggle composing with the query via AND.
- Distinct no-results / empty-favorites states with reset affordance; result count announced in
  a polite live region.
- Delete, navigation, form, detail flows unchanged.

## Constitution gates

| Gate | Plan | Evidence |
| --- | --- | --- |
| I Spec-First | Full artifact set committed before code | this directory |
| II Behavioral Immutability | `src/vault/` consumed as-is; `update` only | FR-012, data-model.md |
| III Zero Trust | Edge cases (trim, AND, regex chars, empty vs no-results, unfavorite-under-filter) each test-locked | spec.md Edge Cases |
| IV Security by Design | `password`/`notes` never searched; nothing persisted to URL/store beyond `favorite` | FR-002, Assumptions |
| V Automated Verifiability | harness-first specs + mutant checks + `pnpm verify` | FR-013, SC-006/007 |
| VII Spec Structure | spec/plan/research/data-model/contracts/quickstart/checklists/tasks | this directory |
| VIII Repo Governance | feature branch off post-014 `main`, mock-only, English | tasks.md T001 |

## Scope

**In**: `credential-list.{ts,html,css,spec}` (+ optional `credential-list.util.ts` colocated),
spec artifacts.

**Out**: `src/vault/`, theme/shell, routes, form/detail/delete-dialog behavior, URL persistence
of query, debounce, fuzzy/regex matching, i18n, roadmap doc edit.

## Planned file impact

- `src/app/credential-list/credential-list.ts` — query/filter signals, `visibleCredentials`
  computed, matcher, `toggleFavorite`, `clearSearch`, count computed.
- `src/app/credential-list/credential-list.html` — header search + filter controls, derived
  `@for`, no-results branch, live region, star toggle replacing the passive span.
- `src/app/credential-list/credential-list.css` — header layout for new controls.
- `src/app/credential-list/credential-list.spec.ts` — new scenarios; 009 indicator assertions
  updated to the toggle (same intent).
- `specs/015-credential-favorites-search/*` — this artifact set.

## Architecture

Component-local derived state (per contract `contracts/search-filter.md`):

```
query: signal<string>("") ─┐
favoritesOnly: signal<bool> ─┤→ visibleCredentials = computed(filter+search over store.credentials())
store.credentials() ───────┘     toggleFavorite(c) → store.update(c.id, {favorite: !c.favorite})
```

No services, no store changes, no new routes — mirrors 009/012's "component owns its view
state" pattern; matcher is a pure exported function for direct edge-case coverage alongside
harness tests.

## Testing approach

- Harness-first: `MatInputHarness` (search), `MatButtonHarness` (toggles/reset/delete),
  `MatNavListItemHarness` (rows), toolkit `setupModule`.
- Store assertions via injected `VaultStore` snapshots (like 014's mutant C).
- Mutant checks planned: (A) drop one field from matcher → search specs fail; (B) remove
  `store.update` → toggle specs fail; (C) AND → OR in filter composition → combined specs fail;
  (D) remove live-region text binding → a11y spec fails.
- Gate: `pnpm verify` (biome + full suite + build) green.

## Risks / open questions

- 009's indicator tests must be rewritten without weakening them (FR-007) — review diff closely.
- Row density: star + delete + link in one row on narrow widths — CSS check in quickstart.
- No user-stated rationale beyond the roadmap sentence → PR must mark everything else
  **inferred**.
