# Research: Credential List

**Feature**: [009-credential-list](spec.md) | **Phase**: 0 (outline & research)

## Decisions

### 1. Route placement and lazy loading

- **Decision**: The dashboard route (`""` in `src/app/app.routes.ts`) gains a `children` array:
  `{ path: "", loadComponent: CredentialList }` (the list is the dashboard's primary content)
  and `{ path: "credentials/:id", loadComponent: CredentialDetail }`. Both use lazy
  `loadComponent` (AGENTS rule). The existing wildcard redirect stays.
- **Rationale**: FR-002 requires the list to replace the dashboard placeholder as primary
  content; FR-006 requires detail navigation via a lazy child route under the dashboard. The
  shell (006) already ships a nested `<router-outlet>` in `<main>`, so children routes mount
  with zero new layout. `dashboard.spec.ts` already proves the nested-outlet pattern works
  (006 US3).
- **Alternatives considered**: Rendering the list directly in `dashboard.html` (rejected:
  FR-006 mandates a routed detail view, and direct embedding would not give us
  `/credentials/:id`); an eager `component:` route (rejected: AGENTS lazy-load rule).

### 2. Seed population at bootstrap

- **Decision**: `App` (root bootstrap component, `src/app/app.ts`) injects `MockDataService`
  and `VaultStore` and, in its constructor, adds every seed credential into the store when
  `count() === 0`. The list component itself stays dumb: it renders whatever the store holds.
- **Rationale**: SC-001 requires 100% of seeds visible on first load, but FR-011 requires a
  real empty-state that must be provable in isolation. If the list auto-seeded, an empty store
  could never produce the empty state. Bootstrapping the seeds once at root keeps the list
  testable with an empty store while still making "first load" show the full mock catalog.
- **Alternatives considered**: List auto-seed when `count() === 0` (rejected: makes US3 empty
  state untestable with a real empty store — the component would always repopulate); a
  dedicated seed guard/router resolver (rejected: over-built, folder-creep for a mock-only
  slice); seeding inside `Dashboard` (rejected: mixes vault concerns into the 006 shell, which
  FR-002/FR-017 keep shell-specific).

### 3. Component split

- **Decision**: Two route components — `CredentialList` (list + empty state + favorite
  indicator + delete flow, dialog inline per spec assumptions) and `CredentialDetail`
  (read-only fields + reveal toggle + not-found state). No shared sub-components.
- **Rationale**: Spec structures the slice as list view and detail/read view; both are
  routable leaves. The delete confirmation is explicitly an inline dialog in the list
  component (spec Assumption), not a service or third component.
- **Alternatives considered**: A shared `CredentialCard` reused by list+detail (rejected:
  the two present different field sets — list shows name/username/domain, detail shows all
  fields — a shared card would either degrade the detail view or over-build the list);
  extracting the dialog into its own component (rejected per spec assumption + anti-abstraction).

### 4. Read-only consumption of the VaultStore

- **Decision**: Components consume the store's public API verbatim: `credentials()`, `count()`,
  `delete(id)`, `getById(id)`. No new store methods, no wrapping, no `src/vault/` edits.
- **Rationale**: FR-017 (do not modify `src/vault/` behaviors) and FR-003 (list sources data
  exclusively from the VaultStore). `credentials()` already returns an immutable copy array, and
  `delete` is a silent no-op on unknown ids — exactly the contract the UI needs.
- **Alternatives considered**: A view-model service aggregating store + local state (rejected:
  FR-017 + anti-abstraction; components keep a tiny `signal<>` for transient UI state only).

### 5. Password masking is a render-level toggle

- **Decision**: `CredentialDetail` holds `revealed = signal(false)`. The template renders the
  plaintext password only inside `@if (revealed())`; the hidden branch renders a masking label
  (e.g. `••••••`). The reveal control is a button whose accessible name flips between
  "Show password" / "Hide password" and whose `aria-pressed` reflects state.
- **Rationale**: FR-008 requires the masked value to never appear as plaintext in the DOM;
  an `@if` branch guarantees the plaintext simply does not exist in the tree until revealed.
  FR-009 requires the control to reflect its state accessibly.
- **Alternatives considered**: CSS `text-security`/blur tricks (rejected: value still exists in
  the DOM, violating FR-008 as literally written); always keeping plaintext and hiding via CSS
  (same violation).

### 6. Delete confirmation: native `<dialog>` with managed focus

- **Decision**: The confirmation is a native `<dialog>` element, opened via `showModal()` when a
  pending delete is set, closed on confirm/cancel/Escape. Focus is placed on the confirm button
  on open and restored to the row's delete button on close.
- **Rationale**: FR-014 (one dialog at a time), FR-015 (keyboard operable, Escape cancels, focus
  managed, WCAG AA). The native `<dialog>` gives modal semantics, `role="dialog"`,
  `aria-modal`, Esc handling, and top-layer behavior with the least custom a11y code, matching
  the "passes AXE with no serious or critical violations" criteria.
- **Alternatives considered**: A hand-rolled `role="dialog"` div with manual focus trap
  (rejected: re-implements browser primitives; more AXE surface for no benefit); a CDK Dialog
  (rejected: wrapper service per spec assumption "inline dialog in the list component").

### 7. Deterministic ordering

- **Decision**: Render order = store insertion order, as preserved by `credentials()`
  (`[...items()]`); no local sort.
- **Rationale**: FR-005 requires deterministic ordering; the store already preserves and exposes
  insertion order. Sorting is presentation polish for a later favorites/ordering slice.

### 8. AXE coverage per state

- **Decision**: Unit specs (`ng test`) run `axe-core` against root and nav scopes like the 006
  dashboard specs; component (gallery) specs add AXE for the interactive list/detail in both
  themes, following the 006/`theme-toggle` AXE rule subset convention.
- **Rationale**: FR-016 (WCAG AA / AXE-clean in both themes) and the dashboard/theme CT
  precedent. The rule-set approach already in the repo (`axe.run(root, { runOnly })`) is reused.

### 9. Component-test resource registration

- **Decision**: Register the two new components' external templates/styles in
  `playwright/gallery/vite.component-resource.ts` (raw imports resolved with
  `ɵresolveComponentResources`), per AGENTS; stories for `CredentialList` (with-vault,
  empty-vault, and a story that seeds via `MockDataService`) and `CredentialDetail` (valid id,
  unknown id) live next to the components.
- **Rationale**: AGENTS CT rules state JIT components with `templateUrl`/`styleUrl` do not
  auto-resolve under Vite; the gallery resolver is the sanctioned seam. Stories mirror the
  `theme-toggle.story.ts` inject-and-seed pattern.
- **Alternatives considered**: Inline templates to dodge the resolver (rejected: project
  convention is external templates for non-trivial components; also hides the exact mechanical
  requirement the gallery exists to prove).

## Decision Log

| # | Decision | Status |
|---|----------|--------|
| 1 | Dashboard children routes: `""` → list (lazy), `credentials/:id` → detail (lazy) | locked |
| 2 | Seed at `App` bootstrap when `count() === 0`; list stays store-driven | locked |
| 3 | Two route components, no shared card, dialog inline in list | locked |
| 4 | Read-only VaultStore usage; no `src/vault/` edits | locked |
| 5 | Reveal = template `@if` branch on a `revealed` signal | locked |
| 6 | Native `<dialog>` for delete confirmation with managed focus | locked |
| 7 | Render in insertion order from `credentials()` | locked |
| 8 | AXE in unit + gallery specs, both themes | locked |
| 9 | Register new external templates in gallery resource resolver | locked |

## Dependencies

- `VaultStore`, `MockDataService`, `credential.schema.ts` (008, unchanged)
- Angular `Router` / `RouterLink` / `ActivatedRoute` / `provideRouter` (006)
- `@angular/router` `RouterTestingHarness` for unit navigation specs (006 precedent)
- CDK test harness NOT required (state driven through real DOM + public store API)
- `axe-core` (installed, used by 006 specs / e2e shared support)
- Playwright CT gallery infra (005/`tests/components`), `vite.component-resource.ts`

## In-Scope Boundary

- `src/app/credential-list/`, `src/app/credential-detail/` (component + template + styles +
  spec + story), `src/app/app.routes.ts` (children), `src/app/app.ts` (seed bootstrap),
  `src/app/dashboard/dashboard.html`/`dashboard.spec.ts` (placeholder replaced by the mounted
  list; strict minimum), `playwright/gallery/vite.component-resource.ts` (resource
  registration).
- Explicitly OUT: create/edit forms (next feature), Supabase, crypto, persistence,
  `src/vault/` changes, theme contract changes, i18n.