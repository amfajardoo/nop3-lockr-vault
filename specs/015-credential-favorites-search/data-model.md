# Data Model: Credential Favorites & Search (015)

No new entities, no schema changes, no store changes. This feature consumes the 008 contract
and adds component-local view state.

## Entities consumed (read)

### Credential (008, `src/vault/credential.schema.ts`)

| Field | Use in 015 |
| --- | --- |
| `id` | `@for` track key, router link, `update` target |
| `name` | row title; **searchable** |
| `username` | row line; **searchable** |
| `domain` | row meta; **searchable** |
| `favorite` | row state; **searchable? no** — drives toggle + filter |
| `password` | untouched, **never searched** |
| `notes` | untouched, **never searched** |
| `created_at` / `updated_at` | read-only; `updated_at` bumped by store on toggle |

## Entities written

| Operation | Payload | Path |
| --- | --- | --- |
| Toggle favorite | `{ favorite: boolean }` (negated current) | `VaultStore.update(id, patch)` → `credentialPatchSchema` → merge + `updated_at` bump |

That single write is the entire mutation surface of this feature (Gate II: no new store
methods; `update` consumed as shipped in 008).

## Component-local view state (`CredentialList`)

| Signal | Type | Initial | Mutated by | Persisted? |
| --- | --- | --- | --- | --- |
| `query` | `signal<string>` | `""` | search input (`input` event / `(ngModelChange)`-equivalent binding) | No — component lifetime only |
| `favoritesOnly` | `signal<boolean>` | `false` | filter button click | No |

Derived (`computed`, never written):

| Computed | Definition |
| --- | --- |
| `credentials` | `store.credentials()` (unchanged 009 accessor) |
| `count` | `store.count()` — gates the empty-vault state |
| `visibleCredentials` | `credentials` filtered by `favoritesOnly` (when true) then by `matchesQuery(c, query)` — original order preserved |
| `visibleCount` | `visibleCredentials().length` — drives the live region |
| `hasActiveView` | `query.trim() !== "" || favoritesOnly()` — gates no-results branch + live region visibility |

## Matcher (pure, exported — research D3)

```ts
export function matchesQuery(credential: Credential, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (q === "") return true;
  return [credential.name, credential.username, credential.domain]
    .some((field) => field.toLowerCase().includes(q));
}
```

Invariants (test-locked):
- field set is exactly `{name, username, domain}` (SC-001; mutant A)
- literal substring — `.`/`*`/`(` match themselves, no regex (edge #8)
- `""` and `"   "` ⇒ everything (edge #1)
- pure: no I/O, no store access, no mutation (SC-001 store-snapshot assertions)

## State transitions

```
query "" ⇄ "<text>"        → visibleCredentials re-derives; store snapshot unchanged
favoritesOnly false ⇄ true → same
toggle favorite(c)         → store.update(c.id, {favorite: !c.favorite})
                             → items array replaced → credentials/visible re-derive
delete(c)                  → store.delete (009, unchanged) → derived list shrinks
                             → possible visibleCount 0 while count > 0 (edge #4)
```

## Out of scope for persistence

- Query/filter are not stored, not in the URL, not in `VaultStore`, not in `localStorage`.
- No optimistic-update layer: the store IS the single source of truth (toggle writes, then
  computed re-renders from `items()`).
