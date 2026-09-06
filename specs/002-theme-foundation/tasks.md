---

description: "Task list for theme foundation feature implementation"
---

# Tasks: Theme Foundation

**Input**: Design documents from `/specs/002-theme-foundation/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Constitution**: automated tests are MANDATORY for every scenario (Automated Verifiability + Testing
and Compliance clauses), so every story includes test-first tasks. Tests are written and shown to
FAIL before the implementation that satisfies them.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)
- Exact file paths are included.

## Path Conventions

- Single Angular SPA at repo root: `src/` (unit specs colocated under `src/theme/`).

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Confirm the starting point is green before any change.

- [ ] T001 Confirm the green baseline by running `pnpm verify` and recording the output (all
      gates: `biome ci . && pnpm test && pnpm build`). If green, proceed; if not, STOP and report.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Pure color-math utilities every story's contrast guarantees depend on (research D4).

- [ ] T002 Create `src/theme/contrast.ts` with pure WCAG functions `relativeLuminance(hex: string): number`
      and `contrastRatio(hexA: string, hexB: string): number` (strict TS, `unknown`-safe inputs, supports
      `#rgb` and `#rrggbb`; per research D4 no external dependency).
- [ ] T003 Create `src/theme/contrast.spec.ts` unit-testing `relativeLuminance` and `contrastRatio`
      against known ratios (white/black = 21:1; `#0f172a` on `#ffffff` ≈ 18.9:1; `#475569` on
      `#ffffff` ≈ 5.9:1; white on `#2563eb` ≈ 5.1:1; dark-mode pairs from data-model.md).

**Checkpoint**: Contrast math is proven; the AA-enforcing token tests (T007) can now run.

---

## Phase 3: User Story 1 - No-flash correct first paint (Priority: P1) — MVP

**Goal**: The active theme is resolved before the first paint (stored choice wins, OS is the
fallback, invalid/missing values never break boot) — research D3, spec US1.

**Independent Test**: `pnpm test` executes the ACTUAL inline script extracted from `src/index.html`
inside jsdom and asserts the applied root class for every spec scenario.

### Tests for User Story 1 (written first - MUST FAIL before T006)

- [ ] T004 [P] [US1] Write `src/theme/pre-paint.spec.ts`: load `src/index.html` from disk (`fs`),
      extract the inline `<head>` script, execute it in a `jsdom` instance (seed `localStorage`,
      stub `window.matchMedia`) and assert the root `dark` class for each spec scenario:
      (a) stored `"dark"` + system light → dark; (b) stored `"light"` + system dark → light;
      (c) missing value + system dark → dark; (d) stored `"system"` → follows system;
      (e) invalid/malformed stored value → follows system, no exception; (f) `localStorage.getItem`
      throwing → follows system, no crash. EXPECT FAIL: script does not exist yet.
- [ ] T005 [P] [US1] Write `src/theme/index-html.spec.ts` (structural): assert `src/index.html`
      `<head>` contains exactly one inline pre-paint `<script>` as its FIRST child, synchronous
      (no `defer`/`async`/`type="module"`), referencing the `lockr.theme` key and
      `prefers-color-scheme`, with no dependency on any external module/request. EXPECT FAIL.

### Implementation for User Story 1

- [ ] T006 [US1] Implement the minimal inline pre-paint script in `src/index.html` `<head>` (before
      the stylesheet/Angular bundle) per research D3: `try/catch`-read `localStorage["lockr.theme"]`;
      `"light"` → remove class, `"dark"` → add class, anything else (including `"system"`, missing,
      malformed, thrown) → `matchMedia("(prefers-color-scheme: dark)")` decides; mutate only
      `classList` on `document.documentElement`. No other code, no layout-affecting statements.

