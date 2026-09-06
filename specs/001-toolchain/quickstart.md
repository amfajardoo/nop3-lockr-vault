# Quickstart: Developer Toolchain

**Phase 1 output for `001-toolchain`.** Runnable validation scenarios that prove the feature
works end-to-end. Implementation details live in `tasks.md`, not here.

## Prerequisites

- Node 24 (via fnm) and `pnpm@11.20.0` (see README setup).
- `pnpm install` completed.

## Scenario 1 — Full gate is green (SC-001, SC-003, US1/AC1)

```bash
pnpm verify
```

**Expected**: exit code 0; Biome reports zero findings and the unit tests + production build
succeed.

## Scenario 2 — Lint violation fails `check` with actionable output (US1/AC2)

1. Introduce a deliberate lint violation in `src/app/app.ts` (e.g. an unused import).
2. Run:

   ```bash
   pnpm check
   ```

**Expected**: non-zero exit; output points at `src/app/app.ts` with the offending rule
(`file:line` format). Revert the change after the check.

## Scenario 3 — Auto-fix and idempotent format (US2)

1. Break formatting in a source file (reorder imports, misindent).
2. Run:

   ```bash
   pnpm check:fix
   ```

   Then:

   ```bash
   pnpm format
   pnpm format   # second run
   ```

**Expected**: first `format` rewrites the file; second `format` produces no further diff
(idempotency). `git diff` shows a clean, canonical result.

## Scenario 4 — Offline reproducibility (FR-006, US3)

1. Disconnect from the network.
2. Run:

   ```bash
   pnpm check
   ```

**Expected**: succeeds cleanly with zero findings — no network access required.

## Scenario 5 — Prettier fully removed (FR-004, SC-004)

```bash
git grep -in "prettier"   # code, configs, and docs
```

Also confirm no `.prettierrc*` file exists and `package.json` has no `prettier` dependency.

**Expected**: zero matches; no Prettier config file.

## Ref

- Contracts: [toolchain-cli.md](./contracts/toolchain-cli.md)
- Command table: `README.md` (updated by this feature)
- Success criteria: [spec.md](./spec.md) SC-001…SC-004