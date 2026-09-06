# Requirements Checklist: App Shell

**Feature**: [004-app-shell](../spec.md)
**Status**: Open (traced to acceptance scenarios and tasks)

| ID | Requirement | Source | Trace |
|----|-------------|--------|-------|
| **US1 — Shell renders & navigates** | | | |
| REQ-SH-01 | `App` renders a `<header>` (banner landmark) with brand, primary `<nav>` (Home/About links), and `<theme-toggle>`. | US1-A1, FR-001 | T004/T005 |
| REQ-SH-02 | The default route (`""`) renders the Home welcome screen. | US1-A1, FR-008 | T002/T003 |
| REQ-SH-03 | The matching nav link exposes `aria-current="page"`. | US1-A3, FR-001 | T004/T005 |
| REQ-SH-04 | A visually-hidden skip link is the first focusable element and targets `<main>`. | US1-A2, FR-006 | T004/T005 |
| REQ-SH-05 | Unknown paths redirect to the Home welcome screen. | US1-A4, FR-007 | T002/T003 |
| REQ-SH-06 | No serious/critical AXE violations on the rendered shell. | US1-A5, NFR-001 | T004 |
| REQ-SH-07 | Focusable shell elements show a token-based `focus-visible` ring. | FR-005 | T004/T005 |
| REQ-SH-08 | No literal colors in 004 templates/styles (002 token contract retained). | FR-002 | T008 |
| **US2 — Toggle accessible & live** | | | |
| REQ-TG-01 | `ThemeToggle` renders options Light/Dark/System and the selected one reflects `ThemeStore.choice`. | US2-A1/A2, FR-003 | T006/T007 |
| REQ-TG-02 | Activating an option calls `setChoice`: signal, `lockr.theme`, and root `dark` class update together. | US2-A3, FR-003 | T006/T007 |
| REQ-TG-03 | Radiogroup roles + `aria-checked` + `aria-label="Theme"` are present on the control. | US2, FR-004 | T006/T007 |
| REQ-TG-04 | Roving `tabindex` plus ArrowLeft/Right/Home/End expose every option to the keyboard. | US2-A4, FR-004 | T006/T007 |
| REQ-TG-05 | No serious/critical AXE violations on the rendered toggle. | US2-A5, NFR-001 | T006 |
| REQ-TG-06 | OS media-query changes do not steal focus or reset the roving tabindex. | Edge case 2 | T006 |
| **US3 — Routes lazy & resilient** | | | |
| REQ-RT-01 | `""` loads lazy `Home`, `/about` loads lazy `About`. | US3-A1/A2, FR-007 | T002/T003 |
| REQ-RT-02 | `"**"` redirects to `""`. | US3-A3, FR-007 | T002/T003 |
| REQ-RT-03 | Header persists across route changes (no reload, same store instance). | US3-A4, FR-009 | T004/T005 |
| REQ-RT-04 | Build output contains separate lazy chunks for Home/About (not inlined). | US3-A1, NFR-003 | T009 |
| REQ-RT-05 | Cold deep-link to `/about` still paints the 002 theme pre-paint and renders inside the shell. | Edge case 4 | T009 |
| REQ-RT-06 | 002 `src/index.html`/pre-paint script stays byte-for-byte unchanged. | FR-010 | T008 |