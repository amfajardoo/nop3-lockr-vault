# Feature Specification: Credential List

**Feature Branch**: `feature/009-credential-list`

**Created**: 2026-09-12

**Status**: Draft

**Input**: User description: "Credential list view (cards/table), detail/read view, empty state, delete with confirmation"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - The user sees every saved credential in a scannable list (Priority: P1)

As a user, I want to see all my saved credentials presented as a clear, scannable list, so that I
can find any of my passwords at a glance and reach the credential I need from the dashboard.

**Why this priority**: Reading credentials is the core password-manager workflow. The dashboard
shell (006) and the data layer (008) already land ahead of this feature, so the list is the first
slice that turns the vault's data into something usable. Without it, the dashboard remains a
placeholder ("Your credentials will appear here").

**Independent Test**: Seed the VaultStore with the mock catalog (008), render the credential list,
and assert that every seed credential appears with its name, username, and domain. The store can
be pre-populated directly through its `add` mutations, so no persistence or backend is required.

**Acceptance Scenarios**:

1. **Given** a VaultStore with several saved credentials, **When** the credential list renders,
   **Then** each credential is shown with its `name`, `username`, and `domain`.
2. **Given** a VaultStore with a credential marked as favorite, **When** the list renders,
   **Then** that credential displays a clear favorite indicator distinct from non-favorite
   entries.
3. **Given** a VaultStore with several credentials, **When** the list renders, **Then** the
   entries appear in a consistent, deterministic order (not a random or unstable sequence).
4. **Given** a list of credentials, **When** the user activates an entry, **Then** the app
   navigates to that credential's detail/read view.
5. **Given** the credential list, **When** the page is inspected for accessibility, **Then** it
   passes WCAG AA and AXE checks with no serious or critical violations.

---

### User Story 2 - The user reads a saved credential's details (Priority: P1)

As a user, I want to open a credential and read its full details — username, domain, notes, and the
stored password — so that I can use the credential to log in to the site I need.

**Why this priority**: The end goal of a password manager is retrieving a secret. The list (US1)
gets the user to the entry; this story delivers the actual value of reading the credential. It is
P1 alongside the list because list-without-read would not yet serve the primary workflow.

**Independent Test**: Seed a credential, navigate to its detail view, and assert that name,
username, domain, notes, and password are rendered. Revealing is simulated (mock password shown);
a "reveal password" control toggles visibility so the secret is hidden by default.

**Acceptance Scenarios**:

1. **Given** a saved credential, **When** the user opens its detail view, **Then** the view shows
   the credential's `name`, `username`, `domain`, and `notes`.
2. **Given** a saved credential, **When** the detail view opens, **Then** the `password` is hidden
   by default (masked) and is not visible in the DOM as plain text.
3. **Given** a masked password, **When** the user activates the reveal control, **Then** the
   password is shown in plain text, and the control indicates the visible state.
4. **Given** a revealed password, **When** the user activates the reveal control again, **Then**
   the password is masked again.
5. **Given** a credential that does not exist (e.g. a stale or invalid detail link), **When** the
   detail view loads, **Then** it shows a friendly "not found" state and a way back to the list
   instead of crashing or showing placeholder data.

---

### User Story 3 - Empty vault shows a helpful empty state (Priority: P2)

As a user with no saved credentials yet, I want a clear, friendly empty state in the credential
list, so that I understand the vault is empty and what to do next (until the form feature lands,
the disposal is informational).

**Why this priority**: The empty vault is a real state every new user starts in. It is P2 because
users with credentials (US1/US2) already get value; the empty state improves onboarding but is not
required for the primary read workflow.

**Independent Test**: Render the credential list against an empty VaultStore and assert the empty
state text and icon/marker appear and no credential rows are rendered.

**Acceptance Scenarios**:

1. **Given** a VaultStore with no credentials, **When** the list renders, **Then** a clearly
   marked empty state is shown instead of a blank list.
2. **Given** the empty state, **When** the list is inspected for accessibility, **Then** it passes
   WCAG AA and AXE checks with no serious or critical violations.
