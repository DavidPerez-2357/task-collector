# Copilot Coding Agent Instructions — Task Collector

## Project Overview

Task Collector is a gamified task-management mobile/web application built with **Angular 20**, **Ionic 8**, and **Capacitor 8**. Users manage tasks with recurring frequencies, earn coins, collect items, and browse a shop/inventory system. Data is stored locally via **SQLite** (Capacitor SQLite plugin on native, `jeep-sqlite`/`sql.js` on web).

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Angular 20 (standalone components) |
| UI | Ionic 8 |
| Mobile bridge | Capacitor 8 |
| Language | TypeScript 5.9, SCSS |
| Database | SQLite via `@capacitor-community/sqlite` + `jeep-sqlite` (web) |
| Linter | ESLint 9 + Angular ESLint + Prettier |
| Package manager | npm |

## Getting Started

```bash
npm install          # Install dependencies
npm run start        # Dev server at localhost:4200
npm run build        # Production build → output in www/
npm run lint         # Run ESLint + Prettier checks
npm run format       # Auto-format all files with Prettier
```

## Project Structure

```
src/
├── app/
│   ├── core/                    # Business logic layer
│   │   ├── models/              # Data interfaces, enums, constants, and utilities
│   │   │   ├── consts/          # Constant values and configuration objects
│   │   │   └── utils/           # Helper/utility functions for models
│   │   ├── services/            # Application services (business-logic facades)
│   │   ├── repositories/        # Data-access layer (SQL queries)
│   │   └── types/               # Shared TypeScript type definitions
│   ├── features/                # Feature pages (lazy-loaded)
│   │   ├── tabs/                # Tab navigation shell and routing
│   │   ├── home-tab/            # Home page
│   │   ├── collection-tab/      # Collections page
│   │   ├── inventory-tab/       # Inventory page
│   │   └── shop-tab/            # Shop page
│   ├── shared/                  # Reusable UI components
│   │   └── components/          # Shared standalone components
│   ├── app.component.ts         # Root component (initializes DB)
│   └── app.routes.ts            # Root routing (lazy-loads tabs)
├── assets/
│   └── db/migrations/           # Numbered SQL migration scripts (001_*.sql, 002_*.sql, etc.)
├── theme/                       # Ionic theme variables and custom SCSS colors
├── global.scss
├── index.html
├── main.ts
└── polyfills.ts
```

## Architecture & Patterns

### Layered Architecture

Follow this strict layering when adding code:

1. **Models** (`core/models/`) — Pure TypeScript interfaces, enums, constants (`consts/`), and utility functions (`utils/`). No dependencies on services or repositories.
2. **Repositories** (`core/repositories/`) — Data-access classes that run SQL against `DatabaseService`. Inject `DatabaseService`.
3. **Services** (`core/services/`) — Business-logic facades. Inject repositories, never run SQL directly.
4. **Features** (`features/`) — Page-level components. Inject services.
5. **Shared** (`shared/components/`) — Reusable UI components with `@Input`/`@Output` bindings, no service injection.

### Database

- **`DatabaseService`** manages the SQLite connection, migrations, locking, and web-platform auto-persist.
- Migrations live in `src/assets/db/migrations/` as numbered `.sql` files (`001_init.sql`, `002_seed_data.sql`, etc.).
- To add a new migration: create the next numbered file and increment `dbVersion` in `database.service.ts`.
- The service uses a lock (`withLock`) to serialize concurrent DB operations and tracks transaction depth.

### Routing

- All routes are lazy-loaded. The root route loads `tabs.routes.ts`, which defines child routes for each tab.
- Each feature page is a standalone Angular component.

## Coding Conventions

### Component Naming

- **Page components** use the suffix `Page` or `Component` (enforced by ESLint rule `@angular-eslint/component-class-suffix`).
- **Component selectors** must use the `app-` prefix in kebab-case (e.g., `app-board`, `app-button`).
- **Directive selectors** must use the `app` prefix in camelCase.

### Angular Patterns

