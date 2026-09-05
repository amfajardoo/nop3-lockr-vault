# Research: Developer Toolchain

**Phase 0 output for `001-toolchain`.** Resolves the toolchain decisions for Biome v2 in an
Angular SPA before design.

## Decision 1: Biome replaces Prettier as the single tool for lint + format

- **Decision**: Install `@biomejs/biome@2.5.12` as an exact-pinned devDependency; remove
  `prettier` and `.prettierrc`; migrate formatting to `biome.json`.
- **Rationale**: One Rust binary covers linting, formatting, and import organization in a
  single pass. It removes two tools (ESLint + Prettier configs) from the toolchain and lowers
  the barrier for reviewers: one config file, one dependency, deterministic output when the
  version is pinned. Biome 2.x is the current stable line (published 2026, v2.5.12).
- **Alternatives considered**: keeping Prettier for formatting + ESLint for linting (two tools,
  two configs, slower, more maintenance); ESLint alone with formatting deferred (no style gate).

## Decision 2: Command surface

- **Decision**:
  - `pnpm format` → `biome format --write .`
  - `pnpm check` → `biome check .` (read-only, reports `file:line` + rule)
  - `pnpm check:fix` → `biome check --write .` (applies safe lint/format fixes)
  - `pnpm verify` → `biome ci . && pnpm test && pnpm build` (all gates, no writes)
  - `pnpm check:format` → `biome ci .` (formatting-only gate, canonical for CI later)
- **Rationale**: `biome ci` is Biome's canonical CI command — it never writes files and fails on
  any finding (formatter + linter + assist). `check` (with `--write`) is the interactive dev
  equivalent. `verify` composes static analysis + unit tests + production build to satisfy
  FR-003 / Constitution V without needing CI hosting yet.
- **Alternatives considered**: a `lint`/`format` split script pair (redundant — `check` already
  covers both); using `tsc --noEmit` instead of the Angular build for typecheck (the build is
  AOT and already mandatory in `verify`; an extra `tsc` pass would duplicate work).

## Decision 3: TypeScript project alignment

- **Decision**: Consolidate strict compiler options under the shared root `tsconfig.json`
  (`strict`, target/module, `skipLibCheck`, module resolution), and have `tsconfig.app.json`
  and `tsconfig.spec.json` extend it, matching the settings the Angular unit-test builder uses.
- **Rationale**: The typecheck gate (production build) and the Vitest runner must agree on types.
  A single root prevents drift between what "compiles" and what "tests compile".
- **Alternatives considered**: leaving tsconfigs as scaffolded (risk of the same type environment
  divergence that plagued the earlier bootstrap attempt).

## Decision 4: Ignores

- **Decision**: `biome.json` `files.ignore` excludes `dist/`, `node_modules/`, `.angular/`,
  `coverage/`, `playwright-report/`, `test-results/` (FR-009).
- **Rationale**: generated artifacts must never surface findings; repository `.gitignore` already
  carries the same set.
- **Alternatives considered**: relying on VCS ignore integration — kept on, but explicit ignores
  make the config self-contained and offline-independent.

## Decision 5: Toolchain requirements verification

- **Decision**: No new runtime dependencies. `@biomejs/biome` is a zero-dependency dev tool.
- **Rationale**: minimal supply-chain surface for a foundation feature (Constitution IV).
- **Alternatives considered**: `biome-config` setup helpers — rejected, they add configuration
  dependencies to a file that should be hand-tended.