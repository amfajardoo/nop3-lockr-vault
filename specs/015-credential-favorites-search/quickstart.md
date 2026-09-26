# Quickstart: Credential Favorites & Search (015)

Manual verification walkthrough for the reviewer. Automated equivalents exist for every step
(specs navigate the real routes); run this after `pnpm start`.

## Setup

1. `pnpm install && pnpm start`, open the app in the browser.
2. Seed state: if the vault is empty, create 4-5 credentials with varied names/usernames/
   domains (e.g. GitHub / dev@example.com / github.com; Gmail / personal@example.com /
   mail.google.com; AWS root / ops@example.com / aws.amazon.com), favoriting two of them via
   the new star control during the walk.

## Search (US1)

3. Type `git` in the search box → only GitHub row renders; store order preserved among
   results; no other UI changes.
4. Type `OPS` (uppercase) → AWS row renders (case-insensitive); type `  git  ` (padded) →
   GitHub row again (trim).
5. Type `example.com`… a domain substring that matches multiple usernames → matching rows
   render; type `.` alone → rows whose fields contain a literal dot render (no regex blow-up).
6. Clear the input (or use the clear affordance) → full list returns, favorites star states
   intact, result-count region hidden.

## Favorite toggle (US2)

7. On a non-favorite row, activate the star → button becomes pressed (`aria-pressed="true"`
   in devtools), filled star; open the entry's detail page → still favorite (persisted via
   `store.update`); back on the list, activate the star again → unpressed, store `favorite:false`.
8. Toggle rapidly 3× → no duplicate rows, order stable, one store entry per credential.

## Favorites filter (US3)

9. Activate "favorites" filter → only starred rows; type a query matching a non-favorite →
   zero rows + no-results card naming the active cause; press its reset control → previous
   view restored.
10. With the filter on, unfavorite a visible row → it disappears immediately (others intact);
    turn the filter off → full list.

## Regression spot-checks

11. Delete a visible row (012 dialog) while a query is active → dialog works, row gone,
    result count updates; if it was the last match → no-results card.
12. Navigate: Add credential (014 form) → create → back to list renders the new row unfiltered;
    row link → detail (009/013) → Edit (014) → favorite star state consistent across views;
    empty the vault → empty-vault card (not no-results).
13. Keyboard pass: Tab through search → star → delete; Enter/Space activate toggles; visible
    Material focus ring; screen-reader spot-check: labels, pressed states, count announcement.

## Gate

14. `pnpm verify` green (biome + full unit suite + production build).
