# Research: Credential Form (Create & Edit)

**Feature**: [014-credential-form](spec.md) | **Date**: 2026-09-26

All API claims below were verified against the installed packages (`node_modules`) before being
recorded — not from memory.

## Decisions

### D1. One component, two routes (mode derived from the route)

**Decision**: A single `CredentialForm` component serves create and edit. Routes:
`credentials/new` → form without `:id`; `credentials/:id/edit` → form with `:id`. The component
reads the optional route param through a signal `input()` (the app already provides
`withComponentInputBinding()`, and `CredentialDetail` uses `input.required<string>()` for `id` —
same pattern: optional `id = input<string>()`).

**Why**: The fields, validation, submit, and cancel behaviors are identical (spec FR-004);
splitting into two components would duplicate the Signal Forms setup and Material markup.
`CredentialDetail`'s not-found pattern already established param-as-input.

**Alternatives rejected**: Two components (duplication); a `mode` query param (URLs lie about
intent); `ActivatedRoute` injection (against AGENTS guidance when input binding is available).

### D2. Signal Forms model and validation

**Decision**: Model as a `WritableSignal<CredentialFormModel>` wrapping the five text fields;
wrap with `form(model, schemaFn)` where the schema function binds `required(...)` to `name`,
`username`, `domain`, `password` (and nothing to `notes`). Submission goes through the exported
`submit(form, action)` helper, which runs the action **only when the form is valid** (verified:
`declare function submit<TModel>(form, action): Promise<boolean>` — "Function to run when
submitting the form data (when form is valid)").

**Verified API surface** (`@angular/forms/signals`, stable `@publicApi 22.0`):

- `form(model: WritableSignal<T>, schemaFnOrOptions?) → FieldTree<T>` — the model signal *is*
  the source of truth; field writes flow back into it (no duplicate copy → satisfies FR-013).
- Schema function style: `form(model, (f) => { required(f.name); ... })`.
- `submit(form, action)` gates on validity; validator set includes `required`, `minLength`,
  `pattern`, `email`, `min`, `max`, `disabled`, `hidden`, `readonly`.
- Template binding: `FormField` directive, selector `[formField]`, required signal input
  `field` (e.g. `<input [formField]="f.name">`); a `FormRoot` directive targets `form[formRoot]`.

**Why**: FR-005 mandates Signal Forms; `submit()`'s built-in validity gate is exactly the
"never forward an invalid payload" rule (FR-006/US3-A3) — the store cannot receive a payload the
zod contract would reject because the action never runs.

**Validation parity**: zod's `z.string().min(1)` accepts a single space; the form uses bare
`required()` (no trim, no pattern) so UI gating ≡ schema acceptance (spec edge case #1). Parity
is enforced by a test that feeds whitespace-only input through both the form gate and
`credentialDraftSchema`.

### D3. Material form controls and error display (one open question, planned spike)

**Decision**: Each field is `<mat-form-field>` + `<mat-label>` + `<input matInput [formField]>`;
notes is a `<textarea matInput>`; actions are `mat-button`/`mat-raised-button`. Errors render in
`<mat-error>`.

**Verified**: `@angular/material`'s input typings side-effect-import `@angular/forms/signals`
(`types/input.d.ts` line 15), i.e. `MatInput` is built for `[formField]`-bound signal fields.
Harnesses exist and cover the assertions we need: `MatFormFieldHarness`
(`floatingLabelText`, `hasErrors`, `getTextErrors`, `isControlValid`, `getControl`),
`MatInputHarness`, `MatErrorHarness` (from `@angular/material/{form-field,input}/testing`).

**Open question (T003 spike)**: whether `MatFormField` auto-opens `<mat-error>` from signal-form
field state alone, or whether visibility must be conditioned on our own touched/submit flag.
The spec's US3 only requires errors **after a submit attempt**, so the deterministic fallback is:
render `<mat-error>` content conditioned on `field has error && submit attempted (or field
touched)`. The spike decides: auto-display → keep markup minimal; otherwise → explicit gating.
Either way tests assert via `MatFormFieldHarness.getTextErrors()` after submit — the observable
contract (FR-007) holds regardless of mechanism.

### D4. Submission and navigation contract

**Decision**:

- Create success → `VaultStore.add(model())` → navigate to `/` (the list, where the new entry
  renders — SC-001).
- Edit success → `VaultStore.update(id, model())` → navigate to `/credentials/:id` (detail
  shows updated values — SC-002).
- Cancel → `router.navigate` back (list for create; detail for edit) with no store call (FR-011).

**Why not navigate to the new credential's detail**: `VaultStore.add` returns `void` (verified in
`vault.store.ts`); FR-008 forbids store API changes; synthesizing the ID client-side (UUID is
`crypto.randomUUID` inside the store) would either duplicate ID generation or leak store
internals. Recorded as an accepted trade-off in spec Assumptions — revisit only if a future
feature legitimately needs `add` to return the created ID.

### D5. Route ranking for `/credentials/new`

**Decision**: Rely on Angular's default route scoring (static segment > parameter at the same
depth) so `credentials/new` resolves to the create form even though `credentials/:id` (detail)
also exists. Declaration order in `app.routes.ts` does not matter for correctness, but the new
static sibling is listed before the parameterized one for readability.

