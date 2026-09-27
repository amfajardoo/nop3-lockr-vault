# Tasks: Expressive Design Refresh (016)

Legend: `[ ]` pending · `[x]` done. Flow: spec → plan → tasks → implement → converge.
Commits stop for human approval per AGENTS.md. Tooling changes (if any, e.g. a testing stub
helper) go in their own commit (Branching policy).

## Phase 0 — Setup

- [ ] T001 Create branch `feature/016-design-refresh` off post-015 `main`.
- [ ] T002 Baseline gate: `pnpm verify` green on `main` (record counts — expect 245 tests).

## Phase 1 — Spec artifacts (commit before code, Gate I)

- [ ] T003 Author `spec.md` (US1–5, FR-001..014, SC-001..009, edge cases, stated-vs-inferred).
- [ ] T004 Author `plan.md` (gates, scope, file impact, architecture, testing, risks).
- [ ] T005 Author `research.md` (D1 expressiveness-in-M3, D2 token unification, D3
      MediaMatcher signal, D4 font via `--mat-sys-*-font` spike, D5 icons, D6 spacing scale,
      D7 hover/focus/motion, D8 accents, D9 spec-selector inventory, D10 palette regen
      fallback).
- [ ] T006 Author `data-model.md` (token layer, responsive state, NavItem.icon, icon
      inventory, unchanged list).
- [ ] T007 Author `contracts/visual-system.md` (page-header, surfaces, breakpoint, icon and
      a11y contracts, non-goals).
- [ ] T008 Author `checklists/requirements.md` (verdict + coverage matrix).
- [ ] T009 Author `quickstart.md` (14-step manual walkthrough).
- [ ] T010 Commit spec artifacts; human approval first (Review-before-commit).

## Phase 2 — Token & type layer

- [ ] T011 `styles.css`: derive body from `--mat-sys-*` tokens; drop the parallel slate
      palette; keep documented `--success`/`--warning` extensions; `.dark` keeps `color-scheme`
      + extension handling only.
- [ ] T012 `styles.css`: add `--space-1..7` scale; override display/headline `--mat-sys-*-font`
      with the display font + fallback stack; body/label/title roles keep Roboto.
- [ ] T013 `index.html`: add the display-font Google Fonts `<link>` (preconnect already
      present); pre-paint script untouched.
- [ ] T014 Update `src/theme/contrast.spec.ts` documented pairs to the unified tokens; keep
      `contrast.ts` untouched; ensure ≥4.5 text / ≥3 non-text in both schemes.
- [ ] T015 If review requests it only: regenerate `_theme-colors.scss` (D10) and re-run the
      full suite — default is to keep palettes.

## Phase 3 — Shell: responsive + structure (US3 + brand)

- [ ] T016 `dashboard.ts`: `wide` signal from CDK `MediaMatcher.matchMedia("(min-width:
      960px)")` + `change` listener + `DestroyRef` cleanup; sidenav `opened` initial from
      `wide()`, resets open on crossing wide.
- [ ] T017 `dashboard.html`: bind sidenav `[mode]` (`side`/`over`), conditional menu button
      (narrow only, accessible name + `aria-expanded`), brand icon; `nav-items.ts` gains
      `icon` with nav item rendering `<mat-icon aria-hidden>`.
- [ ] T018 `dashboard.css`: content measure + centered layout + scale-based padding; token-only
      colors (purity spec must stay green); hover/focus on nav items with reduced-motion gate.
- [ ] T019 Import `MatIconModule` in the dashboard (and later views as needed).
- [ ] T020 Responsive stub: extend `src/testing/media-matcher-stub.ts` (or add a sibling
      helper) to drive wide/narrow — if modified, stage it as its own tooling commit.

## Phase 4 — Views: hierarchy, surfaces, icons (US1 + US5)

- [ ] T021 `credential-list.html/.css`: page-header pattern (title + lede + actions group);
      search `matIconPrefix` icon; filter star icon; replace unicode stars and the inline
      delete SVG with `<mat-icon>`s (labels byte-identical); row hover/focus affordance;
      state cards gain icons.
- [ ] T022 `credential-detail.html/.css`: page-header with Edit/Delete as grouped actions;
      raised surface for data; not-found state icon; `credential-detail` heading ids intact.
- [ ] T023 `credential-form.html/.css`: page-header (create/edit titles); card raised surface
      + measure; not-found icon; field/label structure untouched (014 specs anchor).
- [ ] T024 Grep the selector inventory (research D9) and list every spec file that touches a
      moved element; adjust only where location changed, intent preserved, notes here.

## Phase 5 — Tests

- [ ] T025 Page-header specs (SC-001): harness assertions for title/lede/actions on all four
      views with existing ids/names; state cards render icon + heading + copy + action.
- [ ] T026 Token specs (SC-002/004): body/shell reference Material family (no parallel
      palette); display-font overrides present, body roles still `Roboto`; spacing scale
      present; literal-color scan across ALL component stylesheets (extend
      `app-tokens.spec.ts` or sibling spec).
- [ ] T027 Responsive specs (SC-003): stub-driven wide (rail, no menu button) and narrow
      (closed overlay, menu button opens/closes, `aria-expanded`), reactive crossing,
      listener cleanup.
- [ ] T028 Icon specs (SC-005): each inventory location renders `mat-icon` with the right
      ligature; `aria-hidden` present; pre-existing names/selectors asserted unchanged
      (rely on 009/012/014/015 suites + targeted DOM assertions).
- [ ] T029 Contrast suite green in both schemes after T014 (SC-002); add every new pair
      introduced during styling in the same change.

## Phase 6 — Verification & convergence

- [ ] T030 `pnpm test:run` — full suite green (245 baseline + new design specs); record
      counts; document any structural spec adjustments from T024/T021–023.
- [ ] T031 Mutant A: force sidenav always `side`/wide → responsive specs fail → restore.
- [ ] T032 Mutant B: fork body back to a hand-written palette → token-family spec fails →
      restore.
- [ ] T033 Mutant C: remove display-font override → type spec fails → restore.
- [ ] T034 Mutant D: worsen a documented contrast pair → contrast suite fails → restore.
- [ ] T035 `pnpm verify` green (biome + full suite + build; watch `anyComponentStyle` budget
      4kB warning/8kB error per stylesheet).
- [ ] T036 Manual `quickstart.md` walkthrough with the reviewer (light/dark, wide/narrow,
      320px, keyboard, offline font) — aesthetic sign-off (SC-008).
- [ ] T037 Scope audit: diff confined to styles/templates/shell/theme-specs (+ testing stub if
      staged separately); `git diff --name-only -- src/vault` empty; routes unchanged
      (SC-009).

## Phase 7 — Delivery

- [ ] T038 Present commit summary(s); human approval (Review-before-commit); split tooling
      (stub) from feature commits if T020 applied.
- [ ] T039 Commit(s) + push.
- [ ] T040 Open PR with `.github/PULL_REQUEST_TEMPLATE.md` (6 sections; **inferred**
      aesthetic decisions flagged; mutant results + walkthrough status in Testing).
- [ ] T041 Post-merge: pull `main`, delete branch, re-run `pnpm verify` baseline.
