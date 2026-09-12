import type { Type } from "@angular/core";
import { TestBed, type TestModuleMetadata } from "@angular/core/testing";

import { DynamicTemplateComponent } from "@testing/dynamic-template";

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
}

export function setupModule(config: ModuleConfig): void {
  const imports = [...(config.imports ?? []), DynamicTemplateComponent];
  const providers = [...(config.providers ?? []), ...(config.superProviders ?? [])];
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
}

function setupSuperProvidersAndTemplateOverrides(config: ModuleConfig): void {
  const overrides = config.templateOverrides ?? new Map<Type<unknown>, string>();
  overrides.forEach((template, component) => {
    TestBed.overrideComponent(component, { set: { template } });
  });
}
