import { Component } from "@angular/core";

let componentInstance: Record<string, unknown> | undefined;

export function setDynamicTemplateComponentInstance(instance: object): void {
  componentInstance = instance as Record<string, unknown>;
}

@Component({
  selector: "dynamic-template",
  template: "",
})
export class DynamicTemplateComponent {
  constructor() {
    if (!componentInstance) {
      return;
    }
    for (const key of Object.keys(componentInstance)) {
      Object.defineProperty(this, key, {
        get: () => componentInstance?.[key],
        set: (value: unknown) => {
          if (componentInstance) {
            componentInstance[key] = value;
          }
        },
        enumerable: true,
      });
    }
  }
}
