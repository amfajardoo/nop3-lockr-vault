You are an expert in TypeScript, Angular, and scalable web application development. You write functional, maintainable, performant, and accessible code following Angular and TypeScript best practices.

## Process Policies

- **Node command execution**: The agent runs node-based commands, but if a command fails or produces an unexpected result, STOP and hand the exact command to the user to execute and report back the output. Never silently retry or work around environment issues.
- **Review before commit**: The agent MUST NOT commit until the user has reviewed the pending changes (in the editor/IDE) and explicitly approved. Before every commit, present a concise summary of what it will contain and wait for approval. This applies to all commits, including documentation/spec artifacts.
- **Branching**: Never mix tooling/setup changes with feature code. Keep process/environment setup in its own commits (ideally its own branch) separate from feature implementation.
- **PR template**: Every pull request body MUST follow the repository PR template (`.github/PULL_REQUEST_TEMPLATE.md`) with its six required sections: Context, Changes, Spec coverage, Local verification, Scope guard, and Constitution compliance. The template applies to every PR the agent creates — including PRs for process/tooling/documentation changes — and to the very PR that introduces or changes the template itself. Do NOT write a free-form description in place of the template.
- **Capture the "why"**: The agent MUST establish the intent behind a change — the problem it solves, its rationale, and its expected user impact — before implementing. When the "why" is not explicit in the request, ask for it or derive it from the constitution, specs, AGENTS.md, and session history, and state the derivation in the PR body so the human can correct it. PR bodies must distinguish the author's stated reason from any inferred rationale (mark inferred rationale as such).
- **Human-supervised AI work**: Changes to this repository are largely produced by AI models, but every PR is reviewed by a human. The agent MUST keep diffs small and focused, avoid giant files and sprawling change sets (they overwhelm human reviewers), and write PR bodies that give the reviewer the decision context the diff cannot convey — not a regurgitated summary of the code changes.
- **Follow the flow without asking**: When working within the speckit SDD flow (/speckit.specify → plan → tasks → analyze → implement → converge), move to the next step automatically once the current one finishes. Do NOT ask "should I continue?" or offer step-skipping choices at each gate. Only stop for the user when: (1) a commit is pending (Review before commit above), (2) a command fails or produces an unexpected result, (3) a genuinely ambiguous decision with real alternatives arises, or (4) the user explicitly interrupts. Everything else proceeds by default.

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

- It MUST follow all WCAG AA minimums, including focus management, color contrast, and ARIA attributes.
- Conformance is verified through Angular Material's built-in component accessibility. Find the Material
  component that provides the needed semantics first; specs assert that semantics (roles, labels, names, focus,
  keyboard interaction) as observable behavior instead of scanning with an external tool (axe is NOT a
  dependency).

### Components

- Build on **Angular Material**: use the Material component that covers the needed semantics (list, card,
  dialog, radio, button, ...) instead of bespoke markup. Reimplementing a Material primitive is a defect.
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
- The Tailwind dependency was dropped in 013; any leftover utility classes in templates are
  dead style hooks pending the Angular Material migration and MUST NOT be reintroduced as new
  utilities. Consume the CSS variables (or Material theming) directly in new code.

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

### Reliable tests (applies to all test types: unit, component)

A test is **reliable** only when it survives the **mutant check**: run the test and verify it passes, break the
code under test (delete/alter part of its logic), verify the test FAILS, then restore the code and verify it
passes again. A mutant is a deliberate mutation of the implementation (removing or replacing code) that a
well-written test must catch. If the test stays green with the mutant in place, the test is unreliable and must
be strengthened.

### Harness-first tests: tests as a human use of the app

- Every test should read as a **faithful human representation** of how a user actually uses the app (given a
  state, when a user acts, then an observable outcome) — never as a call sequence into implementation
  internals.
- Prefer driving those interactions through a **harness** (the CDK Test Harness pattern:
  `ComponentHarness` with typed `locatorFor` queries) instead of raw DOM queries or reaching into component
  state. In most cases a harness is the expected way to model user actions in component tests.
- If a component needs a **custom harness**, add `@angular/cdk/testing` to install the harness base classes and
  build the harness from them. Treat that install as a tooling change (own commit, per the Branching policy).
- Otherwise, component tests should limit themselves to the shared test toolkit in `src/testing/`
  (`setupThemeTestBed`, `createFixture`, `query`) plus harness locators — no ad-hoc `fixture.nativeElement`
  spelunking when a harness path exists.
- Harness-based specs still must pass the same **mutant check**: deleting/altering the code the harness
  interacts with must fail the spec.

### Accessibility verification

- A11y coverage is delivered by Angular Material's guarantees plus spec-level assertions of the observable
  semantics (roles, labelling, focus, keyboard interaction). Do not reintroduce an external scanner dependency.

### Component testing

- Run component tests with `pnpm test:run` (Angular unit-test builder on jsdom). If a component needs a
  dedicated interaction spec beyond its unit spec, colocate it as another `*.spec.ts` in `src/`.
- Unit specs must pass the same **mutant check** as any other test.
