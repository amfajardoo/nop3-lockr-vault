# Implementation Plan: Credential Form (Create & Edit)

**Branch**: `feature/014-credential-form` | **Date**: 2026-09-26 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/014-credential-form/spec.md`

## Summary

The vault becomes writable. This feature adds a single reusable credential form component
rendered by two lazy dashboard-child routes — `credentials/new` (create) and
`credentials/:id/edit` (edit) — built on Signal Forms (`@angular/forms/signals`, stable in
Angular v22) inside Angular Material form controls. Entry points: an "Add credential" action in
the credential list (populated and empty states) and an "Edit" action in the credential detail
view. Valid submit calls the unchanged `VaultStore.add`/`update` mutations, then navigates —
create lands on the list, edit on the credential's detail. Client validation mirrors the 008 zod
contract exactly and blocks submission before a payload can be silently discarded by the store.
Mock only: no `src/vault/` changes, no persistence, no crypto.

## Technical Context

**Language/Version**: TypeScript 5.8+ (strict mode)

**Primary Dependencies**: Angular 22.1 (standalone, lazy `loadComponent`,
`withComponentInputBinding()` already enabled in `app.config.ts`), `@angular/forms/signals`
(Signal Forms: `form`, `submit`, `required`, `[formField]`/`FormRoot` directives),
`@angular/material` 22.1.6 (`MatFormFieldModule`, `MatInputModule`, `MatButtonModule`,
`MatCardModule`), `@angular/router` (`RouterLink`, signal `input()` route params),
`@ngrx/signals` VaultStore (008), zod contract (008) as validation-parity reference

**Storage**: In-memory only — VaultStore seeded at bootstrap (009); no persistence, no IndexedDB,
no Supabase

**Testing**: Vitest (Angular CLI `ng test`) with harness-first CDK component tests —
`MatFormFieldHarness` / `MatInputHarness` / `MatErrorHarness` (`@angular/material/{form-field,input}/testing`)
plus `MatButtonHarness`, driven through the shared toolkit in `src/testing/`
(`setupModule`, `createFixture`, `query`, `harnessLoader`, `routerHarnessLoader`); route-level
behavior via `RouterTestingHarness`; mutant checks mandatory; no axe/Playwright (dropped by
`chore/010-repo-cleanup`; a11y asserted as observable Material semantics per AGENTS)

**Target Platform**: Modern browsers (Chrome 130+, Edge, Firefox, Safari 17+)

**Project Type**: Web application (Angular SPA, single-project layout)

**Performance Goals**: Synchronous, signal-driven form state; no async validation; store mutation
only on valid submit; no layout thrash (notes textarea grows)

**Constraints**: Mock only — crypto/AES-256-GCM/Argon2id/Supabase deferred (roadmap). No
`src/vault/` edits (FR-008/FR-016). Signal Forms mandatory — no reactive/template-driven
`FormGroup`/`ngModel` form state (FR-005). Validation must mirror zod exactly, no value
transformation (FR-006). Theme contract and dashboard chrome untouched (FR-016). English copy
only. Tailwind remains dropped (013): component styles consume CSS variables/Material theming.

**Scale/Scope**: New component `credential-form` (ts+html+css+spec), two route registrations,
entry-point edits in `credential-list` (header + empty state) and `credential-detail` (action),
their spec updates, and the spec artifacts of this feature. ~8-10 source files touched.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Gate | Status | Notes |
|------|--------|-------|
| **I. Spec-First** | ✅ PASS | spec.md authored on the feature branch before any code; no implementation decisions leak into the spec beyond declared assumptions. |
| **II. Behavioral Immutability** | ✅ PASS | No silent changes to 006 shell, 008 store/schema, or 009 read/delete behavior; entry points are additive; create/edit are new routes. |
| **III. Zero Trust in Human Memory** | ✅ PASS | Edge cases spec'd: whitespace-only input vs zod parity, double submit, `/credentials/new` ranking, stale edit ID, disappearing entry mid-edit, unsaved changes, duplicate names. |
| **IV. Security by Design** | ✅ PASS | Password input masked (`type="password"`); payload reaches only the store (no logging/extra state); no secrets in URLs or navigation state; crypto clauses remain deferred. |
| **V. Automated Verifiability** | ✅ PASS | Every US scenario has a harness-driven test; mutant checks required (SC-007); `pnpm verify` green before PR. |
| **VI. Anti-abstraction** | ✅ PASS | One route component consumes `VaultStore.add/update/getById` verbatim; no form service, no repository layer, no wrapper facade. |
| **VII. Specification Structure** | ✅ PASS | spec.md, plan.md, research.md, data-model.md, quickstart.md, contracts/navigation.md, checklists/requirements.md, tasks.md. |
| **VIII. Repository Governance** | ✅ PASS | Feature branch from updated `main` (post-010–013 merges); mock-only; sequential number 014 (010–013 consumed by Material migration). |

**Post-design re-check**: All gates remain PASS. The design adds exactly one component and two
routes; store and schema stay byte-identical; navigation contract is documented in
`contracts/navigation.md`; validation parity with zod is locked by tests.

## Project Structure

### Documentation (this feature)

```text
specs/014-credential-form/
├── spec.md              # Feature specification (source of truth for WHAT)
├── plan.md              # This file
├── research.md          # Phase 0 output — decisions D1–D8
├── data-model.md        # Phase 1 output — form model + routes + store interplay
├── quickstart.md        # Phase 1 output — manual validation guide
├── contracts/
│   └── navigation.md    # UI route contract (create/edit entry + exit paths)
├── checklists/
│   └── requirements.md  # Spec quality checklist
└── tasks.md             # Phase 2 output
```

### Source Code (repository root)

```text
src/
├── app/
│   ├── app.routes.ts                 # UPDATED — dashboard children: "credentials/new",
│   │                                 #   "credentials/:id/edit" (lazy loadComponent)
│   ├── credential-form/
│   │   ├── credential-form.ts        # NEW — Signal Forms model + submit/cancel + mode logic
│   │   ├── credential-form.html      # NEW — Material form fields, mat-errors, actions
│   │   ├── credential-form.css       # NEW — token-only styles
│   │   └── credential-form.spec.ts   # NEW — US1/US2/US3 harness specs + mutant targets
│   ├── credential-list/
│   │   ├── credential-list.html      # UPDATED — "Add credential" entry point (header +
│   │   │                             #   empty-state CTA, FR-002)
│   │   └── credential-list.spec.ts   # UPDATED — entry-point assertions
│   └── credential-detail/
│       ├── credential-detail.html    # UPDATED — "Edit" action (FR-003)
│       └── credential-detail.spec.ts # UPDATED — edit entry-point assertion
└── vault/                            # 007/008 — UNCHANGED (schema, store, service)
```

**Structure Decision**: Single-project layout unchanged. The form is one route-level component
under `src/app/credential-form/` beside its siblings (list/detail), consuming the flat
`src/vault/` domain layer. Both modes share the component; the mode is derived from the route
(`:id` present → edit). The UI navigation contract lives in `contracts/navigation.md`; the data
contract remains the 008 `credential.schema.json` (referenced, not duplicated).

## Complexity Tracking

*No violations — Complexity Tracking table not needed.* (No new abstractions or services; one
component in two modes is the minimum surface for the routed write view; navigation targets are
fixed strings, not configurable policy.)

## Mandatory Post-Execution Hooks

None registered (`.specify/extensions.yml` does not exist).
