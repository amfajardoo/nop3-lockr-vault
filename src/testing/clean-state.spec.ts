import { cleanState, stateMaker } from "@testing/clean-state";

interface CounterState {
  count: number;
  label: string | null;
}

describe("cleanState (shared testing helper)", () => {
  const state = cleanState<CounterState>(() => ({ count: 0, label: "fresh" }));

  it("returns an object initialized by init", () => {
    expect(state.count).toBe(0);
    expect(state.label).toBe("fresh");
  });

  it("exposes live get/set on the returned object", () => {
    state.count = 42;
    state.label = "dirty";
    expect(state.count).toBe(42);
    expect(state.label).toBe("dirty");
  });

  it("refreshes the state before the next test in the describe block", () => {
    expect(state.count).toBe(0);
    expect(state.label).toBe("fresh");
  });
});

describe("cleanState stale properties", () => {
  let shape = 0;

  const state = cleanState<{ count: number; extra?: number }>(() => {
    shape++;
    return shape === 1 ? { count: 0, extra: 1 } : { count: 0 };
  });

  it("exposes the first init shape", () => {
    expect(state.count).toBe(0);
    expect(state.extra).toBe(1);
  });

  it("removes properties absent from the refreshed init", () => {
    expect(state.count).toBe(0);
    expect(state.extra).toBeUndefined();
  });
});

describe("cleanState beforeEachCustom hook", () => {
  let hookRuns = 0;

  const state = cleanState(
    () => ({ count: 0 }),
    (action, timeout) => {
      hookRuns++;
      beforeEach(action, timeout);
    },
  );

  it("registers the reset through beforeEachCustom", () => {
    expect(hookRuns).toBe(1);
    expect(state.count).toBe(0);
  });
});

describe("cleanState async init", () => {
  const state = cleanState<{ ready: boolean; n: number }>(async () => {
    await Promise.resolve();
    return { ready: true, n: 5 };
  });

  it("populates the state from a resolved promise before the test runs", () => {
    expect(state.ready).toBe(true);
    expect(state.n).toBe(5);
  });
});

describe("cleanState without init", () => {
  const state = cleanState();

  it("returns an empty state object", () => {
    expect(state).toEqual({});
  });
});

describe("stateMaker with an existing state", () => {
  const base: { shared: string; kept: boolean } = { shared: "base", kept: true };

  const state = stateMaker(base, () => ({ extra: 7 }));

  it("merges the init result into the existing state", () => {
    expect(state.shared).toBe("base");
    expect(state.kept).toBe(true);
    expect(state.extra).toBe(7);
  });

  it("keeps the existing properties for the following test", () => {
    expect(state.shared).toBe("base");
    expect(state.kept).toBe(true);
  });
});
