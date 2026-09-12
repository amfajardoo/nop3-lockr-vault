# Implementation Plan: Credential Data Contract

**Branch**: `feature/008-credential-data-contract` | **Date**: 2026-09-12 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/008-credential-data-contract/spec.md`

## Summary

The vault domain needs a validated data model as its foundation. This feature introduces the Credential data contract (JSON Schema under `contracts/`), a VaultStore (signal store from `@ngrx/signals`) with boundary-validated CRUD mutations, and a mock data service that seeds realistic well-formed credentials. The contract is enforced at every runtime boundary through the `safeParse` wrapper from 007. No persistence, no encryption, no Supabase — mock only.

## Technical Context

**Language/Version**: TypeScript 5.8+ (strict mode)

**Primary Dependencies**: Angular 22, `@ngrx/signals` (installed 003), Zod v4.6+ with `safeParse` wrapper from 007, `json-schema` (available), `uuid` via native `crypto.randomUUID()`

**Storage**: In-memory only (mock data; no persistence, no IndexedDB, no Supabase)

**Testing**: Vitest (via Angular CLI `ng test`), `vitest-angular` test runner, `@angular/cdk/testing` available for component harnesses (no component harnesses in this feature — pure services)

**Target Platform**: Modern browsers (Chrome 130+, Edge, Firefox, Safari 17+)

**Project Type**: Web application (Angular SPA, single-project layout)

**Performance Goals**: VaultStore mutations synchronous; no async operations; mock service is static

**Constraints**: Mock only — Constitution vault clauses (AES-256-GCM, Argon2id, Supabase blob, zero-knowledge for Master Password) are explicitly out of scope (roadmap deferred). No new runtime or dev dependencies added by this feature.

**Scale/Scope**: ~3-4 files of new source code (schema + store + service + types), ~5-6 test files. Minimal bundle impact; schema only loaded when vault domain initializes.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Gate | Status | Notes |
|------|--------|-------|
| **I. Anti-abstraction** | ✅ PASS | No wrapper services, base classes, or abstract layers. A flat schema file, a flat store, a flat service. |
| **II. Specification Structure** | ✅ PASS | `contracts/credential.schema.json` provided under feature's `contracts/` dir; spec, data-model.md, tasks.md all present. |
| **III. No.forRoot** | ✅ PASS | VaultStore uses `providedIn: 'root'` (same as ThemeStore 003). No standalone `forRoot()`. |
| **IV. TypeScript Strict** | ✅ PASS | Strict mode enforced; no `any` types in new code. |
| **V. Angular Defaults** | ✅ PASS | No components in this feature. No `ChangeDetectionStrategy.OnPush`, no `standalone: true`. |
| **VI. No New Plugins** | ✅ PASS | Using existing dependencies only (`@ngrx/signals`, `zod`, `json-schema` available). No new dev or runtime deps. |
| **VII. Mock Data Only** | ✅ PASS | Explicitly in scope: Constitution vault clauses (AES-256-GCM, Argon2id, Supabase blob, zero-knowledge for Master Password) deferred to dedicated storage/crypto feature. |
| **VIII. Automated Verifiability** | ✅ PASS | Unit tests required per spec (SC-001 through SC-006). |

**Post-design re-check**: All gates remain PASS. `contracts/credential.schema.json` satisfies Specification Structure. No abstraction layers added satisfies Anti-abstraction. Store and service are flat files with no architectural wrappers.

## Project Structure

### Documentation (this feature)

```text
specs/008-credential-data-contract/
├── spec.md              # Feature specification (source of truth for WHAT)
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output — JSON Schema
│   └── credential.schema.json
├── checklists/
│   └── requirements.md  # Spec quality checklist
└── tasks.md             # Phase 2 output (/speckit.tasks)
```

### Source Code (repository root)

```text
src/
├── validation/
│   └── validation.ts            # 007 safeParse wrapper (existing)
├── theme/
│   └── theme.store.ts           # 003 pattern reference (existing)
├── vault/
│   ├── credential.schema.ts     # 008 NEW — Zod schema + z.infer types (runtime, aligned with JSON Schema)
│   ├── credential.schema.spec.ts    # 008 NEW — schema validation boundary tests
│   ├── vault.store.ts           # 008 NEW — VaultStore (signalStore with CRUD mutations)
│   ├── vault.store.spec.ts      # 008 NEW — CRUD mutation tests
│   ├── vault.service.ts         # 008 NEW — Mock data service (providedIn: 'root')
│   └── vault.service.spec.ts    # 008 NEW — mock data service tests
└── app/
    └── app.ts                   # 006 (existing, unchanged)

specs/008-credential-data-contract/contracts/
└── credential.schema.json       # 008 NEW — JSON Schema (source of truth for Credential shape)
```

**Structure Decision**: Single-project layout (unchanged from 004). The `src/vault/` directory mirrors the convention of `src/theme/` (domain-specific store + supporting files in a flat folder). The JSON Schema lives in the feature's `contracts/` dir per Constitution Specification Structure (convention: `specs/002-theme-foundation/contracts/`). The source tests sit next to their sources under `src/vault/`, matching the project's existing convention.

## Complexity Tracking

*No violations — table not needed.*
