# UI Navigation Contract: Credential Form (Create & Edit)

**Feature**: [014-credential-form](../spec.md) | **Status**: Approved (draft feature)

Extends the route contract introduced by
[009-credential-list](../../009-credential-list/contracts/navigation.md) with the write-flow
routes. The data contract remains the 008 `credential.schema.json` (referenced, not duplicated).

## Routes

| Method-path               | Story   | Source of truth | Notes |
|---------------------------|---------|-----------------|-------|
| `GET /credentials/new`    | US1     | [spec.md](../spec.md) | Lazy `loadComponent`; empty create form; static segment outranks `:id` |
| `GET /credentials/:id/edit` | US2   | [spec.md](../spec.md) | Lazy `loadComponent`; prefill edit form; unknown id → not-found state |

## Entry points

| From                        | Control              | Target                  | Story |
|-----------------------------|----------------------|-------------------------|-------|
| List (populated)            | "Add credential"     | `/credentials/new`      | US1   |
| List (empty state)          | "Add credential" CTA | `/credentials/new`      | US1   |
| Detail (known id)           | "Edit"               | `/credentials/:id/edit` | US2   |

## Exit paths

| From                  | Action | Target           | Store effect |
|-----------------------|--------|------------------|--------------|
| Create form           | save (valid)   | `/` (list)       | `add(model)` |
| Create form           | cancel         | back (list)      | none |
| Edit form             | save (valid)   | `/credentials/:id` | `update(id, model)` |
| Edit form             | cancel         | `/credentials/:id` | none |
| Edit form (invalid)   | save           | stays on form, errors shown | none |
| Edit route, unknown id | —            | renders not-found + link to `/` | none |

### Routing rules

- `/credentials/new` MUST resolve to the create form, never to the detail view's not-found
  state (static segment ranking, proven by automated test — research D5).
- `/credentials/:id/edit` with an unknown id renders the not-found state inside the form
  component (parity with the detail view), without throwing.
- Existing routes (`/`, `/credentials/:id`) keep their 009 behavior; the `**` → `/` catch-all
  is unchanged.

## Data flow

- Reads: form edit mode consumes `VaultStore.getById(id)`; nothing else is read.
- Mutations: `VaultStore.add(draft)` (create), `VaultStore.update(id, patch)` (edit) — called
  only after the Signal Forms validity gate passes (research D2/D4).
- No new store methods; no values in URLs beyond the id; no navigation state carries secrets.

## Conformance

- WCAG AA semantics asserted in specs (labels, error association, roles, keyboard) — no
  external scanner (FR-014).
- Lazy route splitting for both new children (AGENTS, FR-001).
- `src/vault/` unmodified (FR-008/FR-016); dashboard chrome untouched (FR-016).
