# Quickstart: Zod Runtime Validation

**Feature**: [007-zod-validation](../spec.md) · **Spec**: [spec.md](../spec.md) · **Data model**: [data-model.md](../data-model.md)

## Prerequisites

- pnpm ≥ 11, Node ≥ 22 (project default via fnm/`.nvmrc`), Angular 22 workspace on `feature/007-zod-validation`.

## 1. Install the library

```sh
pnpm add zod
```

`zod` lands in runtime `dependencies`; no companion packages are needed (the `en` locale is
bundled by default).

## 2. Smoke-test the helper

```sh
pnpm ng test --watch=false --include='src/validation/**/*.spec.ts'
```

Expected: all wrapper specs (safeParse, structured issues, fuzz corpus) GREEN.

## 3. Run the migrated theme store

```sh
pnpm ng test --watch=false --include='src/theme/**/*.spec.ts'
```

Expected: every 003 spec stays GREEN with zero behavioral change (corrupt → `system`, blocked
storage → `system`, valid choice → that choice, `setChoice("neon")` → no-op).

## 4. Full local gate

```sh
pnpm verify
```

Expected: Biome (format + lint) clean, all unit specs (existing + new) GREEN, production build
succeeds. After the build, a quick bundle-size spot check (before vs after `zod` addition) should
show only the expected scalar increase.

## 5. Quick mutant check (manual, optional)

While watching the migrated theme specs, temporarily:

1. Remove the `safeParse` fallback in `readStoredChoice` → a corrupt-storage spec must FAIL.
2. Remove the `safeParse` guard in `setChoice` → the out-of-enum spec must FAIL.
3. Restore both → specs must be GREEN again.

The same check applies to the wrapper specs: remove the `issues` mapping → a structured-failure
assertion must FAIL.

## What just changed (and what did not)

| Changed | Unchanged |
|---------|-----------|
| `src/validation/validation.ts` (new wrapper) | `src/index.html`, `src/theme/**` public API, `pre-paint.spec.ts`, `app.spec.ts`, e2e flows |
| `src/theme/theme-choice-schema.ts` (new file) | `contracts/theme-choice.schema.json` (002) |
| `src/theme/theme.store.ts` (internal: `isThemeChoice` removed, `readStoredChoice`/`setChoice` migrated to `safeParse`) | 003 spec suite, 002 token contracts, component tree |
| `package.json` (`dependencies.zod`) | All build/test scripts, biome config, AGENTS rules |