3. **Given** a VaultStore that transitions from empty to populated, **When** a credential is added,
   **Then** the list re-renders showing the credential and the empty state disappears.

---

### User Story 4 - The user deletes a credential with confirmation (Priority: P2)

As a user, I want to delete a credential only after explicitly confirming, so that I do not lose a
saved secret by accident.

**Why this priority**: Delete is a destructive, irreversible action (mock data only — no
persistence yet, but the store mutation is immediate). Confirmation is the difference between a
safe tool and a footgun. It is P2 because create/edit (form feature) is not in this slice and the
read workflow (US1/US2) is the higher-value target.

**Independent Test**: Seed a credential, request deletion, and assert that (a) a confirmation
prompt appears, (b) the list does not change until confirmed, (c) confirming removes the
credential from the store and list, and (d) cancelling keeps the credential.

**Acceptance Scenarios**:

1. **Given** a saved credential in the list, **When** the user activates its delete control,
   **Then** a confirmation dialog appears describing the credential being deleted.
2. **Given** an open confirmation dialog for a credential, **When** the user confirms the
   deletion, **Then** the credential is removed from the store and disappears from the list.
3. **Given** an open confirmation dialog for a credential, **When** the user cancels the
   deletion, **Then** the dialog closes and the credential remains in the list.
4. **Given** a credential not marked as favorite an open delete flow, **When** the user confirms,
   **Then** only that credential is removed (no other entries change).
5. **Given** the delete flow, **When** the dialog is open, **Then** it is keyboard-operable and
   focus is managed so the user can cancel or confirm without a mouse, per WCAG AA.

---

### Edge Cases

- What happens when the VaultStore is temporarily empty while the list is mounted? The list shows
  the empty state (US3) and re-renders as soon as a credential is added.
- What happens when a credential is deleted while its detail view is open? Deleting is initiated
  from the list; a credential shown in a detail view that is then removed becomes the "not found"
  state when revisited.
- What happens when the same credential name appears on different domains? Entries remain distinct
  rows; they are identified by their stable ID, not by name.
- What happens when the store returns malformed data? The store (008) already validates at every
  boundary, so the list never receives an invalid Credential; defensive rendering still must not
  throw.
- What happens on a very long `notes` or `username` value? The list truncates long text gracefully
  (no layout breakage); the detail view shows the full value.
- What happens during delete while another credential's dialog is already open? Only one
  confirmation dialog is presented at a time; opening a new one replaces the previous.
- What happens when confirm triggers a no-op (credential already gone)? The dialog closes and the
  list reflects the current store state without errors.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The app MUST render a credential list view that displays each credential in the
  VaultStore with its `name`, `username`, and `domain`.
- **FR-002**: The list MUST be the primary content of the dashboard (006) once this feature lands,
  replacing the placeholder copy; the dashboard shell, header, and theme toggle MUST NOT be
  modified.
- **FR-003**: The list MUST source its data exclusively from the VaultStore (008) — never from a
  separate/duplicate collection.
- **FR-004**: Favorite credentials MUST carry a distinct, accessible indicator (e.g. a star glyph
  with an `aria-label`) separating them from non-favorites.
- **FR-005**: The list MUST render entries in a deterministic order (e.g. insertion order as
  preserved by the store).
- **FR-006**: Activating a credential row MUST navigate to a detail/read view for that credential
  (routed via a lazy-loaded child route under the dashboard).
- **FR-007**: The detail view MUST show the credential's `name`, `username`, `domain`, and
  `notes` in full.
- **FR-008**: The detail view MUST mask the `password` by default on first render; the raw secret
  MUST NOT appear in the DOM as plain text while masked.
- **FR-009**: The detail view MUST provide a reveal control that toggles password visibility and
  reflects its state via an accessible label (e.g. "Show password"/"Hide password").
- **FR-010**: A detail route for an unknown/missing credential ID MUST render a friendly
  "not found" state with a link back to the list, without throwing.
- **FR-011**: When the VaultStore is empty, the list MUST render a dedicated empty state (text
  plus a recognizable marker) instead of an empty grid/table.
