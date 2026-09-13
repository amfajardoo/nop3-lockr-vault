import type { Type } from "@angular/core";
import { type ComponentFixture, TestBed, type TestModuleMetadata } from "@angular/core/testing";

import { DynamicTemplateComponent } from "@testing/dynamic-template";
import { provideReducedMotionMediaMatcher } from "@testing/media-matcher-stub";
import {
  installThemeMediaQueryStub,
  installThemeStorage,
  type StorageStub,
  type ThemeMediaQueryStub,
} from "@testing/theme-stubs";
import { restoreWindowStubs } from "@testing/window-stubs";
import { ThemeStore } from "@theme/theme.store";

export interface ThemeSetupOptions {
  storage?: string | null;
  systemDark?: boolean;
}

export interface ThemeSetupHandles {
  storage: StorageStub;
  media: ThemeMediaQueryStub;
}

export interface ModuleConfig {
  imports?: TestModuleMetadata["imports"];
  providers?: TestModuleMetadata["providers"];
  superProviders?: TestModuleMetadata["providers"];
  schemas?: TestModuleMetadata["schemas"];
  teardown?: TestModuleMetadata["teardown"];
  deferBlockBehavior?: TestModuleMetadata["deferBlockBehavior"];
  rethrowApplicationErrors?: TestModuleMetadata["rethrowApplicationErrors"];
  inferTagName?: TestModuleMetadata["inferTagName"];
  templateOverrides?: Map<Type<unknown>, string>;
  theme?: ThemeSetupOptions;
}

export function setupModule(config: ModuleConfig & { theme: ThemeSetupOptions }): ThemeSetupHandles;
export function setupModule(config: ModuleConfig): void;
export function setupModule(config: ModuleConfig): ThemeSetupHandles | undefined {
  const { theme } = config;
  const imports = [...(config.imports ?? []), DynamicTemplateComponent];
  const providers = [
    provideReducedMotionMediaMatcher(),
    ...(theme ? [ThemeStore] : []),
    ...(config.providers ?? []),
    ...(config.superProviders ?? []),
  ];
  TestBed.configureTestingModule({
    imports,
    providers,
    schemas: config.schemas ?? [],
    teardown: config.teardown,
    deferBlockBehavior: config.deferBlockBehavior,
    rethrowApplicationErrors: config.rethrowApplicationErrors,
    inferTagName: config.inferTagName ?? true,
  });
  setupSuperProvidersAndTemplateOverrides(config);

  if (!theme) {
    return;
  }
  restoreWindowStubs();
  const media = installThemeMediaQueryStub(theme.systemDark ?? false);
  const storage = installThemeStorage(theme.storage ?? null);
  return { storage, media };
}

function setupSuperProvidersAndTemplateOverrides(config: ModuleConfig): void {
  const overrides = config.templateOverrides ?? new Map<Type<unknown>, string>();
  overrides.forEach((template, component) => {
    TestBed.overrideComponent(component, { set: { template } });
  });
}

export function createFixture<T>(component: new () => T): ComponentFixture<T> {
  const fixture = TestBed.createComponent(component);
  fixture.detectChanges();
  return fixture;
}

export function query<T extends Element>(
  fixture: ComponentFixture<unknown>,
  selector: string,
): T | null {
  return fixture.nativeElement.querySelector(selector) as T | null;
}
