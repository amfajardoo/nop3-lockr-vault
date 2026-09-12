# Requirements Checklist: Dashboard Shell

**Feature**: [006-dashboard-shell](../spec.md)
**Status**: Open (traced to acceptance scenarios and tasks); created 2026-09-11

| ID | Requirement | Source | Trace |
|----|-------------|--------|-------|
| **US1 — App boots into a routable dashboard** | | | |
| REQ-DB-01 | `app.routes.ts` (typed `Routes`) defines path `''` lazy-loading the Dashboard via `loadComponent`, and `'**'` redirecting to `''`. | US1-A1/A3, FR-002 | T002/T003 |
| REQ-DB-02 | `App` (root) renders only the `<router-outlet>`; all chrome (header, nav, main) lives in the Dashboard component. | US1-A4, FR-001 | T002/T003 |
| REQ-DB-03 | Dashboard renders a `<header>` banner: skip link first, `a.brand` → `Lockr Vault`, and the reused `<theme-toggle>`. | US1-A1, FR-003 | T002/T003 |
| REQ-DB-04 | Dashboard main area shows a titled section heading, an empty-state hint, and a nested `<router-outlet>`. | US3-A1/A2, FR-005 | T002/T004 |
| REQ-DB-05 | No serious/critical AXE violations on `App` and the rendered dashboard. | US1-A2, NFR-001 | T002/T004 |
| **US2 — Navigation accessible & live** | | | |
| REQ-NAV-01 | Primary `<nav>` landmark with accessible label; items come from a data-driven constant (label + route), each link targets a real route. | US2-A1, FR-004 | T004 |
| REQ-NAV-02 | Every nav link is keyboard-focusable with a visible ring; active item carries `aria-current="page"`. | US2-A2, FR-007 | T004 |
| REQ-NAV-03 | No serious/critical AXE violations on the nav landmark. | US2-A3, NFR-001 | T004 |
| **US3 — Workspace ready for vault features** | | | |
| REQ-WS-01 | Skip link targets `#main-content` and jumps focus into the main workspace. | US3-A3, FR-007 | T002/T004 |
| REQ-WS-02 | A registered child route renders inside the dashboard's nested outlet (header stays). | US3-A2, FR-005 | T004 |
| **Cross-cutting** | | | |
| REQ-CC-01 | Token-only color surface: no literal `oklch(`/`color-mix(`/hex in 006 templates/styles. | FR-006 | T006 |
| REQ-CC-02 | `src/index.html` and `src/theme/**` byte-for-byte unchanged; pre-paint script first child of `<head>` in build output. | FR-008 | T006 |
| REQ-CC-03 | `pnpm verify` green; build emits a lazy dashboard chunk. | SC-004 | T006 |
| REQ-CC-04 | 005 theme e2e flows still pass against the re-chromed app. | SC-005 | T005 |