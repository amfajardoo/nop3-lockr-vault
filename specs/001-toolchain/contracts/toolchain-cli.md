# Contract: Developer Toolchain CLI Surface

Phase 1 output for `001-toolchain`. Defines the contributor-facing contract of the toolchain:
what commands exist, what they may write, and what "green" means.

## 1. Commands

Invoked through the project package manager (`pnpm`). All commands are English-only and must
run identically on Windows/PowerShell and POSIX shells.

| Command | Behavioral contract | Exit code contract |
|---|---|---|
| `pnpm format` | Rewrites supported files in place to the canonical style (US2) | 0 on success; non-zero on error |
| `pnpm check` | Read-only static analysis. Reports findings as `file:line` + rule. Never writes files (FR-002) | 0 iff zero findings; non-zero with actionable report otherwise |
| `pnpm check:fix` | Applies safe lint/format fixes in place (US2/AC3) | 0 on success; non-zero if unfixable findings remain |
| `pnpm check:format` | Read-only formatting gate only (`biome ci` mode, no writes) | 0 iff formatting is canonical |
| `pnpm verify` | Runs formatting gate + static analysis + unit tests + production build; stops at first failure (FR-003) | 0 iff every gate passes; non-zero otherwise |
| `pnpm test` | Existing unit-test runner; unchanged | 0 iff all tests pass |
| `pnpm build` | Existing production build; serves as the typecheck gate | 0 iff build + typecheck pass |

## 2. Behavior rules

- **Never writes into generated/ignored artifacts**: `dist/`, `node_modules/`, `.angular/`,
  `coverage/`, `playwright-report/`, `test-results/` are excluded from every command's scope
  (FR-009).
- **Offline**: `check` / `check:format` / `format` must succeed with no network access; no
  remote rule downloading (FR-006).
- **Idempotent format**: running `pnpm format` twice yields no second diff (US2/AC2).
- **Deterministic across contributors**: with the committed config and pinned Biome version,
  two contributors formatting the same code produce identical output (US3).
- **Diagnostic clarity**: a failure report must distinguish "not formatted", "lint rule
  violation", and (via `verify`) "unit test failure" / "build type error" so the contributor
  knows what to fix (Edge Cases).

## 3. Consumers

| Consumer | Reads | Invokes |
|---|---|---|
| Developer (local) | check output, format results | any; primarily `format`, `check:fix`, `verify` |
| Reviewer / PR gate | `verify` result | `verify` |
| Future CI feature | `check:format` + `test` + `build` | the same commands, non-interactively |

## 4. Out of scope (per spec Assumptions)

- Markdown formatting automation.
- Hosted CI wiring (deferred tooling feature).
- Pre-commit hooks (husky/lint-staged) — not requested by the spec.