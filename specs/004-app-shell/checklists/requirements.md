# Requirements Checklist: App Shell

**Feature**: [004-app-shell](../spec.md)
**Status**: Open (traced to acceptance scenarios and tasks); revised 2026-09-06 — routes/Home/About
deferred (US3 removed, navigation-dependent US1 items removed)

| ID | Requirement | Source | Trace |
|----|-------------|--------|-------|
| **US1 — Shell renders & is accessible** | | | |
| REQ-SH-01 | `App` renders a `<header>` (banner landmark) with the brand and the `<theme-toggle>`, and a `<main>` wrapping the routed outlet. | US1-A1, FR-001 | T004/T005 |
| REQ-SH-02 | A visually-hidden skip link is the first focusable element and targets `<main>`. | US1-A2, FR-006 | T004/T005 |
| REQ-SH-03 | No serious/critical AXE violations on the rendered shell. | US1-A3, NFR-001 | T004 |
| REQ-SH-04 | Focusable shell elements show a token-based `focus-visible` ring. | FR-005 | T004/T005 |
| REQ-SH-05 | No literal colors in 004 templates/styles (002 token contract retained). | FR-002 | T008 |
| **US2 — Toggle accessible & live** | | | |
| REQ-TG-01 | `ThemeToggle` renders options Light/Dark/System and the selected one reflects `ThemeStore.choice`. | US2-A1/A2, FR-003 | T006/T007 |
| REQ-TG-02 | Activating an option calls `setChoice`: signal, `lockr.theme`, and root `dark` class update together. | US2-A3, FR-003 | T006/T007 |
| REQ-TG-03 | The control is a `radiogroup` (`aria-label="Theme"`) of three native radio inputs with visible labels, roving `tabindex`. | US2, FR-004 | T006/T007 |
| REQ-TG-04 | Roving `tabindex` plus ArrowLeft/Right/Home/End expose every option to the keyboard. | US2-A4, FR-004 | T006/T007 |
| REQ-TG-05 | No serious/critical AXE violations on the rendered toggle. | US2-A5, NFR-001 | T006 |
| REQ-TG-06 | OS media-query changes do not steal focus or reset the roving tabindex. | Edge case 2 | T006 |
| **Deferred (future feature)** | | | |
| REQ-RT-01 | Home/About lazy routes, the `""` default-welcome, and the `"**"` redirect land with the pages feature. | FR-007 | — |
| REQ-RT-02 | 002 `src/index.html`/pre-paint script stays byte-for-byte unchanged. | FR-010 | T008 |