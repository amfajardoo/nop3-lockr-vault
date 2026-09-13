# Quickstart: Credential List

**Feature**: [009-credential-list](spec.md) | **Validates**: US1–US4 end-to-end

## Prerequisites

- Node 24 + pnpm (project toolchain); repo on branch `feature/009-credential-list`.
- Feature 008 merged to `main` (Credential schema, VaultStore, MockDataService).
- Angular CLI available via `pnpm dlx` / local `ng`.

## What this validates

1. The dashboard mounts the credential list as its primary content (`/`).
2. Seed credentials (008) render on first load with name/username/domain + favorite marks.
3. Detail view (`/credentials/:id`) shows fields with a masked password and a reveal toggle.
4. Empty vault renders the empty state.
5. Delete requires confirmation and, once confirmed, removes the credential.

## Run the checks

### 1. Static + build (all features)

```bash
pnpm check:fix
pnpm verify
```

Expected: biome clean; full unit suite green (baseline 216 + new 009 specs); production build OK.

### 2. Feature unit specs (TDD loop)

```bash
pnpm ng test --watch=false --include='src/app/credential-list/**'
pnpm ng test --watch=false --include='src/app/credential-detail/**'
pnpm ng test --watch=false --include='src/app/dashboard/dashboard.spec.ts'
```

Expected: all new CRUD/navigation/reveal/delete/empty/AXE specs green.

### 3. Component (gallery) specs

```bash
pnpm e2e:components
```

Expected: `tests/components/credential-list.spec.ts` and `credential-detail.spec.ts` (and the
existing theme-toggle spec) green against the Vite gallery on port 5173.

### 4. Live smoke (manual)

```bash
pnpm dev
# open http://localhost:4200
```

- `/` → seed credentials appear (github/gitlab/npm/vercel), favorites marked, no placeholder.
- Click a credential → `/credentials/:id` → fields shown, password masked.
- Reveal → password visible; hide → masked again.
- `/credentials/00000000-0000-4000-8000-000000000000` → not-found with back link.
- Empty vault: clear store (fresh context) → empty-state text renders, no rows.
- Delete: confirm removes the row; cancel keeps it.

## Validation scenarios → proofs (SC mapping)

| Scenario | How to prove | Proof |
|----------|--------------|-------|
| SC-001 seeds render on first load | bootstrap seeds + list renders them | App + list unit/CT specs |
| SC-002 detail fields + masked | detail spec: fields present, DOM has no plaintext password | detail unit spec |
| SC-003 reveal toggle round-trip | toggle twice, assert masked↔visible | detail unit spec |
| SC-004 delete confirm/cancel | confirm removes, cancel keeps, no other row changes | list unit spec |
| SC-005 empty ↔ populated transition | empty store renders empty state; add → list replaces it | list unit spec |
| SC-006 AXE-clean both themes | AXE in unit + gallery specs | list/detail specs |
| SC-007 `pnpm verify` green | CI-less local gate | verify output |
| SC-008 non-feature files untouched | `git diff` scoped to listed files | review before commit |

## References

- [Data model](data-model.md) — consumed `Credential` fields + transient UI state.
- [Navigation contract](contracts/navigation.md) — routes and data flow.
- Feature 008 data model / contracts for the source `Credential` shape.