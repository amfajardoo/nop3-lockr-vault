# Research: Zod Runtime Validation

**Feature**: [007-zod-validation](../specs/007-zod-validation/spec.md)
**Date**: 2026-09-12

## Scope

Resolve the technical unknowns for "add Zod-based runtime validation to the project": which package
(full `zod` vs `zod/mini`), what the shared wrapper looks like (schema + safe parse, never throws),
how structured issue reporting maps to Plan FR-005, and how the 003 theme store migrates without
behavioral change. Existing contracts (`theme-choice.schema.json`, 002) are the source of truth;
this feature adds runtime enforcement, not a new contract.

## Decisions

### D1 - Use full `zod` (v4.6.2), not `zod/mini`

- **Decision**: Add `zod@^4.6.2` to runtime `dependencies`. Import as `import * as z from "zod"`.
- **Rationale**: Zod 4 is the stable line and the project's stated choice ("Zod"). Full `zod`
  loads the built-in `en` locale so `issue.message` is human-readable out of the box (Plan FR-005);
  `zod/mini` deliberately returns `"Invalid input"` unless a custom error map is wired up, which
  would force extra boilerplate for the same result. Both packages are runtime (not dev) by contract
  (Plan FR-001). Full zod tree-shakes with Rollup (final build) when imported as
  `import * as z from "zod"`; the docs flag that default/named-then-esbuild bundling can drag in all
  locales — Angular's production build is Rollup-based, so `import * as z` is safe.
- **Alternatives considered**: `zod/mini` — rejected (generic messages, custom error-map overhead,
  marginal size win for a scalar boundary); no validation library (status quo `isThemeChoice`) —
  rejected (every future boundary would hand-roll its own validator, violating the shared-capability
  goal of the spec).

### D2 - Wrapper lives in `src/validation/` and returns a discriminated result; never throws

- **Decision**: New directory `src/validation/` with a single helper module
  (`src/validation/validation.ts`):

  ```ts
  import * as z from "zod";

  export interface ValidationIssue {
    path: string;    // dotted path, e.g. "items.3.name"; "" for a root issue
    code: string;    // stable Zod v4 issue code, e.g. "invalid_type", "invalid_enum_value"
    message: string; // deterministic human-readable message (en locale)
  }

  export type ValidationResult<T> =
    | { success: true; value: T }
    | { success: false; issues: ValidationIssue[] };

  export function safeParse<T>(schema: z.ZodType<T>, input: unknown): ValidationResult<T>;
  ```

  `safeParse` calls `schema.safeParse(input)` and maps `result.error.issues` into the
  `ValidationIssue[]` shape; it never throws, and output data is the inferred schema type on success.
  `z.object()`'s default policy is **strip** (unknown keys are discarded, not rejected) — recorded in
  the spec as the single sanctioned choice (Plan FR-006).
- **Rationale**: spec US1/FR-002/FR-005. A discriminated result lets callers handle success/failure
  with exhaustive `@if`/branching instead of try/catch sprinkled per boundary; full issue paths
  (`issue.path` → dotted string, numbers formatted like `key.3`) satisfy Plan FR-005 "every offending
  field is listed". The generic `T` preserves inferred schema types (strict, no `any`), Plan FR-007.
- **Alternatives considered**: exporting raw `schema.parse`/`schema.safeParse` everywhere — rejected
  (callers would re-derive the `ValidationIssue` mapping per feature and `parse` throws); a shared
  `ValidationError` class wrapper — rejected (favoring the discriminated union the spec's "never
  throws" language requires).

### D3 - Theme schema co-located: `src/theme/theme-choice-schema.ts`

- **Decision**: Create `src/theme/theme-choice-schema.ts` with the enum schema built from the
  existing 002 constants:

  ```ts
  import * as z from "zod";
  import { CHOICE_DARK, CHOICE_LIGHT, CHOICE_SYSTEM } from "./theme-contract";

  export const themeChoiceSchema = z.enum([CHOICE_LIGHT, CHOICE_DARK, CHOICE_SYSTEM]);
  export type ThemeChoice = z.infer<typeof themeChoiceSchema>;
  ```

  `theme.store.ts` then swaps its hand-rolled `isThemeChoice`/`VALID_CHOICES`/`ThemeChoice` for
  `safeParse(themeChoiceSchema, ...)`; `readStoredChoice` returns `CHOICE_SYSTEM` on any failure
  (invalid value, `null`, blocked storage); `setChoice` is a no-op on failure. Public store API and
  observable behavior stay identical (Plan FR-004, FR-008 allows the co-located schema file).
- **Rationale**: spec US2. `z.enum` over the frozen 002 literals keeps the runtime validator aligned
  with `theme-choice.schema.json`; the store's existing 003 spec suite (corrupt values, blocked
  storage, out-of-enum inputs) already encodes every acceptance scenario and must stay green
  unchanged — the strongest possible mutant gate.
- **Alternatives considered**: leaving `isThemeChoice` and only wrapping the read — rejected (two
  validation patterns in one file, violates the single-pattern goal); deriving the schema from the
  JSON Schema file at runtime — rejected (extra dependency; the enum of literals is trivially
  auditable).

### D4 - Validation fuzz corpus is deterministic and part of the wrapper spec

- **Decision**: `src/validation/validation.spec.ts` includes a bounded, deterministic fuzz corpus
  (a fixed list of malformed/random-ish values: `null`, `undefined`, `0`, `NaN`, `[]`, `{}`,
  `"neon"`, `{ a: 1 }`, nested garbage, …) run against `themeChoiceSchema` and a nested object
  schema; every case must complete without throwing and return a well-formed `ValidationResult`.
- **Rationale**: Constitution "Fuzzing Tests" + spec SC/Plan FR — no prior fuzz module exists in the
  repo (`**/*fuzz*.ts` → none). A fixed, deterministic corpus keeps the mutant check reproducible
  (no seeded PRNG flake) while giving the mandated malformed-input battery.
- **Alternatives considered**: true seeded PRNG fuzzing — rejected for this slice (flakiness vs the
  mutant-check requirement; can be layered later under `chore/*`); skipping fuzzing — rejected
  (Constitution V).

### D5 - Build/bundle impact is small and verified

- **Decision**: The wrapper uses only `z.enum`, `z.object`, `z.string` and `safeParse`; production
  build is Rollup (Angular 22/vite), which tree-shakes zod to the used pieces with
  `import * as z from "zod"`. Verification: `pnpm verify` stays green; the emitted `main.js` gain is
  not audited to a specific % threshold but must not introduce an obvious dead-code/whole-locale
  blip (spot-check bundle size before/after in the converge step).
- **Rationale**: spec SC-004. The theme boundary is a scalar read; anything beyond trivial tree-shake
  behavior would be an anomaly worth stopping for.
- **Alternatives considered**: aiming for a precise byte budget — rejected (no prior baseline agreed;
  would be speculative measurement).

## Open Questions

- Locale: English-only per spec assumption; stable `code` keys enable later i18n (US3 already
  guarantees this). No user input needed.
- No other blockers: vault persistence, crypto, and storage stay out of scope (roadmap);
  `contracts/` for 007 intentionally not created — the vault contract arrives with its data-model
  feature.