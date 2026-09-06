import { type Page, test } from "@playwright/test";
import type { FlowStep, UserFlow } from "./flow";

export type StepTranslator = (page: Page) => Promise<void>;

export type TranslatorRegistry<S extends string> = Record<S, StepTranslator>;

export async function runFlow<S extends string>(
  page: Page,
  registry: TranslatorRegistry<S>,
  flow: UserFlow<readonly FlowStep<S>[]>,
): Promise<void> {
  for (const step of flow.steps) {
    await registry[step.statement](page);
  }
}

export function registerFlows<S extends string>(
  flows: Readonly<Record<string, UserFlow<readonly FlowStep<S>[]>>>,
  registry: TranslatorRegistry<S>,
): void {
  for (const flow of Object.values(flows)) {
    test(flow.title, async ({ page }) => {
      await runFlow(page, registry, flow);
    });
  }
}
