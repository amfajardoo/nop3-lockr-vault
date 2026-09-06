# Implementation Plan: Theme Foundation

**Branch**: `feature/002-theme-foundation` | **Date**: 2026-09-05 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/002-theme-foundation/spec.md`

## Summary

Give Lockr Vault a no-flash, class-driven theming foundation: Tailwind v4's `dark` variant is
switched to a root-class driver (`@custom-variant dark (&:where(.dark, .dark *))`), the light/dark
palettes are defined once as semantic tokens (raw CSS variables on `:root`/`.dark` mapped to
utilities via `@theme inline`), and a synchronous pre-paint script in `index.html` resolves the
stored-or-OS theme before the first frame paints. No toggle UI (feature 003), no shell (004), no e2e
(005).

## Technical Context

**Language/Version**: TypeScript ~6.0 (strict), Angular 22.x

**Primary Dependencies**: Angular (standalone), Tailwind CSS v4.1.x via `@tailwindcss/postcss`
(`.postcssrc.json`), PostCSS 8

**Storage**: browser `localStorage` under key `lockr.theme` (read-only in this feature; writer is
feature 003) — plain device storage for a non-sensitive preference per constitution

**Testing**: Angular `@angular/build:unit-test` (Vitest + jsdom available in devDependencies);
unit tests colocated as `*.spec.ts`

**Target Platform**: web (modern evergreen browsers)

**Project Type**: Angular SPA (frontend only; no backend in bootstrap features)

**Performance Goals**: correct palette on the first painted frame (no FOUC); applying/removing the
root marker reflects the palette on the next frame well under the constitution's 100ms theme-switch
SLA

**Constraints**: offline-first rendering (no network to resolve/render), WCAG AA / AXE-clean in both
palettes, static analysis gate (Biome) green, line coverage > 90%, spec scenario coverage 100%

**Scale/Scope**: single-page scaffold only; tokens must be the stable contract future screens build
on

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-checked after Phase 1 design — PASSED.*

| Clause | Application to this feature | Status |
|--------|------------------------------|--------|
| Spec-First | Spec approved (002) before any code | ADHERED |
| Behavioral Immutability | Scenarios frozen from spec; code must match | ADHERED |
| Zero Trust | Boot resolver treats stored value as untrusted input; malformed never crashes | ADHERED |
| Security by Design | Zero secret material; theme is non-sensitive; plain storage clause applies | ADHERED |
| Automated Verifiability | 100% scenarios tested; >90% lines; gates green pre-PR | ADHERED (enforced in tasks/implementation) |
| Testing/Accessibility | WCAG AA + AXE-clean in both palettes; contrast asserted by token test | ADHERED |
| Repository Governance | Feature branch from main; single review merge via PR; gates green locally | ADHERED |

Complexity Tracking: no violations to justify (single feature, standard toolchain pieces).

## Project Structure

### Documentation (this feature)

```text
specs/002-theme-foundation/
├── spec.md              # Feature law (US, FR, SC)
├── plan.md              # This file
├── research.md          # Phase 0 decisions (D1-D5)
├── data-model.md        # Entities: ThemeChoice, EffectiveTheme, marker, tokens
├── quickstart.md        # Validation/run guide
├── contracts/
│   └── theme-choice.schema.json   # Stored preference data contract
├── checklists/
│   └── requirements.md  # Spec quality checklist (19/19)
└── tasks.md             # Created by /speckit.tasks
```

### Source Code (repository root)

```text
src/
├── index.html                 # + inline pre-paint theme script in <head> (before stylesheet)
├── styles.css                 # Tailwind import + @custom-variant dark + tokens (:root/.dark) + @theme inline
├── main.ts
└── app/
    ├── app.ts                 # component (unchanged logic)
    ├── app.html               # scaffold migrated to semantic token utilities
    ├── app.css                # layout only, token-driven
    ├── app.config.ts
    ├── app.routes.ts
    └── app.spec.ts
tests/ (colocated *.spec.ts under src/)
└── (token contrast test, pre-paint resolver behavior test via jsdom)
```

**Structure Decision**: Single-project Angular SPA; everything stays inside `src/` matching the
existing layout. New test surface is colocated (`*.spec.ts`) per the constitution's Angular guidance.
No new directories required beyond the existing structure.

## Complexity Tracking

None. No constitution violations; no multi-project layering, no repository pattern, no extra
dependencies beyond what the toolchain already provides (jsdom is already a devDependency for the
pre-paint test strategy).