**Safety net**: an automated route-resolution test navigates to `/credentials/new` and asserts
the form (not the detail not-found state) — spec edge case #3 / SC-005.

### D6. Entry points

**Decision**:

- List: a `mat-button`/`mat-fab` "Add credential" action next to the `<h1>` heading, plus the
  same action as the primary CTA inside the empty-state `mat-card` (spec US1-A5; 009 explicitly
  deferred the actionable empty-state copy to this feature).
- Detail: an "Edit" `mat-button` in the card (header area or `mat-card-actions`), linking to
  `/credentials/:id/edit`.

Both are plain `routerLink` navigations — no service, no imperative router plumbing (gate VI).

**Why Material buttons**: AGENTS accessibility rule — Material primitives provide the semantics
(specs assert role/name/keyboard via `MatButtonHarness`).

### D7. Not-found handling for edit mode

**Decision**: The form component guards edit mode: `:id` present but `store.getById(id)` is
`undefined` → render the same not-found `mat-card` pattern as `CredentialDetail` (heading +
copy + back link), never the form fields (FR-012).

**Why in the component**: The route must still resolve (lazy component mounts) — redirecting
would hide the state from tests and require router-side logic; the detail view already
established the pattern users see.

**Mid-edit disappearance**: `getById` is a signal-derived `computed` — if the entry is deleted
while the form is open, the guard flips to not-found automatically; if the user submits anyway,
008's `update` no-ops on unknown IDs (verified) and navigation lands on the not-found detail.
The form never creates a replacement entry (spec edge case #4).

### D8. Test strategy (harness-first, mutant-checked)

**Decision**: One colocated spec `credential-form.spec.ts` driving the component through CDK
harnesses:

- `MatFormFieldHarness` + `MatInputHarness` for typing/prefill (`setValue`, `getControl`);
- `MatErrorHarness`/`getTextErrors()` for validation assertions (FR-007 semantics);
- `MatButtonHarness` for save/cancel (role + accessible name);
- toolkit `query()` only where no harness exists;
- route behavior (ranking, not-found, navigation targets) via `RouterTestingHarness` /
  `routerHarnessLoader` with `provideRouter` in `setupModule`.

Entry-point additions are asserted in the existing `credential-list.spec.ts` and
`credential-detail.spec.ts` via `MatButtonHarness`.

**Mutant targets** (SC-007): (1) skip the `submit()` validity gate → invalid-submit tests must
fail; (2) break prefill (`model.set(empty)` in edit mode) → prefill test must fail; (3) remove
the `add`/`update` call from the action → store assertions must fail; (4) remove entry points →
entry-point specs must fail.

**Why not e2e**: Playwright/axe were deliberately dropped (AGENTS + `chore/010`); a11y is
asserted as observable Material semantics (roles, names, error association, keyboard) per AGENTS
testing rules.

## Decision Log

| ID | Decision | Status |
|----|----------|--------|
| D1 | Single form component; optional `id` input derives mode | Accepted |
| D2 | Signal Forms `form()` + `submit()` validity gate; zod parity via bare `required()` | Accepted |
| D3 | Material `mat-form-field`/`matInput`/`mat-error`; error-display mechanism pending T003 spike | Accepted (spike pending) |
| D4 | Create → list; edit → detail; no store API change | Accepted |
| D5 | Route ranking static-vs-param proven by test | Accepted |
| D6 | Entry points: list header + empty-state CTA; detail Edit button | Accepted |
| D7 | In-component not-found guard for stale edit IDs | Accepted |
| D8 | Harness-first colocated spec + router harness + 4 mutant targets | Accepted |

## Dependencies

- **008 `credential.schema`** (`credentialDraftSchema`, `credentialPatchSchema`): validation
  parity target and type source (`CredentialDraft`); imported as types only.
- **008 `VaultStore`**: `add`, `update`, `getById` consumed unchanged.
- **009 list/detail**: entry-point hosts; their specs extended, behavior otherwise untouched.
- **006 shell + routes**: two new lazy children under the dashboard; `withComponentInputBinding`
  already configured (verified in `app.config.ts`).

## In-Scope Boundary

- **In**: form component + its spec, two routes, list/detail entry points + their spec
  additions, spec artifacts.
- **Out**: `src/vault/*` (byte-identical), favorites toggle (roadmap's favorites/search slice),
  unsaved-changes guard, delete-from-detail, persistence/encryption/auth, i18n, theme files,
  dashboard chrome.
