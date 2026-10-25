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
| UI | Shared buttons, status badges, summary pills, calendar panels/labels, cycle labels, overview metrics, date summaries, selectable/workspace cards, alerts, code panels, native tables/cells/viewports, empty states, local icons, disclosures/summaries, error panel, segmented toggle, PWA instructions and modal focus/keyboard behavior; isolated Material controls |
| Components | Forms, lists, calendar, scanner, external-meal dialog and master/detail layout |
| Screens | Every feature, with populated, empty, loading and error API scenarios |
| Application | Shell with sidebar, routing, language/theme controls and seeded home screen |

List stories include explicit management and selection modes; ProductList also covers its single-edit and multi-edit modes. Forms include explicit create and edit modes, saving states and representative validation/dialog cases. DaySetFeature and SlotFeature each include an interaction story that opens their embedded dialog shells. `npm run storybook:check` requires every exported form/list mode value to appear in a story's own args, not only the default meta args. Calendar stories include year, month, week and day views. The modal story demonstrates focus trapping, Escape and return-to-trigger focus.

## Shared buttons

Every application button uses the real `UiButton` component on its native element: `<button appButton>`. This attribute selector deliberately preserves native form submission/reset, keyboard activation, focus, ARIA, dialog directives and screen layout selectors; it is a component, not a directive. Import `UiButton` in the consuming component.

The `UI/Button` catalog documents primary, secondary, danger, edit, filled, raised, text, icon and plain variants; small/medium/large sizes; button/submit/reset types; disabled/loading states; projected icons and long labels. `loading` disables activation and exposes `aria-busy`. The default type is `button`; use `type="submit"` or `type="reset"` explicitly in forms. Labels remain projected and translated by their owner. Icon-only buttons must have an accessible name (`aria-label` or `aria-labelledby`).

Use `plain` for specialized native buttons (calendar tiles/actions, sidebar controls, language selectors, selection cards and modal backdrops) whose existing geometry and colors are owned by the screen. Their appearance is also exercised by the corresponding screen stories. Do not combine `appButton` with a Material button component on the same element. The inventory gate rejects raw buttons so new actions cannot bypass the shared component.

## Shared feedback and Material controls

`UiStatusBadge` (`span[appStatusBadge]`), `UiAlert` (`[appAlert]`) and `UiCodePanel` (`pre[appCodePanel]`) are real production components. They retain the original native host, projected/translated content, consumer classes and ARIA. Their host styles are owned by the component, rather than global presentation-only classes. Import them explicitly. Badges have neutral/saving/warning/info/success/danger tones; alerts have warning/error/info/success tones. Badge `size` is `medium` (the unchanged default), `small` (4px vertical/8px horizontal padding), `compact` (2px vertical/8px horizontal), `card` (4px vertical/0.55rem horizontal), `counter` (4px vertical/12px horizontal) or `chip` (0.2rem vertical/0.55rem horizontal). These retain existing production geometry for design-system analysis; they are not six newly designed densities. `emphasis` is `strong` (default), `semibold`, `medium` or `normal`. `appearance` is `outlined` (default), `soft` (borderless, with the same semantic colors) or `bare` (borderless, transparent, inherited foreground). Day-entry, template stock, list-card statuses, counts and pricing labels use these inputs with translated content; dedicated stories isolate the axes and meaningful copy. The inventory gate requires explicit exported story arguments for each production badge variant. Notice roles stay with the owner: static information does not need a live region, asynchronous information may use `role="status"`, and urgent errors may use `role="alert"`. A danger-colored stock label is not automatically an alert. Code panels retain exact text, support keyboard focus/scrolling and optional wrapping.

`UI/Material` isolates the existing Material form fields, select, checkbox, date picker, card, tabs, progress bar, toggle group and data table. These controls are already library components in production; they do not need duplicate custom implementations. `MaterialPreview` is a **Storybook-only composition**, excluded from the application build. Its invalid field stories use touched reactive form controls with actual required validators, rather than an error-colored mock. The stories include disabled, long-content, multiple-selection and empty states where relevant, plus native date/time/datetime input types.

