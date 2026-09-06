# Research: Theme Foundation

**Feature**: [002-theme-foundation](../002-theme-foundation/spec.md)
**Date**: 2026-09-05

## Scope

Resolve the technical unknowns for "Tailwind v4 class-based dark mode + semantic tokens + no-FOUC
pre-paint". Findings verified against Tailwind CSS v4.3 (current, 2026-06) and the official docs.

## Decisions

### D1 - Class-driven dark variant

- **Decision**: Override the `dark` variant in `src/styles.css` with
  `@custom-variant dark (&:where(.dark, .dark *));` placed immediately after `@import "tailwindcss";`.
- **Rationale**: This is the official Tailwind v4 CSS-first form for class-based dark mode
  (`darkMode`/`tailwind.config.js` no longer exists in v4). `:where()` gives the dark utilities zero
  specificity, so they stay exactly as specific as their light counterparts. A single `dark` class on
  the root element drives the whole palette (FR-001), which is the marker feature 003 will toggle.
  Without this override, `dark:` follows `prefers-color-scheme` only and cannot honor a stored choice.
- **Alternatives considered**:
  - Default media-query dark mode — rejected: not class-driven; cannot be overridden by a stored
    choice; violates FR-001.
  - `@custom-variant dark (@media not print { .dark & })` (what the v3 upgrade tool emits) — rejected:
    known broken behavior as a class toggle; silently ignores the class.
  - `@custom-variant dark (&:is(.dark *))` — rejected: `:is()` inherits the specificity of its most
    specific argument (`.dark`), raising `dark:` utility specificity and causing override bugs.
  - Data-attribute variant (`[data-theme="dark"]`) — rejected: the spec fixes a class marker on the
    root; class is also the ecosystem convention feature 003 will build on.

### D2 - Two-layer semantic tokens

