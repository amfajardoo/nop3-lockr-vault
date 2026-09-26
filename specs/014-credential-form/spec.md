# Feature Specification: Credential Form (Create & Edit)

**Feature Branch**: `feature/014-credential-form`

**Created**: 2026-09-26

**Status**: Draft

**Input**: User description: "Reusable credential form (Signal Forms + validation) for create and
edit; integrates with the store" — `specs/000-planning/dashboard-roadmap.md`, slot originally
numbered `009-credential-form` (renumbered to 014; sequential numbering was consumed by the
Material migration, 010-013).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - The user creates a new credential (Priority: P1)

As a user, I want to register a new credential through a form — name, username, domain, password,
and optional notes — so that the credential joins my vault and appears in the list.

**Why this priority**: Create is the first half of the vault's write workflow. The store's `add`
mutation (008) already exists but has no UI entry point; without this story the vault can only
ever contain the seed catalog. Edit (US2) depends on the same form machinery, so create proves
the shared component first.

**Independent Test**: Mount the list, activate the "Add credential" entry point, fill the form
with valid values, submit, and assert that (a) the VaultStore gained exactly one entry with the
entered values, (b) navigation returned to a view where the new credential is visible, and (c) no
store mutation occurred before submit. No persistence or backend is required.

**Acceptance Scenarios**:

1. **Given** a VaultStore (any state), **When** the user activates the "Add credential" entry
   point, **Then** an empty credential form renders with fields for `name`, `username`,
   `domain`, `password`, and `notes`, plus save and cancel actions.
2. **Given** the empty create form, **When** the user fills every required field with a valid
   value and submits, **Then** the VaultStore contains a new credential with exactly those
   values, `favorite` defaults to false, and the app navigates away from the form to the
   credential list where the new entry is rendered.
3. **Given** the create form with a required field left empty, **When** the user submits,
   **Then** submission is blocked, an accessible inline error is shown for that field, and the
   store is unchanged.
4. **Given** the open create form, **When** the user activates cancel, **Then** the app navigates
   back and the store is unchanged.
5. **Given** the credential list with an empty vault, **When** the list renders, **Then** the
   empty state offers the same "Add credential" action as the populated list (the informational
   copy from 009 becomes actionable).

---

### User Story 2 - The user edits an existing credential (Priority: P1)

As a user, I want to open a saved credential in an edit form pre-filled with its current values,
change fields, and save, so that I can correct or update secrets without re-creating entries.

**Why this priority**: Edit is the second half of the write workflow and shares the form
component with create. Together, create + edit complete the roadmap's form slice; without edit,
mistakes made at create time can only be fixed by delete + re-create.

**Independent Test**: Seed a credential through the store's `add`, navigate to its edit route,
change the name, submit, and assert that (a) the form was pre-filled with the seed values,
(b) the store's entry now carries the new name with `updated_at` bumped, (c) navigation returned
to the detail view showing the updated value, and (d) other fields of that entry are unchanged.

**Acceptance Scenarios**:

1. **Given** a saved credential, **When** the user activates its edit entry point from the detail
   view, **Then** the edit form renders pre-filled with the credential's current `name`,
   `username`, `domain`, `password`, and `notes`.
2. **Given** the pre-filled edit form, **When** the user changes a field to a valid value and
   submits, **Then** the store's entry reflects the change, `updated_at` is set by the store, and
   the app navigates to that credential's detail view showing the updated value.
3. **Given** the edit form with a required field emptied, **When** the user submits, **Then**
   submission is blocked with an accessible inline error and the store is unchanged.
4. **Given** the open edit form, **When** the user activates cancel, **Then** the app returns to
   the previous view and the store still holds the original values.
5. **Given** an edit link for an ID that does not exist (stale or hand-edited URL), **When** the
   route loads, **Then** a friendly "not found" state with a way back to the list renders —
   the same behavior as the detail view — without crashing.

---

### User Story 3 - Invalid input is explained accessibly before it reaches the store (Priority: P2)

As a user, I want clear, per-field error messages when my input is invalid, so that I understand
what to fix and never lose what I typed.

**Why this priority**: The store silently discards invalid payloads (008's `safeParse` returns
without mutating). Without UI-level validation, a submit with an empty required field would
appear to "do nothing" — a silent failure. Validation is therefore required for create/edit to
be usable at all, but it is P2 relative to the flows themselves because it refines them rather
than enabling a new workflow: the basic submit-blocking rules ship as part of US1/US2 acceptance,
and this story covers the full error-experience contract (persistence of input, messaging,
assistive technology).

