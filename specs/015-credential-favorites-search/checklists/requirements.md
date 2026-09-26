# Requirements Quality Checklist: Credential Favorites & Search (015)

Source: speckit requirements checklist. Every `[X]` was answered against `spec.md` before
implementation; `[ ]` marks must be resolved before the feature is called done.

## Completeness

- [X] Every user story has explicit priority, why, and independent test.
- [X] Every story has ≥5 acceptance scenarios with Given/When/Then.
- [X] Edge cases cover empty inputs, boundaries, state combinations, and adversarial input
      (regex chars, secret fields).
- [X] Non-functional requirements present (a11y WCAG AA via Material semantics, FR-011/013/014).
- [X] Out-of-scope items declared (Assumptions: URL persistence, debounce, fuzzy matching,
      roadmap edit, crypto).
- [ ] No open questions remain with the author (numbering 015 and indicator replacement are
      **inferred** — confirm at PR review).

## Ambiguity

- [X] "Search" is defined precisely: trimmed, lowercased, literal substring, three-field set,
      exclusion list (FR-002).
- [X] "Filter" semantics defined as AND-composition (FR-008, SC-003).
- [X] "Derived" defined: computed over store + local signals, zero store mutation (FR-003).
- [X] No modal verbs without a subject (all MUST/SHALL requirements identify the component).
- [X] Success criteria are measurable (store snapshots, aria attributes, mutant failures,
      test counts).

## Consistency

- [X] Terminology matches 008 (`name` not "title", `favorite`, `updated_at`).
- [X] No contradiction with 014's no-transform rule (trimming applies to UI query only —
      Edge Case #1 explains the data-class difference).
- [X] FR-007 explicitly supersedes 009's passive-indicator behavior and mandates test updates
      rather than silently keeping both.
- [X] Priority scheme (P1/P1/P2) consistent with 009/014 conventions.

## Testability

- [X] Each FR maps to ≥1 acceptance scenario; each SC maps to automated assertions
      (harness + store snapshot + aria attributes).
- [X] Independent tests runnable with seeded mock data only (no persistence/backends).
- [X] Mutant targets named (SC-006) and matchable to code (matcher field set, `update` call,
      AND logic, live-region binding).
- [X] A11y verifiable through observable semantics (roles/labels/pressed/live-region) — no
      external scanner (FR-011).

## Traceability

- [X] FR-001..014 ↔ SC-001..008 cross-referenced in spec.
- [X] Roadmap slot → spec → plan → research D1..D9 → contracts → tasks (T-numbers) chain
      documented in `tasks.md`.
- [X] Files outside scope explicitly protected (FR-012, SC-008, `src/vault/`).

## Verdict

Spec is implementation-ready. The single open item is human confirmation of the inferred
decisions (renumbering, indicator replacement) at PR review.
