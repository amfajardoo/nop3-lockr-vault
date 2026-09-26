# Quickstart: Credential Form (Create & Edit)

**Feature**: [014-credential-form](spec.md) | **Date**: 2026-09-26

Runnable validation guide for reviewers — mirrors the automated spec coverage.

## Prerequisites

```powershell
$env:PATH = "C:\Users\andre\AppData\Roaming\fnm\aliases\default;C:\Users\andre\AppData\Local\pnpm\bin;$env:PATH"
pnpm install
pnpm verify        # biome + 212+ unit tests + build — must be green
```

## Manual walkthrough

1. `pnpm start` → open the app → the dashboard shows the seeded credential list.
2. **Create**: activate "Add credential" → form renders empty with five fields → leave *Name*
   empty and press Save → inline error appears, navigation does not occur, store unchanged.
3. Fill `name`, `username`, `domain`, `password` (any non-empty values; whitespace-only also
   passes — parity with the 008 zod rule), leave notes empty → Save → lands on the list with the
   new credential rendered at the end.
4. **Empty CTA**: delete every credential from the list → empty state now offers "Add
   credential" → activates the same create form.
5. **Edit**: open any credential's detail → "Edit" → form pre-fills all five fields → change
   the name → Save → detail shows the new name (`updated_at` bumped by the store).
6. **Cancel**: open edit again → change a field → Cancel → detail shows the original values.
7. **Stale edit URL**: visit `/credentials/<bogus-uuid>/edit` → not-found card with a back
   link; no crash, no form fields.
8. **Route ranking**: visit `/credentials/new` directly → create form (not detail not-found).
9. **Keyboard/a11y**: Tab through the form (label → input → actions), submit with Enter where
   applicable, errors announced via `mat-error` semantics; toggle dark mode and re-check error
   contrast (WCAG AA).
10. Whitespace parity spot check: enter a single space in Name, Save → the credential is
    created (the zod contract accepts it; the UI must not be stricter).

## Automated equivalents

| Check | Spec |
|-------|------|
| Create flow + store mutation + list landing | `credential-form.spec.ts` (US1) |
| Edit prefill + update + detail landing | `credential-form.spec.ts` (US2) |
| Validation gating, error semantics, input preservation | `credential-form.spec.ts` (US3) |
| Cancel leaves store unchanged (both modes) | `credential-form.spec.ts` |
| `/credentials/new` ranking + unknown-id not-found | `credential-form.spec.ts` (router) |
| Entry points in list/empty/detail | `credential-list.spec.ts`, `credential-detail.spec.ts` |
| zod parity (whitespace-only) | `credential-form.spec.ts` (parity test) |

## Mutant check (SC-007)

Break each of these on purpose and confirm the suite fails, then restore:

1. Remove the validity gate (call the action unconditionally) → invalid-submit specs fail.
2. Skip prefill (`model.set(empty)` in edit mode) → prefill spec fails.
3. Remove `store.add`/`store.update` from the action → store-assertion specs fail.
4. Remove an entry point → its entry-point spec fails.

## Done means

- `pnpm verify` green (biome clean, full unit suite, production build).
- All mutant checks above demonstrated.
- Diffs confined to the scope in plan.md (SC-009).
