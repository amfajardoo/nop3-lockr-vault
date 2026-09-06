import { type ComponentFixture, TestBed, type TestModuleMetadata } from "@angular/core/testing";

import {
  installThemeMediaQueryStub,
  installThemeStorage,
  type StorageStub,
  type ThemeMediaQueryStub,
} from "@testing/theme-stubs";
import { restoreWindowStubs } from "@testing/window-stubs";
import { ThemeStore } from "@theme/theme.store";

export interface ThemeTestBedOptions {
  providers?: TestModuleMetadata["providers"];
  storage?: string | null;
  systemDark?: boolean;
}

export interface ThemeTestBedHandles {
  storage: StorageStub;
  media: ThemeMediaQueryStub;
}

export function setupThemeTestBed(options: ThemeTestBedOptions = {}): ThemeTestBedHandles {
  const { providers = [], storage = null, systemDark = false } = options;
  TestBed.configureTestingModule({ providers: [ThemeStore, ...(providers ?? [])] });
  restoreWindowStubs();
  const media = installThemeMediaQueryStub(systemDark);
  const storageStub = installThemeStorage(storage);
  return { storage: storageStub, media };
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
