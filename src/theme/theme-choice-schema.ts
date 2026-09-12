import * as z from "zod";

import { CHOICE_DARK, CHOICE_LIGHT, CHOICE_SYSTEM } from "./theme-contract";

/**
 * Runtime schema for the 002 theme-choice contract (light | dark | system).
 * Built from the frozen literals in theme-contract.ts so it stays aligned with
 * contracts/theme-choice.schema.json. Validated through `safeParse` from
 * ../validation/validation.
 */
export const themeChoiceSchema = z.enum([CHOICE_LIGHT, CHOICE_DARK, CHOICE_SYSTEM]);

export type ThemeChoice = z.infer<typeof themeChoiceSchema>;