**Independent Test**: Submit the create form with one empty required field and assert that an
error message is associated with the field (accessible name/relationship), the typed values in
sibling fields are preserved, the store is unchanged, and that fixing the field clears its
error — all driven through a component harness.

**Acceptance Scenarios**:

1. **Given** the form with an empty required field, **When** the user attempts to submit, **Then**
   an error message is rendered for that field and announced/associated per WCAG AA (e.g. via
   `mat-error` semantics), and focus moves to or stays reachable from the offending field.
2. **Given** a field showing an error, **When** the user types a valid value, **Then** the error
   clears (or clears on next submit attempt) without discarding other fields' input.
3. **Given** any invalid submit attempt, **When** the store is inspected, **Then** no mutation
   occurred — the UI never forwards a payload the 008 zod contract would reject.
4. **Given** the form in either theme (light/dark), **When** its errors are displayed, **Then**
   the error text meets WCAG AA contrast and the state is not conveyed by color alone (icon or
   text accompanies color).

---

### Edge Cases

- What happens when a required field contains only whitespace? The form must apply exactly the
  008 zod rules (`z.string().min(1)`), which accept a single space; the form MUST NOT add
  stricter or transformed rules (no trimming) so the UI never rejects what the store would accept
  — or vice versa.
- What happens when the user double-submits quickly? The second submit is a no-op: either the
  first navigation already occurred or submission is ignored while the first is in flight; the
  store never receives two entries for one form session.
- What happens on the route `/credentials/new`? The literal `new` segment must resolve to the
  create form, never to the detail view's "not found" state (static segment outranks the `:id`
  parameter); this is covered by an automated test.
- What happens when the edit form is opened for an ID deleted in another tab/view? The not-found
  state renders (same as detail); if the store entry disappears while the form is open, submit
  is a no-op (008 `update` ignores unknown IDs) and the user lands on the not-found view — the
  form does not invent a replacement entry.
- What happens if the user navigates away with unsaved changes? No guard: navigation proceeds and
  changes are discarded (documented assumption; an unsaved-changes dialog is future work).
- What happens with a very long `notes` or `name` value? The fields accept it (008 imposes no
  max length); layout must not break (textarea grows/scrolls for notes).
