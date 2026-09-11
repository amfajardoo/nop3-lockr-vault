# Data Model: Dashboard Shell

**Feature**: [006-dashboard-shell](../006-dashboard-shell/spec.md)

## Component Tree

```
App (root, minimal)                             src/app/app.ts + app.html
└── router-outlet ................................ lazy loads Dashboard on ''

Dashboard (standalone, routed)                 src/app/dashboard/dashboard.ts + dashboard.html
├── header.banner ................................. chrome; owns brand + toggle
│   ├── a.skip-link → "#main-content" ............ visually hidden until focus (FR-006)
│   ├── a.brand → "/" → "Lockr Vault" ............ constant brand text
│   └── theme-toggle .............................. ThemeToggle (unchanged, from 004)
├── nav[aria-label="Main"] ........................ primary navigation
│   └── a[@for item in items] ..................... NAV_ITEMS; active → aria-current="page"
└── main#main-content ............................. skip target
    ├── h1 ........................................ section heading (e.g. "Dashboard")
    ├── p.empty-state .............................. placeholder hint for 008+
    └── router-outlet .............................. nested outlet for future child routes
```

## Routes (`src/app/app.routes.ts`, typed `Routes`)

| Path | Match | Component / Target | Purpose |
|------|-------|--------------------|---------|
| `''` | exact | `Dashboard` (lazy `loadComponent`) | Default dashboard layout |
| `'**'` | wildcard | redirect → `''` | Unknown URLs land on dashboard |

Nested routes (008+) register under the Dashboard's internal outlet — decided in the features
that own them; 006 ships no children.

## Navigation (`src/app/dashboard/nav-items.ts`)

```ts
export interface NavItem {
  label: string;
  route: string;
}

export const NAV_ITEMS: NavItem[] = [
  { label: "Overview", route: "" },
];
```

- 006 ships a single item pointing to the dashboard's own root.
- 008/010 append their items (`Credential List`, `Favorites`) alongside their routes.
- The `<nav>` template uses `@for (item of items)` and `routerLinkActive` for the active state.
- `aria-current="page"` binds off the `routerLinkActive` status.
- No dead links: every declared `route` must resolve to a real path (spec FR-004).

## State Wiring

- **No new state**: the Dashboard introduces no store, no signal, and no persisted contract.
- `ThemeToggle` is imported unchanged from `src/app/theme-toggle/theme-toggle.ts` and accesses
  the root-provided `ThemeStore` by injection (003 behavior unchanged).

## Interactions & Side Effects

| Event | Component | Effect |
|-------|-----------|--------|
| App boots → router resolves `''` | `App` | lazy chunk fetched; `Dashboard` renders |
| Unknown path resolved | `App` | `'**'` redirect → `''` → Dashboard renders |
| Skip link focused | `Dashboard` | focus jumps to `#main-content` |
| Theme toggle activated | `ThemeToggle` (unchanged) | `ThemeStore.setChoice` → persistence + root marker |
| `@for` renders nav items | `Dashboard` | each item is a routerLink; active item gets `aria-current="page"` |

## Copy (English, no i18n yet)

- Brand: **Lockr Vault**
- Nav label: **Main**
- Nav items (006): **Overview**
- Section heading: **Dashboard**
- Empty-state hint: **Your credentials will appear here.** (replaced by 008 list)