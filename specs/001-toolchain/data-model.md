# Data Model: Developer Toolchain

**Phase 1 output for `001-toolchain`.** Describes the configuration entities and the npm-script
contract this feature installs. No runtime data is persisted; everything below is developer
tooling surface.

## Entities

### Biome configuration file (`biome.json`)

| Field | Kind | Semantics |
|---|---|---|
| `$schema` | string (URL) | Editor/CLI schema reference, pinned to the installed version |
| `files.ignore` | string[] | dot-globs excluded from all tooling (`dist/`, `node_modules/`, `.angular/`, `coverage/`, `playwright-report/`, `test-results/`) |
| `formatter` | object | Enabled with `indentStyle: space`, `indentWidth: 2`, `lineWidth: 100` |
| `linter` | object | Enabled, `rules.recommended: true`; Angular-friendly overrides (e.g. `noDefaultExport` off for components, `noExplicitAny` error) |
| `organizeImports` | object | Enabled — import sorting on the same single pass |
| `vcs` | object | `enabled: true`, `clientKind: git`, `useIgnoreFile: true` |

### npm scripts (package.json)

The contributor-facing CLI surface. Only these are in scope (FR-003, FR-008):

| Script | Command | Writes files | Gate |
|---|---|---|---|
| `format` | `biome format --write .` | yes | – |
| `check` | `biome check .` | no | lint + format + imports |
| `check:fix` | `biome check --write .` | yes | applies safe fixes |
| `check:format` | `biome ci .` | no | format-only gate (CI-ready) |
| `test` | `ng test` (existing) | no | unit tests |
| `build` | `ng build` (existing) | yes (dist) | typecheck + build |
| `verify` | `biome ci . && pnpm test && pnpm build` | no (dist is ignored) | full gate |

### TypeScript project references

| File | Role | Relation |
|---|---|---|
| `tsconfig.json` | shared strict compiler options (root) | extended by both below |
| `tsconfig.app.json` | production typecheck (AOT build) | extends root |
| `tsconfig.spec.json` | unit-test runner types | extends root |

## Validation rules

- `biome ci .` exits 0 iff no format/lint/import findings across the configured scope (spec
  FR-002, FR-006).
- `verify` exits non-zero if any of its three commands fails (`&&` chaining, FR-003).
- A second `format` run changes nothing (idempotency, US2/AC2).
- Grep for `prettier` / `.prettierrc` returns no hits in code, configs, or docs (FR-004, SC-004).

## State transitions

- Not applicable: no runtime data, no user-visible state. Transition is linear development
  tooling activation (installed → configured → green).