- All components are **standalone** (no NgModules).
- Use `inject()` function for dependency injection instead of constructor injection.
- Use Angular **Signals** for reactive state where applicable (see `TitleSignComponent`).
- Lazy-load feature routes with `loadChildren` / `loadComponent`.

### TypeScript

- **Strict mode** is enabled (`strict: true`, `noImplicitOverride`, `noUncheckedIndexedAccess`, `noImplicitReturns`, `noFallthroughCasesInSwitch`).
- Use path aliases for imports:
  - `@app/*` → `src/app/*`
  - `@core/*` → `src/app/core/*`
  - `@features/*` → `src/app/features/*`
  - `@shared/*` → `src/app/shared/*`
  - `@environments/*` → `src/environments/*`
  - `@assets/*` → `src/assets/*`

### Formatting

- **Prettier** is the formatter (auto-runs on save via VSCode settings).
- Single quotes, semicolons, 2-space indentation, trailing commas, 100-char print width.
- Run `npm run format` to format all files.

### Styling

- Use **SCSS** for component styles.
- Use **Ionic CSS custom properties** (`--ion-color-*`) for theming.
- Custom color tokens defined in `src/theme/variables.scss`: `gem`, `gold`, `darkBrown` (in addition to Ionic defaults).
- Font family: `Jersey 20` (Google Fonts, loaded in `index.html`).

## Testing

- **No testing framework is currently configured.** Tests are explicitly skipped in `angular.json` (`"skipTests": true`).
- Do not add test files unless setting up the testing infrastructure first.

## Mobile / Capacitor

- **Android project** lives in `android/`. Sync with `npx cap sync android`.
- **Capacitor config** is in `capacitor.config.ts`. App ID: `com.app.taskcollector`, web dir: `www`.
- The `sql-wasm.wasm` file from `sql.js` is copied to `www/assets/` during build (configured in `angular.json` assets).

## Environment Files

- Environment files (`src/environments/`) are git-ignored. They are not checked in.
- If the app requires environment-specific config, create `src/environments/environment.ts` and `environment.prod.ts` locally.

## Commit Messages

This project uses **[gitmoji](https://gitmoji.dev/)** for commit messages. Each commit starts with a relevant emoji followed by a short, concise description.

### Common gitmoji used in this project

| Emoji | Code | Use for |
|-------|------|---------|
| ✨ | `:sparkles:` | New feature |
| 🐛 | `:bug:` | Bug fix |
| 💄 | `:lipstick:` | UI / style changes |
| ♻️ | `:recycle:` | Refactor code |
| 🗃️ | `:card_file_box:` | Database changes (migrations, schema) |
| 🔧 | `:wrench:` | Configuration changes |
| 🚚 | `:truck:` | Move or rename files/resources |
| 🔥 | `:fire:` | Remove code or files |
| 📦️ | `:package:` | Build/dependency changes |
| 🎉 | `:tada:` | Initial commit / begin project |
| 🌐 | `:globe_with_meridians:` | Internationalization / localization |
| 🔀 | `:twisted_rightwards_arrows:` | Merge branches |
| ⬇️ | `:arrow_down:` | Downgrade dependencies |
| 🚧 | `:construction:` | Work in progress |
| 📝 | `:memo:` | Documentation |

### Format

```
<gitmoji> <Short imperative description>
```

### Examples from this project

```
✨ Implement player state repository and service for coin management
🐛 Fix unique constraint in weekly recurrence
💄 Implement custom tab bar styling with new background images and icons
🗃️ Add initial SQL schema
♻️ Cleaned tabs scss
🔧 Configure Angular schematics to skip test generation
🚚 Upload UI assets
```

Keep messages **short and concise** — describe *what* was done, not *how*.

## Generating New Code

When scaffolding new components or pages, use the Angular/Ionic CLI:

```bash
# New standalone component (tests are skipped by default via angular.json)
npx ng generate component shared/components/my-component --standalone

# New feature page (--type=page sets the file suffix to .page.ts)
npx ng generate component features/my-feature-tab --standalone --type=page

# New service
npx ng generate service core/services/my-service

# New interface/model
npx ng generate interface core/models/my-model model
```