- **FR-012**: The list MUST provide a delete control per credential row that opens an inline
  confirmation dialog naming the credential to be deleted.
- **FR-013**: Confirming a deletion MUST call the VaultStore `delete` mutation with the
  credential's ID; cancelling MUST NOT mutate the store.
- **FR-014**: At most one confirmation dialog MUST be open at a time; starting a new delete flow
  closes any existing one.
- **FR-015**: The delete dialog MUST be keyboard-operable (buttons focusable, Escape cancels) and
  MUST trap or direct focus appropriately per WCAG AA.
- **FR-016**: The credential list and detail views MUST pass WCAG AA and be AXE-clean in both
  supported themes (light/dark, 003).
- **FR-017**: This feature MUST NOT modify `src/vault/` behaviors (008), theme contracts (003),
  or existing shell markup beyond what is needed to mount the list view.
- **FR-018**: All new scenarios MUST have corresponding automated tests; the full `pnpm verify`
  suite (biome, unit, build) MUST stay green.

### Key Entities

- **Credential**: The vault entry (008) rendered by the list and detail views — read-only in
  this feature (mutations only via the store's existing `delete`; create/edit land in the form
  feature).
- **VaultStore**: The signal store (008) that owns the canonical credential collection; the list
  reads `credentials`, `count`, and calls `delete`. No changes to its public API in this feature.
- **Credential list view**: The route-level component rendering the collection, empty state,
  favorite indicators, delete controls, and the confirmation dialog.
- **Credential detail view**: The lazy-loaded read view that renders a single credential's fields
  and the reveal/mask toggle.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of seed credentials (008) render on the list on first load with name, username,
  and domain visible (verified in component tests).
- **SC-002**: The detail view shows the full `name`, `username`, `domain`, and `notes` for a
  seeded credential, and the masked-by-default password is verifiably hidden (no plaintext in the
  rendered DOM) before reveal.
- **SC-003**: The reveal control toggles the password between masked and visible and back across
  repeated activations — covered by at least one automated test.
- **SC-004**: Delete requires confirmation: a seeded credential survives a cancel and is removed
  after a confirm, with no other credentials affected — covered by automated tests for both
  paths.
- **SC-005**: The empty vault renders the empty state; adding a credential transitions the view
  to the populated list without reload — covered by an automated test.
- **SC-006**: The list, detail, empty, not-found, and delete-dialog states pass AXE scans with
  zero serious or critical violations in both themes.
- **SC-007**: `pnpm verify` remains green: biome clean, the full unit suite passes (existing 216+
  tests plus new specs), and the production build succeeds.
- **SC-008**: Non-feature files are untouched: no diffs outside the credential-list components,
  their tests, routes, and spec artifacts, except where mounting the view into the dashboard
  shell is strictly required.

## Assumptions

- English-only copy; no i18n infrastructure is added or modified.
- Mock data only: this feature renders in-memory seeds; no persistence, Supabase, IndexedDB, or
  encryption. Password reveal shows the mock plaintext from 008's seed catalog.
- The list is the dashboard's primary content; the top-level "Overview" nav item (006) now
  presents this list. No secondary nav items are added in this feature.
- Read-only scope: no create or edit entry point exists yet (the form feature lands next). The
  empty state's actionable copy is informational ("Your vault is empty") until the form ships.
- Password masking is a UI-only concern in this feature (masked/hidden from the DOM while hidden,
  plaintext rendered only after an explicit reveal action). It is explicitly NOT the
  zero-knowledge Master Password handling from the Constitution's cryptography clauses, which
  remain out of scope for mock slices.
- The detail view is a child route of the dashboard (lazy `loadComponent`, AGENTS rule), sharing
  the existing header/nav; no standalone route outside the shell.
- Delete uses the VaultStore `delete` mutation from 008 unchanged; no new store API is added.
- One confirmation dialog at a time per FR-014; implemented as an inline dialog in the list
  component rather than a new global service, to keep the slice small.
- `updated_at` is not shown in this slice (read focuses on the four display fields + notes + the
  masked password); timestamps are display polish left to the favorites/details refinement.