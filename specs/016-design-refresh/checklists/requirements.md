# Requirements Quality Checklist: Expressive Design Refresh (016)

Source: speckit requirements checklist. `[X]` answered against `spec.md` before implementation.

## Completeness

- [X] All five author-selected pain points map to a user story (US1 hierarchy, US2 colors,
      US3 layout, US4 typography/spacing, US5 icons).
- [X] Each story has priority, why, independent test, and ≥5 Given/When/Then scenarios.
- [X] Edge cases cover the risky mechanics: breakpoint flapping, overlay focus, icon-font
      failure, long titles, reduced motion, pre-paint, spec drift, contrast drift, palette
      regeneration.
- [X] Non-functional requirements explicit: WCAG AA contrast (FR-004), reflow 320px (FR-007),
      reduced motion (FR-012), behavior freeze (FR-011).
- [X] Out of scope declared: vault/routes/store/copy/i18n/density/deps/roadmap (Assumptions +
      contract non-goals).
- [ ] Inferred decisions confirmed by author at PR (number, breakpoint, display font,
      accent activation, spacing values, microcopy) — flagged, not yet answered.

## Ambiguity

- [X] "Expressive/branded" operationalized: Material slots + type override + accent usage +
      icons + hierarchy — measurable, not taste-dependent (taste isolated to SC-008 manual).
- [X] "Seam" defect stated with exact values (`#ffffff`/`#0f172a` vs
      `light-dark(#faf8ff, #11131b)`).
- [X] Breakpoint numeric (960px), measure/padding enforceable via scale, font role split
      (display vs body) explicit.
- [X] "No behavior change" defined: 245 tests green; structural spec edits only with
      documented intent preservation (FR-011).
- [X] Success criteria measurable: ratios, harness assertions, token strings, test counts.

## Consistency

- [X] Aligns with AGENTS.md (Material primitives, no Tailwind, token consumption, harness-first
      "when a harness path exists" — DOM queries justified for icons with evidence).
- [X] Aligns with constitution gates (table in plan.md) and 013's Tailwind removal decision.
- [X] Terminology matches existing specs (page header vs "hero", `data-*` hooks, schemes
      light/dark, `.dark` single-writer).
- [X] No contradiction with 009/012/014/015 behaviors — they are regression anchors.

## Testability

- [X] Every FR traces to ≥1 scenario; every SC to automated assertions except SC-008 (human,
      explicitly manual).
- [X] Mutant targets (A sidenav always-wide, B palette fork, C font override, D contrast pair)
      map to code/tokens that specs read directly.
- [X] Contrast verifiable with existing `contrastRatio` utility; responsive drivable via
      existing `MediaMatcher` stub pattern; icons via DOM + name-preservation specs.
- [X] Independent of persistence/backends (visual + token layer only).

## Traceability

- [X] Pain point → US → FR → SC → task chain complete (matrix below).
- [X] Research D1–D10 each disambiguates a plan decision; contracts cover header, surfaces,
      breakpoint, icons, a11y.
- [X] Protected surfaces named: `src/vault/`, routes, theme single-writer, `.specify/`.

### Coverage matrix

| Pain point | US | Key FRs | SCs |
| --- | --- | --- | --- |
| Jerarquía visual | US1 | 001, 002 | 001 |
| Colores/dark | US2 | 003, 004, 005 | 002 |
| Layout/responsive | US3 | 006, 007 | 003 |
| Tipografía/espaciado | US4 | 008, 009 | 004 |
| Iconografía | US5 | 010 | 005 |
| (transversal) | — | 011–014 | 006–009 |

## Verdict

Spec is implementation-ready; the open item is human confirmation of inferred aesthetic
decisions at PR review (they are reversible in isolation per Assumptions).