- **Decision**: Two layers:
  1. Raw semantic CSS variables as the single source of truth on `:root` (light) and `.dark` (dark):
     `--surface`, `--surface-raised`, `--foreground`, `--muted`, `--accent`, `--on-accent`, `--line`,
     `--line-subtle`, plus the four semantic states `--success`, `--warning`, `--error`, `--info`
     (full table in [data-model.md](./data-model.md#semantictokens)).
  2. A `@theme inline` mapping: `@theme inline { --color-surface: var(--surface); ... }` so
     components use `bg-surface`, `text-foreground`, `text-muted`, etc.
- **Rationale**: `@theme inline` inlines the *value* into the utility. When that value is a `var()`
  *reference*, the utility still resolves the raw variable at runtime, so flipping `.dark` on the
  root repaints every surface with zero per-component rules (FR-001, US2, US3). The raw variables in
  `:root`/`.dark` are the single source of truth (FR-002). Additionally set `color-scheme: light` on
  `:root` and `color-scheme: dark` on `.dark` so native form controls, scrollbars, and system UI
  follow the palette.
- **Alternatives considered**:
  - Literal color values inside `@theme inline`
    (`@theme inline { --color-surface: oklch(...) }`) — rejected: values are baked into the compiled
    utility at build time and NEVER change at runtime, so dark-mode switching silently stops
    working (the most common Tailwind v4 dark-mode failure).
  - Non-inline `@theme { --color-surface: <value> }` plus `.dark` overrides — rejected: `@theme`
    both emits utilities and declares the custom property in `@layer theme`, producing competing
    `:root`-level definitions whose cascade order is fragile to maintain.
  - Per-component hardcoding (`bg-white dark:bg-gray-900`) — rejected: duplicates the palette across
    every screen (US3) and makes a speculative third theme a rewrite.
  - `light-dark()` native CSS function — considered; rejected for now because the palette values are
    not a simple two-color pair everywhere and the spec fixes the class-marker contract (FR-001).
    May be revisited later.

### D3 - No-FOUC pre-paint resolution

- **Decision**: Ship the boot-time theme resolution as a tiny, synchronous, inline `<script>` in
  `<head>` of `src/index.html`, placed BEFORE the stylesheet link (Angular does not control this
  file's static head, so inline is the only way to guarantee pre-paint execution). It reads the
  stored choice, validates it, falls back to the OS preference otherwise, and applies/removes the
  `dark` class on `<html>`—then the browser continues to the first frame already correctly themed.
- **Resolution rules** (read-only; feature 003 owns writes):
  - stored `light` → light.
  - stored `dark` → dark.
  - stored `system`, missing, or any invalid/malformed value → `matchMedia('(prefers-color-scheme: dark)')`.
- **Testability decision**: the exact inline script text (the shipped artifact) is executed inside a
  `jsdom` instance (available in devDependencies) that stubs `matchMedia` and provides
  `localStorage`, then asserts the applied root class per scenario. This unit-tests the real shipped
  logic without duplicating it in a TS module (which would diverge silently).
- **Rationale**: a no-JS/script-blocked environment degrades to the light palette (documented
  assumption, SC acceptable as degraded). The script is small, executes within the blocking head
  parse, and honors FR-003/FR-004.
- **Alternatives considered**:
  - Apply the theme after Angular bootstrap (`main.ts`) — rejected: paints a frame in the wrong
    theme first = exactly the FOUC the feature exists to eliminate (SC-001).
  - Load the resolver as a module/bundle — rejected: asynchronous or deferral-reordering risks
    post-paint execution; needs an untestable inline/compiled split.
  - Server/SSR pre-paint — rejected: SPA only (documented assumption).

### D4 - Palette verification strategy

- **Decision**: The token values are chosen as AA-safe pairs up front and enforced by a dependency-free
  regression test: a pure TypeScript module holding the palette constants + a `computeContrastRatio()`
  (WCAG relative-luminance formula) asserting ≥ 4.5:1 for every normal-text pairing and ≥ 3:1 for
  non-text/border pairings in BOTH palettes. Full AXE scan in both themes is owned by feature 005.
- **Rationale**: contrast is a measurable SLA (WCAG AA, constitution Accessibility clause) that a
  color-math unit test can enforce cheaply at the token layer rather than waiting for browser e2e.
- **Alternatives considered**:
  - Only manual/e2e verification — rejected: AXE only runs in 005 and regression detection would be
    delayed a feature.
  - External contrast library dependency — rejected: the WCAG formula is ~30 lines; adding a dep for
    foundation work violates minimalism.

### D5 - Stored-preference key and contract

- **Decision**: The data contract for the persisted choice is a JSON Schema
  `contracts/theme-choice.schema.json` with `enum ["light", "dark", "system"]`. The key lives under
  the clean "lockr.*" domain namespace (`lockr.theme`); feature 003 owns writing it; feature 002 only
  reads it defensively.
- **Rationale**: Naming the contract now (spec phase) keeps 002 and 003 aligned on one storage format
  (constitution: theme is a non-sensitive preference, plain device storage is allowed) and prevents
  drift when 003 lands.
- **Alternatives considered**: leave the key unstated — rejected: cross-feature contract must be
  fixed at spec time; 003 would otherwise guess.

### D6 - Palette: navy + indigo "Trust & Precision"

- **Decision**: Blue-tinted slate neutrals (the tint follows the brand hue rule for less "dead"
  grays) + an indigo interactive accent; dark mode uses dark-navy surfaces. Full AA-safe value table
  in [data-model.md](./data-model.md#semantictokens): canvas `#ffffff`/`#0f172a`, foreground
  `#0f172a`/`#f1f5f9` (near-black/near-white, never pure), accent `#2563eb`/`#818cf8`, semantic
  states `success/warning/error/info` (light: `#15803d #b45309 #b91c1c #1d4ed8`; dark:
  `#4ade80 #fbbf24 #f87171 #a5b4fc`). All normal-text pairs ≥ 4.5:1; non-text/borders ≥ 3:1.
- **Rationale**: A password manager's primary conversion factor is user confidence, and both color
  psychology and SaaS convention (Stripe, 1Password, Bitwarden, Linear, Vercel, Supabase) anchor
  "trust" products in blue/navy. Dark-navy surfaces suit security tools (long sessions, data
  density, less eye strain). Indigo keeps the trust signal while avoiding generic enterprise blue,
  and it composes strongly on dark navy. Values follow the 2026 dark-mode best practices: elevated
  surfaces are lighter fills (not shadows), the accent LIGHTENS on hover in dark mode (darkening
  only in light), grays are hue-tinted, and semantic states never rely on color alone (paired with
  icons/labels for CVD safety). The Angular scaffold's rainbow gradient is default branding, not
  ours, so it is retired to a neutral `--line-subtle` treatment.
- **Alternatives considered**:
  - Generic enterprise blue accent alone — rejected: reliable but commoditized; weak differentiation.
  - Warm neutral / Notion-adjacent (`#fafaf8`, stone text) — rejected: conveys editorial calm, not
    the security/trust authority a vault needs.
  - Purple "AI innovation" accent on near-black (`#a855f7` family) — rejected in isolation: reads
    creative/AI rather than security; used only as a distant secondary brand note at most.
  - Pure white text / pure black surfaces — rejected: eye fatigue (WCAG-contrast-adjacent fatigue
    guidance; near-black `#0f172a` and `#f1f5f9` preferred).

## Out of scope (confirmed)

- Toggle UI, persistence writes, reactive OS-following (`matchMedia` listener): feature 003.
- Shell/header: feature 004.
- Playwright e2e and AXE scans: feature 005.

## References

- Tailwind CSS v4 docs - Dark mode: https://tailwindcss.com/docs/dark-mode (class-driven
  `@custom-variant dark (&:where(.dark, .dark *))`, inline-head FOUC script, three-way toggle pattern).
- Tailwind CSS v4 docs - Theme variables: https://tailwindcss.com/docs/theme (`@theme` vs `@theme inline` output).
- Tailwind v4 GitHub discussion #15083 - CSS variables for dark/light: confirms `@theme inline` with a
  `var()` reference keeps runtime switching; literals bake.
- Community 2026 write-ups on the `@theme`/`@theme inline` gotcha and raw-channels-in-`:root`/`.dark`
  two-stage pattern (verified against v4.3).
- Color psychology & proven AA palettes (B2B SaaS Trust, Dark Mode Developer, Fintech High Trust,
  warm neutral): Sky Rye Design UI color palette guide 2026.
- Dark-mode production guidance (dark navy surfaces, elevated-lighter-fills, desaturate/brighten
  brand colors in dark, `#F1F5F9`-style near-white text): Sky Rye Design + community dark-mode
  guides 2026.
- Design-token naming architecture (primitive → semantic → component; semantic naming over
  descriptive): ColorPick/design.dev/Humbl Design naming guides 2026.
- WebAIM WCAG contrast requirements (4.5:1 normal text, 3:1 non-text / 1.4.11): WebAIM Contrast
  Checker and WCAG 2.2.