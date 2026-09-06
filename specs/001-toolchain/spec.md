# Feature Specification: Developer Toolchain

**Feature Branch**: `feature/001-toolchain`

**Created**: 2026-09-05

**Status**: Draft

**Input**: User description: "Set up the developer toolchain: static analysis and formatting gates that every contributor can run locally, plus a single verification command. Remove the previous formatter stack in favor of one consistent tool, and align TypeScript project configuration."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - One-command static verification (Priority: P1)

As a developer, I want to run a single verification command that checks formatting, static
analysis, unit tests, and the production build, so that I can confirm my change is safe
before opening a PR.

**Why this priority**: This is the core gate of the Constitution ("lint, typecheck, and the
full test suite MUST be green locally before any PR is opened"). Without it there is no
enforcement mechanism at all.

**Independent Test**: Run the verification command on a fresh checkout; it reports a single
green/red result for all gates together, with zero configuration beyond documented setup.

**Acceptance Scenarios**:

1. **Given** a clean working tree on `feature/001-toolchain`, **When** I run the verification
   command, **Then** it completes successfully with exit code 0 and reports each gate
   (formatting, static analysis, typecheck, unit tests, build) as green.
2. **Given** a change that violates a formatting or lint rule, **When** I run the
   verification command, **Then** it fails with a non-zero exit code and points at the exact
   file and rule that caused the failure.
3. **Given** a broken unit test or a build type error, **When** I run the verification
   command, **Then** it reports the failure and the command does not silently pass.

---

### User Story 2 - Automatic formatting and fixable lint (Priority: P1)

As a developer, I want a formatting command that rewrites the codebase in place and a check
command that auto-fixes safe lint issues, so that consistent style is enforced without manual
effort.

**Why this priority**: Consistent formatting is what makes every later review cheap; it must
exist before the first feature PR.

**Independent Test**: Introduce a deliberate formatting deviation in a source file, run the
formatting command, and observe the file is rewritten to canonical style; run it a second
time and observe no further changes (idempotent).

**Acceptance Scenarios**:

1. **Given** a defined style, **When** I run a formatting command over the repository,
   **Then** all supported source files are rewritten to that style consistently.
2. **Given** the previous scenario, **When** I run the same formatting command again,
   **Then** the working tree has no additional changes (idempotency, no churn).
3. **Given** fixable lint findings, **When** I run the check-fix command, **Then** the safe
   issues are corrected in place and a second run reports no remaining findings.

---

### User Story 3 - Consistent, committed configuration (Priority: P2)

As a team, I want the toolchain configuration committed and versioned, so that every
contributor gets identical results regardless of their machine.

**Why this priority**: Reproducibility across contributors is what makes the gates trustworthy.

**Independent Test**: A second contributor clones the repository, follows documented setup,
and obtains the same check/format results as the first contributor.

**Acceptance Scenarios**:

1. **Given** a fresh clone and documented setup, **When** I run the check command,
   **Then** it produces a clean result (no counts) without network access.
2. **Given** the committed configuration, **When** two contributors run formatting on the
   same code, **Then** the produced diff is identical.

---

### Edge Cases

- The tooling MUST ignore generated/build artifacts (`dist/`, `node_modules/`, `.angular/`,
  e2e reports) so they never trigger findings.
- A contributor with no network access MUST still be able to run check/format (no remote
  rule fetching).
- Removing the previous formatter MUST NOT leave dangling references in configs or docs.
- The toolchain MUST handle Windows + PowerShell first-class (the team's primary
  environment), without POSIX-only constructs in the npm scripts.
- A human-readable failure output MUST distinguish "not formatted" from "lint rule
  violation" from "type error" so the contributor knows what to fix.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST provide a formatting command that rewrites supported source files in
  place to a single canonical style.
- **FR-002**: System MUST provide a static-analysis check command that reports violations with
  `file:line` and the offending rule, and exits non-zero when any finding exists.
- **FR-003**: System MUST provide a verification command that runs formatting-check, static
  analysis, typecheck, unit tests, and the production build, failing on any gate.
- **FR-004**: The previous formatter (Prettier) MUST be removed: no dependency, no config
  file, no documented references remain.
- **FR-005**: The toolchain configuration MUST be committed to the repository so results are
  reproducible across contributors.
- **FR-006**: The check commands MUST work fully offline (no remote rule downloads).
- **FR-007**: TypeScript project configuration MUST be aligned so that the typecheck gate and
  the unit-test runner use consistent strict settings, without IDE/viewer warnings.
- **FR-008**: All toolchain scripts MUST run on Windows/PowerShell and on POSIX shells using
  the project's package manager (`pnpm`).
- **FR-009**: Generated artifacts (`dist/`, `node_modules/`, coverage/e2e output) MUST be
  excluded from all toolchain command scopes.

### Key Entities *(include if feature involves data)*

- **Toolchain configuration**: single source of truth for lint + format rules; defines
  includes/excludes.
- **npm scripts**: the CLI surface contributors invoke (`format`, `check`, `check:fix`,
  `verify`, plus existing `start`/`test`/`build`).
- **TypeScript project references** (app/spec): shared strict compiler settings consumed by
  both the build and the unit-test runner.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A fresh clone reaches a fully green `verify` with only the documented setup
  steps, with no manual configuration.
- **SC-002**: `check` completes in under 60 seconds on the current repository size and
  produces zero findings.
- **SC-003**: The full verification gate (lint + typecheck + tests + build) is green locally
  before every PR, as mandated by the Constitution.
- **SC-004**: Zero dangling references to the removed formatter remain in the repository
  (grep for its name/config returns no hits in code, configs, or docs).

## Assumptions

- `pnpm` is the package manager (`packageManager` already pinned in `package.json`); no new
  package manager is introduced.
- The unit-test runner (Vitest via the Angular build) and the build are already configured
  and in scope only as gates of `verify`, not re-engineered here.
- Node 24 via fnm is the team's Node toolchain; PATH setup is a documented per-machine step,
  not a repository concern.
- Markdown files are NOT covered by the automated formatter in this feature; only formats the
  chosen tool supports natively are in scope. Markdown formatting (docs, README, AGENTS.md)
  may be a follow-up decision.
- Hosted CI is out of scope: the Constitution mandates green local gates for this feature;
  CI wiring is a separate future tooling feature.
- Repository docs already describe the command surface; this feature updates them to match
  the new scripts.