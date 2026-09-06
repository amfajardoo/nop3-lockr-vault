export type SameAsWindow = typeof window;

export function windowOf(): SameAsWindow {
  const win = document.defaultView;
  if (!win) throw new Error("jsdom window unavailable");
  return win as unknown as SameAsWindow;
}

export function restoreWindowStubs(): void {
  const win = windowOf();
  delete (win as Partial<SameAsWindow>).matchMedia;
  delete (win as Partial<SameAsWindow>).localStorage;
}
