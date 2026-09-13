# UI Navigation Contract: Credential List

**Feature**: [009-credential-list](../spec.md) | **Status**: Approved (draft feature)

This contract defines the user-facing routes introduced by the credential list feature. It is
the UI analogue of the data contracts in other features: the routes describe the interface a
user's browser navigates against, independent of implementation.

## Routes

| Method-path      | Story   | Source of truth | Notes |
|------------------|---------|-----------------|-------|
| `GET /`          | Dashboard root (list) | [US1](spec.md) | Lazy `loadComponent`; renders the credential list or empty state |
| `GET /credentials/:id` | Detail/read | [US2](spec.md) | Lazy `loadComponent`; renders fields with masked password |

### Routing rules

- `/` redirects nothing; it is the mounted child of the dashboard shell (006) and replaces the
  placeholder copy.
- `/credentials/:id` renders the detail view; an unknown `:id` renders the not-found state with
  a link back to `/`.
- Unknown top-level paths continue to fall through to the existing `**` → `/` redirect.

## Data flow

- Reads: list consumes `VaultStore.credentials()` + `VaultStore.count()`; detail consumes
  `VaultStore.getById(id)`.
- Mutation: list delete consumes `VaultStore.delete(id)` after explicit confirmation.
- No creates or edits in this feature (form feature is next).

## Conformance

- WCAG AA / AXE-clean in both themes (FR-016).
- Lazy route splitting for both children (AGENTS).
- No `src/vault/` modifications (FR-017).