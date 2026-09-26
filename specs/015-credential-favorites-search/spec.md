# Feature Specification: Credential Favorites & Search

**Feature Branch**: `feature/015-credential-favorites-search`

**Created**: 2026-09-26

**Status**: Draft

**Input**: User description: "Mark/unmark favorites, search by title/username/domain, filter by
favorites, derived filtered list" — `specs/000-planning/dashboard-roadmap.md`, slot originally
numbered `010-credential-favorites-search` (renumbered to 015; sequential numbering was consumed
by the Material migration 010–013 and the credential form 014).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - The user finds a credential by typing a query (Priority: P1)

As a user, I want to type into a search box on the credential list and see only the credentials
matching my query across name, username, and domain, so that I can locate an entry without
scrolling the whole vault.

**Why this priority**: Search is the primary browse workflow once a vault has more than a few
entries, and it is the roadmap's lead item for this slice. It is pure derived state over the
store — no new mutations — so it delivers value with the smallest risk and underpins the
favorites filter (US3), which composes with the same query pipeline.

**Independent Test**: Seed the store with several credentials, type a query that matches a subset
by name (and separately by username and domain), and assert that (a) only matching rows render,
(b) the store is byte-identical before and after searching (no mutation), and (c) clearing the
query restores the full list in its original order. No persistence or backend is required.

**Acceptance Scenarios**:

1. **Given** a vault with several credentials, **When** the user types a query matching a
   subset of entries by `name`, **Then** only those entries render, in their original
   deterministic order.
2. **Given** the same vault, **When** the query matches by `username` or by `domain` (for a
   different entry), **Then** that entry renders — matching considers all three fields.
3. **Given** any query, **When** matching runs, **Then** matching is case-insensitive and
   ignores leading/trailing whitespace in the query (`" git "` finds `"GitHub"`).
4. **Given** a populated vault, **When** the user searches and then clears the query, **Then**
   the full list renders again and the store is unchanged at every step.
5. **Given** a query that matches nothing in a non-empty vault, **When** the list renders,
   **Then** a dedicated no-results state appears with a way to clear the search, and no
   credential rows render.

---

### User Story 2 - The user marks and unmarks favorites from the list (Priority: P1)

As a user, I want to toggle a credential's favorite state directly from its row, so that I can
flag the entries I use most without opening each one.

**Why this priority**: Marking is the prerequisite for the favorites filter (US3), and the list
currently shows favorites only as seed data with no way to change them. It is P1 alongside
search because the roadmap pairs mark/unmark with search as this slice's core; the toggle is a
single `store.update` against the already-shipped 008 contract.

**Independent Test**: Seed a non-favorite credential, activate its favorite control, and assert
that (a) the control's accessible state flips (`aria-pressed`), (b) the store entry now has
`favorite: true` with `updated_at` bumped, and (c) activating it again reverts to `false`.
Cancel-equivalent (store rejection) is not applicable — the payload always satisfies the schema.

**Acceptance Scenarios**:

1. **Given** a non-favorite credential row, **When** the user activates its favorite control,
   **Then** the control indicates the favorited state (accessible pressed state) and the store
   entry has `favorite: true`.
2. **Given** a favorite credential row, **When** the user activates its favorite control again,
   **Then** the control returns to the non-favorited state and the store entry has
   `favorite: false`.
3. **Given** a favorites-only filter active (US3), **When** the user unfavorites a visible row,
   **Then** that row leaves the filtered view immediately (derived state), other rows unaffected.
4. **Given** the favorite toggle, **When** it is inspected for accessibility, **Then** it has an
   accessible name naming the credential and reflects its state (not color alone), operable by
   keyboard per WCAG AA.
5. **Given** any favorite action, **When** the store is inspected, **Then** only that
   credential's `favorite` (and `updated_at`) changed — all other fields and entries are
   byte-identical.

---

### User Story 3 - The user restricts the list to favorites (Priority: P2)

As a user, I want to filter the list down to my favorite credentials, optionally combined with
an active search query, so that I can work from a short, high-priority view of the vault.

