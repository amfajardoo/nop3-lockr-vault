## Summary & decisions

<!-- The files tab already shows the diff — do NOT summarize the code here. Write for humans.
What problem does this solve? Broader project context? What decisions were made and WHY this
approach? What alternatives were considered and rejected? How does it affect user behaviour?
Reference the speckit feature (specs/NNN-<slug>/) or the issue (closes #NN).
When a rationale was NOT stated by the author, say so and mark it as "inferred" here so the
human reviewer can confirm or correct it. -->

## Type of Change

- [ ] Bug fix
- [ ] New feature
- [ ] Documentation update
- [ ] Template improvement
- [ ] Automation / tooling change
- [ ] Breaking change

## Changes

<!-- Intent per block, not a diff recap. Group by commit when there are several. -->

- [ ] Change 1
- [ ] Change 2

## Spec coverage

<!-- For speckit features: which US/FR/SC this covers and how each was verified.
For tooling/chore: which constitution gate it touches and the verification plan. -->

## Testing

<!-- Run BEFORE opening the PR. Paste results (test counts, exit codes). -->

- [ ] `pnpm verify` (biome ci + `test:run` + `build`) green
- [ ] New tests written per AGENTS.md (AAA, harness-first when applicable)
- [ ] Mutant check for changed logic (when applicable)
- [ ] Manual verification in the app (describe steps)

## Scope guard

<!-- Confirm what was NOT touched. Repo elements that must stay intact:
`src/vault/`, the constitution, `.specify/` unless this change is about them. -->

## Constitution compliance

<!-- Declare and verify compliance with the constitution (current version).
Cite the relevant principles (I–VII). If there are exceptions or amendments, document them here. -->