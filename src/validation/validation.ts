import type * as z from "zod";

/**
 * Runtime validation wrapper (feature 007).
 *
 * The only sanctioned validation surface for data that crosses a runtime
 * boundary (storage reads, API payloads, future form submissions).
 *
 * Unknown-keys policy (single, documented choice): object schemas use Zod's
 * default **strip** behavior — extra keys on the input are discarded, never
 * rejected and never preserved in the parsed value. Use `z.object({...})` as
 * written; do not add per-feature unknown-key handling.
 *
 * `safeParse` never throws. On failure the caller receives a discriminated
 * `ValidationResult<T>` whose issues carry a dotted `path`, a stable Zod v4
 * `code` (i18n seam: UI maps codes, not raw exception text), and a
 * deterministic human-readable `message` (en locale).
 */

export interface ValidationIssue {
  /** Dotted field path; `""` for a root-level issue (e.g. "items.0.id"). */
  path: string;
  /** Stable Zod v4 issue code (e.g. "invalid_type", "invalid_value"). */
  code: string;
  /** Deterministic human-readable message (en locale), never raw internals. */
  message: string;
}

export type ValidationResult<T> =
  | { success: true; value: T }
  | { success: false; issues: ValidationIssue[] };

export function safeParse<S extends z.ZodType>(
  schema: S,
  input: unknown,
): ValidationResult<z.infer<S>> {
  const result = schema.safeParse(input);

  if (result.success) {
    return { success: true, value: result.data };
  }

  return {
    success: false,
    issues: result.error.issues.map((issue) => ({
      path: issue.path.map(String).join("."),
      code: issue.code,
      message: issue.message,
    })),
  };
}
