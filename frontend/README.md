# Frontend

Web UI for the workflow platform: React 18, TypeScript, Vite, Tailwind CSS, TanStack Query,
React Router, Zustand and React Flow.

## Requirements

- Node.js 22 or later (CI runs on Node 24)
- pnpm 11, pinned in `package.json` (`packageManager`), so `corepack enable` installs the right one

## Run it

```bash
cd frontend
corepack enable
pnpm install
pnpm dev
```

The dev server listens on http://localhost:5173 and proxies `/api` to the backend on
http://localhost:8080.

Without a backend, start the demo mode instead. It serves the data from `src/mocks` and every
write (create, run, rotate, delete) fails with a read-only error:

```bash
pnpm dev:demo
```

Production build (output in `dist/`) and local preview of that build:

```bash
pnpm build
pnpm preview
```

## Formatting and linting

Prettier formats the code, ESLint checks it. Both run on the whole `frontend` folder.

| Command             | What it does                                                 |
| ------------------- | ------------------------------------------------------------ |
| `pnpm format`       | Reformat every file with Prettier                            |
| `pnpm format:check` | Fail if a file is not formatted                              |
| `pnpm lint`         | Run ESLint, fails on any error or warning                    |
| `pnpm lint:fix`     | Run ESLint and apply the automatic fixes (import order, ...) |
| `pnpm fix`          | `lint:fix` then `format`, the one to run before committing   |
| `pnpm typecheck`    | Run the TypeScript compiler without emitting                 |
| `pnpm check`        | `typecheck` + `lint` + `format:check`, exactly what CI runs  |

To work on a single file:

```bash
pnpm exec prettier --write src/features/workflows/pages/WorkflowsListPage.tsx
pnpm exec eslint --fix src/features/workflows/pages/WorkflowsListPage.tsx
```

In VS Code, install the Prettier and ESLint extensions and enable format on save; both pick up
the project configuration (`.prettierrc.json`, `eslint.config.js`).

## Project layout

```
src/
  main.tsx              entry point
  app/                  routes, providers, layout (AppShell, Sidebar)
  features/
    <feature>/
      api.ts            wire types, adapters, fetch functions (no React)
      queries.ts        query keys, useQuery / useMutation hooks
      types.ts          domain types
      pages/            route components: read params, load data, handle loading / error / 404
      components/       UI of the feature, data comes in through props
      hooks/ lib/       feature-only hooks and pure helpers, when needed
      index.ts          public API of the feature
  shared/
    api/                fetch client, ApiError
    ui/                 Button, Badge, Kbd, PageHeader, Toolbar, ChipGroup, SearchField, Table, States
    filter/             filter query language and FilterInput
    hooks/              useHotkeys, useRovingFocus, useFocusTrap
    lib/                cn, formatters, env flags
  mocks/                demo data, only used when VITE_DEMO=true
  styles/               Tailwind entry, design tokens, React Flow overrides
```

Features: `executions`, `workflows`, `editor`, `namespaces`, `plugins`, `secrets`, `landing`.

## Conventions

### Files and naming

- Folders in kebab-case, components in `PascalCase.tsx`, hooks in `useSomething.ts`, everything
  else in `camelCase.ts`.
- Named exports only. Default exports are reserved for config files.
- A page is named `<Thing>Page` and lives in `pages/`. The view it renders lives in `components/`.

### Imports and boundaries

- Inside a feature, use relative imports (`./`, `../`). Everywhere else, use the `@/` alias.
- A feature imports another feature only through its index: `@/features/executions`, never
  `@/features/executions/components/...`. ESLint rejects deep imports.
- `shared/` never imports from `app/`, `features/` or `mocks/`. Features never import from `app/`.
- Imports are sorted automatically (`pnpm lint:fix`): packages, then `@/`, then relative.

### Data

- `api.ts` turns the backend payloads into domain types. Components never call `fetch`.
- Every query key comes from the key factory of the feature (`workflowKeys.detail(id)`, ...).
- Writes go through `useMutation` hooks that invalidate the affected keys; no manual `refetch()`.
- Pages show real errors with `ErrorState`. Mock data only exists in demo mode.

### Styling

- Colors are CSS variables declared in `src/styles/index.css` and exposed as Tailwind colors
  (`cmd-*`, `run-*`), opacity modifiers included (`bg-cmd-bg/40`).
- Font sizes use the project scale instead of arbitrary values:

  | Class       | Size |
  | ----------- | ---- |
  | `text-3xs`  | 9px  |
  | `text-2xs`  | 10px |
  | `text-xs`   | 11px |
  | `text-sm`   | 12px |
  | `text-base` | 13px |
  | `text-md`   | 14px |
  | `text-lg`   | 15px |

- Compose class names with `cn()` and declare component variants with `cva`. Prettier sorts the
  Tailwind classes.

### Code style

- Prettier settings: single quotes, semicolons, trailing commas, 100 columns, LF line endings.
- No comments in the code, and ASCII characters only (`-`, `...`, `->`).
