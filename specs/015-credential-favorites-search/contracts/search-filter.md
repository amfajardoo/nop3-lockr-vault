# Contract: List View Search & Filter Behavior (015)

No route changes: `contracts/navigation.md` from 009/014 still governs routing. This contract
defines the observable behavior of `/` (credential list) after 015.

## Inputs (user-operable)

| Control | Element semantics | Observable state | Effect |
| --- | --- | --- | --- |
| Search input | `mat-form-field` + `MatInputHarness` (`TestHarnessInput`), accessible label "Search credentials" | value = `query` (trimmed on match, raw in field) | re-derives `visibleCredentials` |
| Favorite toggle (per row) | `button[mat-icon-button]`, `aria-label="Add/Remove <name> to favorites"`, `aria-pressed="true|false"` | pressed ⇔ `credential.favorite` | `store.update(id, {favorite: !current})` |
| Favorites filter | `button[mat-stroked-button]`, `aria-pressed`, label contains "favorites" | pressed ⇔ `favoritesOnly()` | AND-filters `visibleCredentials` |
| Clear search / reset | `button` with accessible name (e.g. "Clear search") inside the no-results card | — | `query.set("")` and/or `favoritesOnly.set(false)` |

## Outputs (rendered states — exactly one branch)

| Condition | Hook | Content |
| --- | --- | --- |
| `count() === 0` | `[data-empty-state]` (009, unchanged) | "Your vault is empty." + Add CTA |
| `count() > 0 && visibleCount() === 0` | `[data-no-results]` (new) | message naming the active cause (query and/or favorites filter) + reset button |
| otherwise | `mat-nav-list` rows | `visibleCredentials()` in store order: link (name [+ star is now the toggle], username, domain) + favorite toggle + delete (012) |

Result count: `span[aria-live="polite"]`, rendered only when `hasActiveView()` is true, text
contains `<visibleCount>` and `<count>` (exact wording is implementation detail; specs assert
both numbers + polite role).

## Store interaction

- **Read**: `credentials()`, `count()` — unchanged accessors.
- **Write**: exactly one call shape, `update(id, { favorite })`; no other method called by the
  filter/search code paths; `add`/`delete` reachable only via existing flows (014 form, 012
  dialog).
- **Never**: query/filter values are not passed to the store; store is never mutated to
  simulate filtering (SC-001 snapshot assertions).

## Ordering & identity

- Results keep `store.credentials()` insertion order; controls never sort.
- `@for (…, track credential.id)` unchanged ⇒ DOM reuse on filter changes, no duplicate rows.

## Accessibility contract (asserted in specs)

1. Search input has an accessible name (label association via Material form field).
2. Both toggles expose `aria-pressed` reflecting state (state not conveyed by color alone).
3. Favorite toggle's accessible name includes the credential name and Add/Remove semantics.
4. Result-count span is a polite live region updating on query/filter/toggle/delete changes.
5. Reset/clear buttons are reachable by keyboard (`MatButtonHarness` `click()` = Enter/Space
   per Material); focus visibility is Material-provided (no custom outlines).
6. `mat-nav-list` keeps `aria-label="Saved credentials"`; rows remain list items with a
   navigable link (009 semantics preserved).

## Non-goals (explicit)

- No URL/query-param sync, no route changes, no new components outside `credential-list/`.
- No debounce, no async search, no ranking/highlighting.
- No changes to `password`/`notes` handling anywhere.
