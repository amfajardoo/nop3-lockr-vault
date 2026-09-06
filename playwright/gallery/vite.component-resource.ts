import { ɵresolveComponentResources } from "@angular/core";

import themeToggleTemplate from "../../src/app/theme-toggle/theme-toggle.html?raw";

export async function resolveComponentResourcesForTemplates(): Promise<void> {
  const templates = new Map<string, string>([["./theme-toggle.html", themeToggleTemplate]]);
  await ɵresolveComponentResources(async (url: string) => {
    return templates.get(url) ?? "";
  });
}
