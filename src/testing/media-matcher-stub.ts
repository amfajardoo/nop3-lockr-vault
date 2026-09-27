import { MediaMatcher } from "@angular/cdk/layout";

function reducedMotionQueryList(): MediaQueryList {
  return {
    matches: true,
    media: "(prefers-reduced-motion)",
    onchange: null,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
    addListener: () => undefined,
    removeListener: () => undefined,
    dispatchEvent: () => false,
  };
}

export function provideReducedMotionMediaMatcher(): {
  provide: typeof MediaMatcher;
  useValue: { matchMedia: () => MediaQueryList };
} {
  return {
    provide: MediaMatcher,
    useValue: { matchMedia: () => reducedMotionQueryList() },
  };
}

export interface WidthMediaMatcherStub {
  provider: {
    provide: typeof MediaMatcher;
    useValue: { matchMedia: (query: string) => MediaQueryList };
  };
  setWide: (matches: boolean) => void;
  listenerCount: (mediaPrefix: string) => number;
}

/**
 * Drivable CDK MediaMatcher stub for the responsive shell (feature 016):
 * `(min-width: …)` queries report `initialWide` and can flip at runtime
 * (listeners fire like a real MediaQueryList 'change'); every other query
 * (e.g. prefers-reduced-motion) keeps the deterministic `matches: true`
 * default used across the suite. `listenerCount` lets specs assert that
 * media listeners are registered once and removed on destroy.
 */
export function createWidthMediaMatcher(initialWide: boolean): WidthMediaMatcherStub {
  let wide = initialWide;
  const listeners = new Set<{ media: string; listener: (event: { matches: boolean }) => void }>();
  const build = (media: string, read: () => boolean): MediaQueryList =>
    ({
      get matches() {
        return read();
      },
      media,
      onchange: null,
      addEventListener: (_type: string, listener: (event: { matches: boolean }) => void) => {
        listeners.add({ media, listener });
      },
      removeEventListener: (_type: string, listener: (event: { matches: boolean }) => void) => {
        for (const entry of listeners) {
          if (entry.listener === listener) {
            listeners.delete(entry);
          }
        }
      },
      addListener: () => undefined,
      removeListener: () => undefined,
      dispatchEvent: () => false,
    }) as unknown as MediaQueryList;

  return {
    provider: {
      provide: MediaMatcher,
      useValue: {
        matchMedia: (query: string) =>
          query.startsWith("(min-width") ? build(query, () => wide) : build(query, () => true),
      },
    },
    setWide: (matches: boolean) => {
      wide = matches;
      for (const entry of [...listeners]) {
        if (entry.media.startsWith("(min-width")) {
          entry.listener({ matches });
        }
      }
    },
    listenerCount: (mediaPrefix: string) =>
      [...listeners].filter((entry) => entry.media.startsWith(mediaPrefix)).length,
  };
}