**Why this priority**: The filter is a refinement of the browse workflow — users with favorites
already marked (US2) benefit immediately, but search alone (US1) serves the primary find task.
It is P2 because it composes existing pieces rather than enabling a new capability.

**Independent Test**: Seed a mix of favorite and non-favorite credentials, activate the
favorites-only filter, and assert that only favorites render; then type a query matching one
non-favorite and one favorite and assert the intersection renders (query AND filter). The store
must be untouched by both controls.

**Acceptance Scenarios**:

1. **Given** a vault with mixed favorites, **When** the user activates the favorites-only
   filter, **Then** only favorited credentials render.
2. **Given** the favorites-only filter and a query, **When** both are active, **Then** only
   entries that are favorites AND match the query render (AND semantics).
3. **Given** the filter active with no favorites in the vault, **When** the list renders,
   **Then** a dedicated empty-favorites state appears instead of a blank list or rows.
4. **Given** the favorites-only filter, **When** the user deactivates it, **Then** the previous
   view (full list or query results) is restored without a reload and the store is unchanged.
5. **Given** either control (query or filter), **When** the list state changes, **Then** the
   number of results is announced to assistive technology (result count region), per WCAG AA.

---

### Edge Cases

- What happens with a whitespace-only query (`"   "`)? It is treated as no query — the full
  (or favorites-filtered) list renders; the query is trimmed before matching. (Search queries
  are UI input, not stored data — trimming here does not conflict with feature 014's
  no-transform rule, which governs payloads submitted to the store.)
- What happens when the query matches `password` or `notes`? Nothing — matching covers only
  `name`, `username`, `domain` per the roadmap; secrets and notes are deliberately not
  searchable.
- What happens to insertion order inside the results? Results preserve the store's deterministic
  insertion order; search and filter never reorder.
- What happens when the last matching credential is deleted while a query is active? The
  no-results state renders (the vault is non-empty but the query matches nothing).
- What happens when the vault itself is empty? The empty-vault state (009) renders regardless
  of query/filter — the no-results state only appears for a non-empty vault.
- What happens when a favorite is toggled rapidly? Each activation is an idempotent
  `store.update`; the derived list re-renders per state without reordering or duplicates.
- What happens when unfavorite runs under the favorites-only filter? The row disappears from
  the derived view (US2-A3); the store mutation itself succeeded, so this is not an error state.
- What happens if a query contains regular-expression characters (`.`, `*`, `(`)? Matching is
  literal substring — `.` matches a literal dot; no regex injection surface.
- What happens on very long names/queries? The list truncates long text gracefully (existing
  009 behavior); the query input does not overflow the header layout.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The credential list MUST provide a search input (Material form control with an
  accessible label) in the list header that filters the rendered entries by query.
- **FR-002**: Matching MUST cover `name`, `username`, and `domain` as case-insensitive literal
  substring matches over the whitespace-trimmed query; `password` and `notes` MUST NOT be
  searched.
- **FR-003**: The rendered list MUST be a derived (computed) view over `VaultStore.credentials()`
  plus the query and filter signals; searching and filtering MUST NOT mutate the store.
