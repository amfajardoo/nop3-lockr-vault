# Quickstart: Expressive Design Refresh (016)

Manual aesthetic + behavior walkthrough for the reviewer (SC-008). Specs lock structure,
contrast, and tokens — the look itself is judged here.

## Setup

1. `pnpm install && pnpm start`; open the app. Note the current impression before the branch
   if comparing (checkout `main` side by side if helpful).

## Light & dark (US2)

2. In light mode: check body vs sidenav vs card backgrounds read as one family (no pure-white
   seam against tinted surfaces); brand blue on primary actions; purple accent on brand mark
   and active nav.
3. Toggle theme (header toggle): dark mode shows distinguishable levels — page background,
   toolbar/sidenav container, cards — not one flat slab; no flash of wrong theme on reload
   (pre-paint script).
4. Contrast spot-check: body text, muted labels, buttons, links on their backgrounds — all
   comfortably readable (specs assert ≥ 4.5:1; your eye confirms).

## Hierarchy (US1)

5. Walk the four views (list, detail, create, edit): each opens with the page header —
   dominant display-font title, supporting line, grouped actions — and content sits in raised
   surfaces below.
6. Hover and keyboard-tab through list rows: visible hover affordance AND visible focus ring
   (parity); state cards (empty vault / no results / not found) show icon + heading + copy +
   action.

## Responsive shell (US3)

7. Resize below 960px: sidenav collapses to an overlay behind a menu button (accessible
   name); open via button, dismiss via scrim/Escape; resize wide again → persistent rail, no
   menu button, no stranded scrim.
8. At 320px width (devtools): no horizontal scrolling on any view; header controls wrap;
   long credential names wrap instead of overflowing.

## Typography & spacing (US4)

9. Titles render in the display font; body/buttons/inputs stay Roboto; hierarchy (title >
   line > meta) is visible in list rows and detail labels; spacing looks evenly graduated
   (shared scale), no oddly cramped/loose patches.

## Icons (US5)

10. Sidenav items, brand, search prefix, favorites filter, per-row star/delete, and the three
    state cards all show Material icons; screen-reader spot-check: icon adds no spoken noise,
    `Delete GitHub` / `Add GitHub to favorites` names unchanged; delete button still opens the
    confirm dialog.

## Regressions & gate

11. Search/filter/favorite flows, delete dialog, create/edit forms, detail Edit — all behave
    exactly as on `main` (they are spec-locked; spot-check anyway).
12. `pnpm verify` green (biome + full suite incl. design specs + build).
13. Offline font failure (block fonts.googleapis.com in devtools): headings fall back
    gracefully, layout intact, no raw icon words in accessible names.

## Gate

14. Aesthetic sign-off: does it still look "muy fea"? If not, iterate palette/accent/font
    details (each reversible in isolation per spec Assumptions).
