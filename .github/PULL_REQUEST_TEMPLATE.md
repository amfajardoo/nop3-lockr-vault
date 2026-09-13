## Context

<!-- What this PR resolves and why. Reference the speckit feature when applicable:
`specs/NNN-<slug>/` or the associated issue (closes #NN). One paragraph, not an essay. -->

## Changes

<!-- Concise list of what changes. Group by commit when there are several.
DO NOT paste full diffs; describe the intent of each block. -->

- [ ] Change 1
- [ ] Change 2

## Spec coverage

<!-- For speckit features: which US/FR/SC this covers and how each was verified.
For tooling/chore: which constitution gate it touches and the verification plan. -->

## Local verification

<!-- Run BEFORE opening the PR. Paste results (test counts, exit codes). -->

- [ ] `pnpm verify` (biome ci + `test:run` + `build`) green
- [ ] New tests written per AGENTS.md (AAA, harness-first when applicable)
- [ ] Mutant check for changed logic (when applicable)

## Scope guard

<!-- Confirm what was NOT touched. Repo elements that must stay intact:
`src/vault/`, the constitution, `.specify/` unless this change is about them. -->

## Constitution compliance

<!-- Declare and verify compliance with the constitution (current version).
Cite the relevant principles (I–VII). If there are exceptions or amendments, document them here. -->