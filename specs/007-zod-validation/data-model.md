# Data Model: Zod Runtime Validation

**Feature**: [007-zod-validation](../007-zod-validation/spec.md)

## Core Shape

This feature introduces a validation **capability**, not a business domain. Its "data model" is the
small vocabulary every boundary will reuse: schema → discriminated result → issues.

```
Boundary input (unknown)
        │
        ▼
   schema.safeParse(input)          ──  never throws (Plan FR-002)
        │
        ├── success ───────────────► { success: true,  value: T }   T = zod-inferred type
        │
        └── failure ───────────────► { success: false, issues: ValidationIssue[] }
                                             └── path (dotted), code (stable), message (en)
```

## Entities

| Entity | Represents | Living in | Notes |
|--------|-----------|-----------|-------|
| `ZodType<T>` (schema) | Declarative description of a valid value | feature code (e.g. `theme-choice-schema.ts`) | single source of truth for the boundary shape |
| `ValidationIssue` | One rejected field | `src/validation/validation.ts` | `path: string` (dotted, `""` = root); `code: string` (Zod v4 stable code, e.g. `invalid_type`, `invalid_enum_value`); `message: string` (deterministic, en) |
| `ValidationResult<T>` | Discriminated outcome of one check | `src/validation/validation.ts` | `{ success: true; value: T } \| { success: false; issues: ValidationIssue[] }` — exhaustive, no `any` |
| Safe default | Fallback when a boundary fails validation | consuming boundary (e.g. `CHOICE_SYSTEM` in theme store) | declared per boundary; never throws |

## Theme Schema (`src/theme/theme-choice-schema.ts`)

```ts
import * as z from "zod";
import { CHOICE_DARK, CHOICE_LIGHT, CHOICE_SYSTEM } from "./theme-contract";

export const themeChoiceSchema = z.enum([CHOICE_LIGHT, CHOICE_DARK, CHOICE_SYSTEM]);
export type ThemeChoice = z.infer<typeof themeChoiceSchema>;
```

- Enum built from the **frozen 002 literals** → stays aligned with
  `contracts/theme-choice.schema.json` (002).
- `z.enum` accepts only `"light" | "dark" | "system"`; `null`, `""`, `"neon"`, `"dark"` (JSON-wrapped)
  all fail → store falls back to `CHOICE_SYSTEM`.
- `ThemeChoice` type is re-exported to replace the hand-rolled union in `theme.store.ts`
  (behavior identical: `Type ThemeChoice` was already `light | dark | system`).

## Migration Wiring (`src/theme/theme.store.ts`)

| Current (003) | Migrated (007) | Behavior |
|---------------|----------------|----------|
| `const VALID_CHOICES: readonly ThemeChoice[]` | `themeChoiceSchema` (single source) | same accepted set |
| `function isThemeChoice(v: unknown): v is ThemeChoice` | `safeParse(themeChoiceSchema, v)` | same no-op semantics |
| `readStoredChoice()` → `isThemeChoice(stored) ? stored : CHOICE_SYSTEM` | `safeParse(themeChoiceSchema, stored)` → `result.success ? result.value : CHOICE_SYSTEM` (still wrapped in try/catch for blocked storage) | corrupt → `system`; blocked storage → `system`; valid → itself (spec US2-A1..A3) |
| `setChoice(candidate)` → guard then patch | guard via `safeParse` result | same no-op on invalid; same persist + marker on valid |

Public store API (signals, methods, `providedIn: "root"`, `ThemeStoreInstance`) is unchanged
(feature spec FR-004).

## Interactions & Side Effects

| Event | Boundary | Effect |
|-------|----------|--------|
| `ThemeStore` init reads storage | `readStoredChoice()` | valid value → that choice; anything else → `CHOICE_SYSTEM`; no write-back (003 behavior: corrupt stays in storage) |
| Storage access throws | `readStoredChoice()` | `CHOICE_SYSTEM`, no exception surfaces |
| `setChoice("neon")` | `setChoice()` guard | no-op; no write, no marker change |
| Future vault/data-model feature | any new boundary | must import `safeParse` + a declared schema; never a bespoke validator (documented in roadmap note) |

## Copy / i18n

- Validation messages are English-only (en locale built into `zod`); stable `code` keys provide the
  future i18n seam. No user-facing copy ships with this feature (theme boundary's fallback already
  exists in 003).