# Data Model: App Shell

**Feature**: [004-app-shell](../004-app-shell/spec.md)

## Component Tree

```
App (root, standalone)                        src/app/app.ts + app.html + app.css
├── header.banner ............................. chrome, no state (D1)
│   ├── a.skip-link  → "#main-content" ........ visually hidden until focus (FR-006)
│   ├── a.brand [routerLink="/"] .............. text brand "Lockr Vault"
│   └── theme-toggle .......................... ThemeToggle (only stateful child)
└── main#main-content .......................... skip target; owns router-outlet
    └── router-outlet .......................... empty until routes are added (deferred, FR-007)
```

## Routes (app.routes.ts, typed `Routes`)

| Path | Match | Component | Purpose |
|------|-------|-----------|---------|
| — | — | none (`routes = []`) | Home/About lazy routes + `"**"` redirect deferred to the pages feature (FR-007) |

## State Wiring (ThemeToggle ↔ 003 ThemeStore)

```
ThemeStore (signalStore, providedIn root)        src/theme/theme.store.ts (unchanged)
├── choice: Signal<ThemeChoice> ..................... selected option
├── effective: Signal<ResolvedTheme> ................ derived theme (light/dark)
└── setChoice(option) ............................... sole mutation (validated, persists, marker)

ThemeToggle
├── store = inject(ThemeStore)
├── options = [{ value: "light" | "dark" | "system", label }]  (order Light → Dark → System)
├── tabIndexOf(option) = choice() === option ? 0 : -1   (roving tabindex)
├── native <input type="radio"> per option (sr-only, inside a visible <label>)
├── render(option) = token classes: selected chip uses accent-on tokens, labels carry focus rings
└── (keydown) ArrowLeft/Right/Home/End → select adjacent/first/last via setChoice + focus
```

No new persisted contract: the option set is the 002 `theme-choice.schema.json` enum
(`light | dark | system`); the storage writes come exclusively from 003's `setChoice`.

## Interactions & Side Effects

| Event | Store change | DOM/storage effect |
|-------|--------------|--------------------|
| Click radio (label) | `setChoice(option)` | `lockr.theme` write + root `dark` class (003) |
| ArrowRight/Left/Home/End | `setChoice(adjacent)` | same as above; focus moves to newly-selected radio (roving) |
| OS `prefers-color-scheme` change | `systemDark` patch only (003) | marker update only when choice=system; no storage write; focus untouched (D8) |

## Copy (English, no i18n yet)

- Brand: **Lockr Vault**
- Toggle labels: **Light theme**, **Dark theme**, **System theme**; group label **Theme**.