- What happens when the form is submitted while the store holds an entry with the same `name`?
  Duplicates are allowed (identities are IDs, per 009's edge cases); no uniqueness validation.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The app MUST provide two lazy-loaded routes as children of the dashboard shell
  (006): a create route (`credentials/new`) and an edit route (`credentials/:id/edit`), following
  the AGENTS lazy `loadComponent` rule.
- **FR-002**: The credential list (009) MUST gain an "Add credential" entry point visible in both
  the populated and empty states; the empty state's copy becomes actionable via this control.
- **FR-003**: The credential detail view (009) MUST gain an "Edit" entry point that navigates to
  the edit route for the displayed credential.
- **FR-004**: A single reusable form component MUST render the fields `name`, `username`,
  `domain`, `password` (required) and `notes` (optional) in both create and edit modes, using
  Angular Material form controls (`mat-form-field`, `matInput`, `mat-error`, Material buttons)
  per AGENTS.
- **FR-005**: Form state MUST be managed with Signal Forms (`@angular/forms/signals`, stable in
  Angular v22) — not template-driven or reactive `FormGroup` approaches.
- **FR-006**: Client-side validation MUST mirror the 008 zod contract exactly
  (`credentialDraftSchema` / `credentialPatchSchema` field rules); the form MUST block submission
  while any required field is invalid and MUST NOT transform submitted values (no trimming,
  no coercion).
- **FR-007**: Validation errors MUST be surfaced inline per field with accessible semantics
  (Material `mat-error`), MUST be reachable/announced for keyboard and screen-reader users, and
  MUST NOT rely on color alone.
- **FR-008**: Submitting a valid create form MUST call `VaultStore.add` with the draft values and
  MUST NOT introduce new store methods or change existing mutation signatures (008 is read-only
  scope for this feature; type-only imports from the schema module are allowed).
- **FR-009**: After a successful create, the app MUST navigate to the credential list where the
  new credential is rendered (the store's `add` returns void; navigation cannot target the new
  ID).
- **FR-010**: Submitting a valid edit form MUST call `VaultStore.update` with the route's ID and
  the changed values, then navigate to that credential's detail view showing the updated values.
- **FR-011**: Cancelling from either mode MUST navigate back without any store mutation.
- **FR-012**: An edit route with an unknown/missing credential ID MUST render a friendly
  not-found state with a link back to the list, without throwing (parity with the detail view).
- **FR-013**: The form MUST pre-fill edit mode from `VaultStore.getById`; it MUST NOT maintain a
  second copy of credential data beyond transient form state.
- **FR-014**: The form and both entry points MUST be keyboard-operable with visible focus and
  MUST pass WCAG AA with Material-provided semantics; specs assert observable semantics (roles,
  accessible names, error associations, focus) — no external a11y scanner dependency.
- **FR-015**: All form-related specs MUST be harness-first (CDK `ComponentHarness`), pass the
  mutant check, and `pnpm verify` (biome, full unit suite, build) MUST stay green.
- **FR-016**: The dashboard shell, header, nav, theme system (002-006), and `src/vault/`
  runtime behavior (007-008) MUST NOT change beyond the two entry-point additions in FR-002 /
  FR-003 and route registration in FR-001.

### Key Entities

- **Credential**: The vault entry (008). In this feature it is written through the store's
  existing `add`/`update` mutations using payloads that satisfy `credentialDraftSchema` /
  `credentialPatchSchema`. No schema, type, or store changes.
- **Credential form (new)**: The reusable route-level component owning form state (Signal
  Forms), validation, submit/cancel actions, and not-found handling for edit mode. Modes are
  derived from the route (create vs. edit by presence of `:id`).
- **VaultStore**: Consumed unchanged — `add`, `update`, `getById`, `credentials` are called; no
  new methods, no signature changes.
- **Routes**: `credentials/new` (create) and `credentials/:id/edit` (edit), lazy children of the
  dashboard shell alongside the existing list and detail routes.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A harness-driven create test fills the form, submits, and finds the new entry in
  the store and on the rendered list; a store assertion confirms exactly one addition.
- **SC-002**: A harness-driven edit test prefills from a seed, changes a value, submits, and
  finds the store entry updated (`updated_at` set by the store) with the detail view rendering
  the new value; untouched fields are asserted unchanged.
- **SC-003**: Submitting with an empty required field renders an associated error, preserves the
  other typed values, and leaves the store byte-identical — covered by automated tests for at
  least two distinct required fields.
- **SC-004**: Cancel from create and from edit both leave the store unchanged — covered by
  automated tests for each mode.
- **SC-005**: `/credentials/new` resolves to the create form and `/credentials/<bogus-id>/edit`
  renders the not-found state — both covered by automated tests (route resolution, no crash).
- **SC-006**: Observable a11y semantics (form field labels, error association, button roles and
  names, keyboard submit/cancel, focus behavior) are asserted in specs for both modes and pass;
  the suite runs green in the default (light) configuration with theme contracts untouched.
- **SC-007**: Mutant check demonstrated for the new specs: breaking validation gating, prefill,
  or the store-mutation-on-submit logic makes at least one spec fail.
- **SC-008**: `pnpm verify` remains green: biome clean, the full unit suite (existing 212 tests
  plus new specs) passes, and the production build succeeds.
- **SC-009**: Diffs are confined to the new form component (TS/template/styles), its specs, route
  registration, the two entry points in list/detail, and spec artifacts — no other feature files
  change.

## Assumptions

- Numbering: this feature is `014`. The roadmap table still shows the slot as
  `009-credential-form`; 010-013 were consumed by the Material migration, so the next sequential
  number is 014. The roadmap document itself is stale and is not edited by this feature.
- English-only copy; no i18n infrastructure.
- Mock data only: no persistence, Supabase, IndexedDB, or encryption; the Constitution's
  cryptographic clauses (AES-256-GCM, Argon2id, zero-knowledge) remain out of scope until their
  dedicated feature lands.
- `favorite` is NOT part of the form: favorites are managed by the future
  favorites/search refinement (roadmap slot after this one); create defaults it via the schema
  and edit leaves it untouched.
- Create navigates to the list (not the new credential's detail) because `VaultStore.add`
  returns void and FR-008 forbids store API changes; this is an accepted UX trade-off that can
  be revisited if a later feature legitimately needs `add` to return the created ID.
- No unsaved-changes guard: cancel and in-app navigation discard edits silently.
- In edit mode the `password` field is pre-filled with the stored plaintext (mock contract, same
  trust model as the detail view's reveal control); input `type="password"` masks it visually —
  it exists in the DOM as a value attribute while the form is open.
- Form validation mirrors zod exactly (including accepting whitespace-only strings) because the
  store is the final arbiter: stricter UI rules would diverge from the 008 contract; the parity
  is locked by tests comparing form gating to schema acceptance.
- The Material + Signal Forms binding mechanism (directive availability, `mat-error` integration,
  control-value accessor interplay) is confirmed during the plan/research step; if the stable
  binding API differs from expectations, the plan adjusts while FR-004/FR-005 stand.
- Delete stays in the list (009); no delete action is added to the form or detail views here.
