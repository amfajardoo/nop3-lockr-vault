# Nop3LockrVault

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 22.1.2.

## Development server

To start a local development server, run:

```bash
pnpm start
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

## Toolchain

The repository uses [Biome](https://biomejs.dev) (pinned to `2.5.12`) for linting, formatting,
and import organization. All commands are run through the project package manager:

| Command | Description |
|---|---|
| `pnpm format` | Rewrites files in place to the canonical style |
| `pnpm lint` | Static analysis; reports `file:line` + rule without writing |
| `pnpm lint:fix` | Applies safe lint fixes in place |
| `pnpm check` | Lint + format + import checks (read-only) |
| `pnpm check:fix` | Applies safe fixes from `check` in place |
| `pnpm check:format` | Formatting-only gate (`biome ci`) |
| `pnpm verify` | Full gate: format+lint, unit tests, and production build |

`pnpm verify` must pass before a pull request is opened. It runs fully offline.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
pnpm build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Running unit tests

To execute unit tests with the [Vitest](https://vitest.dev/) test runner, use the following command:

```bash
pnpm test
```

## Running end-to-end tests

End-to-end testing is not configured yet; the `ng e2e` command is covered by the upcoming
theme/shell features. You can choose a framework that suits your needs when that is added.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.
