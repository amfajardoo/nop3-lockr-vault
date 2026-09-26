# Research: Credential Favorites & Search (015)

Spikes are resolved by inspection of the pinned local dependencies (`@angular/material@22.1.6`,
`@ngrx/signals`, `@angular/forms` 22.x) plus the merged 009/012/014 code — no network needed.

## D1 — Where does search/filter state live?

**Decision**: Component-local signals (`query`, `favoritesOnly`) inside `CredentialList`.

**Alternatives rejected**:
- *Store state*: pollutes `VaultStore` with view concerns; violates FR-012 / Gate II (store is
  domain-only: items + CRUD).
- *Service + router queryParams*: adds a route/service layer the roadmap never asked for
  (URL persistence is an explicit Assumption non-goal).
- *Reactive forms for the search box*: a single text input bound to a signal is simpler;
  Signal Forms would only wrap one field with no validation payload (query validity is
  meaningless — whitespace-only is a legitimate "empty" state).

**Consequence**: state resets on navigation (acceptable; not persisted by design).

## D2 — Filter control primitive

**Decision**: plain Material buttons with explicit `[attr.aria-pressed]`
(`mat-icon-button` for the star, `mat-button`/`mat-stroked-button` for the favorites filter).

**Alternatives rejected**:
- *`MatButtonToggle`*: its semantics target toggle **groups** (`MatButtonToggleGroup`,
  multi-select); two independent toggles (star per row + global filter) don't form a group, and
  adopting it would add a module whose group ARIA we don't want specs to fight.
- *`MatSlideToggle`*: implies on/off settings with immediate apply — acceptable, but a button
  reads as a list action and keeps visual weight consistent with the existing header buttons;
  either way the observable contract (`aria-pressed` + accessible name) is identical.

**Spike check**: `MatButtonHarness` supports `click()`; `aria-pressed` asserted via
`host().getAttribute("aria-pressed")` — no `getHref`-style API gaps (cf. 014's D-spike).

## D3 — Matcher shape and location

**Decision**: module-level pure function exported from `credential-list.ts`:

```ts
export function matchesQuery(credential: Credential, query: string): boolean
```

- `const q = query.trim().toLowerCase(); if (q === "") return true;`
- case-insensitive substring over `name`, `username`, `domain` — **never** `password`/`notes`.
- literal matching (no `RegExp`, no injection surface — edge case #8).

**Why exported**: direct unit coverage of edge cases (trim, case, field set, regex chars)
supplements the harness tests; the derived computed is still asserted end-to-end through the
harness (harness-first rule applies to *user interaction*, not to pure-logic edge cases).

**Rejected**: matcher inside the `computed` closure (untestable in isolation); a separate
service (over-abstraction for one call site).

## D4 — Rendering precedence: empty vault vs no-results

**Decision**: outer branch keys on `count() === 0` first (009's empty state renders regardless
of query/filter — spec Assumption + edge case #6); the `@else` branch then keys on
`visibleCredentials().length === 0` → no-results/empty-favorites card with reset affordance
(FR-005).

**Consequence**: three mutually exclusive states, each with its own `data-*` hook for specs:
`data-empty-state` (existing), `data-no-results` (new, wording depends on active controls).

## D5 — Result-count live region

**Decision**: a `span[aria-live="polite"]` inside the header rendered as
`"N of M credentials match"` (wording free, semantics asserted per FR-009/SC-005); hidden when
no controls are active (`@if (hasActiveQuery())`) to avoid noisy announcements on first render.

**Alternative rejected**: `role="status"` on the list itself — over-announces row churn
(deletes re-read the whole list to AT).

## D6 — Replace vs keep the passive favorite indicator

**Decision**: replace 009's `span[data-favorite]` with the toggle button (FR-006/007).

**Why**: two stars per row (display + control) double the visual weight and risk divergence
(indicator says favorite, control says not). The 009 tests that assert "favorites are
distinguishable + accessible" are rewritten against `aria-pressed` + accessible name — same
intent, stronger observable behavior (a single source of truth).

## D7 — Query normalization

**Decision**: trim edges + lowercase both sides; inner whitespace is preserved (`"foo bar"` is a
literal query). Whitespace-only ⇒ empty ⇒ unfiltered.

**Why it's allowed here**: FR-002 is UI input, never stored. 014's no-transform rule governs
payloads submitted to the store (`credentialDraftSchema` parity) — different data class; noted
in spec Edge Case #1 so reviewers don't read it as a contradiction.

## D8 — Debounce / async

**Decision**: none. `computed()` runs synchronously over an in-memory array (mock scale,
hundreds of rows max); a debounce would delay SC-001 assertions for zero benefit. Revisit when
a real backend lands (out of scope).

## D9 — Toggle payload and store semantics (verified)

**Verified in `src/vault/vault.store.ts`**: `update(id, patch)` validates against
`credentialPatchSchema`, merges, bumps `updated_at` (line 47), no-ops on unknown id or invalid
patch. Payload `{ favorite: !credential.favorite }` always satisfies the schema ⇒ FR-006 needs
no error path. Toggle-while-deleted (edge: delete raced with toggle) resolves as a silent no-op
inside the store — consistent with 008's trust model; specs don't cover a race the UI can't
produce (single-user mock).
