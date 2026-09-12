import {
  DynamicTemplateComponent,
  setDynamicTemplateComponentInstance,
} from "@testing/dynamic-template";

interface SampleComponent {
  title: string;
  n: number;
}

interface CounterComponent {
  count: number;
}

describe("DynamicTemplateComponent (shared testing helper)", () => {
  it("does not define properties when no component instance is set", () => {
    const component = new DynamicTemplateComponent() as unknown as Record<string, unknown>;

    expect(Object.keys(component)).toEqual([]);
  });

  it("exposes the component instance properties through get/set accessors", () => {
    const instance: SampleComponent = { title: "Hello", n: 1 };

    setDynamicTemplateComponentInstance(instance);
    const component = new DynamicTemplateComponent() as unknown as SampleComponent;

    expect(component.title).toBe("Hello");
    expect(component.n).toBe(1);

    component.title = "Updated";
    component.n = 5;

    expect(instance.title).toBe("Updated");
    expect(instance.n).toBe(5);
  });

  it("defines each proxied property as an enumerable own accessor", () => {
    const instance: Partial<Record<string, number>> = { a: 1, b: 2 };

    setDynamicTemplateComponentInstance(instance);
    const component = new DynamicTemplateComponent() as unknown as Partial<Record<string, number>>;

    expect(Object.keys(component)).toEqual(["a", "b"]);
  });

  it("reads live values from the component instance", () => {
    const instance: CounterComponent = { count: 1 };

    setDynamicTemplateComponentInstance(instance);
    const component = new DynamicTemplateComponent() as unknown as CounterComponent;

    instance.count = 99;

    expect(component.count).toBe(99);
  });
});
