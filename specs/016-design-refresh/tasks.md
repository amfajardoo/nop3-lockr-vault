# Tasks: Expressive Design Refresh (016)

Legend: `[ ]` pending · `[x]` done. Flow: spec → plan → tasks → implement → converge.
Commits stop for human approval per AGENTS.md. Tooling changes (if any, e.g. a testing stub
helper) go in their own commit (Branching policy).

## Phase 0 — Setup

- [x] T001 Create branch `feature/016-design-refresh` off post-015 `main`.
- [x] T002 Baseline gate: `pnpm verify` green on `main` (record counts — expect 245 tests).

## Phase 1 — Spec artifacts (commit before code, Gate I)

- [x] T003 Author `spec.md` (US1–5, FR-001..014, SC-001..009, edge cases, stated-vs-inferred).
- [x] T004 Author `plan.md` (gates, scope, file impact, architecture, testing, risks).
- [x] T005 Author `research.md` (D1 expressiveness-in-M3, D2 token unification, D3
      MediaMatcher signal, D4 font via `--mat-sys-*-font` spike, D5 icons, D6 spacing scale,
      D7 hover/focus/motion, D8 accents, D9 spec-selector inventory, D10 palette regen
      fallback).
- [x] T006 Author `data-model.md` (token layer, responsive state, NavItem.icon, icon
      inventory, unchanged list).
- [x] T007 Author `contracts/visual-system.md` (page-header, surfaces, breakpoint, icon and
      a11y contracts, non-goals).
- [x] T008 Author `checklists/requirements.md` (verdict + coverage matrix).
- [x] T009 Author `quickstart.md` (14-step manual walkthrough).
- [x] T010 Commit spec artifacts; human approval first (Review-before-commit).

## Phase 2 — Token & type layer

- [x] T011 `styles.css`: derive body from `--mat-sys-*` tokens; drop the parallel slate
      palette; keep documented `--success`/`--warning` extensions; `.dark` keeps `color-scheme`
      + extension handling only.
- [x] T012 `styles.css`: add `--space-1..7` scale; override display/headline `--mat-sys-*-font`
      with the display font + fallback stack; body/label/title roles keep Roboto.
- [x] T013 `index.html`: add the display-font Google Fonts `<link>` (preconnect already
      present); pre-paint script untouched.
- [x] T014 Update `src/theme/contrast.spec.ts` documented pairs to the unified tokens; keep
      `contrast.ts` untouched; ensure ≥4.5 text / ≥3 non-text in both schemes.
- [x] T015 If review requests it only: regenerate `_theme-colors.scss` (D10) and re-run the
      full suite — default is to keep palettes.

## Phase 3 — Shell: responsive + structure (US3 + brand)

- [x] T016 `dashboard.ts`: `wide` signal from CDK `MediaMatcher.matchMedia("(min-width:
      960px)")` + `change` listener + `DestroyRef` cleanup; sidenav `opened` initial from
      `wide()`, resets open on crossing wide.
- [x] T017 `dashboard.html`: bind sidenav `[mode]` (`side`/`over`), conditional menu button
      (narrow only, accessible name + `aria-expanded`), brand icon; `nav-items.ts` gains
      `icon` with nav item rendering `<mat-icon aria-hidden>`.
- [x] T018 `dashboard.css`: content measure + centered layout + scale-based padding; token-only
      colors (purity spec must stay green); hover/focus on nav items with reduced-motion gate.
- [x] T019 Import `MatIconModule` in the dashboard (and later views as needed).
- [x] T020 Responsive stub: extend `src/testing/media-matcher-stub.ts` (or add a sibling
      helper) to drive wide/narrow — if modified, stage it as its own tooling commit.

## Phase 4 — Views: hierarchy, surfaces, icons (US1 + US5)

- [x] T021 `credential-list.html/.css`: page-header pattern (title + lede + actions group);
      search `matIconPrefix` icon; filter star icon; replace unicode stars and the inline
      delete SVG with `<mat-icon>`s (labels byte-identical); row hover/focus affordance;
      state cards gain icons.
- [x] T022 `credential-detail.html/.css`: page-header with Edit/Delete as grouped actions;
      raised surface for data; not-found state icon; `credential-detail` heading ids intact.
- [x] T023 `credential-form.html/.css`: page-header (create/edit titles); card raised surface
      + measure; not-found icon; field/label structure untouched (014 specs anchor).
- [x] T024 Grep the selector inventory (research D9) and list every spec file that touches a
      moved element; adjust only where location changed, intent preserved, notes here.

## Phase 5 — Tests

- [x] T025 Page-header specs (SC-001): harness assertions for title/lede/actions on all four
      views with existing ids/names; state cards render icon + heading + copy + action.
