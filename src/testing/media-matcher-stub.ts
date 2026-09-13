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
