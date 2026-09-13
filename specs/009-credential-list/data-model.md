# Data Model: Credential List & Detail

**Feature**: [009-credential-list](spec.md) | **Consumes**: [Credential model (008)](../008-credential-data-contract/data-model.md)

## Entities

This feature introduces no new persistent entities. It consumes the `Credential` model from 008
unchanged and adds transient UI state owned by the route components.

### Consumed entity: Credential (from 008)

| Field        | Type    | Used by list | Used by detail |
|--------------|---------|--------------|----------------|
| `id`         | string  | navigation target | route param, `getById` |
| `name`       | string  | displayed | displayed |
| `username`   | string  | displayed | displayed |
| `domain`     | string  | displayed | displayed |
| `password`   | string  | — (never rendered) | masked → revealed |
| `favorite`   | boolean | indicator | — |
| `notes`      | string  | — | displayed |
| `created_at` | string  | — | — (not shown this slice) |
| `updated_at` | string? | — | — |

### Transient UI state (component-local signals)

| Component    | State            | Type                    | Behavior |
|--------------|------------------|-------------------------|----------|
| CredentialList | `pendingDelete` | `Signal<Credential \| null>` | null = no dialog; set → open `<dialog>` |
| CredentialDetail | `revealed`   | `Signal<boolean>`       | false = masked (default); true = plaintext shown |

## Route model

| URL                        | Component       | Params | Behavior |
|----------------------------|-----------------|--------|----------|
| `/` (dashboard root)       | `CredentialList` | —      | Renders store collection or empty state |
| `/credentials/:id`         | `CredentialDetail` | `id` | `getById(id)` or not-found state |

The dashboard `""` route owns a nested `<router-outlet>`; both children mount lazily via
`loadComponent`.

## State transitions

### List: render

1. `credentials()` → array copy in insertion order.
2. `count() === 0` → render empty state markup (no rows); else render a row per credential.
3. Row shows `name`, `username`, `domain`; favorite rows carry a distinct indicator.
4. Row activates → `routerLink` to `/credentials/:id`. No store mutation on render.

### List: delete flow

1. User activates the row's delete control → `pendingDelete.set(credential)`.
2. Dialog opens (`showModal`), focus moves to confirm button.
3. Confirm → `VaultStore.delete(id)`; `pendingDelete.set(null)`; dialog closes; focus returns
   to the delete control.
4. Cancel or Escape → `pendingDelete.set(null)`; dialog closes; no mutation (FR-013).
5. Opening a new delete flow while one is open replaces the pending target (FR-014).

### Detail: read + reveal

1. `ActivatedRoute` param `id` → `getById(id)`.
2. Known id → render all display fields; `password` masked via `@if (revealed())` (FR-008).
3. Reveal control toggles `revealed`; accessible name/`aria-pressed` reflect it (FR-009).
4. Unknown id → render not-found state with a link back to the list (FR-010).

## Relationship map

- **VaultStore** (008) — canonical in-memory collection; list reads `credentials()`/`count()`,
  calls `delete(id)`; detail reads `getById(id)`.
- **MockDataService** (008) — seeds the store once at app bootstrap when empty.
- **App** (root) — bootstrap seeding concern only; no vault logic.
- **Dashboard** (006) — shell unchanged; its nested outlet mounts the list/detail children.
- No persistence, no crypto, no Supabase in this feature.