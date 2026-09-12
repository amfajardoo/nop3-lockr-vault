# Plan: Zod Runtime Validation

**Feature**: [007-zod-validation](../spec.md)
**Input**: spec.md, research.md, data-model.md, quickstart.md, checklists/requirements.md; 002 (theme-choice.schema.json) and 003 (ThemeStore) artifacts.
**Date**: 2026-09-12

## Summary

Add Zod 4 as a runtime validation capability: a thin shared wrapper under `src/validation/` that
returns a discriminated, never-throwing result, and migrate the 003 ThemeStore boundary
(`readStoredChoice`/`setChoice`) to use it. No new UI, no vault storage, no crypto. The only real
data boundary exercised is the theme choice; future features (vault data model, credential forms)
import the same wrapper. A deterministic malformed-input corpus satisfies the Constitution's fuzzing
requirement. All 003 specs stay green with zero behavioral change.

## Constitution Conformance

- **Specification First** — branch and implementation created only after this approved plan.
- **Zero Trust in Human Memory** — validation is declarative (schema-driven) per boundary; no
  hand-rolled guards.
- **Security by Design** — no secret material touched; non-sensitive preference boundary only.
- **Automated Verifiability (SC-001/002)** — US1/US2/US3 acceptance scenarios have corresponding
  unit specs (new wrapper specs + existing 003 specs covering corrupt/blocked/out-of-enum).
- **Fuzzing** — deterministic malformed-input corpus in `src/validation/validation.spec.ts`
  (Constitution V).
- **Standalone components** — no components introduced; wrapper is a plain TypeScript module.
- **Signals** — `ThemeStore` public contract (signals + methods) unchanged; internal helpers only.
- **No `any`** — wrapper is generic over `T` inferred by `z.infer`; strict + TS 4.1
  `noPropertyAccessFromIndexSignature` satisfied.
- **No `@HostBinding` / `@HostListener`** — N/A.
- **Native control flow** — N/A (no templates).
- **ProvidedAtRoot** — `ThemeStore` stays `providedIn: "root"`; wrapper is imported, not injected.
- **Review before commit** — implementation commits only after user approval.
- **Branching** — feature work on `feature/007-zod-validation`; no `chore/*` mixing.
- **Errors obfuscation** — US3 issues carry stable `code` keys; no raw exception text; human-readable
  message derived deterministically from the issue.

## Proposed Structure

### Documentation (this feature)

```
specs/007-zod-validation/
  spec.md              # Approved feature specification
  plan.md              # This file
  research.md          # Phase 0 output
  data-model.md        # Phase 1 output
  quickstart.md        # Phase 1 output
  checklists/
    requirements.md    # Quality checklist (completed in specify phase)
  tasks.md             # Phase 2 output (/speckit.tasks — not created here)
```

### Source Code (repository root)

```
src/
  validation/
    validation.ts       # NEW — safeParse<T>, ValidationIssue, ValidationResult<T>
    validation.spec.ts  # NEW — unit specs (US1/US3) + fuzz corpus (Constitution V)
  theme/
    theme-choice-schema.ts      # NEW — themeChoiceSchema, ThemeChoice type (Zod-inferred)
    theme-choice-schema.spec.ts # NEW — schema unit specs (accept/reject specific values)
    theme-store.ts              # MODIFIED — isThemeChoice removed; readStoredChoice/setChoice use safeParse
    theme.store.spec.ts         # UNCHANGED (already covers US2 acceptance scenarios)
    theme-contract.ts           # UNCHANGED (CHOOSE_*, THEME_STORAGE_KEY, resolveEffectiveTheme)
    ...
package.json   # MODIFIED — "zod": "^4.6.2" added to dependencies
```

**Structure Decision**: `src/validation/` is a small, feature-agnostic capability directory; the
theme schema is co-located under `src/theme/` (Plan FR-008 explicitly allows the single co-located
file as a mechanical addition to the 002/003 boundary directory).

## Strategy

### T001 — Green baseline
Confirm `pnpm verify` is GREEN on `feature/007-zod-validation` before any code change.

### T002 — RED: write wrapper spec + schema spec (US1/US3)
Create `src/validation/validation.spec.ts` and `src/theme/theme-choice-schema.spec.ts`:

`validation.spec.ts` (US1 + US3 + fuzz):
1. Valid schema + valid input → `{ success: true, value: inferred }`.
2. Invalid scalar → `{ success: false, issues }` with exactly one issue whose `path` is `""`, whose
   `code` is a known Zod v4 enum code, and whose `message` is a non-empty deterministic string.
3. Invalid nested object with two wrong fields → both issues present (no early single-error truncation).
4. `safeParse` never throws on any input (wraps the call in a `(() => safeParse(...))` and asserts no
   exception escapes).
