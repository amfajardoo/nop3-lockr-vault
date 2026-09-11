# Dashboard & Credentials Roadmap

**Date**: 2026-09-11 | **Status**: defined (not scheduled)

After the bootstrap features (001-005) landed, the shell (`app.routes.ts` = `[]`) has no
routable destinations. The originally-deferred "Home/About pages" feature is replaced by a
**Dashboard-first** direction: the app is a password-manager dashboard where the user manages
credentials (register, list, favorite, edit, read, delete).

Unlike `bootstrap-split.md` (which split one big feature into five), this roadmap declares
the **next features in the product's future**: the dashboard experience plus the first
vault-domain feature (credentials) in incremental slices. Each feature goes through the full
SDD flow (`/speckit.specify` … `/speckit.converge`) and lands via its own branch and PR.

## Constraints

- Feature branches: `feature/NNN-<slug>` based on `main`, merged only via PR + review +
  green gates.
- Numbering is sequential (`init-options.json`): next free number is `006`.
- The Constitutional vault clauses (AES-256-GCM, Argon2id, Supabase blob, zero-knowledge)
  become binding only when cryptography/storage land — NOT in the mock-data slices below.
- Mock data only: no Supabase, no real encryption, no IndexedDB persistence in these
  features. The vault domain reaches the database when a dedicated storage feature is
  scheduled.
- AGENTS runtime rules apply (standalone components, signals, `@Service`, lazy `loadComponent`,
  native control flow, Signal Forms, AXE/WCAG AA, mandatory tests).

## Features

| ID | Feature | Scope | Depends on | Est. tasks |
|----|---------|-------|-----------|------------|
| `006-dashboard-shell` | Dashboard layout as the app's living shell: routing (lazy `loadComponent`), header (brand + theme toggle reused), primary nav, main content area — replacing the static 004 shell chrome | 004, 005 | 4-5 |
| `007-vault-data-model` | `Credential` data contract (JSON Schema), mock data service, `VaultStore` (signalStore) with CRUD mutation methods, unit tests | 004 | 4-5 |
| `008-credential-list` | Credential list view (cards/table), detail/read view, empty state, delete with confirmation | 006, 007 | 5-6 |
| `009-credential-form` | Reusable credential form (Signal Forms + validation) for create and edit; integrates with the store | 007, 008 | 5-6 |
| `010-credential-favorites-search` | Mark/unmark favorites, search by title/username/domain, filter by favorites, derived filtered list | 008 | 4-5 |

## Sequencing

1. `feature/006-dashboard-shell` — independent of vault data (no dependencies beyond 004/005).
2. `feature/007-vault-data-model` — independent of the shell; can run in parallel with 006.
3. `feature/008-credential-list` — after 006 + 007 (needs a place to render and data to show).
4. `feature/009-credential-form` — after 007 + 008 (create/edit wired into the existing list).
5. `feature/010-credential-favorites-search` — after 008 (refines the list surface).

## Rationale

- **Reviewability**: each PR is small; a single vault-DOMAIN slice per PR keeps cryptography
  and UI concerns apart.
- **Incremental value**: after 006 the app has a real routable screen; after 007-008 the user
  can read credentials; 009 makes data editable; 010 polishes the primary workflow.
- **Risk isolation**: the data model (007) and its serialization contract are firmed up before
  any UI depends on them.
- **Traceability**: each feature maps 1:1 to its spec artifacts under `specs/<id>/*`.

## Out of scope (scheduled later)

- Real persistence: Supabase blob + IndexedDB offline mirror (constitution "The Safe").
- Cryptography: AES-256-GCM + Argon2id, master password, vault unlock.
- Auth: Supabase Auth, session handling.
- CI hosting pipeline (deferred tooling feature).
- i18n (English-only copy throughout).