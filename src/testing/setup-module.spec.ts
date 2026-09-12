import { Component, InjectionToken } from "@angular/core";
import { TestBed } from "@angular/core/testing";

import {
  DynamicTemplateComponent,
  setDynamicTemplateComponentInstance,
} from "@testing/dynamic-template";
import { setupModule } from "@testing/setup-module";

const PLAIN_TOKEN = new InjectionToken<string>("plain");
const SUPER_TOKEN = new InjectionToken<string>("super");

interface ProxiedComponent {
  title: string;
  n: number;
}

@Component({ selector: "target-component", template: "original" })
class TargetComponent {
  value = "overridden-content";
}

describe("setupModule (shared testing helper)", () => {
  it("merges providers and superProviders into the testing module", () => {
    setupModule({
      providers: [{ provide: PLAIN_TOKEN, useValue: "plain-value" }],
      superProviders: [{ provide: SUPER_TOKEN, useValue: "super-value" }],
    });

    expect(TestBed.inject(PLAIN_TOKEN)).toBe("plain-value");
    expect(TestBed.inject(SUPER_TOKEN)).toBe("super-value");
  });

  it("applies a template override for the declared component", () => {
    setupModule({
      imports: [TargetComponent],
      templateOverrides: new Map([[TargetComponent, "<span>{{ value }}</span>"]]),
    });

    const fixture = TestBed.createComponent(TargetComponent);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent.trim()).toBe("overridden-content");
  });

  it("mounts the DynamicTemplateComponent overridden to render the proxied instance", () => {
    const proxied: ProxiedComponent = { title: "Hello", n: 5 };
    setDynamicTemplateComponentInstance(proxied);

    setupModule({
      templateOverrides: new Map([[DynamicTemplateComponent, "<div>{{ title }} - {{ n }}</div>"]]),
    });

    const fixture = TestBed.createComponent(DynamicTemplateComponent);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent.trim()).toBe("Hello - 5");
  });
});