- **FR-004**: Clearing the query (via the input's clear affordance or by emptying it) MUST
  restore the unfiltered view without a reload.
- **FR-005**: When the vault is non-empty but the current query/filter combination matches
  nothing, the list MUST render a dedicated no-results/empty-filter state with a way to reset
  the search/filter, distinct from the empty-vault state (009).
- **FR-006**: Every credential row MUST expose a favorite toggle control (Material button
  semantics) that calls `VaultStore.update(id, { favorite })` with the negated current value;
  the control MUST reflect state via an accessible name/pressed state (not color alone).
- **FR-007**: The favorite toggle replaces the passive favorite indicator from 009 (the row's
  star IS the control); existing 009 assertions about the indicator MUST be updated to the new
  observable behavior without weakening them.
- **FR-008**: The list MUST provide a favorites-only filter control (Material toggle semantics)
  that restricts the derived view to `favorite: true` entries and composes with the query using
  AND semantics.
- **FR-009**: The list MUST expose the current result count in an assistive-technology-visible
  way (e.g. a polite live region announcing "N credentials match") that updates with query and
  filter changes.
- **FR-010**: Delete (009) MUST keep working unchanged within the filtered view: deleting a
  visible row removes it from the store and the derived list updates.
- **FR-011**: Controls MUST be keyboard-operable with visible focus and pass WCAG AA with
  Material-provided semantics; specs assert observable semantics (roles, labels, pressed state,
  live-region text) — no external a11y scanner dependency.
- **FR-012**: This feature MUST NOT change `src/vault/` behavior (007/008 — `update` is
  consumed as-is), the theme system, the dashboard shell, or routes; no new store methods.
- **FR-013**: All new scenarios MUST have automated harness-first tests, pass the mutant check,
  and keep `pnpm verify` (biome, full unit suite, build) green.
- **FR-014**: The form (014), detail (009/013) and delete-dialog (012) flows MUST remain
  behaviorally unchanged.

### Key Entities

- **Credential**: Vault entry (008). This feature writes only `favorite` (and the store-managed
  `updated_at`) via `VaultStore.update`; search reads `name`, `username`, `domain`.
- **VaultStore**: Consumed unchanged — `credentials`, `count`, `update`, `delete`; no new API.
- **Query state**: Component-local signal (trimmed string); never persisted, never sent to the
  store, never placed in the URL.
- **Favorites-only filter state**: Component-local signal (boolean), same lifecycle as query.
- **Credential list view** (existing, 009/012): gains the header controls, the derived list
  pipeline, the no-results state, and the row-level favorite toggle.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Harness-driven tests prove query matching by each of name, username, and domain,
  case-insensitivity, trimming, and full restoration on clear — with the store snapshot
  unchanged across every step.
- **SC-002**: A harness-driven toggle test proves the store entry flips `favorite` false → true
  → false via `update` alone (asserting `updated_at` set and sibling fields untouched).
- **SC-003**: Combined query + favorites filter renders exactly the AND-intersection of both,
  asserted against seeded data, store untouched.
- **SC-004**: No-results and empty-favorites states render for their respective conditions and
  each includes a working reset affordance — covered by automated tests; the empty-vault state
  remains distinct.
- **SC-005**: Observable a11y semantics (search label, toggle accessible names + pressed state,
  result-count live region, keyboard activation) are asserted in specs and pass.
- **SC-006**: Mutant check demonstrated: breaking the matcher (e.g. field set or AND logic),
  the `update` call, or the derived-view wiring makes at least one spec fail.
- **SC-007**: `pnpm verify` remains green: biome clean, the full unit suite (existing 227 tests
  plus new specs) passes, and the production build succeeds.
- **SC-008**: Diffs are confined to the credential-list component and its spec, the spec
  artifacts of this feature, and no other feature's behavior changes.

## Assumptions

- Numbering: this feature is 015. The roadmap slot is still labeled `010-credential-favorites-search`;
  010–014 are taken, so the next sequential number is 015. The roadmap document is not edited
  here.
- The roadmap's "title" is this app's `name` field (008 vocabulary).
- Search is literal, case-insensitive substring matching — no regex, fuzzy matching, ranking, or
  stemming (mock-scale vault; no debounce needed).
- Query and filter live in component state only: no URL persistence, no store persistence, no
  cross-route memory (roadmap silent → inferred minimal scope).
- The passive favorite indicator (009's `★` span) is replaced by the toggle control (FR-006/007)
  rather than duplicated; 009's indicator tests are updated in place to assert the new control,
  keeping their intent (favorites are distinguishable and accessible).
- Result-count announcements use a polite live region; the exact wording is implementation
  detail, the semantics are asserted.
- Mock data only: no persistence, Supabase, IndexedDB, or encryption; the Constitution's
  cryptographic clauses remain out of scope until their dedicated feature lands.
- English-only copy; no i18n infrastructure.
- Existing behavior outside the list header/rows (delete dialog, navigation, form, detail) is
  untouched (FR-014).
