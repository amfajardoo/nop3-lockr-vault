# Tasks: Credential Favorites & Search (015)

Legend: `[ ]` pending · `[x]` done. Execution follows the speckit flow (spec → plan → tasks →
implement → converge); commits stop for human approval per AGENTS.md.

## Phase 0 — Setup

- [ ] T001 Create branch `feature/015-credential-favorites-search` off post-014 `main`
      (mock-only, English, governance per Constitution VIII).
- [ ] T002 Baseline gate: `pnpm verify` green on `main` before any change (record counts).

## Phase 1 — Spec artifacts (commit before code, Gate I)

- [ ] T003 Author `spec.md` (US1-3, FR-001..014, SC-001..008, edge cases, assumptions).
- [ ] T004 Author `plan.md` (gates table, scope, file impact, architecture, testing approach).
- [ ] T005 Author `research.md` (D1 state location, D2 toggle primitive, D3 matcher, D4 render
      precedence, D5 live region, D6 indicator replacement, D7 query normalization, D8 no
      debounce, D9 store semantics verified).
- [ ] T006 Author `data-model.md` (consumed fields, single write, signal/computed inventory,
      matcher invariants).
- [ ] T007 Author `contracts/search-filter.md` (inputs, three render branches, store
      interaction, a11y contract, non-goals).
- [ ] T008 Author `checklists/requirements.md` (quality checklist verdict).
- [ ] T009 Author `quickstart.md` (14-step manual walkthrough).
- [ ] T010 Commit spec artifacts only; get human approval first (Review-before-commit).

## Phase 2 — Implementation (`src/app/credential-list/`)

- [ ] T011 `credential-list.ts`: add `query`/`favoritesOnly` signals; export pure
      `matchesQuery` (D3); `visibleCredentials`, `visibleCount`, `hasActiveView` computeds
      (order-preserving, AND composition).
- [ ] T012 `credential-list.ts`: `toggleFavorite(credential)` →
      `store.update(credential.id, { favorite: !credential.favorite })`; `clearSearch()` /
      `resetView()`.
- [ ] T013 `credential-list.html`: header search field (accessible label) + favorites filter
      button (`aria-pressed`) + polite live-region count (hidden when `!hasActiveView()`).
- [ ] T014 `credential-list.html`: rows over `visibleCredentials()`; replace passive
      `span[data-favorite]` with star toggle button (`aria-label` Add/Remove <name>,
      `aria-pressed`); add `data-no-results` branch with reset affordance; keep
      `data-empty-state` outer branch (D4 precedence).
- [ ] T015 `credential-list.css`: header layout for the new controls; row density check;
      no new utility-class dependencies (CSS vars/Material tokens only).

## Phase 3 — Tests (`credential-list.spec.ts`, harness-first, AAA)

- [ ] T016 US1 specs: match by name / username / domain; case-insensitive; trimmed query;
      clear restores full list; store snapshot identical across the whole scenario (SC-001).
- [ ] T017 US1 specs: no-results branch (query matches nothing, vault non-empty) + reset
      works; empty vault still shows `data-empty-state` (edge #4/#6, SC-004).
- [ ] T018 US2 specs: star toggles `aria-pressed` + store `favorite` false→true→false with
      `updated_at` bumped and sibling fields untouched; accessible name contains credential
      name (SC-002, SC-005).
- [ ] T019 US3 specs: favorites-only filter shows only favorites; combined query+filter =
      AND intersection; unfavorite under filter removes the row (SC-003).
- [ ] T020 A11y specs: search label, both toggles' `aria-pressed`, live-region polite text
      contains visible+total counts and updates (SC-005); delete (012) still works inside a
      filtered view (FR-010).
- [ ] T021 Rewrite 009's passive-indicator assertions against the toggle without weakening
      intent (FR-007); confirm no other existing spec broke.

## Phase 4 — Verification & convergence

- [ ] T022 Run `pnpm test:run` — all green; record final counts (baseline + new).
- [ ] T023 Mutant check A: drop a field from `matchesQuery` → ≥1 search spec fails → restore.
- [ ] T024 Mutant check B: remove the `store.update` call in `toggleFavorite` → ≥1 toggle
      spec fails → restore.
- [ ] T025 Mutant check C: change AND composition to OR → ≥1 combined spec fails → restore.
- [ ] T026 Mutant check D: remove live-region text binding → ≥1 a11y spec fails → restore.
- [ ] T027 `pnpm verify` green (biome + full suite + build); fix any biome findings.
- [ ] T028 Manual `quickstart.md` walkthrough (13 steps) — or explicitly hand to reviewer.
- [ ] T029 Scope audit: `git status`/`diff --stat` show only credential-list files + spec
      artifacts; `git diff --name-only -- src/vault src/theme` empty (SC-008, FR-012).

## Phase 5 — Delivery

- [ ] T030 Present commit summary; get explicit human approval (Review-before-commit).
- [ ] T031 Commit(s): feat (code+tests) then docs (task progress); push.
- [ ] T032 Open PR with `.github/PULL_REQUEST_TEMPLATE.md` (6 sections; rationale stated vs
      **inferred** clearly marked; mutant results in Testing).
- [ ] T033 Post-merge: pull `main`, delete branch, re-run `pnpm verify` baseline for the next
      feature.
