import { ɵresolveComponentResources } from "@angular/core";
import credentialDetailStyle from "../../src/app/credential-detail/credential-detail.css?raw";
import credentialDetailTemplate from "../../src/app/credential-detail/credential-detail.html?raw";
import credentialListStyle from "../../src/app/credential-list/credential-list.css?raw";
import credentialListTemplate from "../../src/app/credential-list/credential-list.html?raw";
import themeToggleTemplate from "../../src/app/theme-toggle/theme-toggle.html?raw";

export async function resolveComponentResourcesForTemplates(): Promise<void> {
  const templates = new Map<string, string>([
    ["./theme-toggle.html", themeToggleTemplate],
    ["./credential-list.html", credentialListTemplate],
    ["./credential-list.css", credentialListStyle],
    ["./credential-detail.html", credentialDetailTemplate],
    ["./credential-detail.css", credentialDetailStyle],
  ]);
  await ɵresolveComponentResources(async (url: string) => {
    return templates.get(url) ?? "";
  });
}