- [x] T026 Token specs (SC-002/004): body/shell reference Material family (no parallel
      palette); display-font overrides present, body roles still `Roboto`; spacing scale
      present; literal-color scan across ALL component stylesheets (extend
      `app-tokens.spec.ts` or sibling spec).
- [x] T027 Responsive specs (SC-003): stub-driven wide (rail, no menu button) and narrow
      (closed overlay, menu button opens/closes, `aria-expanded`), reactive crossing,
      listener cleanup.
- [x] T028 Icon specs (SC-005): each inventory location renders `mat-icon` with the right
      ligature; `aria-hidden` present; pre-existing names/selectors asserted unchanged
      (rely on 009/012/014/015 suites + targeted DOM assertions).
- [x] T029 Contrast suite green in both schemes after T014 (SC-002); add every new pair
      introduced during styling in the same change.

## Phase 6 — Verification & convergence

- [x] T030 `pnpm test:run` — full suite green (245 baseline + new design specs); record
      counts; document any structural spec adjustments from T024/T021–023.
- [x] T031 Mutant A: force sidenav always `side`/wide → responsive specs fail → restore.
- [x] T032 Mutant B: fork body back to a hand-written palette → token-family spec fails →
      restore.
- [x] T033 Mutant C: remove display-font override → type spec fails → restore.
- [x] T034 Mutant D: worsen a documented contrast pair → contrast suite fails → restore.
- [x] T035 `pnpm verify` green (biome + full suite + build; watch `anyComponentStyle` budget
      4kB warning/8kB error per stylesheet).
- [ ] T036 Manual `quickstart.md` walkthrough with the reviewer (light/dark, wide/narrow,
      320px, keyboard, offline font) — aesthetic sign-off (SC-008).
- [x] T037 Scope audit: diff confined to styles/templates/shell/theme-specs (+ testing stub if
      staged separately); `git diff --name-only -- src/vault` empty; routes unchanged
      (SC-009).

## Phase 7 — Delivery

- [ ] T038 Present commit summary(s); human approval (Review-before-commit); split tooling
      (stub) from feature commits if T020 applied.
- [ ] T039 Commit(s) + push.
- [ ] T040 Open PR with `.github/PULL_REQUEST_TEMPLATE.md` (6 sections; **inferred**
      aesthetic decisions flagged; mutant results + walkthrough status in Testing).
- [ ] T041 Post-merge: pull `main`, delete branch, re-run `pnpm verify` baseline.

## Progress notes (implementation, 2026-09-26)

- **T002 baseline**: `pnpm verify` green on `main` @ `13a9da7` � 245 tests.
- **T015**: palettes kept (D10 default); `_theme-colors.scss` untouched.
- **T024 selector inventory (D9)**: every listed selector survives byte-identically �
  zero adjustments were needed in the 009/012/014/015 specs (all pass unchanged).
  Structural notes: detail/form titles moved inside the card `.page-header` wrapper while
  keeping `mat-card-title`, so `MatCardHarness.getTitleText()` and the exact `h1` text
  assertions hold; detail's grouped header action is Edit only (FR-011 � no new behavior;
  the US2 scenario's "Edit/Delete" is read as *existing* actions, Delete stays row-only);
  `.page-header` styles live in `styles.css` (shared, token-only, single source).
- **T030 counts**: 245 baseline -> 240 after the `tokens.spec.ts` reconciliation
  (structural consolidation of the old parity/invariant blocks, SC-006 allowance) ->
  **275** with the 016 specs (+4 page-header, +5 responsive, +8 iconography,
  +10 contrast pairs, +8 token/view-stylesheet checks).
- **T031�T034 mutants** (each applied, suite run, restored): A always-wide shell ->
  2 responsive tests fail; B literal body color -> single-source spec fails; C display
  font -> Roboto -> type spec fails; D worsened contrast pair -> contrast suite fails.
  Extra mutant: no listener cleanup on destroy -> listener test fails. All green again
  after restore.
- **T035**: `pnpm verify` green (biome ci clean, 275/275, build within style budgets).
- **T037**: diff confined to `src/app/**`, `src/styles.css`, `src/index.html`,
  `src/theme/*`, `src/testing/media-matcher-stub.ts`; `git diff --name-only -- src/vault`
  empty; routes unchanged.
- **Inferred decisions** (flagged for PR review): 960px breakpoint (research D3);
  Space Grotesk as display font (D4/D8); page-lede microcopy strings; edit-form lede;
  `.card-raised` = `surface-container-high` (contract's card level); active-nav via
  `--mat-list-list-item-*-label-text-color` overrides (Material component tokens).