`UI/Modal card surface` documents the 13 production `mat-card.app-modal-card` uses: standard, wide and long-content surfaces. The existing Material card stays the component, `app-modal-card` remains its global token-based surface class, and `UiModal` continues to own keyboard/focus/close behavior.

`UiActionCard` is a native `UiButton` composition with local icons and accent/info/neutral surface tones. Its stories cover each planning option, disabled use and long content; `PlanningFeature` continues to own its action handlers.

These additions do **not** prove that every screen-owned visual pattern has a dedicated story. See the [UI coverage audit](./ui-audit.md) for the remaining extraction/coverage work.

`UiSummaryPill` (`span[appSummaryPill]`) owns the shared inventory/shopping/meal-prep summary counts and availability labels. It preserves their 0.4rem vertical/0.7rem horizontal padding, 0.8rem type, semibold weight and strong foreground, independently of status badges. Owners project translated text, numbers and optional rich values; the pill adds no live role or focus target. Its five stories cover counts, zero, availability, long and rich labels. Known summary-container ancestry is tracked by the inventory gate so anonymous styled spans cannot bypass the component; projected rich-value copy is excluded.

## Calendar and cycle labels

`UiCalendarTag` (`span[appCalendarTag]`) isolates the calendar's year status/count labels, three Today geometries, regular/compact chips, metadata, assignment/source labels and alert contexts. Set `context="on-color"` for alerts inside assigned-day surfaces; neutral surfaces use `surface`. `compact` preserves the dense desktop-week presentation. Optional `value` and `label` inputs render the year-count anatomy, including zero; otherwise project translated copy. Twenty-two dedicated stories cover all declared variant/tone/context axes. The Calendar component also has a Year story.

`UiCalendarPanel` (`div[appCalendarPanel]`) owns the themed outer surface for the year/month/week/day views: clipping, border, large-to-compact responsive radius, shadow and calendar panel background. It does not own inner summary backgrounds, calendar content or view layout. Its Year overview and Narrow surface stories isolate the shared surface; the Calendar component stories demonstrate all four real layouts and states.

`UiBreakdownBadge` (`span[appBreakdownBadge]`) isolates cycle metadata, overview warnings and nutrition statuses. `kind` is meta/overview/status; `status` is under/exact/over/missing. `expanded` preserves single-selection metadata and overview sizing. Its ten stories cover all declared kinds/statuses and both expanded formats. Owners retain calculations, selection, translation and native semantics. Neither label component adds an automatic announcement role or focus target. The inventory gate rejects known label classes bypassing these components and requires explicit CSF argument coverage for every string variant.

`UiOverviewMetric` (`div[appOverviewMetric]`) owns the calendar's value/label summary surfaces. Pass required `value` (number or already formatted string) and translated `label`. Its six stories include zero, large/formatted values, long labels and grouped metrics. Two-column mobile sizing is an owner layout rule; the component does not count, format, announce or select anything.

`UiDateBadge` (`div[appDateBadge]`) owns a caption, display date and optional `detail` such as a time. `label` and `value` are required; null/empty detail produces no extra row. Its six stories cover optional detail, owner-localized and long content. The Planning day-action story opens the real dialog through the calendar button. Neither component adds a live role or focus target.

`UiSelectableCard` (`div[appSelectableCard]`) owns the common surface and selected-state presentation for inventory, meal-prep, shopping-list and template-selection cards. Its `tone` is `success` or `accent`; the latter preserves the template list's accent surface and compact spacing. It projects selection content into its own shared `UiButton` and projects edit/remove actions separately; owners retain selection behavior, labels, disabled state and action handlers. The root stays a noninteractive `div`, so secondary controls are never nested inside a button. Stories cover both tones, active/inactive, disabled selection, long copy, keyboard selection and independent actions.

`UiWorkspaceCard` (`div[appWorkspaceCard]` / `section[appWorkspaceCard]`) owns the neutral border, small radius and solid background shared by inventory detail, meal-prep detail/editors, and shopping-list detail/editors. It deliberately does not impose display, spacing or padding; those remain with each owner. Its two stories show a detail surface and long projected content.

`UiNutritionMetricCard` (`div[appNutritionMetricCard]`) owns the shared cycle macro-card surface. `prominent` preserves the larger single-selection treatment; consumers retain metric labels, values and typography. Standard and prominent stories expose the two presentations independently.

