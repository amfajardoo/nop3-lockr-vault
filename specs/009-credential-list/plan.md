# Implementation Plan: Credential List

**Branch**: `feature/009-credential-list` | **Date**: 2026-09-12 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/009-credential-list/spec.md`

## Summary

The dashboard shows the vault's credentials. This feature mounts the credential list as the
dashboard's primary content: the list renders every credential from the VaultStore (name,
username, domain, favorite indicator) in insertion order, seeds the store at app bootstrap,
ships a routed read-only detail view with a masked-by-default password and a reveal toggle,
renders a dedicated empty state when the vault is empty, and provides a confirmed delete flow
via an inline native `<dialog>`. Both routes are lazy `loadComponent` children of the 006 shell.
No `src/vault/` changes, no create/edit (next feature), mock only.

## Technical Context

**Language/Version**: TypeScript 5.8+ (strict mode)

**Primary Dependencies**: Angular 22 (standalone, `loadComponent`), `@angular/router`
(`RouterLink`, `ActivatedRoute`, `RouterTestingHarness`), `@ngrx/signals` VaultStore (008),
`MockDataService` (008), `axe-core` (component specs)

**Storage**: In-memory only — VaultStore seeded once at bootstrap from `MockDataService`; no
persistence, no IndexedDB, no Supabase

**Testing**: Vitest (Angular CLI `ng test`) for unit; Playwright CT gallery (port 5173) for
`tests/components/credential-list.spec.ts` + `credential-detail.spec.ts`; AXE in both; no CDK
harness needed (driven through real DOM + public store API)

**Target Platform**: Modern browsers (Chrome 130+, Edge, Firefox, Safari 17+)

**Project Type**: Web application (Angular SPA, single-project layout)

**Performance Goals**: Render synchronous over store signals; no async data fetching; native
`<dialog>` for delete; no layout thrash

**Constraints**: Mock only — crypto/AES/Argon2id/Supabase deferred (roadmap). No `src/vault/`
edits (FR-017). Theme contract, dashboard shell chrome unchanged (FR-002). One dialog at a time
(FR-014). English copy only.

**Scale/Scope**: New components `credential-list` + `credential-detail` (each ts+html+css+spec+
story), route wiring (children in `app.routes.ts`), bootstrap seeding in `app.ts`, placeholder
removal in `dashboard.html` + `dashboard.spec.ts` update, gallery resource registration update.
~12-14 files.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Gate | Status | Notes |
|------|--------|-------|
| **I. Spec-First** | ✅ PASS | spec.md approved artifacts; branch from `main`; no code before spec. |
| **II. Behavioral Immutability** | ✅ PASS | All US1–US4 scenarios testable; no silent behavior changes to 006/008 contracts. |
| **III. Zero Trust in Human Memory** | ✅ PASS | Edge cases in spec (missing id, empty store, dialog reuse, long strings, malformed store, no-op delete). |
| **IV. Security by Design** | ✅ PASS | Password masked in DOM by default (FR-008); reveal is explicit user action; no secret logging/state. |
| **V. Automated Verifiability** | ✅ PASS | Every scenario/edge has a test; mutant checks per story; `pnpm verify` green before PR. |
| **VI. Anti-abstraction** | ✅ PASS | No wrapper services/layers; components consume store API verbatim; transient UI state only. |
| **VII. Specification Structure** | ✅ PASS | spec.md, contracts/ (navigation contract), data-model.md, checklists/ present. |
| **VIII. Repository Governance** | ✅ PASS | Feature branch from `main`; mock-only confirmed (vault crypto clauses deferred). |

**Post-design re-check**: All gates remain PASS. Design introduced no new abstractions
(components read `VaultStore`/`MockDataService` directly), no persistence/crypto, and every US
has an independent automated proof. Verification mirror: `Specification Structure` holds
(`contracts/navigation.md` documents the UI interface this feature adds).

## Project Structure

### Documentation (this feature)

```text
specs/009-credential-list/
├── spec.md              # Feature specification (source of truth for WHAT)
├── plan.md              # This file
├── research.md          # Phase 0 output — design decisions D1–D9
├── data-model.md        # Phase 1 output — consumed Credential + UI state + routes
├── quickstart.md        # Phase 1 output — runnable validation guide
├── contracts/           # Phase 1 output
│   └── navigation.md    # UI route contract (/, /credentials/:id)
├── checklists/
│   └── requirements.md  # Spec quality checklist
├── contracts/           # (data source of truth = 008 credential.schema.json)
└── tasks.md             # Phase 2 output (/speckit.tasks)
```

### Source Code (repository root)

```text
src/
├── app/
│   ├── app.ts                        # UPDATED — bootstrap seeds VaultStore when empty
│   ├── app.routes.ts                 # UPDATED — dashboard children: {"" → list}, {"credentials/:id" → detail}
│   ├── dashboard/
│   │   ├── dashboard.html            # UPDATED — placeholder copy replaced by list mount
│   │   ├── dashboard.spec.ts         # UPDATED — main now mounts child list route
│   │   └── dashboard.ts              # UNCHANGED (shell chrome untouched)
│   ├── credential-list/
│   │   ├── credential-list.ts        # NEW — list + empty state + favorite + delete dialog
│   │   ├── credential-list.html      # NEW
│   │   ├── credential-list.css       # NEW — token-only styles
│   │   ├── credential-list.spec.ts   # NEW — US1/US3/US4 unit specs + AXE
│   │   └── credential-list.story.ts  # NEW — gallery stories (seeded / empty)
│   └── credential-detail/
│       ├── credential-detail.ts      # NEW — read view + reveal toggle + not-found
│       ├── credential-detail.html    # NEW
│       ├── credential-detail.css     # NEW
│       ├── credential-detail.spec.ts # NEW — US2 unit specs + AXE
│       └── credential-detail.story.ts# NEW — gallery stories (valid id / unknown id)
└── vault/                            # 008 — UNCHANGED (schema, store, service)

playwright/gallery/vite.component-resource.ts   # UPDATED — register new external templates
tests/components/credential-list.spec.ts         # NEW — gallery CT specs (list)
tests/components/credential-detail.spec.ts       # NEW — gallery CT specs (detail)
```

**Structure Decision**: Single-project layout (unchanged from 004/006). Vault UI components live
under `src/app/<feature>/` alongside the shell (matching `theme-toggle/` and `dashboard/`
conventions), consuming the flat `src/vault/` domain layer (008). External templates stay
colocated and are registered in the gallery resource resolver. The UI navigation contract lives
in the feature's `contracts/` dir per Constitution Specification Structure; the data contract is
the 008 `credential.schema.json` (referenced, not duplicated).

## Complexity Tracking

*No violations — Complexity Tracking table not needed.* (No abstraction layers, no new projects,
no repository pattern. Native `<dialog>` avoids a dialog service; two route components are the
minimum for the routed read view.)

## Mandatory Post-Execution Hooks

None registered (`.specify/extensions.yml` does not exist).