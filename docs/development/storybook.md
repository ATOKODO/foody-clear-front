# Storybook

Storybook is the component workbench for Foody Clear. It contains every production Angular component, the application's modal directive, all feature screens and the application shell. It also documents the live design-system foundations: semantic tokens, Material colors, typography, spacing, shape, elevation, motion, responsive breakpoints, controls, feedback and calendar icons.

## Run locally

```sh
npm ci
npm run storybook
```

Open **http://localhost:6006**. No application backend or database is needed. The workbench uses the application's SCSS and local public assets. Use the toolbar to switch **light/dark**, **English/French** and **viewport sizes**. Component inputs are editable in Controls; output callbacks are recorded in Actions. Autodocs describes the component APIs. The accessibility panel runs axe checks; findings are advisory, not a claim that every existing application screen is accessible.

The integration uses `@storybook/angular-vite` 10.6.1 and Analog 2.8.0, compatible with the project's Angular 22 and Vite 8. This official framework is currently in preview; its version is pinned to keep upgrades deliberate. See the [official Angular/Vite integration](https://storybook.js.org/docs/get-started/frameworks/angular-vite). The Angular compiler/runtime packages stay aligned on the project's existing 22.0.7 version.

## Catalog organization

| Section | Content |
| --- | --- |
| Design system | All `--app-*` tokens, typography, spacing, shape, elevation/motion, breakpoints, Material controls, feedback and icons |
| UI | Error panel, segmented toggle, PWA instructions and modal focus/keyboard behavior |
| Components | Forms, lists, calendar, scanner, external-meal dialog and master/detail layout |
| Screens | Every feature, with populated, empty, loading and error API scenarios |
| Application | Shell with sidebar, routing, language/theme controls and seeded home screen |

List stories include management and selection modes. Forms include creation, prefilled editing and saving states. Calendar stories include month, week and day views. The modal story demonstrates focus trapping, Escape and return-to-trigger focus.

## Isolated scenarios

`stories/support/environment.ts` intercepts Angular HTTP calls and runs the same seeded handlers as the Playwright application tests. Each story gets a fresh state. CRUD updates are in memory only, including when navigating within the shell. Unsupported requests fail with a visible `Unmocked Storybook request` error; they never fall through to the real backend. Reloading a story resets its data.

Screens select `apiScenario: 'populated' | 'empty' | 'loading' | 'error'` through their parameters. The date-sensitive previews use **25 March 2026, Europe/Paris**, matching the seeded calendar/consumption data. This clock override exists only in Storybook.

PWA controls do not install an app, reload the browser or register a service worker. Scanner lookup returns a local product, including inside the product form. Camera capture is not automatic: it requires clicking the camera button and granting browser permission. Actual scanner and PWA integration remain covered by the application tests.

## Build and verify

```sh
npm run storybook:check
npm run build-storybook
npx playwright install --no-shell chromium
npm run storybook:test
```

The build output is **`dist/storybook`**, separate from the application artifact. `storybook:test` serves that output at **127.0.0.1:6007** and checks every canvas in desktop light/English and mobile dark/French, runtime errors, theme/language application, real design-token resolution and absence of external HTTP calls. It also checks generated APIs, Controls/Actions/Autodocs, segmented-control interaction, modal focus restoration, nested scanner lookup, in-memory shopping/recipe updates, reset on reload and shell navigation without changing the canvas URL. A dedicated CI workflow runs the same gates and uploads the build and browser report; it does not publish anything externally.

## Maintaining coverage

Add static CSF stories under `stories/components`, `stories/ui` or `stories/screens`. Import the real component and set `component` in the default metadata; use `Meta<Component>` and `StoryObj<Component>` so inputs remain type checked. Reuse the fixtures and `fn()` output callbacks. Include meaningful states and interaction behavior, not just a placeholder rendering.

`scripts/check-storybook.mjs` discovers production `@Component` classes using the TypeScript AST and compares them with the actual CSF metadata. Adding a component without a story fails the inventory gate. Story-only foundation code is excluded from the production and unit-test TypeScript programs. Foundations read `_tokens.scss` directly, so new tokens appear without maintaining a duplicate palette.

The ZXing library's published ESM data-matrix module has incomplete exports with Vite/Rolldown. Storybook resolves the library's official CommonJS entry instead; the application build and library version are unchanged.

The preview docgen integration watches the whole workspace recursively, including installed packages and build/test artifacts. `.storybook/docgen-worker.mjs` keeps its official analyzer but replaces its public watcher lifecycle with one-second polling scoped to application/story/mock sources and TypeScript configuration files. This prevents inotify exhaustion without changing machine settings or installed packages. Recheck this adapter when upgrading the pinned Storybook version; it can be removed once upstream supports scoped watchers.
