import "@angular/compiler";
import { type ApplicationRef, type ComponentRef, createComponent, type Type } from "@angular/core";
import { createApplication } from "@angular/platform-browser";
import { provideRouter } from "@angular/router";

import { resolveComponentResourcesForTemplates } from "./vite.component-resource";

type StoryModule = Record<string, unknown> & { default?: unknown };

const stories = import.meta.glob<StoryModule>([
  "/**/*.story.{ts,tsx,js,jsx,vue}",
  "!/node_modules/**",
  "!/dist/**",
  "!/playwright-report/**",
  "!/test-results/**",
]);

function storyId(file: string): string {
  return file.replace(/^(\.\.\/)+src\//, "").replace(/\.story\.\w+$/, "");
}

interface MountOptions {
  story: string;
  props?: Record<string, unknown>;
}

declare global {
  interface Window {
    mount?: (options: MountOptions) => Promise<void>;
    unmount?: () => Promise<void>;
  }
}

export async function resolve(storyName: string): Promise<Type<unknown>> {
  const separator = storyName.lastIndexOf("/");
  const path = storyName.slice(0, separator);
  const name = storyName.slice(separator + 1);
  const file = Object.keys(stories).find(
    (candidate) => storyId(candidate) === path || storyId(candidate).endsWith(`/${path}`),
  );
  const module = file ? await stories[file]() : undefined;
  const resolved: unknown = module?.[name] ?? module?.default;
  if (typeof resolved !== "function") {
    throw new Error(`Unknown story: ${storyName}`);
  }
  return resolved as Type<unknown>;
}

const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("Gallery root element (#root) not found");
}

let app: ApplicationRef | undefined;
let component: ComponentRef<unknown> | undefined;
let mountedStory: Type<unknown> | undefined;

window.mount = async ({ story, props }: MountOptions): Promise<void> => {
  const resolved = await resolve(story);
  if (!app) {
    await resolveComponentResourcesForTemplates();
    app = await createApplication({ providers: [provideRouter([])] });
  }
  if (component && mountedStory !== resolved) {
    app.detachView(component.hostView);
    component.destroy();
    component = undefined;
  }
  if (!component) {
    component = createComponent(resolved, {
      environmentInjector: app.injector,
      hostElement: rootElement,
    });
    app.attachView(component.hostView);
    mountedStory = resolved;
  }
  if (props) {
    for (const [key, value] of Object.entries(props)) {
      component.setInput(key, value);
    }
  }
  component.changeDetectorRef.detectChanges();
};

window.unmount = async (): Promise<void> => {
  app?.destroy();
  app = undefined;
  component = undefined;
  mountedStory = undefined;
};
