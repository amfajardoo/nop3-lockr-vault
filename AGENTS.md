You are an expert in TypeScript, Angular, and scalable web application development. You write functional, maintainable, performant, and accessible code following Angular and TypeScript best practices.

## Process Policies

- **Node command execution**: The agent runs node-based commands, but if a command fails or produces an unexpected result, STOP and hand the exact command to the user to execute and report back the output. Never silently retry or work around environment issues.
- **Review before commit**: The agent MUST NOT commit until the user has reviewed the pending changes (in the editor/IDE) and explicitly approved. Before every commit, present a concise summary of what it will contain and wait for approval. This applies to all commits, including documentation/spec artifacts.
- **Branching**: Never mix tooling/setup changes with feature code. Keep process/environment setup in its own commits (ideally its own branch) separate from feature implementation.

## TypeScript Best Practices

- Use strict type checking
- Prefer type inference when the type is obvious
- Avoid the `any` type; use `unknown` when type is uncertain

## Angular Best Practices

- Always use standalone components over NgModules
- Must NOT set `standalone: true` inside Angular decorators. It's the default in Angular v20+.
- Do NOT set `changeDetection: ChangeDetectionStrategy.OnPush` explicitly. `OnPush` is the default in Angular v22+.
- Use signals for state management
- Implement lazy loading for feature routes
- Do NOT use the `@HostBinding` and `@HostListener` decorators. Put host bindings inside the `host` object of the `@Component` or `@Directive` decorator instead
- Use `NgOptimizedImage` for all static images.
  - `NgOptimizedImage` does not work for inline base64 images.

## Accessibility Requirements

- It MUST pass all AXE checks.
- It MUST follow all WCAG AA minimums, including focus management, color contrast, and ARIA attributes.

### Components

- Keep components small and focused on a single responsibility
- Use `input()` and `output()` functions instead of decorators
- Use `model()` for two-way bound properties with `[(prop)]` syntax instead of pairing `input()` with `output()`
- Use `computed()` for derived state
- Use `linkedSignal()` for state derived from multiple reactive sources that must stay synchronized
- Prefer inline templates for small components
- Prefer Signal Forms (`@angular/forms/signals`) for new forms. They are stable in Angular v22+ and provide signal-based state, type-safe field access, and schema-based validation
- When not using Signal Forms, prefer Reactive forms instead of Template-driven ones
- Do NOT use `ngClass`, use `class` bindings instead
- Do NOT use `ngStyle`, use `style` bindings instead
- When using external templates/styles, use paths relative to the component TS file.

## State Management

- Use signals for local component state
- Use `computed()` for derived state
- Keep state transformations pure and predictable
- Do NOT use `mutate` on signals, use `update` or `set` instead

## Templates

- Keep templates simple and avoid complex logic
- Use native control flow (`@if`, `@for`, `@switch`) instead of `*ngIf`, `*ngFor`, `*ngSwitch`
- Use the async pipe to handle observables
- Do not assume globals like (`new Date()`) are available.

## Services

- Design services around a single responsibility
- Use the `providedIn: 'root'` option for singleton services
- Prefer the `@Service` decorator over `@Injectable({providedIn: 'root'})` for new singleton services (Angular v22+)
- Use the `inject()` function instead of constructor injection

## Testing

- Structure every test with the AAA pattern: separate the Arrange, Act, and Assert phases with blank lines (no section comments)
- Reuse the shared test toolkit in `src/testing/` (`setupThemeTestBed`, `createFixture`, `query`, the storage/matchMedia stubs) instead of repeating TestBed and stub setup in every spec
- Do NOT reset `document.documentElement` classes in `beforeEach`: each fresh `setupThemeTestBed` re-instantiates the store, which re-applies the correct root marker on init

### Reliable tests (applies to all test types: unit, component, e2e)

A test is **reliable** only when it survives the **mutant check**: run the test and verify it passes, break the
code under test (delete/alter part of its logic), verify the test FAILS, then restore the code and verify it
passes again. A mutant is a deliberate mutation of the implementation (removing or replacing code) that a
well-written test must catch. If the test stays green with the mutant in place, the test is unreliable and must
be strengthened.

### E2E flows (Playwright)

- Every e2e run targets a **user flow** that is defined as a separate, implementation-agnostic description
  (the `*.flow.ts` files, or a `FLOWS.md`): the flow declares the steps a real user performs (given
  a state, when a user acts, then the observable outcome).
- Group each test set in its own feature folder under `e2e/<feature>/` (`theme.steps.ts` catalog,
  `theme.flow.ts`, `theme.spec.ts`), keeping the shared support helpers in `e2e/support/`.
- The Playwright specs translate each declared flow literally into steps (`.goto`, `.click`, `.expect`), never
  inventing steps that are not in the flow definition. One spec per flow; flow names match spec names.
- Flows must be runnable with the same mutant check: deleting the step that produces the asserted outcome must
  fail the corresponding spec.

### E2E translator layer

- Keep the flow language decoupled from the browser actions: `e2e/support/` holds the generic contract
  (`flow.ts`), the `StepTranslator`/`TranslatorRegistry`/`runFlow`/`registerFlows` helpers (`registry.ts`, an
  exhaustive `Record<S, translator>` keyed by catalog statement), and the reusable browser actions
  (`shared.ts`: `openApp`, `reloadPage`, `emulateColorScheme`, `injectAxe`,
  `expectNoSeriousOrCriticalViolations`, ...).
- Keep every interchangeable action in `e2e/support/shared.ts` so setup, config, and stubs are reused across
  specs instead of duplicated. Keep feature-specific actions (selectors, localStorage keys, root classes) in
  the spec that owns them.
- A spec builds a `TranslatorRegistry` for its own step catalog, composing shared actions; the `Record` type
  forces a translator for every statement in the catalog.

### Component testing (Playwright CT)

- Run component tests with `pnpm e2e:components` (`playwright test --config=playwright-ct.config.ts`). The suite
  targets **real browsers** through a Vite dev server (port 5173, `strictPort`) and the Playwright **gallery**:
  stories are served at `http://localhost:5173/playwright/gallery/index.html`, and each `mount()` navigates there.
- A story (`*.story.ts`) lives next to its component and exports the component type (or a wrapper component) under
  named exports. Reference it from a spec by the story id following the path-based convention:
  `<src relative path without .story> + /<export>`, e.g. `app/theme-toggle/theme-toggle/Primary`.
- Write specs under `tests/components/<component>.spec.ts` using the built-in `mount` fixture (returns a Locator;
  scope queries from it, not from `page`). Keep state isolated: `beforeEach` clears `localStorage` (via the Vite
  origin) because the browser context is reused (`reuseContext: true`).
- JIT components with `templateUrl`/`styleUrl` do NOT auto-resolve under Vite: register raw resources through
  `import.meta.glob` with `?raw` in `playwright/gallery/vite.component-resource.ts` and resolve them with
  `ɵresolveComponentResources` **before** `createApplication()`. Add new templates there when introducing a
  component with external template/style files.
- Vite serves the gallery with `vite.ct.config.ts` (TS path aliases for Vite resolution). The gallery wiring lives
  in `playwright/gallery/`; the web server is owned by `playwright-ct.config.ts`. Keep `vite` and the spec tree
  type-checked: `playwright/tsconfig.json` and `tests/tsconfig.json`, both referenced from the root `tsconfig.json`.
- Every CT spec must pass the same **mutant check** as unit and e2e tests.