**Checkpoint**: T004+T005 (and the app's existing specs) pass; US1 is functionally proven at boot.

---

## Phase 4: User Story 2 - One marker switches the whole palette (Priority: P1)

**Goal**: A single `dark` class on the root switches every surface through the shared tokens
(class-driven dark mode + AA-verified palettes) — spec US2, research D1/D2.

**Independent Test**: `pnpm test` asserts the token/variant structure of the ACTUAL `src/styles.css`
and recomputes every AA invariant from the parsed token values.

### Tests for User Story 2 (written first - MUST FAIL before T008)

- [ ] T007 [P] [US2] Write `src/theme/tokens.spec.ts`: parse `src/styles.css` and assert
      (a) `@custom-variant dark (&:where(.dark, .dark *))` appears immediately after
      `@import "tailwindcss";`; (b) `:root` defines ALL light tokens and `.dark` overrides the SAME
      token set from data-model.md (`--surface`, `--surface-raised`, `--foreground`, `--muted`,
      `--accent`, `--on-accent`, `--line`, `--line-subtle`, `--success`, `--warning`, `--error`,
      `--info`); (c) `@theme inline` maps every raw token to its `--color-*` utility; (d)
      `color-scheme: light`/`dark` respectively; (e) recompute `contrastRatio` (from T002) for every
      invariant pair in data-model.md in BOTH palettes and assert text ≥ 4.5:1 and non-text (`--line`,
      focus/accent) ≥ 3:1. EXPECT FAIL: styles.css has no tokens yet.

### Implementation for User Story 2

- [ ] T008 [US2] Implement the theming core in `src/styles.css`: `@custom-variant dark` after the
      Tailwind import; `:root`/`.dark` token blocks per data-model.md (including `color-scheme`);
      `@theme inline` mapping all tokens to utilities; a global `@layer base` so the document canvas
      uses the tokens (`body { background-color/color }` via the raw variables).

**Checkpoint**: T007 passes; both palettes are AA-enforced at the token layer.

---

## Phase 5: User Story 3 - One source of truth for colors (Priority: P2)

**Goal**: Every scaffold surface references semantic tokens only; no literal colors outside
`:root`/`.dark` (single source) — spec US3, data-model validation rules.

**Independent Test**: `pnpm test` asserts the scaffold HTML/CSS contains no literal color values and
uses only token utilities; manual visual check stays consistent in both themes.

### Tests for User Story 3 (written first - MUST FAIL before T010)

- [ ] T009 [P] [US3] Write `src/app/app-tokens.spec.ts` (structural): read `src/app/app.html`,
      `src/app/app.css` and assert no literal hex/oklch/rgb() color values remain and that themed
      color classes used are token utilities (`bg-surface*`, `text-foreground`, `text-muted`,
      `border-line*`, `text-accent`); existing layout classes are preserved. EXPECT FAIL: the
      scaffold still inlines hardcoded oklch palette + rainbow gradients.

### Implementation for User Story 3

- [ ] T010 [US3] Migrate `src/app/app.html` + `src/app/app.css` to token-based styling: remove the
      hardcoded oklch variables/gradients (Angular scaffold branding is not ours - research D6),
      replace themed colors with token utilities, keep layout/spacing intact, and keep the existing
      `app.spec.ts` title assertions passing.

**Checkpoint**: T009 passes; the scaffold is fully token-driven in both themes.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: End-to-end verification and repo hygiene.

- [ ] T011 Run `pnpm verify` (Biome gate + unit tests + build) and fix any violations; confirm no
      literal `#`/`oklch(` colors remain anywhere under `src/` outside `src/styles.css` token blocks
      (grep check) and `pnpm lint` passes.
- [ ] T012 [P] Confirm the shipped build keeps the pre-paint script: `pnpm build`, then assert the
      inline script is present in `dist/` `index.html` in `<head>`. Optionally re-run the
      quickstart.md manual checks (no-FOUC via devtools emulation; one-marker switch; offline reload).

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (T001)**: green baseline first.
- **Foundational (T002-T003)**: after T001; T003 depends on T002. Blocks the AA-parse in T007.
- **US1 (T004-T006)**: after Foundational; does not depend on the token CSS (tests the boot script).
- **US2 (T007-T008)**: after Foundational; T007 depends on T002 (contrast math) + data-model.
- **US3 (T009-T010)**: depends on US2 (tokens+base must exist for the scaffold migration) and T001.
- **Polish (T011-T012)**: after all stories.

### User Story Dependencies

- **US1 (P1)**: standalone (script + jsdom tests). Can land and be demoed as the MVP.
- **US2 (P1)**: standalone CSS mechanism; no code written by US1 is required for it.
- **US3 (P2)**: requires US2 tokens to exist so the scaffold can migrate to them.

### Within Each User Story

- Tests written and shown FAILING first, then implementation, then green.

### Parallel Opportunities

- T002 vs T004 vs T005 vs T007 vs T009: all touch different files (different spec files + sources),
  so the "write the test first" tasks can be authored and run in parallel.
- T003 depends on T002; T006 depends on T004/T005 (green check); T008 depends on T007;
  T010 depends on T009 and T008.

---

## Parallel Example: test-first batch

```bash
# Write all story tests in parallel (all fail until their implementation lands):
Task: "T004 src/theme/pre-paint.spec.ts (jsdom, behavior) + T005 src/theme/index-html.spec.ts (structure)"
Task: "T007 src/theme/tokens.spec.ts (CSS structure + AA invariants)"
Task: "T009 src/app/app-tokens.spec.ts (scaffold token purity)"
```

---

## Implementation Strategy

### MVP First (User Story 1 only)

1. T001 baseline green.
2. T002-T003 contrast utilities (needed only by T007; not by US1).
3. T004-T006 US1 → jsdom test proves the resolution contract. Demo: boot in dark mode has zero flash.
4. STOP and VALIDATE US1 independently before continuing.

### Incremental Delivery

1. Foundation ready: US1 (no-flash boot) → demo.
2. Add US2 (palette mechanism + AA) → validated by tokens.spec.
3. Add US3 (scaffold on tokens) → validated by app-tokens.spec.
4. Polish: verify + build assertions.

### Notes

- Visual "no FOUC" capture and AXE scans are owned by feature 005 (per spec assumptions); 002
  enforces the resolution contract in jsdom and the token/AA structure in unit tests.
- The stored-value key (`lockr.theme`) and schema are fixed contracts for feature 003.
- Commit after each task or logical group, always after user review (review-before-commit policy).