`UiBreakdownCard` (`article[appBreakdownCard]` / `div[appBreakdownCard]`) owns cycle nutrition breakdown surface status colors and compact/summary density. `prominent` preserves the single-selection treatment. Stories cover all four statuses and both densities while metric copy and calculations remain with `ListCycle`.

`UiRaisedPanel` (`[appRaisedPanel]`) owns the raised border, background and shadow used by the home dashboard hero and its five panels. Native header/article/section semantics and owner layout and padding remain unchanged; stories show header and content uses.

`UiMacroProgressCard` presents each home-dashboard nutrition value with its target, delta, status and progress track. The dashboard retains calculations and localization; the catalog covers below/exact/over/unavailable states and long labels.

`UiModal` observes in-place content changes and restores focus inside the top dialog when an update removes the focused control. Its isolated `FocusAfterContentChange` story and the Planning day-actions story verify that switching from a day action to the editor keeps keyboard focus in the dialog and Escape still closes it.

`UiStatusBadge` also accepts the native `em` host. `size="marker"`, `emphasis="heavy"`, `tone="info"` and `appearance="soft"` preserve the home's external-origin marker geometry, 850 weight and non-italic display without changing its original emphasis markup. The tiny size and heavy weight have explicit stories and remain independent inputs; existing badge defaults are unchanged. The Home external-entry story supplies real domain data to the isolated API rather than simulating the feature with copied HTML.

## Native tables and empty states

Use `UiTable` on `<table appTable>` and `UiTableCell` on its native `th`/`td` elements. Density is `compact`, `standard` or `comfortable`, inherited by projected cells through a CSS variable. `layout` is `auto` or `fixed`; `contentAlign` on a cell is `start`, `center` or `end` (not the obsolete native `align` attribute). Keep accessible captions, header `scope`, spanning cells and domain-specific row contents. Editable controls retain their original form binding; the table components do not own data, validation or selection. Existing Material tables keep their library components.

`UiTableScroll` uses `<div appTableScroll [label]="translatedName">` around wide tables. Its required label names a native region, and `tabindex="0"` allows keyboard scrolling without replacing the focus targets of projected controls. `outlined` controls its border; minimum table widths and other placement constraints remain with the owner.

`UiEmptyState` uses native `p`/`div` with projected translated content. `appearance` is `text`, `panel` or `large`; `size` is `small` or `medium`; `tone` is `muted` or `contextual` (inherits a foreground chosen by the parent). Use `div` for titles, paragraphs and actions, keeping valid HTML. Static empty content has no automatic announcement role; owners add `role="status"` only when appropriate. The dedicated stories cover density/alignment, empty and editable tables, scrolling, long content and empty-state actions.

## Local icons and native disclosures

`UiIcon` (`<app-icon name="today" />`) owns the existing local SVG glyphs. Names are typed from `UI_ICONS` in `glyphs.ts`; the catalog isolates all registered glyphs. Default sizing is medium (24px), with small (20px) and large (32px) variants. Scoped owner CSS may retain specialized placement/sizing, such as the calendar's mobile-only action glyphs. The inner SVG follows the host dimensions and inherits its foreground color.

An icon is decorative by default and adds no focus target. A named button keeps its own translated accessible name; do not give its decorative glyph a second name. Use `[label]="translatedDescription"` only for a meaningful standalone image. Both the local registry and its story arguments are checked so adding a glyph cannot silently omit its dedicated story. No external font/icon request is required.

`UiDisclosure` (`<details appDisclosure>`) and `UiDisclosureSummary` (`<summary appDisclosureSummary>`) keep native HTML disclosure behavior. Project the summary as the first child. Appearance is inline/panel; summary size is small/medium and emphasis normal/strong. Native `open`, `[open]` and `(toggle)` remain available without duplicate component state. The browser owns its marker, focus, keyboard activation and expanded/collapsed accessibility state; the summary component adds shared presentation and a focus ring. Projected content and controls keep their existing handlers, form bindings and translation.

## Isolated scenarios

