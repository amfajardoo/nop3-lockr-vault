# Tasks: Credential Favorites & Search (015)

Legend: `[ ]` pending · `[x]` done. Execution follows the speckit flow (spec → plan → tasks →
implement → converge); commits stop for human approval per AGENTS.md.

## Phase 0 — Setup

- [x] T001 Create branch `feature/015-credential-favorites-search` off post-014 `main`
      (mock-only, English, governance per Constitution VIII).
- [x] T002 Baseline gate: `pnpm verify` green on `main` before any change (227/227 tests,
      biome 73 files, build OK).

## Phase 1 — Spec artifacts (commit before code, Gate I)

- [x] T003 Author `spec.md` (US1-3, FR-001..014, SC-001..008, edge cases, assumptions).
- [x] T004 Author `plan.md` (gates table, scope, file impact, architecture, testing approach).
- [x] T005 Author `research.md` (D1 state location, D2 toggle primitive, D3 matcher, D4 render
      precedence, D5 live region, D6 indicator replacement, D7 query normalization, D8 no
      debounce, D9 store semantics verified).
- [x] T006 Author `data-model.md` (consumed fields, single write, signal/computed inventory,
      matcher invariants).
- [x] T007 Author `contracts/search-filter.md` (inputs, three render branches, store
      interaction, a11y contract, non-goals).
- [x] T008 Author `checklists/requirements.md` (quality checklist verdict).
- [x] T009 Author `quickstart.md` (14-step manual walkthrough).
- [x] T010 Commit spec artifacts only; get human approval first (Review-before-commit) —
      `5e63a46`.

## Phase 2 — Implementation (`src/app/credential-list/`)

- [x] T011 `credential-list.ts`: add `query`/`favoritesOnly` signals; export pure
      `matchesQuery` (D3); `visibleCredentials`, `visibleCount`, `hasActiveView` computeds
      (order-preserving, AND composition).
- [x] T012 `credential-list.ts`: `toggleFavorite(credential)` →
      `store.update(credential.id, { favorite: !credential.favorite })`; `resetView()`.
- [x] T013 `credential-list.html`: header search field (accessible `<label for>`) + favorites
      filter button (`aria-pressed`) + polite live-region count (empty when `!hasActiveView()`).
- [x] T014 `credential-list.html`: rows over `visibleCredentials()`; replaced passive
      `span[data-favorite]` with star toggle button (`aria-label` Add/Remove <name>,
      `aria-pressed`); added `data-no-results` branch with reset affordance; kept
      `data-empty-state` outer branch (D4 precedence).
- [x] T015 `credential-list.css`: header layout (flex-wrap), search field width, result-count
      and no-results styles; Material tokens/CSS vars only.

## Phase 3 — Tests (`credential-list.spec.ts`, harness-first, AAA)

- [x] T016 US1 specs: match by name / username / domain; case-insensitive; trimmed query;
      clear restores full list; store snapshot identical across the whole scenario (SC-001).
- [x] T017 US1 specs: no-results branch + reset works; empty vault still shows
      `data-empty-state` (edge #4/#6, SC-004); regex chars treated literally (edge #8).
- [x] T018 US2 specs: star toggles `aria-pressed` + store `favorite` false→true→false with
      `updated_at` bumped and sibling fields untouched (SC-002, SC-005).
- [x] T019 US3 specs: favorites-only filter shows only favorites; combined query+filter =
      AND intersection; unfavorite under filter removes the row; empty-favorites state
      (SC-003, SC-004).
- [x] T020 A11y specs: search label via native `label[for]` (Material's actual association,
      verified against form-field source), toggle `aria-pressed`/names, live-region polite
      text contains visible+total counts (SC-005); delete (012) works inside a filtered view
      (FR-010).
- [x] T021 Rewrote 009's passive-indicator assertion against the toggle (pressed order
      `["true","false","false"]` + labels match /favorite/i) without weakening intent
      (FR-007); no other existing spec broke.

## Phase 4 — Verification & convergence

- [x] T022 `pnpm test:run` — **245/245 green** (baseline 227 + 18 new).
- [x] T023 Mutant A: dropped `domain` from `matchesQuery` → 1 search spec failed → restored.
- [x] T024 Mutant B: removed `store.update` in `toggleFavorite` → 4 specs failed → restored.
- [x] T025 Mutant C: AND → OR in `visibleCredentials` → 11 specs failed → restored.
- [x] T026 Mutant D: removed live-region text binding → 1 a11y spec failed → restored.
- [x] T027 `pnpm verify` green (biome 73 files + 245 tests + build); fixed 2
      `use-iterable-callback-return` findings.
- [ ] T028 Manual `quickstart.md` walkthrough (13 steps) — handed to the PR reviewer (no
      browser in the agent environment).
- [x] T029 Scope audit: only `credential-list.{ts,html,css,spec}` pending; spec artifacts
      already committed; `git diff --name-only -- src/vault src/theme` empty (SC-008, FR-012).

## Phase 5 — Delivery

- [ ] T030 Present commit summary; get explicit human approval (Review-before-commit).
- [ ] T031 Commit(s): feat (code+tests) then docs (task progress); push.
- [ ] T032 Open PR with `.github/PULL_REQUEST_TEMPLATE.md` (6 sections; rationale stated vs
      **inferred** clearly marked; mutant results in Testing).
- [ ] T033 Post-merge: pull `main`, delete branch, re-run `pnpm verify` baseline for the next
      feature.
