# AGENTS.md

This file provides guidance to AI coding agents (Claude Code, GitHub Copilot, Codex, etc.) when working with code in this repository.

## Commands

This is an npm workspaces monorepo (`packages/*`, `apps/*`). Most scripts can run at the root across all workspaces, or scoped to one with `-w <package-name>`.

```bash
npm install                          # install everything (root)

npm run build                        # build all workspaces
npm run build -w @ski-next/ui        # build just the component library

npm run dev                          # runs apps/web's Vite dev server
npm run storybook                    # Storybook dev server for @ski-next/ui (port 6006)
npm run build-storybook              # static Storybook build

npm run typecheck                    # tsc --noEmit across all workspaces
npm run lint                         # eslint across all workspaces

npm run test                         # runs each workspace's test script (currently only @ski-next/ui)
```

Single test file (Playwright component tests, run from `packages/ui`):

```bash
cd packages/ui
npx playwright test -c playwright-ct.config.ts src/components/Button/Button.test.tsx
```

One-time Playwright browser install: `npx playwright install chromium`.

**Important**: `@ski-next/ui`'s `package.json#exports` points at `dist/`, not `src/`. Any other workspace (e.g. `apps/web`) that imports `@ski-next/ui` resolves types and runtime code from the built output, so run `npm run build -w @ski-next/ui` after changing the library before `typecheck`/`dev`/`build` in a consumer will pick it up.

## Architecture

### Shared config packages

- `packages/tsconfig` (`@ski-next/tsconfig`) — base/react-library/vite-app tsconfig presets, extended by path, e.g. `"extends": "@ski-next/tsconfig/react-library.json"`.
- `packages/eslint-config` (`@ski-next/eslint-config`) — ESLint 9 flat config, exports `baseConfig` and `reactConfig`. Each package has its own `eslint.config.js` that just re-exports one of these.

### `packages/ui` (`@ski-next/ui`) — the component library

- Bundled with Vite library mode to ESM + CJS (`vite.config.ts`). `react`/`react-dom` are externalized peer deps; `vite-plugin-dts` rolls up a single `.d.ts`; `sideEffects: false` is set for treeshaking.
- Uses Ant Design v5 directly — it's CSS-in-JS, so there's no separate stylesheet to import/extract.
- i18n: `src/i18n/index.ts` creates its **own isolated `i18next` instance** (not the host app's), namespaced under `ski-next-ui`, exposed via the `useUiTranslation` hook. This keeps the library's strings from colliding with whatever i18next setup a consuming app uses.
- `src/providers/AppProvider.tsx` is the integration point every consumer (and Storybook, and Playwright CT) wraps around components: it provides the library's i18next instance via `I18nextProvider` and drives antd's `ConfigProvider` locale (`en_US`/`fr_FR`) off the same `language` prop. New components needing translated text or antd locale-aware behavior should assume they're rendered inside this provider.
- Storybook (`.storybook/`) uses the Vite builder; `preview.tsx` decorates every story with `AppProvider`.
- Tests use **Playwright component testing** (`@playwright/experimental-ct-react`), not Storybook's test-runner — `*.test.tsx` files live next to the component they test. `playwright/index.tsx` is the mount hook and also wraps mounted components in `AppProvider`. Config: `playwright-ct.config.ts`.
- New components: colocate `Component.tsx`, `Component.stories.tsx`, `Component.test.tsx`, `index.ts` under `src/components/<Name>/`, and add the public export to `src/index.ts`.

### `apps/web` (`@ski-next/web`)

Vite + React SPA whose only real purpose is to consume `@ski-next/ui`'s built package as a real-world integration check (not where product features live, at least not yet).