5. Fuzz corpus: fixed list of malformed values (`null`, `undefined`, `0`, `NaN`, `[]`, `{}`,
   `"neon"`, `{ a: 1 }`, nested garbage, etc.) run against the theme schema; every entry returns a
   well-formed `ValidationResult` without throwing.

`theme-choice-schema.spec.ts` (US2 probe):
1. `safeParse(themeChoiceSchema, "light")` → `success: true, value: "light"`.
2. `safeParse(themeChoiceSchema, "system")` → success.
3. `safeParse(themeChoiceSchema, "dark")` → success.
4. Reject `"neon"` → `success: false`, single issue, `code` present.
5. Reject `null` → success false.
6. Reject `""` → success false.
7. Reject JSON-wrapped `'"dark"'` → success false.
8. `ThemeChoice` type equals `"light" | "dark" | "system"` (compile-time assertion via assignability).

Run specs → expect all RED (implementation does not exist yet).

### T003 — GREEN: implement validation wrapper
Create `src/validation/validation.ts`:

```ts
import * as z from "zod";

export interface ValidationIssue {
  path: string;     // dotted ("" = root)
  code: string;
  message: string;
}

export type ValidationResult<T> =
  | { success: true; value: T }
  | { success: false; issues: ValidationIssue[] };

export function safeParse<T>(schema: z.ZodType<T>, input: unknown): ValidationResult<T> {
  const result = schema.safeParse(input);
  if (result.success) return { success: true, value: result.data };
  return {
    success: false,
    issues: result.error.issues.map((issue) => ({
      path: issue.path.map(String).join("."),
      code: issue.code,
      message: issue.message,
    })),
  };
}
```

Run `validation.spec.ts` → expect GREEN.

### T004 — GREEN: implement theme schema + migrate ThemeStore internals
Create `src/theme/theme-choice-schema.ts`:

```ts
import * as z from "zod";
import { CHOICE_DARK, CHOICE_LIGHT, CHOICE_SYSTEM } from "./theme-contract";

export const themeChoiceSchema = z.enum([CHOICE_LIGHT, CHOICE_DARK, CHOICE_SYSTEM]);
export type ThemeChoice = z.infer<typeof themeChoiceSchema>;
```

Modify `src/theme/theme.store.ts`:
- Import `safeParse` and `themeChoiceSchema` (and re-exported `ThemeChoice` — replace local union).
- Remove `VALID_CHOICES`, `isThemeChoice`.
- Rewrite `readStoredChoice()`:

```ts
function readStoredChoice(): ThemeChoice {
  try {
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
    const result = safeParse(themeChoiceSchema, stored);
    return result.success ? result.value : CHOICE_SYSTEM;
  } catch {
    return CHOICE_SYSTEM;
  }
}
```

- Rewrite `setChoice(candidate: unknown)` guard:

```ts
setChoice(candidate: unknown): void {
  const result = safeParse(themeChoiceSchema, candidate);
  if (!result.success) return;
  patchState(store, { choice: result.value });
  persistStoredChoice(result.value);
  applyRootMarker(store.effective());
},
```

Run `theme.store.spec.ts` → expect ALL existing specs GREEN (corrupt, blocked-storage, valid,
setChoice-out-of-enum, OS-following).

### T005 — Mutant check
While watching the full theme + validation specs:

1. **Remove the fallback in `readStoredChoice`** (return `result.value` unconditionally when
   `!result.success`) → the "falls back to system for corrupt values" spec must FAIL.
2. **Remove the `return` guard in `setChoice`** (let it persist invalid data) → the "setChoice with
   an out-of-enum value is a no-op" spec must FAIL.
3. **Remove the fuzz corpus assertion** (or delete the fuzz loop) → fuzz spec must FAIL.
4. Restore all three → specs must be GREEN again.

### T006 — Gate polish
1. `pnpm check:fix` — Biome clean.
2. `pnpm verify` — unit suite + build GREEN.
3. Bundle spot-check: no obvious dead-code bloat or locale drag (manual diff of `dist/nop3-lockr-vault/browser/main.js` size before vs after is optional but expected to be small).
4. Confirm `src/index.html`, `pre-paint.spec.ts`, `app.spec.ts`, `theme-toggle.spec.ts` unchanged/unchanged-behavior (regression guard).

## Dependencies & Sequencing

- `T001` establishes the baseline. `T002` (RED) depends on nothing.
- `T003` (wrapper GREEN) depends on `T002`.
- `T004` (schema + migration GREEN) depends on `T003`.
- `T005` (mutant) depends on `T004`.
- `T006` (gate) depends on `T005`.
- No vault/storage/crypto involvement; no e2e change (005 flows remain valid through 006's
  re-chromed dashboard).

## Deliverables

- `pnpm verify` GREEN with the new `zod` dependency, the wrapper module, and the migrated theme
  store.
- 003 spec suite GREEN with zero modification to spec logic.
- Deterministic fuzz corpus in the validation spec satisfying Constitution V.