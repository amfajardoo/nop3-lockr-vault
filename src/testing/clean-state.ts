import { beforeEach } from "vitest";

export type StateInitializer<T> = (() => Promise<T>) | (() => T);

export type BeforeEachFn = (action: () => void, timeout?: number | undefined) => void;

export function cleanState<NewState extends {}>(
  init: StateInitializer<NewState> | null = null,
  beforeEachCustom?: BeforeEachFn,
): NewState {
  const state = stateMaker(undefined, init, beforeEachCustom);
  return state;
}

export function stateMaker<NewState extends {}, OldState extends {}>(
  existingState: OldState | undefined,
  init: StateInitializer<NewState> | null,
  beforeEachCustom: BeforeEachFn = beforeEach,
): OldState & NewState {
  const state = (existingState ?? {}) as unknown as OldState & NewState;
  beforeEachCustom(async () => {
    if (!existingState) {
      for (const prop of Object.getOwnPropertyNames(state)) {
        delete (state as Record<string, unknown>)[prop];
      }
    }
    if (init) {
      Object.assign(state, await init());
    }
  });
  return state;
}