`stories/support/environment.ts` intercepts Angular HTTP calls and runs the same seeded handlers as the Playwright application tests. Each story gets a fresh state. CRUD updates are in memory only, including when navigating within the shell. Unsupported requests fail with a visible `Unmocked Storybook request` error; they never fall through to the real backend. Reloading a story resets its data.

Screens select `apiScenario: 'populated' | 'empty' | 'loading' | 'error'` through their parameters. The date-sensitive previews use **25 March 2026, Europe/Paris**, matching the seeded calendar/consumption data. This clock override exists only in Storybook.

`apiExternalEntries` optionally seeds external entries by local date for focused business states. Each fixture is cloned into the story's own supplementary API state; it does not change the default stories or mutate a shared fixture. The Home external-entry story uses this to exercise its actual row and origin badge. This row-specific seed does not recompute the shared mock's nutrition totals; use it for row/marker presentation, not to certify external-meal aggregation or goal-progress arithmetic.

PWA controls do not install an app, reload the browser or register a service worker. Scanner lookup returns a local product, including inside the product form. Camera capture is not automatic: it requires clicking the camera button and granting browser permission. Actual scanner and PWA integration remain covered by the application tests.

## Build and verify

```sh
npm run storybook:check
npm run build-storybook
npx playwright install --no-shell chromium
npm run storybook:test
```

The build output is **`dist/storybook`**, separate from the application artifact. `storybook:test` serves that output at **127.0.0.1:6007** and checks every canvas in desktop light/English and mobile dark/French, runtime errors, theme/language application, real design-token resolution and absence of external HTTP calls. Each catalog check also waits for Storybook's `STORY_FINISHED` event for the requested story and requires a successful result; initial canvas content alone does not prove that an asynchronous `play` interaction passed. The preview exposes this completion result as test-only data attributes on `#storybook-root`. The suite also checks generated APIs, Controls/Actions/Autodocs, segmented-control interaction, modal focus restoration, nested scanner lookup, in-memory shopping/recipe updates, reset on reload and shell navigation without changing the canvas URL. A dedicated CI workflow runs the same gates and uploads the build and browser report; it does not publish anything externally.

## Maintaining coverage

Add static CSF stories under `stories/components`, `stories/ui` or `stories/screens`. Import the real component and set `component` in the default metadata; use `Meta<Component>` and `StoryObj<Component>` so inputs remain type checked. Reuse the fixtures and `fn()` output callbacks. Include meaningful states and interaction behavior, not just a placeholder rendering.

`scripts/check-storybook.mjs` discovers production `@Component` classes using the TypeScript AST and compares them with the actual CSF metadata. Adding a component without a story fails the inventory gate. It parses both external and inline Angular templates, including switch case groups, loop-empty and deferred branches, to reject raw buttons, conflicting Material buttons, unregistered text inputs, feedback elements, native tables/cells, class-named empty-state roots and disclosures/summaries bypassing the shared primitives. Raw glyph SVG is restricted to the real icon implementation, and registered glyphs need icon-story arguments. Native/Material table ancestry and projected empty-state content are distinguished explicitly. Parser traversal has its own regression tests. Story-only preview code is excluded from the production and unit-test TypeScript programs. Foundations read `_tokens.scss` directly, so new tokens appear without maintaining a duplicate palette.

Run `npm run ui:audit` for an additional **element-level source inventory**, or `npm run ui:audit -- --json` for owners, source locations, attributes and text. This reports composition candidates beyond existing component classes. Candidate counts are not automatically missing components: typography, container elements and context-specific business compositions need human review. A green component gate does not mean that every UI primitive or business variation has been independently covered.

The ZXing library's published ESM data-matrix module has incomplete exports with Vite/Rolldown. Storybook resolves the library's official CommonJS entry instead; the application build and library version are unchanged.

The preview docgen integration watches the whole workspace recursively, including installed packages and build/test artifacts. `.storybook/docgen-worker.mjs` keeps its official analyzer but replaces its public watcher lifecycle with one-second polling scoped to application/story/mock sources and TypeScript configuration files. This prevents inotify exhaustion without changing machine settings or installed packages. Recheck this adapter when upgrading the pinned Storybook version; it can be removed once upstream supports scoped watchers.
