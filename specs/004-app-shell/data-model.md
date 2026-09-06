# Data Model: App Shell

**Feature**: [004-app-shell](../004-app-shell/spec.md)

## Component Tree

```
App (root, standalone)                        src/app/app.ts + app.html + app.css
├── header.banner ............................. chrome, no state (D1)
│   ├── a.skip-link  → "#main-content" ........ visually hidden until focus (FR-006)
│   ├── a.brand [routerLink="/"] .............. text brand; aria-label="Lockr Vault home"
│   └── nav[aria-label="Primary"] ............. landmark
│       ├── a [routerLink="/"] + RouterLinkActive + ariaCurrentWhenActive="page"
│       ├── a [routerLink="/about"] (same)
│       └── theme-toggle ...................... ThemeToggle (only stateful child)
└── main#main-content .......................... skip target; owns router-outlet
    └── router-outlet .......................... lazy Home | About (single active)
```

## Routes (app.routes.ts, typed `Routes`)

| Path | Match | Component (lazy) | Purpose |
|------|-------|------------------|---------|
| `""` | full | `./home` → `Home` | Welcome screen (US3 default) |
| `"about"` | prefix | `./about` → `About` | About screen |
| `"**"` | — | redirectTo `""` | Resilience (US3) |

## State Wiring (ThemeToggle ↔ 003 ThemeStore)

```
ThemeStore (signalStore, providedIn root)       3  src/theme/theme.store.ts (unchanged)
├── choice: Signal<ThemeChoice> ..................... selected radio
├── effective: Signal<ResolvedTheme> ................ derived theme (light/dark)
└── setChoice(option) ............................... sole mutation (validated, persists, marker)

ThemeToggle
├── store = inject(ThemeStore)
├── options = [{ value: "light" | "dark" | "system", label }]  (order Light → Dark → System)
├── tabindexOf(option) = choice() === option ? 0 : -1   (roving tabindex)
├── ariaChecked(option) = choice() === option
├── render(option) = axe-friendly text + token classes: selected radio uses accent/border tokens
└── (keydown) ArrowLeft/Right/Home/End → select adjacent/first/last via setChoice
```

No new persisted contract: the option set is the 002 `theme-choice.schema.json` enum
(`light | dark | system`); the storage writes come exclusively from 003's `setChoice`.

## Interactions & Side Effects

| Event | Store change | DOM/storage effect |
|-------|--------------|--------------------|
| Click radio | `setChoice(option)` | `lockr.theme` write + root `dark` class (003) |
| ArrowRight/Left/Home/End | `setChoice(adjacent)` | same as above; focus moves to newly-selected radio (roving) |
| OS `prefers-color-scheme` change | `systemDark` patch only (003) | marker update only when choice=system; no storage write; focus untouched (D8) |
| Navigate to `/about` | none (lazy chunk mounts inside `main`) | header persists, same store instance (FR-009) |
| Unknown URL | none | router redirects to `""` (Home) |

## Copy (English, no i18n yet)

- Brand: **Lockr Vault**
- Nav: **Home**, **About**
- Welcome h1: **Welcome to Lockr Vault** | intro: *A token-styled vault scaffold built with Angular
  v22, NgRx signals and Tailwind v4.*
- About: h1 **About Lockr Vault** | short description of the stack + roadmap status.
- Toggle labels: **Light theme**, **Dark theme**, **System theme**; group label **Theme**.