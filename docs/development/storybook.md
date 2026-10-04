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
| UI | Shared buttons, status badges, alerts, code panels, native tables/cells/viewports, empty states, error panel, segmented toggle, PWA instructions and modal focus/keyboard behavior; isolated Material controls |
| Components | Forms, lists, calendar, scanner, external-meal dialog and master/detail layout |
| Screens | Every feature, with populated, empty, loading and error API scenarios |
| Application | Shell with sidebar, routing, language/theme controls and seeded home screen |

List stories include management and selection modes. Forms include creation, prefilled editing and saving states. Calendar stories include month, week and day views. The modal story demonstrates focus trapping, Escape and return-to-trigger focus.

## Shared buttons

Every application button uses the real `UiButton` component on its native element: `<button appButton>`. This attribute selector deliberately preserves native form submission/reset, keyboard activation, focus, ARIA, dialog directives and screen layout selectors; it is a component, not a directive. Import `UiButton` in the consuming component.

The `UI/Button` catalog documents primary, secondary, danger, edit, filled, raised, text, icon and plain variants; small/medium/large sizes; disabled/loading states; projected icons and long labels. `loading` disables activation and exposes `aria-busy`. The default type is `button`; use `type="submit"` or `type="reset"` explicitly in forms. Labels remain projected and translated by their owner. Icon-only buttons must have an accessible name (`aria-label` or `aria-labelledby`).

Use `plain` for specialized native buttons (calendar tiles/actions, sidebar controls, language selectors, selection cards and modal backdrops) whose existing geometry and colors are owned by the screen. Their appearance is also exercised by the corresponding screen stories. Do not combine `appButton` with a Material button component on the same element. The inventory gate rejects raw buttons so new actions cannot bypass the shared component.

## Shared feedback and Material controls

`UiStatusBadge` (`span[appStatusBadge]`), `UiAlert` (`[appAlert]`) and `UiCodePanel` (`pre[appCodePanel]`) are real production components. They retain the original native host, projected/translated content, consumer classes and ARIA. Their host styles are owned by the component, rather than global presentation-only classes. Import them explicitly. Badges have neutral/saving/warning/info/success tones; alerts have warning/error/info/success tones. Notice roles stay with the owner: static information does not need a live region, asynchronous information may use `role="status"`, and urgent errors may use `role="alert"`. Code panels retain exact text, support keyboard focus/scrolling and optional wrapping.

`UI/Material` isolates the existing Material form fields, select, checkbox, date picker, card, tabs, progress bar, toggle group and data table. These controls are already library components in production; they do not need duplicate custom implementations. `MaterialPreview` is a **Storybook-only composition**, excluded from the application build. Its invalid field stories use touched reactive form controls with actual required validators, rather than an error-colored mock. The stories include disabled, long-content, multiple-selection and empty states where relevant, plus native date/time/datetime input types.

These additions do **not** prove that every screen-owned visual pattern has a dedicated story. See the [UI coverage audit](./ui-audit.md) for the remaining extraction/coverage work.

## Native tables and empty states

Use `UiTable` on `<table appTable>` and `UiTableCell` on its native `th`/`td` elements. Density is `compact`, `standard` or `comfortable`, inherited by projected cells through a CSS variable. `layout` is `auto` or `fixed`; `contentAlign` on a cell is `start`, `center` or `end` (not the obsolete native `align` attribute). Keep accessible captions, header `scope`, spanning cells and domain-specific row contents. Editable controls retain their original form binding; the table components do not own data, validation or selection. Existing Material tables keep their library components.

`UiTableScroll` uses `<div appTableScroll [label]="translatedName">` around wide tables. Its required label names a native region, and `tabindex="0"` allows keyboard scrolling without replacing the focus targets of projected controls. `outlined` controls its border; minimum table widths and other placement constraints remain with the owner.

`UiEmptyState` uses native `p`/`div` with projected translated content. `appearance` is `text`, `panel` or `large`; `size` is `small` or `medium`; `tone` is `muted` or `contextual` (inherits a foreground chosen by the parent). Use `div` for titles, paragraphs and actions, keeping valid HTML. Static empty content has no automatic announcement role; owners add `role="status"` only when appropriate. The dedicated stories cover density/alignment, empty and editable tables, scrolling, long content and empty-state actions.

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

`scripts/check-storybook.mjs` discovers production `@Component` classes using the TypeScript AST and compares them with the actual CSF metadata. Adding a component without a story fails the inventory gate. It parses both external and inline Angular templates, including switch case groups, loop-empty and deferred branches, to reject raw buttons, conflicting Material buttons, unregistered text inputs, feedback elements, native tables/cells and class-named empty-state roots bypassing the shared primitives. Native/Material table ancestry and projected empty-state content are distinguished explicitly. Parser traversal has its own regression tests. Story-only preview code is excluded from the production and unit-test TypeScript programs. Foundations read `_tokens.scss` directly, so new tokens appear without maintaining a duplicate palette.

Run `npm run ui:audit` for an additional **element-level source inventory**, or `npm run ui:audit -- --json` for owners, source locations, attributes and text. This reports composition candidates beyond existing component classes. Candidate counts are not automatically missing components: typography, container elements and context-specific business compositions need human review. A green component gate does not mean that every UI primitive or business variation has been independently covered.

The ZXing library's published ESM data-matrix module has incomplete exports with Vite/Rolldown. Storybook resolves the library's official CommonJS entry instead; the application build and library version are unchanged.

The preview docgen integration watches the whole workspace recursively, including installed packages and build/test artifacts. `.storybook/docgen-worker.mjs` keeps its official analyzer but replaces its public watcher lifecycle with one-second polling scoped to application/story/mock sources and TypeScript configuration files. This prevents inotify exhaustion without changing machine settings or installed packages. Recheck this adapter when upgrading the pinned Storybook version; it can be removed once upstream supports scoped watchers.
